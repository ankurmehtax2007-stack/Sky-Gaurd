// SkyGuard AI - Overview Dashboard Page
import React from 'react';
import { StationInfo, LiveAnalysisRecord } from '../types';
import { StatCard } from '../components/StatCard';
import { AnomalyTable } from '../components/AnomalyTable';
import { StatusBadge } from '../components/StatusBadge';
import { AnomalyDistributionChart } from '../charts/AnomalyDistributionChart';
import { formatNumber } from '../utils/formatters';
import {
  Radio,
  CheckCircle2,
  AlertTriangle,
  Flame,
  HeartPulse,
  Activity,
  Zap
} from 'lucide-react';

interface OverviewPageProps {
  stations: StationInfo[];
  anomalies: LiveAnalysisRecord[];
  latestAnalyses: Record<string, LiveAnalysisRecord>;
  onInspect: (record: LiveAnalysisRecord) => void;
  onSelectStation: (stationId: string) => void;
  onOpenInject: () => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  stations,
  anomalies,
  latestAnalyses,
  onInspect,
  onSelectStation,
  onOpenInject
}) => {
  // Compute true live statistics from backend/WebSocket state
  const totalStations = stations.length;
  const onlineStations = stations.filter(s => s.status !== 'OFFLINE').length;

  const activeAnomaliesCount = stations.filter(s => {
    const id = s.station_id || s.stationId || '';
    const analysis = latestAnalyses[id];
    const rc = analysis?.root_cause || s.current_anomaly || 'normal';
    return rc !== 'normal';
  }).length;

  const normalStationsCount = totalStations - activeAnomaliesCount;

  const criticalAnomaliesCount = stations.filter(s => {
    const id = s.station_id || s.stationId || '';
    const analysis = latestAnalyses[id];
    const sev = String(analysis?.severity || '').toUpperCase();
    return sev === 'CRITICAL' || sev === 'HIGH';
  }).length;

  // Average sensor health
  const totalHealth = stations.reduce((acc, s) => {
    const id = s.station_id || s.stationId || '';
    const h = latestAnalyses[id]?.sensor_health?.score ?? s.sensor_health ?? 100;
    return acc + h;
  }, 0);
  const avgSensorHealth = totalStations > 0 ? Math.round(totalHealth / totalStations) : 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Overview Top Metric Cards */}
      <div className="stat-grid">
        <StatCard
          label="Total Regional AWS"
          value={totalStations}
          subtext="Configured weather telemetry nodes"
          icon={<Radio size={20} />}
          valueColor="#0f172a"
        />

        <StatCard
          label="Online Stations"
          value={onlineStations}
          subtext={`${totalStations > 0 ? ((onlineStations / totalStations) * 100).toFixed(0) : 100}% operational network`}
          icon={<CheckCircle2 size={20} />}
          valueColor="#16a34a"
        />

        <StatCard
          label="Nominal Stations"
          value={normalStationsCount}
          subtext="Streaming within physical bounds"
          icon={<Activity size={20} />}
          valueColor="#0284c7"
        />

        <StatCard
          label="Active Anomalies"
          value={activeAnomaliesCount}
          subtext={activeAnomaliesCount > 0 ? 'Requires meteorological triage' : 'No active deviations'}
          icon={<AlertTriangle size={20} />}
          valueColor={activeAnomaliesCount > 0 ? '#dc2626' : '#16a34a'}
        />

        <StatCard
          label="Critical Severity"
          value={criticalAnomaliesCount}
          subtext="Immediate sensor attention required"
          icon={<Flame size={20} />}
          valueColor={criticalAnomaliesCount > 0 ? '#dc2626' : '#64748b'}
        />

        <StatCard
          label="Avg Sensor Health"
          value={`${avgSensorHealth}/100`}
          subtext="Network fleet health index"
          icon={<HeartPulse size={20} />}
          valueColor={avgSensorHealth >= 80 ? '#16a34a' : '#d97706'}
        />
      </div>

      {/* Live Anomaly Summary Banner */}
      {activeAnomaliesCount > 0 ? (
        <div style={{
          background: '#fff5f5',
          border: '1px solid #fecaca',
          borderRadius: '10px',
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: '#fee2e2', padding: '0.5rem', borderRadius: '8px', color: '#dc2626' }}>
              <AlertTriangle size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#991b1b' }}>
                {activeAnomaliesCount} Regional Weather Station{activeAnomaliesCount > 1 ? 's' : ''} Currently Experiencing Sensor Anomalies
              </div>
              <div style={{ fontSize: '0.8rem', color: '#b91c1c', marginTop: '0.15rem' }}>
                FastAPI ML Diagnostics Engine has identified active anomalies. Review the recent anomalies table below for evidence breakdown.
              </div>
            </div>
          </div>

          <button onClick={onOpenInject} className="btn btn-secondary btn-sm" style={{ background: '#ffffff', whiteSpace: 'nowrap' }}>
            <Zap size={14} color="#0284c7" />
            <span>Inject Test Anomaly</span>
          </button>
        </div>
      ) : (
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '10px',
          padding: '0.85rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CheckCircle2 size={20} color="#16a34a" />
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#166534' }}>
              All 5 IMD weather telemetry stations operating nominally. Zero active physical anomalies.
            </span>
          </div>
          <button onClick={onOpenInject} className="btn btn-secondary btn-sm" style={{ background: '#ffffff' }}>
            <Zap size={14} color="#0284c7" />
            <span>Test Simulator Injection</span>
          </button>
        </div>
      )}

      {/* Grid: Recent Anomalies Table & Anomaly Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }}>
        {/* Recent Anomalies Table */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Recent Telemetry Anomalies</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Verified incident classifications received from Python FastAPI pipeline
              </div>
            </div>
          </div>

          <AnomalyTable
            anomalies={anomalies}
            onInspect={onInspect}
            limit={8}
            emptyMessage="No historical or active anomalies logged."
          />
        </div>

        {/* Anomaly Distribution Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Incident Distribution</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Classification breakdown by root cause
              </div>
            </div>
          </div>

          <AnomalyDistributionChart anomalies={anomalies} height={280} />
        </div>
      </div>
    </div>
  );
};
