export interface MineSiteInfo {
  site_id: string;
  name: string;
  location: string;
  lat: number;
  lng: number;
  total_area_sqkm: number;
  active_benches: number;
  annual_target_tonnes: number;
}

export interface GeoJSONProperty {
  zone_id: string;
  mine_site: string;
  grade_name: string;
  mn_content_percent: number;
  fe_content_percent: number;
  depth_meters: number;
  stripping_ratio: number;
  estimated_reserve_tonnes: number;
  mmpi_score: number;
  confidence: number;
  accessibility_rating: string;
  spectral_ratio_swir_vnir: number;
  spectral_ratio_nir_green: number;
  esg_environmental_risk: string;
  anomaly_tag?: string;
  district?: string;
}

export interface GeoJSONGeometry {
  type: string;
  coordinates: number[][][];
}

export interface GeoJSONFeature {
  type: string;
  geometry: GeoJSONGeometry;
  properties: GeoJSONProperty;
}

export interface AnomalyPeak {
  tag: string;
  lat: number;
  lng: number;
  type: 'HIGH' | 'LOW';
  mmpi_score: number;
  mn_content_percent: number;
  name: string;
}

export interface GeologicalLineament {
  id: string;
  name: string;
  coords: number[][];
}

export interface ProspectivitySummary {
  mine_site: string;
  site_name: string;
  state_name?: string;
  national_reserve_share_pct?: number;
  national_rank?: string;
  districts?: string[];
  key_mines?: string[];
  center_coordinates: { lat: number; lng: number };
  total_zones_delineated: number;
  total_estimated_reserves_tonnes: number;
  high_grade_reserves_tonnes: number;
  high_grade_percentage: number;
  average_mmpi_score: number;
  anomaly_peaks?: AnomalyPeak[];
  geological_lineaments?: GeologicalLineament[];
  spectral_satellites_integrated: string[];
}

export interface ProspectivityResponse {
  type: string;
  features: GeoJSONFeature[];
  summary: ProspectivitySummary;
}

export interface ShortfallFactors {
  rain_impact_pct: number;
  breakdown_impact_pct: number;
  blasting_delay_impact_pct: number;
  bench_slippage_impact_pct: number;
}

export interface ShiftPredictionResponse {
  mine_site: string;
  shift_name: string;
  shift_target_tonnes: number;
  predicted_extraction_tonnes: number;
  shortfall_tonnes: number;
  shortfall_percentage: number;
  risk_level: 'OPTIMAL' | 'MODERATE' | 'CRITICAL';
  dgms_safety_status: string;
  dgms_safety_violation: boolean;
  safety_message: string;
  shortfall_factors: ShortfallFactors;
}

export interface ReallocationDirective {
  priority: number;
  action_type: string;
  source_location: string;
  destination_location: string;
  equipment_count: number;
  equipment_type: string;
  expected_tonnage_recovery: number;
  sop_code: string;
  description: string;
  source_lat?: number | null;
  source_lng?: number | null;
  dest_lat?: number | null;
  dest_lng?: number | null;
  bench_halted?: boolean;
}

export interface BenchInfo {
  bench_id: string;
  mine_site: string;
  name: string;
  lat: number;
  lng: number;
  status: string;
  bench_kind: string;
}

export interface SatelliteCatalog {
  satellite_constellation: string;
  last_pass_timestamp: string;
  spatial_resolution_meters: number;
  cloud_cover_percent: number;
  status: string;
  spectral_bands: { band: string; wavelength_nm: number; reflectance: number }[];
}

export interface ComplianceCheck {
  rule_code: string;
  measured_value: number;
  threshold: number;
  decision: string;
  reason: string;
}

export interface ComplianceEvaluation {
  mine_site: string;
  shift_name: string;
  decision: string;
  checked_at: string;
  checks: ComplianceCheck[];
}

export interface ShiftPlan {
  id: number;
  created_at: string;
  mine_site: string;
  shift_name: string;
  shift_target_tonnes: number;
  predicted_extraction_tonnes: number;
  shortfall_tonnes: number;
  tonnage_recovered: number;
  net_financial_value_inr: number;
  dgms_safety_status: string;
  actual_extraction_tonnes: number | null;
}

export interface FleetOptimizationMetrics {
  original_shortfall_tonnes: number;
  optimized_shortfall_tonnes: number;
  tonnage_recovered: number;
  fuel_consumption_liters: number;
  fuel_savings_liters: number;
  co2_emissions_kg: number;
  co2_reduction_kg: number;
  net_financial_value_inr: number;
  optimality_status: string;
}

export interface OptimizerResponse {
  directives: ReallocationDirective[];
  metrics: FleetOptimizationMetrics;
}

export interface SimulationResponse {
  prediction: ShiftPredictionResponse;
  optimization: OptimizerResponse;
  timestamp: string;
}

export interface SimulatorParams {
  mine_site: string;
  shift_name: string;
  shift_target_tonnes: number;
  active_excavators: number;
  active_dumpers: number;
  blasting_scheduled_today: number;
  rainfall_forecast_mm: number;
  machinery_breakdown_hours: number;
  bench_moisture_level: number;
  haul_distance_km: number;
}

export interface TelemetryHistoryItem {
  date: string;
  shift: string;
  target_tonnes: number;
  actual_tonnes: number;
  shortfall_tonnes: number;
  rainfall_mm: number;
  breakdown_hours: number;
  active_fleet_ratio: number;
  risk_level: string;
}
