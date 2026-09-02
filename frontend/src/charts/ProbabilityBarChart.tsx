// SkyGuard AI - XGBoost Multi-Class Probability Bar Chart
import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';
import { formatAnomalyLabel } from '../utils/formatters';
import { getAnomalyColor } from '../utils/colorMap';

interface ProbabilityBarChartProps {
  probabilities: Record<string, number> | undefined;
  predictedClass?: string;
  height?: number;
}

export const ProbabilityBarChart: React.FC<ProbabilityBarChartProps> = ({
  probabilities,
  predictedClass,
  height = 240
}) => {
  if (!probabilities || Object.keys(probabilities).length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
        No probability distribution available.
      </div>
    );
  }

  // Supported classes (DRIFT filtered out)
  const data = Object.entries(probabilities)
    .filter(([className]) => className !== 'drift')
    .map(([className, prob]) => {
      const p = Number(prob);
      const val = p > 1 ? p : p * 100;
      return {
        className,
        label: formatAnomalyLabel(className),
        probability: Number(val.toFixed(1)),
        isPredicted: className === predictedClass
      };
    })
    .sort((a, b) => b.probability - a.probability);

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
        >
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            unit="%"
            axisLine={{ stroke: '#e2e8f0' }}
          />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fontSize: 11, fill: '#334155' }}
            width={120}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '12px'
            }}
            formatter={(value: any) => [`${value}%`, 'Probability']}
          />
          <Bar dataKey="probability" radius={[0, 4, 4, 0]} isAnimationActive={false}>
            {data.map((entry, index) => {
              const color = entry.isPredicted
                ? getAnomalyColor(entry.className)
                : entry.className === 'normal'
                ? '#94a3b8'
                : '#cbd5e1';
              return <Cell key={`cell-${index}`} fill={color} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
