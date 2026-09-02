// SkyGuard AI - Stations & Realtime State Hook
import { useState, useEffect, useCallback, useRef } from 'react';
import { StationInfo, LiveAnalysisRecord, TelemetryHistoryPoint } from '../types';
import { DEFAULT_STATIONS, MAX_HISTORY_POINTS } from '../utils/constants';
import { fetchStations } from '../services/api';
import { formatTime } from '../utils/formatters';

export const useStations = () => {
  const [stations, setStations] = useState<StationInfo[]>(DEFAULT_STATIONS);
  const [latestAnalyses, setLatestAnalyses] = useState<Record<string, LiveAnalysisRecord>>({});
  const [historyByStation, setHistoryByStation] = useState<Record<string, TelemetryHistoryPoint[]>>({});
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [inspectAnalysis, setInspectAnalysis] = useState<LiveAnalysisRecord | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize stations list from API
  useEffect(() => {
    let isMounted = true;
    const loadInitial = async () => {
      try {
        const remote = await fetchStations();
        if (isMounted && remote && remote.length > 0) {
          // Merge with default coordinates if missing
          const merged = DEFAULT_STATIONS.map(def => {
            const match = remote.find(r => (r.station_id || r.stationId) === def.station_id);
            return match ? { ...def, ...match } : def;
          });
          setStations(merged);
        }
      } catch (err) {
        console.warn('Using default station config:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadInitial();
    return () => { isMounted = false; };
  }, []);

  // Handler for new live analysis record from WebSocket
  const handleLiveAnalysis = useCallback((record: LiveAnalysisRecord) => {
    if (!record || !record.station_id) return;
    const stationId = record.station_id;

    // 1. Update latest analysis cache
    setLatestAnalyses(prev => ({
      ...prev,
      [stationId]: record
    }));

    // 2. Update station summary state
    setStations(prev => prev.map(stn => {
      const id = stn.station_id || stn.stationId;
      if (id === stationId) {
        const isAnom = record.prediction?.is_anomaly || (record.decision && record.decision !== 'normal');
        return {
          ...stn,
          temperature_c: record.telemetry?.temperature_c ?? record.temperature_c ?? stn.temperature_c,
          humidity_pct: record.telemetry?.humidity_pct ?? record.humidity_pct ?? stn.humidity_pct,
          pressure_hpa: record.telemetry?.pressure_hpa ?? record.pressure_hpa ?? stn.pressure_hpa,
          sensor_health: record.sensor_health?.score ?? record.health_score ?? stn.sensor_health,
          current_anomaly: isAnom ? (record.root_cause as any) : 'normal',
          status: 'ONLINE',
          last_updated: record.timestamp
        };
      }
      return stn;
    }));

    // 3. Append to bounded client history (max MAX_HISTORY_POINTS)
    const newPoint: TelemetryHistoryPoint = {
      time: formatTime(record.timestamp),
      timestamp: record.timestamp,
      temperature: record.telemetry?.temperature_c ?? record.temperature_c ?? null,
      humidity: record.telemetry?.humidity_pct ?? record.humidity_pct ?? null,
      pressure: record.telemetry?.pressure_hpa ?? record.pressure_hpa ?? null,
      is_anomaly: Boolean(record.prediction?.is_anomaly || (record.decision && record.decision !== 'normal')),
      root_cause: record.root_cause || 'normal',
      severity: String(record.severity || 'NONE'),
      health: record.sensor_health?.score ?? record.health_score ?? 100
    };

    setHistoryByStation(prev => {
      const currentList = prev[stationId] || [];
      const updated = [...currentList, newPoint];
      if (updated.length > MAX_HISTORY_POINTS) {
        return { ...prev, [stationId]: updated.slice(-MAX_HISTORY_POINTS) };
      }
      return { ...prev, [stationId]: updated };
    });
  }, []);

  const selectedStation = stations.find(s => (s.station_id || s.stationId) === selectedStationId) || null;
  const selectedStationAnalysis = selectedStationId ? latestAnalyses[selectedStationId] || null : null;
  const selectedStationHistory = selectedStationId ? historyByStation[selectedStationId] || [] : [];

  const resetStationAnomalies = useCallback(() => {
    setLatestAnalyses({});
    setInspectAnalysis(null);
  }, []);

  return {
    stations,
    latestAnalyses,
    historyByStation,
    selectedStation,
    selectedStationId,
    selectedStationAnalysis,
    selectedStationHistory,
    inspectAnalysis,
    isLoading,
    setSelectedStationId,
    setInspectAnalysis,
    handleLiveAnalysis,
    resetStationAnomalies
  };
};
