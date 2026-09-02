// SkyGuard AI - Status Badge Component
import React from 'react';
import { formatAnomalyLabel } from '../utils/formatters';

interface StatusBadgeProps {
  status: 'normal' | 'warning' | 'critical' | 'online' | 'offline' | string;
  label?: string;
  anomalyType?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  anomalyType
}) => {
  const norm = (status || '').toLowerCase();
  let badgeClass = 'badge-normal';
  let defaultText = 'Normal';

  if (norm === 'critical' || norm === 'anomaly' || norm === 'high' || (anomalyType && anomalyType !== 'normal')) {
    badgeClass = 'badge-critical';
    defaultText = anomalyType ? formatAnomalyLabel(anomalyType) : 'Anomaly';
  } else if (norm === 'warning' || norm === 'medium' || norm === 'degraded') {
    badgeClass = 'badge-warning';
    defaultText = 'Warning';
  } else if (norm === 'offline') {
    badgeClass = 'badge-warning';
    defaultText = 'Offline';
  } else if (norm === 'online') {
    badgeClass = 'badge-normal';
    defaultText = 'Online';
  }

  return (
    <span className={`badge ${badgeClass}`}>
      <span className="badge-dot" />
      <span>{label || defaultText}</span>
    </span>
  );
};
