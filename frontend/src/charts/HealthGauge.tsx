// SkyGuard AI - Sensor Health Circular Gauge Component
import React from 'react';
import { getHealthColor } from '../utils/colorMap';

interface HealthGaugeProps {
  score: number | undefined;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export const HealthGauge: React.FC<HealthGaugeProps> = ({
  score = 100,
  size = 110,
  strokeWidth = 10,
  label = 'Sensor Health'
}) => {
  const safeScore = Math.min(100, Math.max(0, Math.round(Number(score || 0))));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (safeScore / 100) * circumference;
  const color = getHealthColor(safeScore);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Foreground progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.4s ease, stroke 0.3s ease' }}
          />
        </svg>

        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <span style={{ fontSize: size * 0.24, fontWeight: 700, color, fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
            {safeScore}
          </span>
          <span style={{ fontSize: size * 0.1, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
            / 100
          </span>
        </div>
      </div>

      {label && (
        <span style={{ marginTop: '0.4rem', fontSize: '0.75rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>
          {label}
        </span>
      )}
    </div>
  );
};
