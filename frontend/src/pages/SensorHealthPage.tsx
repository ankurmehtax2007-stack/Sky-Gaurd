// SkyGuard AI - Sensor Health Fleet Dashboard
import React from 'react';
import { StationInfo, LiveAnalysisRecord } from '../types';
import { HealthGauge } from '../charts/HealthGauge';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { formatAnomalyLabel } from '../utils/formatters';
import { getHealthColor } from '../utils/colorMap';
import { HeartPulse, Thermometer, Droplets, Gauge, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';

interface SensorHealthPageProps {
  stations: StationInfo[];
  latestAnalyses: Record<string, LiveAnalysisRecord>;
  onSelectStation: (stationId: string) => void;
  onInspect: (record: LiveAnalysisRecord) => void;
}

export const SensorHealthPage: React.FC<SensorHealthPageProps> = ({
  stations,
  latestAnalyses,
  onSelectStation,
  onInspect
}) => {
  // Aggregate sensor-level health scores across all stations
  let totalOverall = 0;
  let degradedStationsCount = 0;
  let criticalStationsCount = 0;

  stations.forEach(stn => {
    const id = stn.station_id || stn.stationId || '';
    const h = latestAnalyses[id]?.sensor_health?.score ?? stn.sensor_health ?? 100;
    totalOverall += h;
    if (h < 70 && h >= 40) degradedStationsCount++;
    if (h < 40) criticalStationsCount++;
  });

  const avgOverall = stations.length > 0 ? Math.round(totalOverall / stations.length) : 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Health Metric Cards */}
      <div className="stat-grid">
        <StatCard
          label="Network Health Index"
          value={`${avgOverall}/100`}
          subtext="Fleet average sensor integrity score"
          icon={<HeartPulse size={20} />}
          valueColor={getHealthColor(avgOverall)}
        />

        <StatCard
          label="Optimal Health"
          value={stations.length - degradedStationsCount - criticalStationsCount}
          subtext="Score ≥ 80 (Fully nominal)"
          icon={<ShieldCheck size={20} />}
          valueColor="#16a34a"
        />

        <StatCard
          label="Degraded Sensors"
          value={degradedStationsCount}
          subtext="Score 40–79 (Suspect calibration)"
          icon={<Activity size={20} />}
          valueColor={degradedStationsCount > 0 ? '#d97706' : '#64748b'}
        />

        <StatCard
          label="Critical Health"
          value={criticalStationsCount}
          subtext="Score < 40 (Immediate maintenance)"
          icon={<AlertTriangle size={20} />}
          valueColor={criticalStationsCount > 0 ? '#dc2626' : '#64748b'}
        />
      </div>

      {/* Station Health Fleet Breakdown Cards */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Regional Weather Station Fleet Health Status</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Real-time health deductions computed by Python ML sensor diagnostics layer
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {stations.map(stn => {
            const id = stn.station_id || stn.stationId || '';
            const analysis = latestAnalyses[id];
            const healthScore = analysis?.sensor_health?.score ?? stn.sensor_health ?? 100;
            const healthStatus = analysis?.sensor_health?.status || (healthScore >= 80 ? 'GOOD' : healthScore >= 60 ? 'FAIR' : 'CRITICAL');
            const rootCause = analysis?.root_cause || stn.current_anomaly || 'normal';
            const isAnomaly = rootCause !== 'normal';
            const deductions = analysis?.sensor_health?.deductions || {};

            return (
              <div
                key={id}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                {/* Station Top Info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>{stn.station_name}</h4>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                      {id} • {stn.city} ({stn.cluster})
                    </div>
                  </div>
                  <StatusBadge status={isAnomaly ? 'critical' : 'online'} anomalyType={isAnomaly ? rootCause : undefined} />
                </div>

                {/* Circular Gauge & Health Details */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', background: '#f8fafc', padding: '0.85rem', borderRadius: '8px' }}>
                  <HealthGauge score={healthScore} size={75} />
                  <div>
                    <div style={{ fontSize: '0.725rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Integrity Status</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: getHealthColor(healthScore) }}>
                      {healthStatus}
                    </div>
                    {isAnomaly && (
                      <div style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 600, marginTop: '2px' }}>
                        Anomaly: {formatAnomalyLabel(rootCause)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Specific Sensor Health Meters */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Thermometer size={13} color="#0284c7" /> Temperature Channel
                    </span>
                    <strong style={{ color: isAnomaly && rootCause.includes('temp') ? '#dc2626' : '#16a34a' }}>
                      {isAnomaly && rootCause.includes('temp') ? 'Suspect' : 'Healthy'}
                    </strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Droplets size={13} color="#0d9488" /> Humidity Sensor
                    </span>
                    <strong style={{ color: isAnomaly && rootCause.includes('hum') ? '#dc2626' : '#16a34a' }}>
                      {isAnomaly && rootCause.includes('hum') ? 'Suspect' : 'Healthy'}
                    </strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Gauge size={13} color="#8b5cf6" /> Barometric Pressure
                    </span>
                    <strong style={{ color: isAnomaly && rootCause.includes('press') ? '#dc2626' : '#16a34a' }}>
                      {isAnomaly && rootCause.includes('press') ? 'Suspect' : 'Healthy'}
                    </strong>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <button
                    onClick={() => onSelectStation(id)}
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1, fontSize: '0.75rem' }}
                  >
                    Station Details
                  </button>
                  {analysis && isAnomaly && (
                    <button
                      onClick={() => onInspect(analysis)}
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: '0.75rem' }}
                    >
                      Inspect
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
