// SkyGuard AI - Anomaly Class Distribution Pie/Bar Chart
import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from 'recharts';
import { LiveAnalysisRecord } from '../types';
import { formatAnomalyLabel } from '../utils/formatters';
import { getAnomalyColor } from '../utils/colorMap';

interface AnomalyDistributionChartProps {
  anomalies: LiveAnalysisRecord[];
  height?: number;
}

export const AnomalyDistributionChart: React.FC<AnomalyDistributionChartProps> = ({
  anomalies,
  height = 240
}) => {
  if (!anomalies || anomalies.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
        No anomalies logged in current session.
      </div>
    );
  }

  // Count by anomaly root cause
  const counts: Record<string, number> = {};
  anomalies.forEach(a => {
    const rc = a.root_cause || a.prediction?.root_cause || 'unknown';
    if (rc !== 'normal') {
      counts[rc] = (counts[rc] || 0) + 1;
    }
  });

  const data = Object.entries(counts).map(([type, count]) => ({
    name: formatAnomalyLabel(type),
    rawType: type,
    value: count
  }));

  if (data.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
        All stations reporting nominal conditions.
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={75}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getAnomalyColor(entry.rawType)} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '12px'
            }}
            formatter={(value: any, name: any) => [`${value} incidents`, name]}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => <span style={{ fontSize: '11px', color: '#334155' }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
