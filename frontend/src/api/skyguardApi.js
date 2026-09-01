const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export const getApiBase = () => API_BASE;

export const fetchStations = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/stations`);
    if (res.ok) {
      const data = await res.json();
      return data.data || [];
    }
  } catch (err) {
    console.warn("Error fetching stations:", err.message);
  }
  return null;
};

export const fetchLatestReadings = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/readings`);
    if (res.ok) {
      const data = await res.json();
      return data.data || [];
    }
  } catch (err) {
    console.warn("Error fetching latest readings:", err.message);
  }
  return null;
};

export const fetchStationHistory = async (stationId, limit = 240) => {
  try {
    const res = await fetch(`${API_BASE}/api/readings/station/${stationId}?limit=${limit}`);
    if (res.ok) {
      const json = await res.json();
      const readings = json.data?.readings || json.data || [];
      return readings
        .filter(r => r && (r.timestamp || r.createdAt))
        .sort((a, b) => new Date(a.timestamp || a.createdAt) - new Date(b.timestamp || b.createdAt))
        .slice(-limit);
    }
  } catch (err) {
    console.warn(`Error fetching history for station ${stationId}:`, err.message);
  }
  return [];
};

export const fetchAlerts = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/anomalies`);
    if (res.ok) {
      const data = await res.json();
      return data.anomalies || data.data || [];
    }
  } catch (err) {
    console.warn("Error fetching anomalies:", err.message);
  }
  return null;
};

export const fetchSimulatorStatus = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/simulator/status`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Error fetching simulator status:", err.message);
  }
  return { isRunning: true, intervalSeconds: 10, activeInjections: [] };
};

export const fetchInjectionStatus = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/simulator/injection-status`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Error fetching injection status:", err.message);
  }
  return { status: "success", hasActive: false, active: [], completed: [] };
};

export const toggleSimulatorStream = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/simulator/toggle`, { method: "POST" });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Error toggling simulator:", err.message);
  }
  return null;
};

export const startSimulatorStream = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/simulator/start`, { method: "POST" });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Error starting simulator:", err.message);
  }
  return null;
};

export const stopSimulatorStream = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/simulator/stop`, { method: "POST" });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Error stopping simulator:", err.message);
  }
  return null;
};

export const injectAnomaly = async (payloadOrType = "temperature_spike", stationId = null) => {
  try {
    const payload = typeof payloadOrType === "object" && payloadOrType !== null
      ? payloadOrType
      : { anomaly_type: payloadOrType, station_id: stationId };

    const res = await fetch(`${API_BASE}/api/simulator/inject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Error injecting anomaly:", err.message);
  }
  return null;
};

export const generateReportForAnomaly = async (anomalyId, alertData) => {
  try {
    const res = await fetch(`${API_BASE}/api/generate-report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        anomaly_id: anomalyId,
        station_id: alertData?.station_id || alertData?.station?.id || "AWS Node",
        station_name: alertData?.station_name || alertData?.station?.name || "AWS Node",
        root_cause: alertData?.root_cause || "temperature_spike",
        decision: "known_anomaly",
        severity: alertData?.severity || "HIGH",
        confidence: alertData?.confidence || 0.92,
        temperature_c: alertData?.readings?.temperature ?? 28.5,
        humidity_pct: alertData?.readings?.humidity ?? 55.0,
        pressure_hpa: alertData?.readings?.pressure ?? 1008.0,
        shap_factors: alertData?.shap_explanation || [],
        evidence: alertData?.evidence || [],
        maintenance: {
          recommended_action: alertData?.recommended_actions?.[0] || "Inspect sensor hardware and enclosure."
        }
      })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Error generating on-demand report:", err.message);
  }
  return null;
};

export const submitOperatorFeedback = async (feedbackData) => {
  try {
    const res = await fetch(`${API_BASE}/api/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(feedbackData)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Error submitting operator feedback:", err.message);
  }
  return null;
};

export const fetchReports = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/reports`);
    if (res.ok) {
      const data = await res.json();
      return data.reports || data.data || [];
    }
  } catch (err) {
    console.warn("Error fetching reports:", err.message);
  }
  return [];
};

export const fetchFeedbacks = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/feedbacks`);
    if (res.ok) {
      const data = await res.json();
      return data.feedbacks || [];
    }
  } catch (err) {
    console.warn("Error fetching feedbacks:", err.message);
  }
  return [];
};

export const clearAllAlertsApi = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/anomalies`, { method: "DELETE" });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn("Error clearing alerts:", err.message);
  }
  return null;
};

export const clearAllReportsApi = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/reports`, { method: "DELETE" });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn("Error clearing reports:", err.message);
  }
  return null;
};

export default {
  getApiBase,
  fetchStations,
  fetchLatestReadings,
  fetchStationHistory,
  fetchAlerts,
  fetchSimulatorStatus,
  fetchInjectionStatus,
  toggleSimulatorStream,
  startSimulatorStream,
  stopSimulatorStream,
  injectAnomaly,
  generateReportForAnomaly,
  submitOperatorFeedback,
  fetchReports,
  fetchFeedbacks,
  clearAllAlertsApi,
  clearAllReportsApi
};
