// SkyGuard AI - Stat Card Component
import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  valueColor?: string;
  statusBadge?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  icon,
  valueColor,
  statusBadge
}) => {
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="stat-label">{label}</span>
        {icon && <div style={{ color: '#64748b' }}>{icon}</div>}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.2rem' }}>
        <span className="stat-value" style={{ color: valueColor || 'inherit' }}>
          {value}
        </span>
        {statusBadge}
      </div>

      {subtext && <span className="stat-subtext">{subtext}</span>}
    </div>
  );
};
