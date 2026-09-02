// SkyGuard AI - Anomalies Management Hook
import { useState, useEffect, useCallback, useMemo } from 'react';
import { LiveAnalysisRecord } from '../types';
import { fetchAnomalies } from '../services/api';

export const useAnomalies = () => {
  const [anomalies, setAnomalies] = useState<LiveAnalysisRecord[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initial load from backend API
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const list = await fetchAnomalies(50);
        if (isMounted && Array.isArray(list)) {
          // Filter out normal if returned in list
          const anomsOnly = list.filter(item => {
            const rc = item.root_cause || item.prediction?.root_cause;
            return rc && rc !== 'normal';
          });
          setAnomalies(anomsOnly);
        }
      } catch (err) {
        console.warn('Could not load historical anomalies:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    load();
    return () => { isMounted = false; };
  }, []);

  // Add new anomaly from live stream
  const addLiveAnomaly = useCallback((record: LiveAnalysisRecord) => {
    const isAnom = record.prediction?.is_anomaly || (record.decision && record.decision !== 'normal');
    const rootCause = record.root_cause || record.prediction?.root_cause;

    if (isAnom && rootCause && rootCause !== 'normal') {
      setAnomalies(prev => {
        // Prevent duplicate analysis_id
        if (record.analysis_id && prev.some(a => a.analysis_id === record.analysis_id)) {
          return prev;
        }
        // Keep max 100 recent anomalies in state
        const updated = [record, ...prev];
        return updated.slice(0, 100);
      });
    }
  }, []);

  // Filtered list
  const filteredAnomalies = useMemo(() => {
    return anomalies.filter(item => {
      const type = (item.root_cause || item.prediction?.root_cause || '').toLowerCase();
      const city = (item.city || '').toLowerCase();
      const severity = String(item.severity || '').toUpperCase();
      const station = (item.station_name || item.station_id || '').toLowerCase();

      if (selectedType !== 'all' && type !== selectedType.toLowerCase()) return false;
      if (selectedCity !== 'all' && city !== selectedCity.toLowerCase()) return false;
      if (selectedSeverity !== 'all' && severity !== selectedSeverity.toUpperCase()) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return station.includes(q) || city.includes(q) || type.includes(q);
      }
      return true;
    });
  }, [anomalies, selectedType, selectedCity, selectedSeverity, searchQuery]);

  return {
    anomalies,
    filteredAnomalies,
    selectedType,
    selectedCity,
    selectedSeverity,
    searchQuery,
    isLoading,
    setSelectedType,
    setSelectedCity,
    setSelectedSeverity,
    setSearchQuery,
    addLiveAnomaly,
    clearAnomalies: () => setAnomalies([])
  };
};
