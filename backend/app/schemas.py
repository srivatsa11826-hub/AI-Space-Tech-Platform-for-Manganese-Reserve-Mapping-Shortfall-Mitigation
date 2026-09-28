from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class MineSiteInfo(BaseModel):
    site_id: str
    name: str
    location: str
    lat: float
    lng: float
    total_area_sqkm: float
    active_benches: int
    annual_target_tonnes: float

class ProspectivityQuery(BaseModel):
    mine_site: str = Field(default="Balaghat", description="Mine site identifier")
    min_confidence: float = Field(default=0.5, ge=0.0, le=1.0, description="Minimum confidence threshold")
    include_low_grade: bool = Field(default=True, description="Whether to include low grade deposit zones")

class GeoJSONProperty(BaseModel):
    zone_id: str
    mine_site: str
    grade_name: str  # e.g., "High Grade Pyrolusite", "Medium Grade Psilomelane"
    mn_content_percent: float  # e.g. 44.5%
    fe_content_percent: float  # e.g. 6.2%
    depth_meters: float
    stripping_ratio: float  # Overburden : Ore (e.g. 3.2:1)
    estimated_reserve_tonnes: float
    mmpi_score: float  # Manganese Mineral Prospectivity Index (0.0 to 1.0)
    confidence: float
    accessibility_rating: str  # "Easy", "Moderate", "Challenging"
    spectral_ratio_swir_vnir: float
    spectral_ratio_nir_green: float
    esg_environmental_risk: str  # "Low", "Medium", "High"

class GeoJSONGeometry(BaseModel):
    type: str = "Polygon"
    coordinates: List[List[List[float]]]

class GeoJSONFeature(BaseModel):
    type: str = "Feature"
    geometry: GeoJSONGeometry
    properties: GeoJSONProperty

class ProspectivityResponse(BaseModel):
    type: str = "FeatureCollection"
    features: List[GeoJSONFeature]
    summary: Dict[str, Any]

class ShiftPredictionRequest(BaseModel):
    mine_site: str = Field(default="Balaghat", description="Mine site name")
    shift_name: str = Field(default="Shift A (06:00-14:00)")
    shift_target_tonnes: float = Field(default=1200.0, ge=100.0, le=10000.0)
    active_excavators: int = Field(default=8, ge=0, le=30)
    active_dumpers: int = Field(default=22, ge=0, le=100)
    blasting_scheduled_today: int = Field(default=1, ge=0, le=1)
    rainfall_forecast_mm: float = Field(default=12.0, ge=0.0, le=150.0)
    machinery_breakdown_hours: float = Field(default=1.5, ge=0.0, le=24.0)
    bench_moisture_level: float = Field(default=18.0, ge=0.0, le=100.0)
    haul_distance_km: float = Field(default=3.5, ge=0.5, le=25.0)

class ShortfallFactors(BaseModel):
    rain_impact_pct: float
    breakdown_impact_pct: float
    blasting_delay_impact_pct: float
    bench_slippage_impact_pct: float

class ShiftPredictionResponse(BaseModel):
    mine_site: str
    shift_name: str
    shift_target_tonnes: float
    predicted_extraction_tonnes: float
    shortfall_tonnes: float
    shortfall_percentage: float
    risk_level: str  # OPTIMAL, MODERATE, CRITICAL
    dgms_safety_status: str  # COMPLIANT, WARNING, HALTED_RAINFALL, HALTED_SLOPE
    dgms_safety_violation: bool
    safety_message: str
    shortfall_factors: ShortfallFactors

class ReallocationDirective(BaseModel):
    priority: int
    action_type: str  # "EQUIPMENT_REALLOCATION", "BLASTING_DEFERRAL", "DRAINAGE_DISPATCH", "HAUL_ROUTE_REROUTE"
    source_location: str
    destination_location: str
    equipment_count: int
    equipment_type: str  # "Excavator", "Dumper / Haul Truck", "Dewatering Pump"
    expected_tonnage_recovery: float
    sop_code: str
    description: str
    source_lat: Optional[float] = None
    source_lng: Optional[float] = None
    dest_lat: Optional[float] = None
    dest_lng: Optional[float] = None
    bench_halted: bool = False

class FleetOptimizationMetrics(BaseModel):
    original_shortfall_tonnes: float
    optimized_shortfall_tonnes: float
    tonnage_recovered: float
    fuel_consumption_liters: float
    fuel_savings_liters: float
    co2_emissions_kg: float
    co2_reduction_kg: float
    net_financial_value_inr: float
    optimality_status: str

class OptimizerRequest(BaseModel):
    mine_site: str = Field(default="Balaghat")
    shift_target_tonnes: float = Field(default=1200.0)
    predicted_shortfall_tonnes: float = Field(default=320.0)
    active_excavators: int = Field(default=8)
    active_dumpers: int = Field(default=22)
    rainfall_forecast_mm: float = Field(default=12.0)
    machinery_breakdown_hours: float = Field(default=1.5)
    bench_moisture_level: float = Field(default=18.0)
    blasting_scheduled_today: int = Field(default=1)

class OptimizerResponse(BaseModel):
    directives: List[ReallocationDirective]
    metrics: FleetOptimizationMetrics

class SimulationRequest(BaseModel):
    prediction_input: ShiftPredictionRequest

class SimulationResponse(BaseModel):
    prediction: ShiftPredictionResponse
    optimization: OptimizerResponse
    timestamp: str

class TelemetryHistoryItem(BaseModel):
    date: str
    shift: str
    target_tonnes: float
    actual_tonnes: float
    shortfall_tonnes: float
    rainfall_mm: float
    breakdown_hours: float
    active_fleet_ratio: float
    risk_level: str

class MineSummary(BaseModel):
    sites: List[MineSiteInfo]
    overall_target_tonnes: float
    overall_ytd_production_tonnes: float
    dgms_active_alerts_count: int
    active_excavators_total: int
    active_dumpers_total: int
