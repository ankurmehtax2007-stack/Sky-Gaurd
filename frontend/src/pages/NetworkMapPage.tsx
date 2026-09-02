// SkyGuard AI - Network Map Page
import React, { useState, useMemo } from 'react';
import { StationInfo, LiveAnalysisRecord } from '../types';
import { IndiaMap } from '../map/IndiaMap';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { formatNumber, formatAnomalyLabel } from '../utils/formatters';
import { Map, Filter, Radio, AlertTriangle, CheckCircle2, ChevronRight, Eye } from 'lucide-react';

interface NetworkMapPageProps {
  stations: StationInfo[];
  latestAnalyses: Record<string, LiveAnalysisRecord>;
  onSelectStation: (stationId: string) => void;
  onInspect: (record: LiveAnalysisRecord) => void;
}

export const NetworkMapPage: React.FC<NetworkMapPageProps> = ({
  stations,
  latestAnalyses,
  onSelectStation,
  onInspect
}) => {
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [anomalyFilter, setAnomalyFilter] = useState<string>('all');
  const [activeStationId, setActiveStationId] = useState<string | null>(null);

  // Available unique cities dynamically extracted from backend station models
  const cities = useMemo(() => {
    const s = new Set<string>();
    stations.forEach(stn => { if (stn.city) s.add(stn.city); });
    return Array.from(s);
  }, [stations]);

  // Selected station details
  const activeStation = stations.find(s => (s.station_id || s.stationId) === activeStationId) || stations[0] || null;
  const activeStationIdStr = activeStation ? (activeStation.station_id || activeStation.stationId || '') : '';
  const activeAnalysis = activeStationIdStr ? latestAnalyses[activeStationIdStr] || null : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Filters Toolbar */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        padding: '0.85rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Map size={20} color="#0284c7" />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
            National AWS Telemetry Network Map
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {/* City Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>CITY:</span>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
            >
              <option value="all">All Cities ({cities.length})</option>
              {cities.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Anomaly Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>STATUS:</span>
            <select
              value={anomalyFilter}
              onChange={(e) => setAnomalyFilter(e.target.value)}
              style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
            >
              <option value="all">All Stations</option>
              <option value="anomaly">Anomalies Only</option>
              <option value="normal">Nominal Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Map & Live Station Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }}>
        {/* Interactive Map */}
        <IndiaMap
          stations={stations}
          latestAnalyses={latestAnalyses}
          onSelectStation={(id) => {
            setActiveStationId(id);
            onSelectStation(id);
          }}
          onInspectStation={onInspect}
          cityFilter={selectedCity}
          anomalyFilter={anomalyFilter}
        />

        {/* Selected Station Telemetry Drawer */}
        {activeStation ? (() => {
          const rootCause = activeAnalysis?.root_cause || activeStation.current_anomaly || 'normal';
          const isAnomaly = rootCause !== 'normal';
          const temp = activeAnalysis?.telemetry?.temperature_c ?? activeStation.temperature_c;
          const hum = activeAnalysis?.telemetry?.humidity_pct ?? activeStation.humidity_pct;
          const press = activeAnalysis?.telemetry?.pressure_hpa ?? activeStation.pressure_hpa;
          const health = activeAnalysis?.sensor_health?.score ?? activeStation.sensor_health ?? 100;

          return (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'space-between' }}>
              <div>
                <div className="card-header" style={{ marginBottom: '0.5rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                      Selected Station Node
                    </div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                      {activeStation.station_name}
                    </h3>
                  </div>
                  <StatusBadge status={isAnomaly ? 'critical' : 'online'} anomalyType={isAnomaly ? rootCause : undefined} />
                </div>

                <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>
                  <span className="mono">{activeStationIdStr}</span> • {activeStation.city} ({activeStation.cluster})
                </div>

                {/* Metrics */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.75rem', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Temperature</span>
                    <strong className="mono" style={{ color: '#0284c7' }}>{formatNumber(temp, 2, '°C')}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.75rem', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Relative Humidity</span>
                    <strong className="mono" style={{ color: '#0d9488' }}>{formatNumber(hum, 1, '%')}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.75rem', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Barometric Pressure</span>
                    <strong className="mono" style={{ color: '#8b5cf6' }}>{formatNumber(press, 1, 'hPa')}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.75rem', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Sensor Health Index</span>
                    <strong className="mono" style={{ color: health >= 80 ? '#16a34a' : '#dc2626' }}>{health}/100</strong>
                  </div>
                </div>

                {isAnomaly && (
                  <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#fee2e2', borderRadius: '6px', border: '1px solid #fca5a5' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#991b1b', textTransform: 'uppercase' }}>
                      Anomaly Diagnostic
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#dc2626', marginTop: '2px' }}>
                      {formatAnomalyLabel(rootCause)}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button
                  onClick={() => onSelectStation(activeStationIdStr)}
                  className="btn btn-secondary"
                  style={{ flex: 1, fontSize: '0.8rem' }}
                >
                  Station Details
                </button>
                {activeAnalysis && isAnomaly && (
                  <button
                    onClick={() => onInspect(activeAnalysis)}
                    className="btn btn-primary"
                    style={{ fontSize: '0.8rem' }}
                  >
                    <Eye size={14} />
                    <span>Inspect</span>
                  </button>
                )}
              </div>
            </div>
          );
        })() : null}
      </div>
    </div>
  );
};
