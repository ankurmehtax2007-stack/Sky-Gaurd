// SkyGuard AI - Telemetry Line Chart Component
import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceDot
} from 'recharts';
import { TelemetryHistoryPoint } from '../types';

interface TelemetryLineChartProps {
  data: TelemetryHistoryPoint[];
  metricKey: 'temperature' | 'humidity' | 'pressure';
  label: string;
  unit: string;
  color?: string;
  height?: number;
}

export const TelemetryLineChart: React.FC<TelemetryLineChartProps> = ({
  data,
  metricKey,
  label,
  unit,
  color = '#0284c7',
  height = 180
}) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
        Awaiting live telemetry packets...
      </div>
    );
  }

  // Find anomaly points for reference markers
  const anomalyPoints = data.filter(d => d.is_anomaly && d[metricKey] !== null);

  const values = data.map(d => d[metricKey]).filter((v): v is number => v !== null);
  const minVal = values.length > 0 ? Math.floor(Math.min(...values) - 2) : 0;
  const maxVal = values.length > 0 ? Math.ceil(Math.max(...values) + 2) : 100;

  return (
    <div style={{ width: '100%', height }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
          {label} ({unit})
        </span>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color, fontFamily: 'var(--font-mono)' }}>
          {data[data.length - 1]?.[metricKey] !== null ? `${data[data.length - 1]?.[metricKey]} ${unit}` : 'N/A'}
        </span>
      </div>

      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
          />
          <YAxis
            domain={[minVal, maxVal]}
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '12px',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
            }}
            formatter={(value: any) => [`${value} ${unit}`, label]}
            labelFormatter={(label: any) => `Time: ${label}`}
          />
          <Line
            type="monotone"
            dataKey={metricKey}
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          {anomalyPoints.map((pt, idx) => (
            <ReferenceDot
              key={idx}
              x={pt.time}
              y={pt[metricKey] as number}
              r={4}
              fill="#dc2626"
              stroke="#ffffff"
              strokeWidth={1.5}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
