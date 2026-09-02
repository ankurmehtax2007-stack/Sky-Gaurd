// SkyGuard AI - Station Details Modal Component
import React from 'react';
import { StationInfo, LiveAnalysisRecord, TelemetryHistoryPoint } from '../types';
import { TelemetryLineChart } from '../charts/TelemetryLineChart';
import { HealthGauge } from '../charts/HealthGauge';
import { StatusBadge } from './StatusBadge';
import { formatNumber, formatDateTime, formatAnomalyLabel, formatPct } from '../utils/formatters';
import { getSeverityColor } from '../utils/colorMap';
import { X, ShieldAlert, Sparkles, Activity, MapPin } from 'lucide-react';

interface StationDetailsModalProps {
  station: StationInfo | null;
  analysis: LiveAnalysisRecord | null;
  history: TelemetryHistoryPoint[];
  onClose: () => void;
  onInspect: (record: LiveAnalysisRecord) => void;
}

export const StationDetailsModal: React.FC<StationDetailsModalProps> = ({
  station,
  analysis,
  history,
  onClose,
  onInspect
}) => {
  if (!station) return null;

  const stationId = station.station_id || station.stationId || '';
  const rootCause = analysis?.root_cause || station.current_anomaly || 'normal';
  const isAnomaly = rootCause !== 'normal';
  const healthScore = analysis?.sensor_health?.score ?? station.sensor_health ?? 100;
  const severity = String(analysis?.severity || 'NONE');
  const confidence = analysis?.confidence ?? 0.95;
  const evidenceSummary = analysis?.explanation?.evidence_summary || [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px' }}>
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
                {station.station_name}
              </h2>
              <StatusBadge
                status={isAnomaly ? 'critical' : 'online'}
                anomalyType={isAnomaly ? rootCause : undefined}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>
              <span className="mono">{stationId}</span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <MapPin size={13} /> {station.city} ({station.cluster})
              </span>
              <span>•</span>
              <span>GPS: {station.latitude.toFixed(4)}°N, {station.longitude.toFixed(4)}°E</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.4rem', borderRadius: '50%' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Status & Diagnostic Summary Card */}
          <div style={{
            background: isAnomaly ? '#fff5f5' : '#f8fafc',
            border: `1px solid ${isAnomaly ? '#fee2e2' : '#e2e8f0'}`,
            borderRadius: '10px',
            padding: '1.15rem',
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            gap: '1.5rem',
            alignItems: 'center'
          }}>
            <HealthGauge score={healthScore} size={90} label="Health" />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                    Latest Diagnostic Prediction
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: isAnomaly ? '#dc2626' : '#16a34a' }}>
                    {formatAnomalyLabel(rootCause)}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>CONFIDENCE</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                      {formatPct(confidence)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>SEVERITY</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: getSeverityColor(severity).text, fontFamily: 'var(--font-mono)' }}>
                      {severity}
                    </div>
                  </div>
                </div>
              </div>

              {/* Evidence statements */}
              {evidenceSummary.length > 0 ? (
                <div style={{ fontSize: '0.825rem', color: '#334155', background: '#ffffff', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  {evidenceSummary.map((stmt, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                      <span style={{ color: '#0284c7' }}>•</span>
                      <span>{stmt}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  All sensors operating within nominal climatological envelope.
                </div>
              )}
            </div>
          </div>

          {/* Live Telemetry Graphs (Temperature, Humidity, Pressure) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Live Telemetry Rolling Windows (Last 30 Points / 300s)
            </h3>

            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.85rem' }}>
              <TelemetryLineChart
                data={history}
                metricKey="temperature"
                label="Ambient Temperature"
                unit="°C"
                color="#0284c7"
                height={160}
              />
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.85rem' }}>
              <TelemetryLineChart
                data={history}
                metricKey="humidity"
                label="Relative Humidity"
                unit="%"
                color="#0d9488"
                height={160}
              />
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.85rem' }}>
              <TelemetryLineChart
                data={history}
                metricKey="pressure"
                label="Barometric Pressure"
                unit="hPa"
                color="#8b5cf6"
                height={160}
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
          {analysis && (
            <button
              onClick={() => {
                onClose();
                onInspect(analysis);
              }}
              className="btn btn-primary"
            >
              <Sparkles size={16} />
              <span>Deep Inspection & SHAP</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
