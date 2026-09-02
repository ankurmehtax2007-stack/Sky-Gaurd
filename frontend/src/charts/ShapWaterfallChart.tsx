// SkyGuard AI - SHAP Feature Attribution Chart
import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ReferenceLine
} from 'recharts';
import { ShapFactor } from '../types';

interface ShapWaterfallChartProps {
  factors: ShapFactor[] | undefined;
  height?: number;
}

export const ShapWaterfallChart: React.FC<ShapWaterfallChartProps> = ({
  factors,
  height = 240
}) => {
  if (!factors || factors.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
        No SHAP feature contributions available for this record.
      </div>
    );
  }

  // Parse SHAP items (support both object structures and scalar maps)
  const data = factors.slice(0, 8).map((f) => {
    const rawVal = f.contribution ?? f.importance ?? f.value ?? 0;
    const cleanFeatureName = (f.feature || 'Feature')
      .replace(/_/g, ' ')
      .replace('pct', '%')
      .replace('hpa', 'hPa')
      .replace('temp', 'Temp');

    return {
      feature: cleanFeatureName,
      val: Number(Number(rawVal).toFixed(4)),
      isPositive: rawVal >= 0,
      description: f.description || ''
    };
  });

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
        >
          <XAxis
            type="number"
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            axisLine={{ stroke: '#e2e8f0' }}
          />
          <YAxis
            type="category"
            dataKey="feature"
            tick={{ fontSize: 11, fill: '#334155' }}
            width={140}
            axisLine={false}
            tickLine={false}
          />
          <ReferenceLine x={0} stroke="#94a3b8" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '12px'
            }}
            formatter={(val: any) => [
              `${val > 0 ? '+' : ''}${val} SHAP Value`,
              val > 0 ? 'Pushes toward anomaly' : 'Supports normal baseline'
            ]}
          />
          <Bar dataKey="val" radius={[3, 3, 3, 3]} isAnimationActive={false}>
            {data.map((entry, idx) => (
              <Cell
                key={`shap-${idx}`}
                fill={entry.isPositive ? '#ef4444' : '#0ea5e9'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
