export const stations = [
  {
    station_id: "AWS001",
    station_name: "Prayagraj Central",
    location: "Prayagraj",
    status: "ONLINE",
    temperature: 28.6,
    humidity: 67.2,
    pressure: 1012.4,
  },

  {
    station_id: "AWS002",
    station_name: "Delhi AWS",
    location: "Delhi",
    status: "ALERT",
    temperature: 48.7,
    humidity: 72.4,
    pressure: 1008.2,
  },

  {
    station_id: "AWS003",
    station_name: "Naini Station",
    location: "Naini",
    status: "ONLINE",
    temperature: 31.4,
    humidity: 63.5,
    pressure: 1010.7,
  },

  {
    station_id: "AWS004",
    station_name: "Phaphamau",
    location: "Phaphamau",
    status: "OFFLINE",
    temperature: 0,
    humidity: 0,
    pressure: 0,
  },

  {
    station_id: "AWS005",
    station_name: "Jhunsi",
    location: "Jhunsi",
    status: "ONLINE",
    temperature: 29.8,
    humidity: 65.8,
    pressure: 1011.6,
  },

  {
    station_id: "AWS006",
    station_name: "Koraon",
    location: "Koraon",
    status: "ONLINE",
    temperature: 27.9,
    humidity: 69.1,
    pressure: 1013.2,
  },
];

export const alerts = [
  {
    anomaly_id: "ANM001",
    station_id: "AWS002",
    station_name: "Delhi AWS",
    timestamp: "2026-08-25T09:30:00+05:30",
    severity: "HIGH",
    title: "Temperature Spike Detected",
    anomaly_score: 0.91,
    root_cause: "temperature_spike",
    confidence: 0.94,

    sensor_status: {
      temperature: "ABNORMAL",
      humidity: "NORMAL",
      pressure: "NORMAL",
    },

    readings: {
      temperature: 48.7,
      humidity: 72.4,
      pressure: 1008.2,
    },

    evidence: [
      "Temperature changed sharply relative to the previous observation.",
      "Temperature is substantially above its 24-hour baseline.",
      "The station temperature differs significantly from the local spatial cluster.",
    ],

    shap_explanation: [
      { feature: "temperature_c_diff_lag1", impact: 0.72 },
      { feature: "temperature_c_roll24_zscore", impact: 0.51 },
      { feature: "spatial_temp_zscore", impact: 0.39 },
    ],

    recommended_actions: [
      "Validate the temperature reading against nearby stations.",
      "Inspect the temperature sensor and telemetry connection.",
      "Monitor subsequent temperature observations.",
    ],

    uncertainty:
      "The diagnosis is model-based and should be validated against subsequent observations and nearby station measurements.",
  },

  {
    anomaly_id: "ANM002",
    station_id: "AWS003",
    station_name: "Naini Station",
    timestamp: "2026-08-25T10:15:00+05:30",
    severity: "MEDIUM",
    title: "Pressure Drop Detected",
    anomaly_score: 0.73,
    root_cause: "pressure_drop",
    confidence: 0.87,

    sensor_status: {
      temperature: "NORMAL",
      humidity: "NORMAL",
      pressure: "ABNORMAL",
    },

    readings: {
      temperature: 31.4,
      humidity: 63.5,
      pressure: 1008.7,
    },

    evidence: [
      "Pressure dropped significantly compared with the previous reading.",
      "Pressure is below the expected station baseline.",
    ],

    shap_explanation: [
      { feature: "pressure_diff_lag1", impact: 0.61 },
      { feature: "pressure_roll24_zscore", impact: 0.42 },
    ],

    recommended_actions: [
      "Check pressure sensor calibration.",
      "Compare pressure with nearby weather stations.",
      "Continue monitoring subsequent readings.",
    ],

    uncertainty:
      "Diagnosis should be validated using subsequent observations.",
  },
];
