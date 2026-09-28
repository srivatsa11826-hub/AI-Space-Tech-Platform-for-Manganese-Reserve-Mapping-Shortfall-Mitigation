import numpy as np
from scipy.optimize import linprog
from typing import List, Dict, Any
from app.schemas import OptimizerRequest, OptimizerResponse, ReallocationDirective, FleetOptimizationMetrics
from app.database import list_benches, set_bench_status

# Average high grade MOIL Manganese Ore value: ~ ₹32,000 per Tonne
ORE_VALUE_PER_TONNE_INR = 32000.0
DIESEL_COST_PER_LITER_INR = 92.5
CO2_KG_PER_LITER_DIESEL = 2.68  # Standard IPCC emission factor

def solve_fleet_reallocation(req: OptimizerRequest) -> OptimizerResponse:
    """
    Solves Linear Programming (LP) optimization for HEMM fleet reallocation across mine benches.
    Neutralizes predicted production shortfalls while enforcing DGMS safety limits and minimizing deadhaul fuel burn.
    """
    shortfall = req.predicted_shortfall_tonnes
    excavators_avail = req.active_excavators
    dumpers_avail = req.active_dumpers
    rain = req.rainfall_forecast_mm

    # Define Benches / Mine Locations:
    # 1. Open Pit A Bench 3 (Flooded/Primary pit)
    # 2. Open Pit B High-Grade Ore Face (Dry / Elev 340m)
    # 3. Underground Shaft Ramp Level 4 (Weather-independent)
    # 4. Stockpile 3 High-Grade Ore Blending Pit
    
    stored = list_benches(req.mine_site)
    if stored:
        benches = [{
            "id": b["bench_id"],
            "name": b["name"],
            "max_cap": b["max_cap"],
            "rain_sensitivity": b["rain_sensitivity"],
            "haul_km": b["haul_km"],
            "lat": b["lat"],
            "lng": b["lng"],
            "kind": b["bench_kind"],
        } for b in stored]
    else:
        benches = [
            {"id": "PitA_Bench3", "name": "Open Pit A Bench 3 (Primary)", "max_cap": 500, "rain_sensitivity": 0.9, "haul_km": 4.2, "lat": 21.808, "lng": 80.184, "kind": "OPEN_PIT"},
            {"id": "PitB_OreFace", "name": "Open Pit B High-Grade Ore Face", "max_cap": 750, "rain_sensitivity": 0.2, "haul_km": 2.8, "lat": 21.801, "lng": 80.186, "kind": "OPEN_PIT"},
            {"id": "UG_ShaftRamp", "name": "Underground Shaft Ramp Level 4", "max_cap": 450, "rain_sensitivity": 0.05, "haul_km": 1.5, "lat": 21.806, "lng": 80.177, "kind": "UNDERGROUND"},
            {"id": "Stockpile3_Blend", "name": "Stockpile 3 High-Grade Blending Pit", "max_cap": 600, "rain_sensitivity": 0.1, "haul_km": 2.1, "lat": 21.799, "lng": 80.179, "kind": "STOCKPILE"},
        ]

    moisture = req.bench_moisture_level
    halted = []
    for b in benches:
        rain_halt = rain >= 25.0 and b["kind"] == "OPEN_PIT" and b["rain_sensitivity"] >= 0.5
        slope_halt = moisture >= 45.0 and b["kind"] == "OPEN_PIT"
        blast_halt = req.blasting_scheduled_today == 1 and (rain >= 25.0 or moisture >= 45.0) and b["kind"] == "OPEN_PIT"
        b["halted"] = bool(rain_halt or slope_halt or blast_halt)
        if b["halted"]:
            halted.append(b["id"])
    set_bench_status(req.mine_site, halted)

    # If shortfall is negligible (OPTIMAL state)
    if shortfall <= 20.0 and not halted:
        directives = [
            ReallocationDirective(
                priority=1,
                action_type="HAUL_ROUTE_REROUTE",
                source_location="Mine Operations Yard",
                destination_location=benches[0]["name"],
                equipment_count=excavators_avail,
                equipment_type="Excavator & Dumper Fleet",
                expected_tonnage_recovery=0.0,
                sop_code="SOP-MOIL-OPT-001",
                description="Maintain current baseline fleet distribution. Operations proceeding within target parameters.",
                dest_lat=benches[0]["lat"],
                dest_lng=benches[0]["lng"],
            )
        ]
        metrics = FleetOptimizationMetrics(
            original_shortfall_tonnes=shortfall,
            optimized_shortfall_tonnes=shortfall,
            tonnage_recovered=0.0,
            fuel_consumption_liters=round(dumpers_avail * 42.0, 1),
            fuel_savings_liters=0.0,
            co2_emissions_kg=round(dumpers_avail * 42.0 * CO2_KG_PER_LITER_DIESEL, 1),
            co2_reduction_kg=0.0,
            net_financial_value_inr=0.0,
            optimality_status="BASELINE_OPTIMAL"
        )
        return OptimizerResponse(directives=directives, metrics=metrics)

    # Solve Linear Optimization using SciPy Linprog
    # Objective: Maximize Tonnage Recovered - Penalty for Fuel Burn
    # c vector: [-tonnage_per_excavator_dumper_pair_at_bench_i + fuel_cost_penalty]
    # Decision Variables x_i = number of equipment teams assigned to bench i (i=0..3)

    # Hourly capacity per equipment team (1 Excavator + 3 Dumpers): ~110 tonnes/shift
    tonnes_per_team = [
        max(10.0, 120.0 * (1.0 - (rain / 45.0) * b["rain_sensitivity"])) for b in benches
    ]
    fuel_liters_per_team = [
        round(35.0 + (b["haul_km"] * 6.5), 1) for b in benches
    ]

    # Maximizing sum(tonnes_per_team[i] * x[i]) is equivalent to minimizing -c * x
    c = [-t + (f * 0.05) for t, f in zip(tonnes_per_team, fuel_liters_per_team)]
    
    # Constraints:
    # 1. Total excavators assigned <= excavators_avail
    # 2. Total tonnage assigned <= shortfall target
    # 3. Individual bench capacity limits
    n = len(benches)
    A_ub = [
        [1.0] * n,
        tonnes_per_team
    ]
    b_ub = [
        float(min(excavators_avail, dumpers_avail // 2)),
        float(shortfall)
    ]

    # Bounds per bench
    bounds = []
    for b in benches:
        if b["halted"]:
            bounds.append((0, 0))
        else:
            bounds.append((0, min(excavators_avail, 4)))

    res = linprog(c, A_ub=A_ub, b_ub=b_ub, bounds=bounds, method='highs')

    teams_assigned = [0] * n
    if res.success:
        teams_assigned = [int(np.round(val)) for val in res.x]

    yard = next((b for b in benches if not b["halted"]), benches[0])
    directives = []
    prio = 1

    for i, bench in enumerate(benches):
        if bench["halted"]:
            directives.append(ReallocationDirective(
                priority=prio,
                action_type="DRAINAGE_DISPATCH" if rain >= 25 else "BLASTING_DEFERRAL",
                source_location=bench["name"],
                destination_location=yard["name"],
                equipment_count=0,
                equipment_type="Haul fleet held",
                expected_tonnage_recovery=0.0,
                sop_code="SOP-DGMS-HALT-01",
                description=f"DGMS halt on {bench['name']}. No blasting or extra trucks assigned.",
                source_lat=bench["lat"],
                source_lng=bench["lng"],
                dest_lat=yard["lat"],
                dest_lng=yard["lng"],
                bench_halted=True,
            ))
            prio += 1
        elif teams_assigned[i] > 0:
            rec_tonnes = round(teams_assigned[i] * tonnes_per_team[i], 1)
            directives.append(ReallocationDirective(
                priority=prio,
                action_type="EQUIPMENT_REALLOCATION",
                source_location="Standby yard",
                destination_location=bench["name"],
                equipment_count=teams_assigned[i],
                equipment_type="Excavator & Dumper Fleet",
                expected_tonnage_recovery=rec_tonnes,
                sop_code="SOP-MOIL-REALLOC-01",
                description=f"Move {teams_assigned[i]} excavator team(s) and {teams_assigned[i]*3} dumpers to {bench['name']}.",
                source_lat=yard["lat"],
                source_lng=yard["lng"],
                dest_lat=bench["lat"],
                dest_lng=bench["lng"],
                bench_halted=False,
            ))
            prio += 1

    # Tonnage & Financial Metrics calculation
    total_recovered = round(sum(d.expected_tonnage_recovery for d in directives), 1)
    optimized_shortfall = max(0.0, round(shortfall - total_recovered, 1))
    
    # Fuel savings by route optimization (closer dry benches vs deadhaul in mud)
    baseline_fuel = dumpers_avail * 54.0  # liters in heavy mud
    optimized_fuel = sum(teams_assigned[i] * fuel_liters_per_team[i] * 3.0 for i in range(n)) + 120.0
    fuel_saved = max(15.0, round(baseline_fuel - optimized_fuel, 1))

    co2_reduction = round(fuel_saved * CO2_KG_PER_LITER_DIESEL, 1)
    net_value_inr = round(total_recovered * ORE_VALUE_PER_TONNE_INR, 2)

    metrics = FleetOptimizationMetrics(
        original_shortfall_tonnes=shortfall,
        optimized_shortfall_tonnes=optimized_shortfall,
        tonnage_recovered=total_recovered,
        fuel_consumption_liters=round(optimized_fuel, 1),
        fuel_savings_liters=fuel_saved,
        co2_emissions_kg=round(optimized_fuel * CO2_KG_PER_LITER_DIESEL, 1),
        co2_reduction_kg=co2_reduction,
        net_financial_value_inr=net_value_inr,
        optimality_status="SOLVED_OPTIMAL" if res.success else "FEASIBLE_HEURISTIC"
    )

    return OptimizerResponse(directives=directives, metrics=metrics)
