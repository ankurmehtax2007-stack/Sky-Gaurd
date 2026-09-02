// SkyGuard AI - Reusable Anomaly Table Component
import React from 'react';
import { LiveAnalysisRecord } from '../types';
import { StatusBadge } from './StatusBadge';
import { formatDateTime, formatPct, formatAnomalyLabel } from '../utils/formatters';
import { getSeverityColor } from '../utils/colorMap';
import { Eye, AlertTriangle } from 'lucide-react';

interface AnomalyTableProps {
  anomalies: LiveAnalysisRecord[];
  onInspect: (record: LiveAnalysisRecord) => void;
  emptyMessage?: string;
  limit?: number;
}

export const AnomalyTable: React.FC<AnomalyTableProps> = ({
  anomalies,
  onInspect,
  emptyMessage = 'No anomalies detected in the current telemetry window.',
  limit
}) => {
  const displayList = limit ? anomalies.slice(0, limit) : anomalies;

  if (displayList.length === 0) {
    return (
      <div style={{ padding: '2.5rem', textAlign: 'center', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
        <div style={{ color: '#16a34a', display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
          <AlertTriangle size={28} />
        </div>
        <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.95rem' }}>{emptyMessage}</div>
        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
          All regional AWS stations are streaming nominal weather parameters.
        </div>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Station</th>
            <th>City</th>
            <th>Timestamp</th>
            <th>Anomaly Class</th>
            <th>Severity</th>
            <th>Confidence</th>
            <th>Sensor Health</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {displayList.map((item, idx) => {
            const stationId = item.station_id || item.raw_record?.station_id || 'IMD-001';
            const stationName = item.station_name || item.raw_record?.station?.name || 'AWS Node';
            const rootCause = item.root_cause || item.prediction?.root_cause || 'unknown';
            const severity = String(item.severity || 'NONE');
            const conf = item.confidence ?? item.prediction?.confidence ?? 0.95;
            const health = item.sensor_health?.score ?? item.health_score ?? 100;
            const sevColor = getSeverityColor(severity);

            return (
              <tr key={item._id || item.analysis_id || idx}>
                <td>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{stationName}</div>
                  <div className="mono" style={{ color: '#64748b', fontSize: '0.75rem' }}>{stationId}</div>
                </td>
                <td style={{ fontWeight: 500 }}>{item.city}</td>
                <td className="mono" style={{ color: '#475569', fontSize: '0.8rem' }}>
                  {formatDateTime(item.timestamp)}
                </td>
                <td>
                  <StatusBadge status="critical" anomalyType={rootCause} />
                </td>
                <td>
                  <span
                    style={{
                      background: sevColor.bg,
                      color: sevColor.text,
                      border: `1px solid ${sevColor.border}`,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '9999px',
                      fontSize: '0.725rem',
                      fontWeight: 700
                    }}
                  >
                    {severity}
                  </span>
                </td>
                <td className="mono" style={{ fontWeight: 600 }}>
                  {formatPct(conf)}
                </td>
                <td>
                  <span className="mono" style={{ fontWeight: 700, color: health >= 80 ? '#16a34a' : '#dc2626' }}>
                    {health}/100
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => onInspect(item)}
                    className="btn btn-primary btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                  >
                    <Eye size={13} />
                    <span>Inspect</span>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
