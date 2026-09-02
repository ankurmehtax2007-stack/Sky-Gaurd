// SkyGuard AI - Anomaly Center Page
import React, { useState } from 'react';
import { LiveAnalysisRecord } from '../types';
import { AnomalyTable } from '../components/AnomalyTable';
import { SUPPORTED_ANOMALY_CLASSES, ANOMALY_LABELS } from '../utils/constants';
import { AlertOctagon, Search, Zap, Trash2 } from 'lucide-react';

interface AnomalyCenterPageProps {
  anomalies: LiveAnalysisRecord[];
  onInspect: (record: LiveAnalysisRecord) => void;
  onOpenInject: () => void;
  onClearRecords?: () => void;
}

export const AnomalyCenterPage: React.FC<AnomalyCenterPageProps> = ({
  anomalies,
  onInspect,
  onOpenInject,
  onClearRecords
}) => {
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  // Filter anomalies (DRIFT is completely excluded)
  const filtered = anomalies.filter(item => {
    const rc = (item.root_cause || item.prediction?.root_cause || '').toLowerCase();
    if (rc === 'normal' || rc === 'drift') return false;

    if (selectedClass !== 'all' && rc !== selectedClass.toLowerCase()) return false;
    if (selectedSeverity !== 'all' && String(item.severity).toUpperCase() !== selectedSeverity.toUpperCase()) return false;

    if (search) {
      const q = search.toLowerCase();
      const station = (item.station_name || item.station_id || '').toLowerCase();
      const city = (item.city || '').toLowerCase();
      return station.includes(q) || city.includes(q) || rc.includes(q);
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header Banner */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: '#fee2e2', padding: '0.65rem', borderRadius: '10px', color: '#dc2626' }}>
            <AlertOctagon size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>
              Anomaly Center
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Real-time feed of multi-source verified anomalies from the Python FastAPI decision engine.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {onClearRecords && (
            <button
              onClick={onClearRecords}
              className="btn btn-secondary"
              style={{ color: '#dc2626', borderColor: '#fecaca', background: '#fff5f5' }}
              title="Clear all database anomaly records and streaming buffers"
            >
              <Trash2 size={15} />
              <span>Clear Records</span>
            </button>
          )}
          <button onClick={onOpenInject} className="btn btn-primary">
            <Zap size={15} />
            <span>Inject Test Anomaly</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '0.75rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '220px' }}>
          <Search size={16} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search by station, city, or anomaly..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.85rem' }}
          />
        </div>

        {/* Anomaly Class Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>CLASS:</span>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
          >
            <option value="all">All Anomaly Classes ({SUPPORTED_ANOMALY_CLASSES.length})</option>
            {SUPPORTED_ANOMALY_CLASSES.map(c => (
              <option key={c} value={c}>{ANOMALY_LABELS[c]}</option>
            ))}
          </select>
        </div>

        {/* Severity Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>SEVERITY:</span>
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
          >
            <option value="all">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Anomalies Table */}
      <div className="card">
        <AnomalyTable
          anomalies={filtered}
          onInspect={onInspect}
          emptyMessage="No anomalies match the selected filters."
        />
      </div>
    </div>
  );
};
