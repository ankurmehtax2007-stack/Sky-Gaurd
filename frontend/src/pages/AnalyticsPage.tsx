// SkyGuard AI - Analytics Page
import React, { useMemo } from 'react';
import { StationInfo, LiveAnalysisRecord, TelemetryHistoryPoint } from '../types';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from 'recharts';
import { AnomalyDistributionChart } from '../charts/AnomalyDistributionChart';
import { formatAnomalyLabel } from '../utils/formatters';
import { getAnomalyColor } from '../utils/colorMap';
import { BarChart3, TrendingUp, AlertCircle, Heart, Thermometer, Droplets, Gauge } from 'lucide-react';

interface AnalyticsPageProps {
  stations: StationInfo[];
  anomalies: LiveAnalysisRecord[];
  historyByStation: Record<string, TelemetryHistoryPoint[]>;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({
  stations,
  anomalies,
  historyByStation
}) => {
  // Aggregate recent rolling history points across all stations
  const aggregatedHistory = useMemo(() => {
    const timeMap: Record<string, { time: string; avgTemp: number; avgHum: number; avgPress: number; avgHealth: number; count: number }> = {};

    Object.values(historyByStation).forEach(hist => {
      hist.forEach(pt => {
        if (!timeMap[pt.time]) {
          timeMap[pt.time] = { time: pt.time, avgTemp: 0, avgHum: 0, avgPress: 0, avgHealth: 0, count: 0 };
        }
        if (pt.temperature !== null) timeMap[pt.time].avgTemp += pt.temperature;
        if (pt.humidity !== null) timeMap[pt.time].avgHum += pt.humidity;
        if (pt.pressure !== null) timeMap[pt.time].avgPress += pt.pressure;
        timeMap[pt.time].avgHealth += pt.health;
        timeMap[pt.time].count += 1;
      });
    });

    return Object.values(timeMap).map(item => ({
      time: item.time,
      temperature: Number((item.avgTemp / (item.count || 1)).toFixed(2)),
      humidity: Number((item.avgHum / (item.count || 1)).toFixed(1)),
      pressure: Number((item.avgPress / (item.count || 1)).toFixed(1)),
      health: Number((item.avgHealth / (item.count || 1)).toFixed(1))
    })).slice(-20);
  }, [historyByStation]);

  // City-wise anomaly distribution
  const cityAnomalyCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    anomalies.forEach(a => {
      const city = a.city || 'Unknown';
      const rc = a.root_cause || a.prediction?.root_cause;
      if (rc && rc !== 'normal') {
        counts[city] = (counts[city] || 0) + 1;
      }
    });

    return Object.entries(counts).map(([city, count]) => ({
      city,
      count
    }));
  }, [anomalies]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <div style={{ background: '#e0f2fe', padding: '0.5rem', borderRadius: '8px', color: '#0284c7' }}>
          <BarChart3 size={24} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>
            Meteorological Telemetry & Anomaly Analytics
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Comprehensive time-series trends and regional distribution analytics aggregated from live streams.
          </p>
        </div>
      </div>

      {/* Grid 1: Ambient Temperature & Relative Humidity Trends */}
      <div className="grid-2">
        {/* Temperature Trend */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Thermometer size={18} color="#0284c7" />
              <span>Network Temperature Trend (°C)</span>
            </div>
          </div>
          <div style={{ height: 220 }}>
            {aggregatedHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={aggregatedHistory} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} />
                  <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px' }}
                    formatter={(val: any) => [`${val} °C`, 'Avg Temp']}
                  />
                  <Line type="monotone" dataKey="temperature" stroke="#0284c7" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: '0.875rem' }}>
                Accumulating streaming data points...
              </div>
            )}
          </div>
        </div>

        {/* Humidity Trend */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Droplets size={18} color="#0d9488" />
              <span>Relative Humidity Trend (%)</span>
            </div>
          </div>
          <div style={{ height: 220 }}>
            {aggregatedHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={aggregatedHistory} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px' }}
                    formatter={(val: any) => [`${val} %`, 'Avg Humidity']}
                  />
                  <Line type="monotone" dataKey="humidity" stroke="#0d9488" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: '0.875rem' }}>
                Accumulating streaming data points...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid 2: Barometric Pressure & Station Health Trends */}
      <div className="grid-2">
        {/* Pressure Trend */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Gauge size={18} color="#8b5cf6" />
              <span>Barometric Pressure Trend (hPa)</span>
            </div>
          </div>
          <div style={{ height: 220 }}>
            {aggregatedHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={aggregatedHistory} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} />
                  <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px' }}
                    formatter={(val: any) => [`${val} hPa`, 'Avg Pressure']}
                  />
                  <Line type="monotone" dataKey="pressure" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: '0.875rem' }}>
                Accumulating streaming data points...
              </div>
            )}
          </div>
        </div>

        {/* Station Health Trend */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Heart size={18} color="#16a34a" />
              <span>Fleet Sensor Health Index (0–100)</span>
            </div>
          </div>
          <div style={{ height: 220 }}>
            {aggregatedHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={aggregatedHistory} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px' }}
                    formatter={(val: any) => [`${val}/100`, 'Health Index']}
                  />
                  <Line type="monotone" dataKey="health" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: '0.875rem' }}>
                Accumulating streaming data points...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid 3: Anomaly Distribution & City-Wise Anomaly Distribution */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Anomaly Class Frequency</div>
          </div>
          <AnomalyDistributionChart anomalies={anomalies} height={240} />
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">City-Wise Anomaly Distribution</div>
          </div>
          <div style={{ height: 240 }}>
            {cityAnomalyCounts.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cityAnomalyCounts} margin={{ top: 10, right: 15, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="city" tick={{ fontSize: 11, fill: '#334155' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px' }} />
                  <Bar dataKey="count" fill="#0284c7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: '0.875rem' }}>
                No active city-level anomalies logged.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
