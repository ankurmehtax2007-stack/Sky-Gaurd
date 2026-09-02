// SkyGuard AI - Backend API Client
import { API_BASE_URL, SIMULATOR_URL } from '../utils/constants';
import { LiveAnalysisRecord, StationInfo, InjectionRequest, SimulatorStatus } from '../types';

export const fetchStations = async (): Promise<StationInfo[]> => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/stations`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.data || data || [];
  } catch (err) {
    console.warn('Failed to fetch stations from API, using fallback:', err);
    return [];
  }
};

export const fetchAnomalies = async (limit = 50): Promise<LiveAnalysisRecord[]> => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/anomalies?limit=${limit}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : (data.data || data.anomalies || []);
  } catch (err) {
    console.warn('Failed to fetch anomalies from API:', err);
    return [];
  }
};

export const fetchReports = async (limit = 30): Promise<any[]> => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/reports?limit=${limit}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.reports || data.data || [];
  } catch (err) {
    console.warn('Failed to fetch reports from API:', err);
    return [];
  }
};

export const fetchReportById = async (id: string): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/api/reports/${id}`);
  if (!res.ok) throw new Error(`Report not found: HTTP ${res.status}`);
  return await res.json();
};

export const generateAiReport = async (diagnosticData: any, instruction?: string): Promise<{ report: string; provider: string }> => {
  const res = await fetch(`${API_BASE_URL}/api/generate-report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ diagnostic: diagnosticData, instruction })
  });
  if (!res.ok) throw new Error(`LLM Report generation failed: HTTP ${res.status}`);
  const data = await res.json();
  return {
    report: data.report || data.llm_report || '',
    provider: data.source || data.provider || 'mistral'
  };
};

export const submitFeedback = async (payload: {
  analysis_id?: string;
  station_id: string;
  confirmed_root_cause: string;
  operator_notes?: string;
  operator_name?: string;
}): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/api/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return await res.json();
};

export const resetStreamingState = async (): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/api/reset-state`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  return await res.json();
};

export const checkSystemHealth = async (): Promise<{ backend: boolean; mlService: boolean }> => {
  let backend = false;
  let mlService = false;
  try {
    const bRes = await fetch(`${API_BASE_URL}/api/health`, { signal: AbortSignal.timeout(2000) });
    backend = bRes.ok;
  } catch {}

  try {
    const mlRes = await fetch(`${API_BASE_URL}/api/health`, { signal: AbortSignal.timeout(2000) });
    mlService = mlRes.ok;
  } catch {}

  return { backend, mlService };
};

// Simulator Control APIs
export const fetchSimulatorStatus = async (): Promise<SimulatorStatus | null> => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/simulator/status`, { signal: AbortSignal.timeout(2000) });
    if (!res.ok) throw new Error(`Simulator status failed: HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return null;
  }
};

export const injectAnomaly = async (req: InjectionRequest): Promise<any> => {
  // Pure raw request containing ONLY city, station_id, anomaly_type, duration_points (NO derived features or ML calculations!)
  const payload = {
    city: req.city,
    station_id: req.station_id,
    anomaly_type: req.anomaly_type,
    duration_points: req.duration_points || 6,
    sensor: req.sensor || 'temperature',
    intensity: req.intensity || 'high'
  };

  const res = await fetch(`${API_BASE_URL}/api/simulator/inject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) throw new Error(`Anomaly injection failed: HTTP ${res.status}`);
  return await res.json();
};

export const toggleSimulator = async (): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/api/simulator/toggle`, { method: 'POST' });
  return await res.json();
};

export const triggerCycle = async (): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/api/simulator/trigger`, { method: 'POST' });
  return await res.json();
};

export const clearAllRecords = async (): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/api/records/clear`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error(`Clear records failed: HTTP ${res.status}`);
  return await res.json();
};

