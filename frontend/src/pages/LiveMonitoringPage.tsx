// SkyGuard AI - Live Monitoring Page (Grouped by City)
import React, { useMemo, useState } from 'react';
import { StationInfo, LiveAnalysisRecord } from '../types';
import { StationCard } from '../components/StationCard';
import { MapPin, Search, Filter, Activity, Zap } from 'lucide-react';

interface LiveMonitoringPageProps {
  stations: StationInfo[];
  latestAnalyses: Record<string, LiveAnalysisRecord>;
  onSelectStation: (stationId: string) => void;
  onInspect: (record: LiveAnalysisRecord) => void;
  onOpenInject: () => void;
}

export const LiveMonitoringPage: React.FC<LiveMonitoringPageProps> = ({
  stations,
  latestAnalyses,
  onSelectStation,
  onInspect,
  onOpenInject
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'normal' | 'anomaly'>('all');

  // Filter stations
  const filteredStations = useMemo(() => {
    return stations.filter(stn => {
      const id = stn.station_id || stn.stationId || '';
      const name = stn.station_name || stn.name || '';
      const city = stn.city || '';
      const analysis = latestAnalyses[id];
      const rootCause = analysis?.root_cause || stn.current_anomaly || 'normal';
      const isAnom = rootCause !== 'normal';

      if (statusFilter === 'anomaly' && !isAnom) return false;
      if (statusFilter === 'normal' && isAnom) return false;

      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return id.toLowerCase().includes(q) || name.toLowerCase().includes(q) || city.toLowerCase().includes(q);
      }
      return true;
    });
  }, [stations, latestAnalyses, statusFilter, searchTerm]);

  // Group stations strictly by CITY
  const groupedByCity = useMemo(() => {
    const groups: Record<string, StationInfo[]> = {};
    filteredStations.forEach(stn => {
      const city = stn.city || 'Other Region';
      if (!groups[city]) groups[city] = [];
      groups[city].push(stn);
    });
    return groups;
  }, [filteredStations]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Filter & Search Bar */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        padding: '0.85rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '240px' }}>
          <Search size={18} color="#64748b" />
          <input
            type="text"
            placeholder="Search by station name, ID, or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              border: 'none',
              outline: 'none',
              width: '100%',
              fontSize: '0.875rem',
              color: '#0f172a'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: '#64748b' }}>
            <Filter size={15} />
            <span>Status:</span>
          </div>

          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '6px', padding: '2px' }}>
            {(['all', 'normal', 'anomaly'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setStatusFilter(mode)}
                style={{
                  padding: '0.3rem 0.65rem',
                  fontSize: '0.75rem',
                  fontWeight: statusFilter === mode ? 600 : 500,
                  background: statusFilter === mode ? '#ffffff' : 'transparent',
                  color: statusFilter === mode ? '#0f172a' : '#64748b',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  boxShadow: statusFilter === mode ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                }}
              >
                {mode}
              </button>
            ))}
          </div>

          <button onClick={onOpenInject} className="btn btn-primary btn-sm">
            <Zap size={14} />
            <span>Inject Anomaly</span>
          </button>
        </div>
      </div>

      {/* City Groups */}
      {Object.keys(groupedByCity).length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', color: '#64748b' }}>
          No weather stations match your search or filter criteria.
        </div>
      ) : (
        Object.entries(groupedByCity).map(([city, cityStns]) => {
          const cityAnomalies = cityStns.filter(stn => {
            const id = stn.station_id || stn.stationId || '';
            const analysis = latestAnalyses[id];
            const rc = analysis?.root_cause || stn.current_anomaly || 'normal';
            return rc !== 'normal';
          }).length;

          return (
            <div key={city} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* City Group Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.35rem', borderBottom: '2px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MapPin size={18} color="#0284c7" />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                    {city}
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', background: '#f1f5f9', padding: '0.1rem 0.45rem', borderRadius: '9999px', fontWeight: 600 }}>
                    {cityStns.length} Station{cityStns.length > 1 ? 's' : ''}
                  </span>
                </div>

                {cityAnomalies > 0 ? (
                  <span className="badge badge-critical">
                    <span className="badge-dot" />
                    <span>{cityAnomalies} Anomaly Detected</span>
                  </span>
                ) : (
                  <span className="badge badge-normal">
                    <span className="badge-dot" />
                    <span>All Stations Normal</span>
                  </span>
                )}
              </div>

              {/* Grid of Station Cards for this City */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1rem'
              }}>
                {cityStns.map(stn => {
                  const id = stn.station_id || stn.stationId || '';
                  const analysis = latestAnalyses[id];
                  return (
                    <StationCard
                      key={id}
                      station={stn}
                      latestAnalysis={analysis}
                      onClick={() => onSelectStation(id)}
                      onInspect={onInspect}
                    />
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};
