// SkyGuard AI - Formatting Utilities
import { ANOMALY_LABELS } from './constants';

export const formatTime = (isoString?: string): string => {
  if (!isoString) return '--:--:--';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '--:--:--';
    return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return '--:--:--';
  }
};

export const formatDateTime = (isoString?: string): string => {
  if (!isoString) return '--';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '--';
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  } catch {
    return '--';
  }
};

export const formatNumber = (val: number | null | undefined, digits = 1, unit = ''): string => {
  if (val === null || val === undefined || isNaN(val)) return 'N/A';
  return `${Number(val).toFixed(digits)}${unit ? ' ' + unit : ''}`;
};

export const formatPct = (val: number | null | undefined): string => {
  if (val === null || val === undefined || isNaN(val)) return '0.0%';
  const num = val > 1 ? val : val * 100;
  return `${num.toFixed(1)}%`;
};

export const formatAnomalyLabel = (rawType?: string): string => {
  if (!rawType) return 'Normal';
  const key = rawType.toLowerCase().trim();
  return ANOMALY_LABELS[key] || rawType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};
