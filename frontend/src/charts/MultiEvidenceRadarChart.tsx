// SkyGuard AI - Multi-Source Evidence Breakdown Visualizer
import React from 'react';
import { MultiSourceEvidence } from '../types';

interface MultiEvidenceRadarChartProps {
  evidence: MultiSourceEvidence | undefined;
}

export const MultiEvidenceRadarChart: React.FC<MultiEvidenceRadarChartProps> = ({ evidence }) => {
  const temporal = evidence?.temporal ?? 0;
  const spatial = evidence?.spatial ?? 0;
  const physics = evidence?.physics ?? 0;
  const xgb = evidence?.xgboost ?? evidence?.xgboost_anomaly ?? 0;
  const iforest = evidence?.isolation_forest ?? evidence?.iforest_novelty ?? 0;
  const fused = evidence?.fused_anomaly_score ?? 0;

  const items = [
    { label: 'Temporal Consistency', score: temporal, desc: 'Rate-of-change, lag variance & step jumps', color: '#0284c7' },
    { label: 'Spatial Correlation', score: spatial, desc: 'Deviation against same-city neighbor consensus', color: '#0d9488' },
    { label: 'Physics Validation', score: physics, desc: 'Thermodynamic & psychrometric dew point bounds', color: '#8b5cf6' },
    { label: 'XGBoost Classifier', score: xgb, desc: '10-Class gradient-boosted decision trees', color: '#f59e0b' },
    { label: 'Isolation Forest', score: iforest, desc: 'Unsupervised multivariate outlier / novelty score', color: '#ec4899' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {items.map((item, idx) => {
        const pct = Math.min(100, Math.max(0, Math.round(item.score * 100)));
        return (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>
                  {item.label}
                </span>
                <span style={{ fontSize: '0.725rem', color: '#64748b', marginLeft: '0.5rem' }}>
                  {item.desc}
                </span>
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: item.color }}>
                {pct}% ({item.score.toFixed(3)})
              </span>
            </div>

            <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${pct}%`,
                  backgroundColor: item.color,
                  borderRadius: '9999px',
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
          </div>
        );
      })}

      {fused > 0 && (
        <div style={{
          marginTop: '0.5rem',
          padding: '0.75rem 1rem',
          background: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '0.825rem', fontWeight: 600, color: '#334155' }}>
            Combined Multi-Tier Fused Score
          </span>
          <span style={{ fontSize: '1rem', fontWeight: 700, color: fused >= 0.4 ? '#dc2626' : '#16a34a', fontFamily: 'var(--font-mono)' }}>
            {(fused * 100).toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  );
};
