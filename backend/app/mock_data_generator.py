import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Any

def generate_historical_shift_telemetry(days: int = 30) -> pd.DataFrame:
    """
    Generates realistic historical shift logs for MOIL Balaghat & Bhandara manganese mining operations.
    Includes target vs actual extraction, weather, fleet breakdown, and risk categories.
    """
    np.random.seed(42)  # Reproducible synthetic dataset
    records = []
    
    start_date = datetime.now() - timedelta(days=days)
    shifts = ["Shift A (06:00-14:00)", "Shift B (14:00-22:00)", "Shift C (22:00-06:00)"]
    sites = ["Balaghat", "Dongri Buzurg", "Chikla"]

    for d in range(days):
        current_date = start_date + timedelta(days=d)
        date_str = current_date.strftime("%Y-%m-%d")
        
        # Simulate monsoon weather pattern
        is_rainy_day = np.random.rand() < 0.35
        base_rain = np.random.uniform(15.0, 48.0) if is_rainy_day else np.random.uniform(0.0, 4.0)

        for shift in shifts:
            site = np.random.choice(sites, p=[0.6, 0.25, 0.15])
            
            # Target per shift (MOIL standard: ~1000 to 1400 tonnes/shift)
            target = float(np.random.choice([1000.0, 1100.0, 1200.0, 1350.0, 1500.0]))
            
            # Shift specific rain variation
            rain = max(0.0, base_rain + np.random.normal(0, 3.0))
            
            # HEMM Fleet stats
            excavators = int(np.random.randint(5, 12))
            dumpers = int(np.random.randint(14, 30))
            breakdown_hrs = float(np.random.exponential(scale=1.2)) if np.random.rand() < 0.4 else 0.0
            blasting = 1 if (shift == "Shift A (06:00-14:00)" and rain < 15.0 and np.random.rand() < 0.7) else 0
            bench_moisture = min(85.0, 12.0 + (rain * 1.6) + np.random.normal(0, 2.0))
            haul_dist = round(float(np.random.uniform(2.5, 5.5)), 2)

            # Calculation of extraction efficiency
            base_capacity = (excavators * 110.0) + (dumpers * 35.0)
            
            # Loss penalties
            rain_loss = (rain / 50.0) * 0.45 * target
            breakdown_loss = (breakdown_hrs / 8.0) * 0.35 * target
            moisture_loss = max(0.0, (bench_moisture - 25.0) / 75.0) * 0.20 * target
            blasting_boost = 150.0 if blasting == 1 else -50.0
            
            actual = target - (rain_loss + breakdown_loss + moisture_loss) + blasting_boost + np.random.normal(0, 30.0)
            actual = max(180.0, min(actual, target * 1.15))
            
            shortfall = max(0.0, target - actual)
            shortfall_pct = (shortfall / target) * 100.0
            
            if shortfall_pct > 25.0 or rain > 25.0:
                risk_level = "CRITICAL"
            elif shortfall_pct > 10.0 or rain > 10.0:
                risk_level = "MODERATE"
            else:
                risk_level = "OPTIMAL"

            records.append({
                "date": date_str,
                "shift": shift,
                "mine_site": site,
                "shift_target_tonnes": round(target, 1),
                "actual_extraction_tonnes": round(actual, 1),
                "shortfall_tonnes": round(shortfall, 1),
                "shortfall_percentage": round(shortfall_pct, 2),
                "active_excavators": excavators,
                "active_dumpers": dumpers,
                "blasting_scheduled_today": blasting,
                "rainfall_forecast_mm": round(rain, 1),
                "machinery_breakdown_hours": round(breakdown_hrs, 1),
                "bench_moisture_level": round(bench_moisture, 1),
                "haul_distance_km": haul_dist,
                "risk_level": risk_level
            })

    return pd.DataFrame(records)

def get_telemetry_history_json(days: int = 14) -> List[Dict[str, Any]]:
    """Helper to return formatted JSON array for Recharts time-series visualization."""
    df = generate_historical_shift_telemetry(days=days)
    result = []
    for _, row in df.iterrows():
        fleet_ratio = round((row["active_excavators"] + row["active_dumpers"]) / 35.0, 2)
        result.append({
            "date": f"{row['date']} ({row['shift'].split()[0]})",
            "shift": row["shift"],
            "target_tonnes": row["shift_target_tonnes"],
            "actual_tonnes": row["actual_extraction_tonnes"],
            "shortfall_tonnes": row["shortfall_tonnes"],
            "rainfall_mm": row["rainfall_forecast_mm"],
            "breakdown_hours": row["machinery_breakdown_hours"],
            "active_fleet_ratio": fleet_ratio,
            "risk_level": row["risk_level"]
        })
    return result
