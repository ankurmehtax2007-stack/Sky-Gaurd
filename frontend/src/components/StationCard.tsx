// SkyGuard AI - Memoized Station Card Component
import React from 'react';
import { StationInfo, LiveAnalysisRecord } from '../types';
import { formatNumber, formatAnomalyLabel } from '../utils/formatters';
import { getHealthColor } from '../utils/colorMap';
import { StatusBadge } from './StatusBadge';
import { Thermometer, Droplets, Gauge, Heart, ChevronRight, Activity } from 'lucide-react';

interface StationCardProps {
  station: StationInfo;
  latestAnalysis?: LiveAnalysisRecord | null;
  onClick: () => void;
  onInspect?: (record: LiveAnalysisRecord) => void;
}

export const StationCard: React.FC<StationCardProps> = React.memo(({
  station,
  latestAnalysis,
  onClick,
  onInspect
}) => {
  const stationId = station.station_id || station.stationId || '';
  const stationName = station.station_name || station.name || 'AWS Node';

  const temp = latestAnalysis?.telemetry?.temperature_c ?? station.temperature_c ?? station.temperature;
  const hum = latestAnalysis?.telemetry?.humidity_pct ?? station.humidity_pct ?? station.humidity;
  const press = latestAnalysis?.telemetry?.pressure_hpa ?? station.pressure_hpa ?? station.pressure;
  const health = latestAnalysis?.sensor_health?.score ?? station.sensor_health ?? 100;

  const rootCause = latestAnalysis?.root_cause || station.current_anomaly || 'normal';
  const isAnomaly = rootCause !== 'normal';
  const confidence = latestAnalysis?.confidence ?? 0.95;

  return (
    <div
      onClick={onClick}
      style={{
        background: '#ffffff',
        border: `1px solid ${isAnomaly ? '#fca5a5' : '#e2e8f0'}`,
        borderRadius: '12px',
        padding: '1.15rem',
        cursor: 'pointer',
        boxShadow: isAnomaly ? '0 4px 12px rgba(220, 38, 38, 0.08)' : '0 1px 3px rgba(0,0,0,0.05)',
        transition: 'all 0.15s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = isAnomaly ? '#ef4444' : '#0284c7';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = isAnomaly ? '#fca5a5' : '#e2e8f0';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Card Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
              {stationName}
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'var(--font-mono)', marginTop: '0.1rem' }}>
            {stationId} • <span style={{ color: '#0284c7', fontWeight: 500 }}>{station.cluster || station.city}</span>
          </div>
        </div>

        <StatusBadge
          status={isAnomaly ? 'critical' : station.status === 'OFFLINE' ? 'offline' : 'online'}
          anomalyType={isAnomaly ? rootCause : undefined}
        />
      </div>

      {/* Telemetry Metrics Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '0.5rem',
        background: isAnomaly ? '#fff5f5' : '#f8fafc',
        padding: '0.65rem 0.75rem',
        borderRadius: '8px',
        border: `1px solid ${isAnomaly ? '#fee2e2' : '#f1f5f9'}`
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>
            <Thermometer size={12} color="#0284c7" />
            <span>Temp</span>
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
            {formatNumber(temp, 1, '°C')}
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>
            <Droplets size={12} color="#0d9488" />
            <span>Humidity</span>
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
            {formatNumber(hum, 1, '%')}
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>
            <Gauge size={12} color="#8b5cf6" />
            <span>Pressure</span>
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
            {formatNumber(press, 1, 'hPa')}
          </div>
        </div>
      </div>

      {/* Card Footer: Sensor Health & Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.2rem', borderTop: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem' }}>
          <Heart size={14} color={getHealthColor(health)} />
          <span style={{ color: '#64748b' }}>Health:</span>
          <strong style={{ color: getHealthColor(health), fontFamily: 'var(--font-mono)' }}>{health}/100</strong>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          {isAnomaly && latestAnalysis && onInspect && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onInspect(latestAnalysis);
              }}
              className="btn btn-primary btn-sm"
              style={{ fontSize: '0.725rem', padding: '0.25rem 0.55rem' }}
            >
              Inspect
            </button>
          )}

          <span style={{ fontSize: '0.75rem', color: '#0284c7', display: 'flex', alignItems: 'center', fontWeight: 600 }}>
            Details <ChevronRight size={14} />
          </span>
        </div>
      </div>
    </div>
  );
});

StationCard.displayName = 'StationCard';
