// SkyGuard AI - System Constants

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000/ws';
export const ML_SERVICE_URL = import.meta.env.VITE_ML_SERVICE_URL || 'http://localhost:8000';
export const SIMULATOR_URL = import.meta.env.VITE_SIMULATOR_URL || 'http://localhost:3001';

// Supported 8 Live Anomaly Classes (DRIFT is completely removed!)
export const SUPPORTED_ANOMALY_CLASSES = [
  'temperature_spike',
  'humidity_spike',
  'pressure_jump',
  'freeze',
  'offset',
  'missing_data',
  'multivariate_inconsistency',
  'spatial_inconsistency'
] as const;

export const ALL_CLASSES_WITH_NORMAL = [
  'normal',
  ...SUPPORTED_ANOMALY_CLASSES
] as const;

export const ANOMALY_LABELS: Record<string, string> = {
  normal: 'Normal',
  temperature_spike: 'Temperature Spike',
  humidity_spike: 'Humidity Spike',
  pressure_jump: 'Pressure Jump',
  freeze: 'Sensor Freeze',
  offset: 'Calibration Offset',
  missing_data: 'Missing Data',
  multivariate_inconsistency: 'Multivariate Inconsistency',
  spatial_inconsistency: 'Spatial Inconsistency',
  novel_anomaly: 'Novel Anomaly'
};

export const ANOMALY_DESCRIPTIONS: Record<string, string> = {
  temperature_spike: 'Sudden abnormal rate of change or extreme spike in ambient temperature.',
  humidity_spike: 'Sudden surge toward saturation or abnormal RH variance.',
  pressure_jump: 'Sudden barometric pressure change exceeding natural meteorologic bounds.',
  freeze: 'Repeated or stuck sensor values across consecutive readings with zero variance.',
  offset: 'Sudden calibration step shift that remains persistent at the new level.',
  missing_data: 'Null or missing sensor channels detected in raw telemetry frame.',
  multivariate_inconsistency: 'Psychrometric and thermodynamic cross-sensor conflict (e.g. extreme heat + saturated RH).',
  spatial_inconsistency: 'Station diverges sharply from companion AWS stations in the same city/cluster.',
  novel_anomaly: 'Unseen pattern detected as statistical outlier by Isolation Forest.',
  normal: 'Telemetry within normal physical and climatological bounds.'
};

export const DEFAULT_STATIONS = [
  {
    station_id: 'IMD-DEL-001',
    station_name: 'New Delhi Safdarjung AWS',
    city: 'New Delhi',
    cluster: 'NCR',
    latitude: 28.6139,
    longitude: 77.2090,
    status: 'ONLINE' as const,
    temperature_c: 28.5,
    humidity_pct: 55.0,
    pressure_hpa: 1008.0,
    sensor_health: 98
  },
  {
    station_id: 'IMD-DEL-002',
    station_name: 'Delhi Ridge AWS',
    city: 'New Delhi',
    cluster: 'NCR',
    latitude: 28.7041,
    longitude: 77.1025,
    status: 'ONLINE' as const,
    temperature_c: 29.0,
    humidity_pct: 53.0,
    pressure_hpa: 1007.5,
    sensor_health: 96
  },
  {
    station_id: 'IMD-BOM-001',
    station_name: 'Mumbai Santacruz Coastal AWS',
    city: 'Mumbai',
    cluster: 'Konkan_Deccan',
    latitude: 19.0760,
    longitude: 72.8777,
    status: 'ONLINE' as const,
    temperature_c: 27.5,
    humidity_pct: 70.0,
    pressure_hpa: 1010.0,
    sensor_health: 95
  },
  {
    station_id: 'IMD-MAA-001',
    station_name: 'Chennai Meenambakkam AWS',
    city: 'Chennai',
    cluster: 'Tamil_Nadu_Coast',
    latitude: 13.0827,
    longitude: 80.2707,
    status: 'ONLINE' as const,
    temperature_c: 30.5,
    humidity_pct: 75.0,
    pressure_hpa: 1012.0,
    sensor_health: 94
  },
  {
    station_id: 'IMD-CCU-001',
    station_name: 'Kolkata Alipore AWS',
    city: 'Kolkata',
    cluster: 'West_Bengal',
    latitude: 22.5726,
    longitude: 88.3639,
    status: 'ONLINE' as const,
    temperature_c: 29.0,
    humidity_pct: 78.0,
    pressure_hpa: 1009.0,
    sensor_health: 97
  }
];

export const MAX_HISTORY_POINTS = 30;
