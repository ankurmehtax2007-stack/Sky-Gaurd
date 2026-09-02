// SkyGuard AI - Color and Visual Mappings

export const getSeverityColor = (severity: string | undefined): { text: string; bg: string; border: string } => {
  const s = (severity || '').toUpperCase();
  switch (s) {
    case 'CRITICAL':
    case 'HIGH':
      return { text: '#b91c1c', bg: '#fee2e2', border: '#fca5a5' };
    case 'MEDIUM':
    case 'WARNING':
      return { text: '#b45309', bg: '#fef3c7', border: '#fde68a' };
    case 'LOW':
      return { text: '#0369a1', bg: '#e0f2fe', border: '#bae6fd' };
    case 'NONE':
    case 'NORMAL':
    default:
      return { text: '#15803d', bg: '#dcfce7', border: '#86efac' };
  }
};

export const getHealthColor = (score: number | undefined): string => {
  const val = Number(score ?? 100);
  if (val >= 80) return '#16a34a'; // Green
  if (val >= 60) return '#eab308'; // Yellow
  if (val >= 40) return '#f97316'; // Orange
  return '#dc2626'; // Red
};

export const getAnomalyColor = (type: string | undefined): string => {
  const t = (type || '').toLowerCase();
  switch (t) {
    case 'normal':
      return '#16a34a';
    case 'temperature_spike':
      return '#ef4444';
    case 'humidity_spike':
      return '#06b6d4';
    case 'pressure_jump':
      return '#8b5cf6';
    case 'freeze':
      return '#3b82f6';
    case 'offset':
      return '#f59e0b';
    case 'missing_data':
      return '#64748b';
    case 'multivariate_inconsistency':
      return '#ec4899';
    case 'spatial_inconsistency':
      return '#14b8a6';
    case 'novel_anomaly':
      return '#a855f7';
    default:
      return '#ef4444';
  }
};
