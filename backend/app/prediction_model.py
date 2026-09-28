import os
import joblib
import numpy as np
import pandas as pd
from xgboost import XGBRegressor
from typing import Dict, Any, Tuple
from app.schemas import ShiftPredictionRequest, ShiftPredictionResponse, ShortfallFactors
from app.mock_data_generator import generate_historical_shift_telemetry

MODEL_FILE_PATH = os.path.join(os.path.dirname(__file__), "manganese_xgboost_model.joblib")

FEATURE_COLUMNS = [
    "shift_target_tonnes",
    "active_excavators",
    "active_dumpers",
    "blasting_scheduled_today",
    "rainfall_forecast_mm",
    "machinery_breakdown_hours",
    "bench_moisture_level",
    "haul_distance_km"
]

class ProductionPredictionEngine:
    def __init__(self):
        self.model = None
        self._ensure_model_trained()

    def _ensure_model_trained(self):
        """Train or load XGBoost model on MOIL operational telemetry."""
        if os.path.exists(MODEL_FILE_PATH):
            try:
                self.model = joblib.load(MODEL_FILE_PATH)
                return
            except Exception:
                pass
        
        # Train fresh model on synthetic historical dataset
        df = generate_historical_shift_telemetry(days=90)
        X = df[FEATURE_COLUMNS]
        y = df["actual_extraction_tonnes"]

        self.model = XGBRegressor(
            n_estimators=100,
            max_depth=5,
            learning_rate=0.08,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42
        )
        self.model.fit(X, y)
        joblib.dump(self.model, MODEL_FILE_PATH)
        self._stamp_model("synthetic-seed")

    def retrain_from_database(self) -> Dict[str, Any]:
        from app.database import training_frame, set_meta
        from datetime import datetime
        df = training_frame()
        if len(df) < 20:
            return {"retrained": False, "rows": int(len(df)), "reason": "Need at least 20 telemetry rows"}
        X = df[FEATURE_COLUMNS]
        y = df["actual_extraction_tonnes"]
        self.model = XGBRegressor(
            n_estimators=100,
            max_depth=5,
            learning_rate=0.08,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42
        )
        self.model.fit(X, y)
        joblib.dump(self.model, MODEL_FILE_PATH)
        version = datetime.now().strftime("db-%Y%m%d%H%M%S")
        self._stamp_model(version)
        set_meta("model_version", version)
        set_meta("model_trained_at", datetime.now().isoformat())
        set_meta("model_rows", str(len(df)))
        return {"retrained": True, "rows": int(len(df)), "model_version": version}

    def _stamp_model(self, version: str) -> None:
        from app.database import set_meta
        from datetime import datetime
        set_meta("model_version", version)
        set_meta("model_trained_at", datetime.now().isoformat())

    def predict_shift_output(self, req: ShiftPredictionRequest) -> ShiftPredictionResponse:
        """Runs XGBoost inference and evaluates DGMS safety threshold safeguards."""
        input_data = pd.DataFrame([{
            "shift_target_tonnes": req.shift_target_tonnes,
            "active_excavators": req.active_excavators,
            "active_dumpers": req.active_dumpers,
            "blasting_scheduled_today": req.blasting_scheduled_today,
            "rainfall_forecast_mm": req.rainfall_forecast_mm,
            "machinery_breakdown_hours": req.machinery_breakdown_hours,
            "bench_moisture_level": req.bench_moisture_level,
            "haul_distance_km": req.haul_distance_km
        }])[FEATURE_COLUMNS]

        raw_pred = float(self.model.predict(input_data)[0])
        
        # DGMS Safety Constraints Evaluation
        # DGMS Circular No. 3: Open-pit bench blasting prohibited during rainfall > 25 mm/hr or slope instability moisture > 45%
        dgms_violation = False
        dgms_status = "COMPLIANT"
        safety_msg = "All operational parameters within DGMS statutory limits."

        if req.rainfall_forecast_mm >= 25.0:
            dgms_violation = True
            dgms_status = "HALTED_RAINFALL"
            safety_msg = f"DGMS MANDATE ALERT: Open-cast bench blasting & haulage HALTED due to heavy rainfall ({req.rainfall_forecast_mm} mm/hr >= 25 mm threshold)."
            # Force severe reduction due to safety stoppage
            raw_pred = min(raw_pred, req.shift_target_tonnes * 0.35)
        elif req.bench_moisture_level >= 45.0:
            dgms_violation = True
            dgms_status = "HALTED_SLOPE"
            safety_msg = f"DGMS SAFETY ALERT: Bench slope moisture ({req.bench_moisture_level}%) exceeds 45% limit. Heavy excavator movements restricted."
            raw_pred = min(raw_pred, req.shift_target_tonnes * 0.55)
        elif req.rainfall_forecast_mm > 12.0 or req.machinery_breakdown_hours > 3.0:
            dgms_status = "WARNING"
            safety_msg = f"DGMS ADVISORY: Heightened wet bench hazard and fleet breakdown delays detected."

        predicted_tonnes = max(50.0, min(round(raw_pred, 1), req.shift_target_tonnes * 1.15))
        shortfall = max(0.0, round(req.shift_target_tonnes - predicted_tonnes, 1))
        shortfall_pct = round((shortfall / max(req.shift_target_tonnes, 1.0)) * 100.0, 2)

        # Risk Classification
        if dgms_violation or shortfall_pct >= 25.0:
            risk_level = "CRITICAL"
        elif shortfall_pct >= 10.0 or req.rainfall_forecast_mm >= 10.0:
            risk_level = "MODERATE"
        else:
            risk_level = "OPTIMAL"

        # Detailed breakdown of shortfall attribution
        rain_factor = round(min(100.0, (req.rainfall_forecast_mm / 35.0) * 45.0), 1)
        breakdown_factor = round(min(100.0, (req.machinery_breakdown_hours / 6.0) * 35.0), 1)
        blasting_factor = 20.0 if (req.blasting_scheduled_today == 0 and req.rainfall_forecast_mm < 25) else 0.0
        bench_factor = round(min(100.0, (req.bench_moisture_level / 50.0) * 20.0), 1)

        total_factors = max(1.0, rain_factor + breakdown_factor + blasting_factor + bench_factor)
        
        shortfall_factors = ShortfallFactors(
            rain_impact_pct=round((rain_factor / total_factors) * 100, 1),
            breakdown_impact_pct=round((breakdown_factor / total_factors) * 100, 1),
            blasting_delay_impact_pct=round((blasting_factor / total_factors) * 100, 1),
            bench_slippage_impact_pct=round((bench_factor / total_factors) * 100, 1)
        )

        return ShiftPredictionResponse(
            mine_site=req.mine_site,
            shift_name=req.shift_name,
            shift_target_tonnes=req.shift_target_tonnes,
            predicted_extraction_tonnes=predicted_tonnes,
            shortfall_tonnes=shortfall,
            shortfall_percentage=shortfall_pct,
            risk_level=risk_level,
            dgms_safety_status=dgms_status,
            dgms_safety_violation=dgms_violation,
            safety_message=safety_msg,
            shortfall_factors=shortfall_factors
        )

# Global Instance
predictor = ProductionPredictionEngine()
