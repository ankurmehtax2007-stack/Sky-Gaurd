// SkyGuard AI - Unified TypeScript Definitions

export type AnomalyType =
  | 'normal'
  | 'temperature_spike'
  | 'humidity_spike'
  | 'pressure_jump'
  | 'freeze'
  | 'offset'
  | 'missing_data'
  | 'multivariate_inconsistency'
  | 'spatial_inconsistency'
  | 'novel_anomaly';

export type SeverityLevel = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type HealthStatus = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'DEGRADED' | 'CRITICAL';

export interface TelemetryData {
  temperature_c: number | null;
  humidity_pct: number | null;
  pressure_hpa: number | null;
  timestamp?: string;
  data_quality?: 'valid' | 'suspect' | 'missing' | string;
}

export interface StationInfo {
  station_id: string;
  stationId?: string;
  station_name: string;
  name?: string;
  city: string;
  cluster: string;
  latitude: number;
  longitude: number;
  status: 'ONLINE' | 'OFFLINE' | 'DEGRADED';
  temperature?: number | null;
  humidity?: number | null;
  pressure?: number | null;
  temperature_c?: number | null;
  humidity_pct?: number | null;
  pressure_hpa?: number | null;
  sensor_health?: number;
  health_score?: number;
  current_anomaly?: AnomalyType;
  last_updated?: string;
}

export interface ModelPrediction {
  is_anomaly: boolean;
  decision: string;
  root_cause: AnomalyType | string;
  confidence: number;
}

export interface MultiSourceEvidence {
  isolation_forest?: number;
  iforest_novelty?: number;
  xgboost?: number;
  xgboost_anomaly?: number;
  temporal?: number;
  spatial?: number;
  physics?: number;
  fused_anomaly_score?: number;
}

export interface ClassEvidenceBreakdown {
  temporal: number;
  spatial: number;
  physics: number;
  xgb: number;
  fused: number;
}

export interface ShapFactor {
  feature: string;
  value?: number;
  importance?: number;
  contribution?: number;
  direction?: 'increases_anomaly' | 'decreases_anomaly' | string;
  description?: string;
}

export interface SensorHealth {
  score: number;
  status: HealthStatus | string;
  deductions?: {
    anomaly?: number;
    drift?: number;
    missing?: number;
    physics?: number;
    [key: string]: number | undefined;
  };
  temperature_sensor?: number;
  humidity_sensor?: number;
  pressure_sensor?: number;
}

export interface MaintenanceRecommendation {
  priority: string;
  recommended_action: string;
  component?: string;
  estimated_downtime?: string;
  tools_required?: string[];
}

export interface AIReport {
  provider: string;
  report: string;
  timestamp?: string;
  status?: string;
}

export interface LiveAnalysisRecord {
  _id?: string;
  incident_id?: string;
  analysis_id?: string;
  station_id: string;
  station_name: string;
  city: string;
  cluster: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  telemetry: TelemetryData;
  temperature_c?: number | null;
  humidity_pct?: number | null;
  pressure_hpa?: number | null;
  prediction: ModelPrediction;
  root_cause: AnomalyType | string;
  decision: string;
  confidence: number;
  confidence_pct?: string;
  severity: SeverityLevel | string;
  severity_score?: number;
  fused_anomaly_score?: number;
  sensor_health: SensorHealth;
  sensor_health_score?: number;
  health_score?: number;
  health_status?: HealthStatus | string;
  evidence: MultiSourceEvidence;
  scores?: MultiSourceEvidence;
  class_probabilities?: Record<string, number>;
  class_evidence?: Record<string, ClassEvidenceBreakdown>;
  class_fused_scores?: Record<string, number>;
  explanation?: {
    top_features?: ShapFactor[];
    shap_factors?: ShapFactor[];
    evidence_summary?: string[];
  };
  shap_factors?: ShapFactor[];
  maintenance: MaintenanceRecommendation;
  llm: AIReport;
  llm_report?: string;
  llm_source?: string;
  raw_record?: any;
}

export interface InjectionRequest {
  city?: string;
  station_id: string;
  anomaly_type: AnomalyType;
  duration_points: number;
  sensor?: string;
  intensity?: 'medium' | 'high' | 'extreme';
}

export interface ActiveInjectionState {
  id: string;
  station_id: string;
  station_name: string;
  city: string;
  cluster: string;
  anomaly_type: AnomalyType;
  sensor: string;
  intensity: string;
  status: 'pending' | 'active' | 'completed';
  records_emitted: number;
  remaining_records: number;
  total_records: number;
  progress: string;
  progress_pct: number;
  start_time: string;
  last_emitted_time?: string;
  companion_station_id?: string;
  companion_station_name?: string;
}

export interface SimulatorStatus {
  status: string;
  isRunning: boolean;
  intervalMs: number;
  intervalSeconds: number;
  simulatedStepSeconds?: number;
  currentSimulatedTime?: string;
  stationsCount?: number;
  totalCycles?: number;
  lastCycleTime?: string;
  activeInjections: ActiveInjectionState[];
  hasActiveInjection?: boolean;
  completedInjections?: Array<{
    id: string;
    station_id: string;
    station_name: string;
    city: string;
    anomaly_type: string;
    total_records: number;
    completed_time: string;
  }>;
}

export interface SystemHealthStatus {
  backend: boolean;
  fastapi: boolean;
  simulator: boolean;
  websocket: boolean;
  mqtt: boolean;
  lastChecked: string;
}

export interface TelemetryHistoryPoint {
  time: string;
  timestamp: string;
  temperature: number | null;
  humidity: number | null;
  pressure: number | null;
  is_anomaly: boolean;
  root_cause: string;
  severity: string;
  health: number;
}
