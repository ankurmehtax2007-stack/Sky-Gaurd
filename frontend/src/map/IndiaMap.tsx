// SkyGuard AI - Interactive National Weather Network Map (Leaflet + Real India GeoJSON)
import React, { useMemo, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Popup, useMap, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import indiaGeoJSON from '../assets/india.geojson';
import { StationInfo, LiveAnalysisRecord } from '../types';
import { formatNumber, formatPct, formatAnomalyLabel } from '../utils/formatters';
import { getSeverityColor } from '../utils/colorMap';
import { RotateCcw, AlertTriangle, Eye, Activity } from 'lucide-react';

interface IndiaMapProps {
  stations: StationInfo[];
  latestAnalyses: Record<string, LiveAnalysisRecord>;
  onSelectStation: (stationId: string) => void;
  onInspectStation?: (record: LiveAnalysisRecord) => void;
  cityFilter?: string;
  anomalyFilter?: string;
}

// Helper component to auto-fit map view to real India GeoJSON bounds
const FitBoundsToGeoJSON: React.FC<{ data: any }> = ({ data }) => {
  const map = useMap();
  const hasFitted = useRef(false);

  useEffect(() => {
    if (data && !hasFitted.current) {
      try {
        const layer = L.geoJSON(data);
        const bounds = layer.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [25, 25], maxZoom: 6 });
          hasFitted.current = true;
        }
      } catch (err) {
        // Fallback center if bounds calculation encounters issue
        map.setView([22.5937, 78.9629], 5);
      }
    }
  }, [map, data]);

  return null;
};

// Map controller for Reset button
const MapResetControl: React.FC<{ data: any }> = ({ data }) => {
  const map = useMap();

  const handleReset = () => {
    if (data) {
      try {
        const layer = L.geoJSON(data);
        const bounds = layer.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [25, 25], maxZoom: 6 });
          return;
        }
      } catch {}
    }
    map.setView([22.5937, 78.9629], 5);
  };

  return (
    <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 1000 }}>
      <button
        onClick={handleReset}
        className="btn btn-secondary btn-sm"
        style={{
          padding: '6px 10px',
          background: '#ffffff',
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '0.75rem',
          fontWeight: 600,
          color: '#0f172a'
        }}
        title="Reset Map to India Bounds"
      >
        <RotateCcw size={14} color="#0284c7" />
        <span>Fit India</span>
      </button>
    </div>
  );
};

export const IndiaMap: React.FC<IndiaMapProps> = ({
  stations,
  latestAnalyses,
  onSelectStation,
  onInspectStation,
  cityFilter = 'all',
  anomalyFilter = 'all'
}) => {
  // Filter stations based on city and anomaly status
  const visibleStations = useMemo(() => {
    return stations.filter(stn => {
      const id = stn.station_id || stn.stationId || '';
      const analysis = latestAnalyses[id];
      const rootCause = analysis?.root_cause || analysis?.prediction?.root_cause || stn.current_anomaly || 'normal';
      const isAnom = (analysis?.prediction?.is_anomaly ?? (rootCause !== 'normal'));

      if (cityFilter !== 'all' && stn.city.toLowerCase() !== cityFilter.toLowerCase()) {
        return false;
      }
      if (anomalyFilter === 'anomaly' && !isAnom) return false;
      if (anomalyFilter === 'normal' && isAnom) return false;
      if (anomalyFilter !== 'all' && anomalyFilter !== 'anomaly' && anomalyFilter !== 'normal' && rootCause !== anomalyFilter) {
        return false;
      }
      return true;
    });
  }, [stations, latestAnalyses, cityFilter, anomalyFilter]);

  // Determine marker color and state based strictly on live backend data
  const getMarkerStatus = (stn: StationInfo, analysis: LiveAnalysisRecord | undefined) => {
    const isOffline = stn.status === 'OFFLINE';
    if (isOffline) {
      return { color: '#64748b', status: 'offline', label: 'Offline / Stale', badgeClass: 'badge-neutral' };
    }

    const rootCause = analysis?.root_cause || analysis?.prediction?.root_cause || stn.current_anomaly || 'normal';
    const isAnomaly = (analysis?.prediction?.is_anomaly ?? (rootCause !== 'normal'));
    if (isAnomaly) {
      return { color: '#dc2626', status: 'anomaly', label: 'Active Anomaly', badgeClass: 'badge-critical' };
    }

    const healthScore = analysis?.sensor_health?.score ?? analysis?.health_score ?? stn.sensor_health ?? 100;
    const sevVal = typeof analysis?.severity === 'object' && analysis?.severity !== null
      ? String((analysis.severity as any).level || '')
      : String(analysis?.severity || '');
    const severityLevel = sevVal.toUpperCase();
    const isDegraded = healthScore < 75 || severityLevel === 'MEDIUM' || severityLevel === 'WARNING' || severityLevel === 'LOW';
    if (isDegraded) {
      return { color: '#eab308', status: 'warning', label: 'Warning / Degraded', badgeClass: 'badge-warning' };
    }

    return { color: '#16a34a', status: 'normal', label: 'Normal', badgeClass: 'badge-normal' };
  };


  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '560px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        background: '#f8fafc',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      <MapContainer
        center={[22.5937, 78.9629]}
        zoom={5}
        minZoom={4}
        maxZoom={12}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={true}
      >
        {/* Professional Light Basemap Tile Layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {/* Real India Geographic GeoJSON Boundary */}
        <GeoJSON
          data={indiaGeoJSON}
          style={{
            color: '#0284c7',
            weight: 2,
            opacity: 0.85,
            fillColor: '#0ea5e9',
            fillOpacity: 0.04
          }}
        />

        {/* Auto fit map to India boundary on initial render */}
        <FitBoundsToGeoJSON data={indiaGeoJSON} />

        {/* Custom Reset to India Bounds button */}
        <MapResetControl data={indiaGeoJSON} />

        {/* Station Markers placed at real backend latitude & longitude */}
        {visibleStations.map(stn => {
          const id = stn.station_id || stn.stationId || '';
          const analysis = latestAnalyses[id];
          const rootCause = analysis?.root_cause || analysis?.prediction?.root_cause || stn.current_anomaly || 'normal';
          const isAnomaly = (analysis?.prediction?.is_anomaly ?? (rootCause !== 'normal'));
          const markerMeta = getMarkerStatus(stn, analysis);

          // Use real backend latitude and longitude
          const lat = Number(stn.latitude ?? analysis?.latitude ?? 28.6139);
          const lon = Number(stn.longitude ?? analysis?.longitude ?? 77.2090);

          // Live Telemetry from WebSocket
          const temp = analysis?.telemetry?.temperature_c ?? stn.temperature_c ?? stn.temperature;
          const hum = analysis?.telemetry?.humidity_pct ?? stn.humidity_pct ?? stn.humidity;
          const press = analysis?.telemetry?.pressure_hpa ?? stn.pressure_hpa ?? stn.pressure;
          const healthScore = analysis?.sensor_health?.score ?? analysis?.health_score ?? stn.sensor_health ?? 100;

          const sevVal = typeof analysis?.severity === 'object' && analysis?.severity !== null
            ? String((analysis.severity as any).level || '')
            : String(analysis?.severity || (isAnomaly ? 'HIGH' : 'NONE'));
          const severityLevel = sevVal.toUpperCase();
          const confidence = analysis?.prediction?.confidence ?? analysis?.confidence ?? 0.95;


          return (
            <React.Fragment key={id}>
              {/* Pulsing outer ring for active anomaly */}
              {isAnomaly && (
                <CircleMarker
                  center={[lat, lon]}
                  radius={18}
                  pathOptions={{
                    color: '#dc2626',
                    fillColor: '#dc2626',
                    fillOpacity: 0.18,
                    weight: 1.5,
                    dashArray: '3, 4'
                  }}
                />
              )}

              {/* Core Station Marker */}
              <CircleMarker
                center={[lat, lon]}
                radius={isAnomaly ? 10 : 8}
                pathOptions={{
                  color: '#ffffff',
                  fillColor: markerMeta.color,
                  fillOpacity: 1.0,
                  weight: 2.5
                }}
                eventHandlers={{
                  click: () => onSelectStation(id)
                }}
              >
                {/* Station Hover Tooltip */}
                <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
                  <div style={{ fontWeight: 600, fontSize: '0.8rem', color: '#0f172a' }}>
                    {stn.station_name || id}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                    {stn.city} • {formatNumber(temp, 1, '°C')} • {markerMeta.label}
                  </div>
                </Tooltip>

                {/* Click Popup with Comprehensive Station Diagnostics */}
                <Popup minWidth={280}>
                  <div style={{ fontFamily: 'var(--font-sans)', color: '#0f172a', padding: '2px 0' }}>
                    {/* Header */}
                    <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a', lineHeight: 1.2 }}>
                            {stn.station_name || 'AWS Weather Node'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                            {id} • {stn.city} ({stn.cluster || 'Regional AWS'})
                          </div>
                        </div>
                        <span className={`badge ${markerMeta.badgeClass}`} style={{ fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
                          {isAnomaly ? 'Anomaly' : markerMeta.status === 'warning' ? 'Degraded' : 'Normal'}
                        </span>
                      </div>
                    </div>

                    {/* Live Telemetry Metrics */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '6px',
                        marginBottom: '10px',
                        background: '#f8fafc',
                        padding: '8px 6px',
                        borderRadius: '6px',
                        textAlign: 'center',
                        border: '1px solid #e2e8f0'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Temp</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0284c7' }}>
                          {formatNumber(temp, 1, '°C')}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Humidity</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0d9488' }}>
                          {formatNumber(hum, 1, '%')}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Pressure</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#8b5cf6' }}>
                          {formatNumber(press, 1, 'hPa')}
                        </div>
                      </div>
                    </div>

                    {/* Diagnostic Summary Table */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '0.75rem', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#64748b' }}>Sensor Health:</span>
                        <strong style={{ color: healthScore >= 80 ? '#16a34a' : healthScore >= 60 ? '#d97706' : '#dc2626' }}>
                          {healthScore}/100
                        </strong>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#64748b' }}>Current Anomaly:</span>
                        <strong style={{ color: isAnomaly ? '#dc2626' : '#16a34a' }}>
                          {formatAnomalyLabel(rootCause)}
                        </strong>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#64748b' }}>Severity:</span>
                        <span
                          style={{
                            padding: '1px 7px',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            background: getSeverityColor(severityLevel).bg,
                            color: getSeverityColor(severityLevel).text,
                            border: `1px solid ${getSeverityColor(severityLevel).border}`
                          }}
                        >
                          {severityLevel}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#64748b' }}>Confidence:</span>
                        <strong className="mono" style={{ color: '#0f172a' }}>
                          {formatPct(confidence)}
                        </strong>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => onSelectStation(id)}
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1, fontSize: '0.75rem', padding: '5px 8px' }}
                      >
                        Station Details
                      </button>
                      {onInspectStation && (
                        <button
                          onClick={() => {
                            if (analysis) onInspectStation(analysis);
                            else onSelectStation(id);
                          }}
                          className="btn btn-primary btn-sm"
                          style={{ fontSize: '0.75rem', padding: '5px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Eye size={12} />
                          <span>Inspect</span>
                        </button>
                      )}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            </React.Fragment>
          );
        })}
      </MapContainer>

      {/* Map Legend Overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          right: 12,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(6px)',
          padding: '0.45rem 0.85rem',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
          fontSize: '0.75rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          zIndex: 1000
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#16a34a', border: '1px solid #ffffff', display: 'inline-block' }} />
          <span style={{ color: '#334155', fontWeight: 500 }}>Normal</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#eab308', border: '1px solid #ffffff', display: 'inline-block' }} />
          <span style={{ color: '#334155', fontWeight: 500 }}>Warning / Degraded</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#dc2626', border: '1px solid #ffffff', display: 'inline-block' }} />
          <span style={{ color: '#334155', fontWeight: 500 }}>Active Anomaly</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#64748b', border: '1px solid #ffffff', display: 'inline-block' }} />
          <span style={{ color: '#334155', fontWeight: 500 }}>Offline / Stale</span>
        </div>
      </div>
    </div>
  );
};

export default IndiaMap;
