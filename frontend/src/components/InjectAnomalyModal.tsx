// SkyGuard AI - Clean Anomaly Injection Modal
import React, { useState, useMemo } from 'react';
import { StationInfo, AnomalyType } from '../types';
import { SUPPORTED_ANOMALY_CLASSES, ANOMALY_LABELS, ANOMALY_DESCRIPTIONS } from '../utils/constants';
import { injectAnomaly } from '../services/api';
import { X, Zap, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface InjectAnomalyModalProps {
  stations: StationInfo[];
  onClose: () => void;
  onInjectionScheduled?: (msg: string) => void;
}

export const InjectAnomalyModal: React.FC<InjectAnomalyModalProps> = ({
  stations,
  onClose,
  onInjectionScheduled
}) => {
  // 1. Unique Cities
  const cities = useMemo(() => {
    const set = new Set<string>();
    stations.forEach(s => { if (s.city) set.add(s.city); });
    return Array.from(set);
  }, [stations]);

  const [selectedCity, setSelectedCity] = useState<string>(cities[0] || 'New Delhi');

  // 2. Filter stations by selected city
  const cityStations = useMemo(() => {
    return stations.filter(s => s.city.toLowerCase() === selectedCity.toLowerCase());
  }, [stations, selectedCity]);

  const [selectedStationId, setSelectedStationId] = useState<string>(
    cityStations[0]?.station_id || cityStations[0]?.stationId || 'IMD-DEL-001'
  );

  // Update station when city changes
  const handleCityChange = (newCity: string) => {
    setSelectedCity(newCity);
    const available = stations.filter(s => s.city.toLowerCase() === newCity.toLowerCase());
    if (available.length > 0) {
      setSelectedStationId(available[0].station_id || available[0].stationId || '');
    }
  };

  // 3. Anomaly Type (DRIFT is completely removed!)
  const [anomalyType, setAnomalyType] = useState<AnomalyType>('temperature_spike');

  // 4. Duration (default: 6 points = 60s)
  const [durationPoints, setDurationPoints] = useState<number>(6);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Find companion station if spatial inconsistency is selected
  const companionStation = useMemo(() => {
    if (anomalyType === 'spatial_inconsistency') {
      return stations.find(s =>
        (s.station_id || s.stationId) !== selectedStationId &&
        s.city.toLowerCase() === selectedCity.toLowerCase()
      );
    }
    return null;
  }, [anomalyType, stations, selectedStationId, selectedCity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // Clean request payload: ONLY sends city, station_id, anomaly_type, duration_points (NO ML features or scores)
      await injectAnomaly({
        city: selectedCity,
        station_id: selectedStationId,
        anomaly_type: anomalyType,
        duration_points: durationPoints
      });

      setSuccessMsg(`Anomaly injection scheduled on ${selectedStationId} for ${durationPoints} records (~${durationPoints * 10}s). Station will automatically return to normal.`);
      onInjectionScheduled?.(`Injected ${anomalyType} on ${selectedStationId}`);

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to schedule anomaly injection in simulator.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Zap size={20} color="#0284c7" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
              Simulator Anomaly Injection Control
            </h2>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ borderRadius: '50%', padding: '0.4rem' }}>
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="modal-body" style={{ gap: '1rem' }}>
          {errorMsg && (
            <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', padding: '0.75rem', borderRadius: '6px', color: '#b91c1c', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div style={{ background: '#dcfce7', border: '1px solid #86efac', padding: '0.75rem', borderRadius: '6px', color: '#15803d', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 1. City Select */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              1. Select City
            </label>
            <select
              value={selectedCity}
              onChange={(e) => handleCityChange(e.target.value)}
              style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
            >
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {/* 2. Station Select */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              2. Select Target Station
            </label>
            <select
              value={selectedStationId}
              onChange={(e) => setSelectedStationId(e.target.value)}
              style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
            >
              {cityStations.map(stn => {
                const id = stn.station_id || stn.stationId;
                return (
                  <option key={id} value={id}>
                    {stn.station_name} ({id})
                  </option>
                );
              })}
            </select>
          </div>

          {/* 3. Anomaly Type (DRIFT is completely removed!) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              3. Select Anomaly Type (8 Supported Classes)
            </label>
            <select
              value={anomalyType}
              onChange={(e) => setAnomalyType(e.target.value as AnomalyType)}
              style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
            >
              {SUPPORTED_ANOMALY_CLASSES.map(type => (
                <option key={type} value={type}>
                  {ANOMALY_LABELS[type]}
                </option>
              ))}
            </select>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.3rem' }}>
              {ANOMALY_DESCRIPTIONS[anomalyType]}
            </div>
          </div>

          {/* Spatial Inconsistency Notice */}
          {anomalyType === 'spatial_inconsistency' && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.75rem', borderRadius: '6px', fontSize: '0.8rem', color: '#166534', display: 'flex', gap: '8px' }}>
              <Info size={18} style={{ flexShrink: 0 }} />
              <div>
                <strong>Dual-Station Inconsistency Pairing:</strong> Target station <code>{selectedStationId}</code> will deviate while companion station{' '}
                <code>{companionStation ? (companionStation.station_id || companionStation.stationId) : 'cluster reference'}</code> in {selectedCity} continues emitting normal telemetry.
              </div>
            </div>
          )}

          {/* 4. Duration Points (Default: 6 points = 60s) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              4. Injection Duration (Telemetry Points)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <input
                type="number"
                min="1"
                max="20"
                value={durationPoints}
                onChange={(e) => setDurationPoints(parseInt(e.target.value, 10) || 6)}
                style={{ width: '100px', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
              />
              <span style={{ fontSize: '0.825rem', color: '#64748b' }}>
                = {durationPoints * 10} seconds (at 10-second telemetry frequency)
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
              Station automatically returns to nominal data stream after window completion.
            </div>
          </div>

          {/* Footer Controls */}
          <div className="modal-footer" style={{ margin: '-1.5rem', marginTop: '0.5rem', padding: '1rem 1.5rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{ background: 'linear-gradient(135deg, #0284c7, #0d9488)' }}
            >
              <Zap size={16} />
              <span>{isSubmitting ? 'Scheduling...' : 'Inject Anomaly (6 Pts)'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
