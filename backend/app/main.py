from fastapi import FastAPI, Query, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from typing import Optional, Dict, Any, List

from app.schemas import (
    ProspectivityResponse,
    ShiftPredictionRequest,
    ShiftPredictionResponse,
    OptimizerRequest,
    OptimizerResponse,
    SimulationRequest,
    SimulationResponse,
    MineSummary
)
from app.geospatial_engine import generate_prospectivity_geojson, STATE_MANGANESE_BELTS
from app.prediction_model import predictor
from app.optimizer import solve_fleet_reallocation
from app.database import (
    get_db_connection, init_db, company_summary, resolve_mine_site, MINE_COORDS,
    list_benches, log_compliance, list_compliance, save_shift_plan, list_shift_plans,
    record_shift_actual, get_meta
)
from app.online_data_fetcher import fetch_online_satellite_metadata, fetch_live_weather_telemetry
from app.geospatial_engine import features_from_band_rows
import csv
import io
import json

app = FastAPI(
    title="MOIL Limited Manganese AI Industrial Decision Platform",
    description="Full-stack AI/ML, Space Tech Spectral Engine & Prescriptive Fleet Optimization for Manganese Operations in Balaghat & Bhandara Belts.",
    version="1.0.0"
)

# Enable CORS for Next.js / Vite client applications
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    init_db()

@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "HEALTHY",
        "system": "MOIL Manganese AI Decision Platform",
        "timestamp": datetime.now().isoformat(),
        "xgboost_model_loaded": predictor.model is not None,
        "database_connected": True,
        "model_version": get_meta("model_version", "unversioned"),
        "model_trained_at": get_meta("model_trained_at", ""),
        "model_rows": get_meta("model_rows", "")
    }

@app.get("/api/v1/mines/summary", response_model=MineSummary, tags=["Mines"])
def get_mines_summary():
    """Returns overview of MOIL key mining assets summed from the local SQLite database."""
    summary = company_summary()
    sites_data = []
    for r in summary["sites"]:
        sites_data.append({
            "site_id": r["site_id"],
            "name": r["name"],
            "location": f"{r['state']} Manganese Belt",
            "lat": r["lat"],
            "lng": r["lng"],
            "total_area_sqkm": r["area_sqkm"],
            "active_benches": r["active_benches"],
            "annual_target_tonnes": r["annual_target_tonnes"]
        })

    return MineSummary(
        sites=sites_data,
        overall_target_tonnes=summary["overall_target_tonnes"],
        overall_ytd_production_tonnes=summary["overall_ytd_production_tonnes"],
        dgms_active_alerts_count=summary["dgms_active_alerts_count"],
        active_excavators_total=summary["active_excavators_total"],
        active_dumpers_total=summary["active_dumpers_total"]
    )

@app.get("/api/v1/prospectivity", tags=["Space-Tech Exploration"])
def get_prospectivity(
    mine_site: str = Query(default="Balaghat", description="Mine site identifier"),
    min_confidence: float = Query(default=0.5, ge=0.0, le=1.0),
    include_low_grade: bool = Query(default=True)
):
    """
    Computes Manganese Mineral Prospectivity Index (MMPI) from multispectral remote sensing bands.
    Returns GeoJSON FeatureCollection with reserve bounds, % Mn content, depth, and stripping ratios.
    """
    try:
        data = generate_prospectivity_geojson(
            mine_site=mine_site,
            min_confidence=min_confidence,
            include_low_grade=include_low_grade
        )
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error computing prospectivity: {str(e)}")

@app.post("/api/v1/predict-shortfall", response_model=ShiftPredictionResponse, tags=["Predictive AI Engine"])
def predict_shortfall(req: ShiftPredictionRequest):
    """
    XGBoost Shift Extraction Predictor.
    Evaluates shift parameters against DGMS safety threshold constraints and quantifies net shortfall.
    """
    return predictor.predict_shift_output(req)

@app.post("/api/v1/optimize-fleet", response_model=OptimizerResponse, tags=["Prescriptive Optimization"])
def optimize_fleet(req: OptimizerRequest):
    """
    SciPy Simplex Linear Programming Fleet & Dispatch Optimization Engine.
    Reallocates excavator/dumper teams across alternative benches to neutralize predicted shortfall.
    """
    return solve_fleet_reallocation(req)

@app.post("/api/v1/simulate", response_model=SimulationResponse, tags=["Digital Twin Simulation"])
def run_digital_twin_simulation(sim_req: SimulationRequest):
    """
    Closed-loop Digital Twin Simulator endpoint.
    Executes shift shortfall prediction followed immediately by prescriptive fleet reallocation optimization.
    """
    pred_res = predictor.predict_shift_output(sim_req.prediction_input)
    
    opt_req = OptimizerRequest(
        mine_site=pred_res.mine_site,
        shift_target_tonnes=pred_res.shift_target_tonnes,
        predicted_shortfall_tonnes=pred_res.shortfall_tonnes,
        active_excavators=sim_req.prediction_input.active_excavators,
        active_dumpers=sim_req.prediction_input.active_dumpers,
        rainfall_forecast_mm=sim_req.prediction_input.rainfall_forecast_mm,
        machinery_breakdown_hours=sim_req.prediction_input.machinery_breakdown_hours,
        bench_moisture_level=sim_req.prediction_input.bench_moisture_level,
        blasting_scheduled_today=sim_req.prediction_input.blasting_scheduled_today
    )
    
    opt_res = solve_fleet_reallocation(opt_req)
    
    return SimulationResponse(
        prediction=pred_res,
        optimization=opt_res,
        timestamp=datetime.now().isoformat()
    )

@app.get("/api/v1/telemetry/historical", tags=["Analytics & Telemetry"])
def get_historical_telemetry(
    days: int = Query(default=14, ge=1, le=90),
    mine_site: Optional[str] = Query(default=None),
    shift: Optional[str] = Query(default=None)
):
    """Returns shift-by-shift historical extraction logs filtered by mine and shift."""
    conn = get_db_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM shift_telemetry WHERE 1=1"
    params: List[Any] = []
    if mine_site:
        query += " AND mine_site = ?"
        params.append(resolve_mine_site(mine_site))
    if shift:
        query += " AND shift_name = ?"
        params.append(shift)
    query += " ORDER BY id DESC LIMIT ?"
    params.append(days * 3)
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    result = []
    for r in reversed(rows):
        fleet_ratio = round((r["active_excavators"] + r["active_dumpers"]) / 35.0, 2)
        result.append({
            "date": f"{r['date']} ({r['shift_name'].split()[0]})",
            "mine_site": r["mine_site"],
            "shift": r["shift_name"],
            "target_tonnes": r["shift_target_tonnes"],
            "actual_tonnes": r["actual_extraction_tonnes"],
            "shortfall_tonnes": r["shortfall_tonnes"],
            "rainfall_mm": r["rainfall_forecast_mm"],
            "breakdown_hours": r["machinery_breakdown_hours"],
            "active_fleet_ratio": fleet_ratio,
            "risk_level": r["risk_level"]
        })
    return result

@app.get("/api/v1/online/satellite-catalog", tags=["Online External Resources"])
def get_online_satellite_catalog():
    """Links to online remote sensing satellite catalog (Resourcesat-2A, Sentinel-2B)."""
    return fetch_online_satellite_metadata()

@app.get("/api/v1/online/weather", tags=["Online External Resources"])
def get_online_weather(mine_site: str = Query(default="Balaghat")):
    """Fetches real-time weather telemetry from Open-Meteo for the selected mine."""
    site = resolve_mine_site(mine_site)
    lat, lng = MINE_COORDS.get(site, (21.8042, 80.1814))
    weather = fetch_live_weather_telemetry(lat, lng)
    weather["mine_site"] = site
    weather["lat"] = lat
    weather["lng"] = lng
    return weather

def evaluate_rules(mine_site: str, shift_name: str, rainfall: float, moisture: float) -> Dict[str, Any]:
    checks = []
    decision = "CONTINUE"
    if rainfall >= 25.0:
        decision = "HALT"
        reason = f"Rainfall {rainfall} mm/hr meets or exceeds the 25 mm/hr open-pit blasting limit."
        log_compliance(mine_site, shift_name, "DGMS-RAIN-25", rainfall, 25.0, "HALT", reason)
        checks.append({"rule_code": "DGMS-RAIN-25", "measured_value": rainfall, "threshold": 25.0, "decision": "HALT", "reason": reason})
    else:
        reason = f"Rainfall {rainfall} mm/hr is below the 25 mm/hr halt threshold."
        log_compliance(mine_site, shift_name, "DGMS-RAIN-25", rainfall, 25.0, "CONTINUE", reason)
        checks.append({"rule_code": "DGMS-RAIN-25", "measured_value": rainfall, "threshold": 25.0, "decision": "CONTINUE", "reason": reason})
    if moisture >= 45.0:
        decision = "HALT"
        reason = f"Bench moisture {moisture}% meets or exceeds the 45% slope limit."
        log_compliance(mine_site, shift_name, "DGMS-SLOPE-45", moisture, 45.0, "HALT", reason)
        checks.append({"rule_code": "DGMS-SLOPE-45", "measured_value": moisture, "threshold": 45.0, "decision": "HALT", "reason": reason})
    else:
        reason = f"Bench moisture {moisture}% is below the 45% slope limit."
        log_compliance(mine_site, shift_name, "DGMS-SLOPE-45", moisture, 45.0, "CONTINUE", reason)
        checks.append({"rule_code": "DGMS-SLOPE-45", "measured_value": moisture, "threshold": 45.0, "decision": "CONTINUE", "reason": reason})
    return {
        "mine_site": resolve_mine_site(mine_site),
        "shift_name": shift_name,
        "decision": decision,
        "checked_at": datetime.now().isoformat(),
        "checks": checks
    }

@app.get("/api/v1/compliance/evaluate", tags=["DGMS Compliance"])
def compliance_evaluate(
    mine_site: str = Query(default="Balaghat"),
    shift_name: str = Query(default="Shift A (06:00-14:00)"),
    rainfall_mm: float = Query(default=0.0),
    bench_moisture: float = Query(default=0.0)
):
    return evaluate_rules(mine_site, shift_name, rainfall_mm, bench_moisture)

@app.get("/api/v1/compliance/alerts", tags=["DGMS Compliance"])
def compliance_alerts(mine_site: Optional[str] = Query(default=None), limit: int = Query(default=40, ge=1, le=200)):
    return list_compliance(mine_site, limit)

@app.get("/api/v1/benches", tags=["Fleet"])
def get_benches(mine_site: str = Query(default="Balaghat")):
    return list_benches(mine_site)

@app.post("/api/v1/shift-plans", tags=["Shift Plans"])
def create_shift_plan(body: Dict[str, Any]):
    required = ["mine_site", "shift_name", "shift_target_tonnes", "predicted_extraction_tonnes", "shortfall_tonnes"]
    for key in required:
        if key not in body:
            raise HTTPException(status_code=400, detail=f"Missing {key}")
    plan_id = save_shift_plan({
        **body,
        "tonnage_recovered": body.get("tonnage_recovered", 0),
        "net_financial_value_inr": body.get("net_financial_value_inr", 0),
        "dgms_safety_status": body.get("dgms_safety_status", "COMPLIANT"),
        "directives_json": json.dumps(body.get("directives", [])),
    })
    return {"id": plan_id}

@app.get("/api/v1/shift-plans", tags=["Shift Plans"])
def get_shift_plans(mine_site: Optional[str] = Query(default=None)):
    plans = list_shift_plans(mine_site)
    for plan in plans:
        try:
            plan["directives"] = json.loads(plan.get("directives_json") or "[]")
        except Exception:
            plan["directives"] = []
    return plans

@app.post("/api/v1/shift-plans/{plan_id}/actual", tags=["Shift Plans"])
def post_shift_actual(plan_id: int, actual_extraction_tonnes: float = Query(..., ge=0)):
    try:
        return record_shift_actual(plan_id, actual_extraction_tonnes)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

@app.post("/api/v1/model/retrain", tags=["Predictive AI Engine"])
def retrain_model():
    return predictor.retrain_from_database()

@app.post("/api/v1/prospectivity/upload", tags=["Space-Tech Exploration"])
async def upload_bands(
    file: UploadFile = File(...),
    mine_site: str = Query(default="Balaghat"),
    min_confidence: float = Query(default=0.0, ge=0.0, le=1.0)
):
    raw = (await file.read()).decode("utf-8", errors="ignore")
    reader = csv.DictReader(io.StringIO(raw))
    rows = [row for row in reader if any((v or "").strip() for v in row.values())]
    if not rows:
        synthetic = generate_prospectivity_geojson(mine_site, min_confidence, True)
        synthetic["summary"]["source"] = "SYNTHETIC_FALLBACK"
        return synthetic
    parsed = features_from_band_rows(rows, mine_site, min_confidence)
    if not parsed["features"]:
        synthetic = generate_prospectivity_geojson(mine_site, min_confidence, True)
        synthetic["summary"]["source"] = "SYNTHETIC_FALLBACK"
        return synthetic
    return parsed
