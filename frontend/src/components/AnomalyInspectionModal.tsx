// SkyGuard AI - Deep Anomaly Inspection Modal Component
import React, { useState } from 'react';
import { LiveAnalysisRecord } from '../types';
import { ProbabilityBarChart } from '../charts/ProbabilityBarChart';
import { MultiEvidenceRadarChart } from '../charts/MultiEvidenceRadarChart';
import { ShapWaterfallChart } from '../charts/ShapWaterfallChart';
import { HealthGauge } from '../charts/HealthGauge';
import { StatusBadge } from './StatusBadge';
import { formatNumber, formatDateTime, formatAnomalyLabel, formatPct } from '../utils/formatters';
import { getSeverityColor } from '../utils/colorMap';
import { generateAiReport } from '../services/api';
import {
  X,
  AlertTriangle,
  BrainCircuit,
  Wrench,
  Bot,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Layers,
  FileText
} from 'lucide-react';

interface AnomalyInspectionModalProps {
  analysis: LiveAnalysisRecord | null;
  onClose: () => void;
}

export const AnomalyInspectionModal: React.FC<AnomalyInspectionModalProps> = ({
  analysis,
  onClose
}) => {
  if (!analysis) return null;

  const [activeTab, setActiveTab] = useState<'overview' | 'probabilities' | 'evidence' | 'shap' | 'ai_report'>('overview');
  const [llmReport, setLlmReport] = useState<string>(analysis.llm?.report || analysis.llm_report || '');
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);

  const stationId = analysis.station_id || '';
  const stationName = analysis.station_name || 'AWS Node';
  const rootCause = analysis.root_cause || analysis.prediction?.root_cause || 'normal';
  const decision = analysis.decision || analysis.prediction?.decision || 'normal';
  const confidence = analysis.confidence ?? analysis.prediction?.confidence ?? 0.95;
  const severity = String(analysis.severity || 'NONE');
  const healthScore = analysis.sensor_health?.score ?? analysis.health_score ?? 100;
  const iforestScore = analysis.evidence?.isolation_forest ?? analysis.scores?.iforest_novelty ?? 0.0;
  const shapFactors = analysis.explanation?.shap_factors || analysis.shap_factors || [];
  const maint = analysis.maintenance || { priority: severity, recommended_action: 'Continue routine scheduled monitoring.' };

  const handleGenerateOnDemandAiReport = async () => {
    setIsGeneratingReport(true);
    try {
      const res = await generateAiReport(analysis.raw_record || analysis);
      if (res && res.report) {
        setLlmReport(res.report);
      }
    } catch (err) {
      console.warn('On-demand LLM generation failed:', err);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '980px' }}>
        {/* Header */}
        <div className="modal-header" style={{ background: '#f8fafc' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <BrainCircuit size={20} color="#0284c7" />
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>
                Multi-Tier ML Anomaly Diagnostics Inspector
              </h2>
              <StatusBadge status="critical" anomalyType={rootCause} />
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>
              <span className="mono">{stationId}</span> ({stationName}, {analysis.city}) • {formatDateTime(analysis.timestamp)}
            </div>
          </div>

          <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ borderRadius: '50%', padding: '0.4rem' }}>
            <X size={18} />
          </button>
        </div>

        {/* Navigation Sub-Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#ffffff', padding: '0 1.5rem', gap: '0.5rem', overflowX: 'auto' }}>
          {[
            { id: 'overview', label: 'A. Prediction & Summary' },
            { id: 'probabilities', label: 'B. XGBoost Probabilities' },
            { id: 'evidence', label: 'C & D. Evidence & Novelty' },
            { id: 'shap', label: 'E. SHAP Contributions' },
            { id: 'ai_report', label: 'F & G. AI Report & Maintenance' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '0.75rem 0.85rem',
                fontSize: '0.825rem',
                fontWeight: activeTab === tab.id ? 600 : 500,
                color: activeTab === tab.id ? '#0284c7' : '#64748b',
                borderBottom: `2px solid ${activeTab === tab.id ? '#0284c7' : 'transparent'}`,
                background: 'none',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body Tabs */}
        <div className="modal-body" style={{ minHeight: '380px' }}>
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Prediction Pillar Card */}
              <div style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '1.25rem',
                display: 'grid',
                gridTemplateColumns: 'auto 1fr auto',
                gap: '1.5rem',
                alignItems: 'center'
              }}>
                <HealthGauge score={healthScore} size={85} label="Sensor Health" />

                <div>
                  <div style={{ fontSize: '0.725rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                    FastAPI ML Decision Engine
                  </div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#dc2626' }}>
                    {formatAnomalyLabel(rootCause)}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.2rem' }}>
                    Decision: <strong>{decision}</strong> • Telemetry Status: <strong>{analysis.telemetry?.data_quality || 'Suspect'}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', textAlign: 'right' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>CONFIDENCE</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-mono)' }}>
                      {formatPct(confidence)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>SEVERITY LEVEL</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: getSeverityColor(severity).text }}>
                      {severity}
                    </div>
                  </div>
                </div>
              </div>

              {/* Raw Telemetry Snapshots */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '1rem',
                background: '#f8fafc',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>TEMPERATURE</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0284c7', fontFamily: 'var(--font-mono)' }}>
                    {formatNumber(analysis.telemetry?.temperature_c, 2, '°C')}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>HUMIDITY</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0d9488', fontFamily: 'var(--font-mono)' }}>
                    {formatNumber(analysis.telemetry?.humidity_pct, 1, '%')}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>BAROMETRIC PRESSURE</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#8b5cf6', fontFamily: 'var(--font-mono)' }}>
                    {formatNumber(analysis.telemetry?.pressure_hpa, 1, 'hPa')}
                  </div>
                </div>
              </div>

              {/* Diagnostic Statements */}
              {analysis.explanation?.evidence_summary && analysis.explanation.evidence_summary.length > 0 && (
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                    Multi-Tier Evidence Verification
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', color: '#334155' }}>
                    {analysis.explanation.evidence_summary.map((stmt, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                        <CheckCircle2 size={14} color="#0284c7" />
                        <span>{stmt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: XGBOOST PROBABILITIES */}
          {activeTab === 'probabilities' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                  XGBoost 10-Class Posterior Probabilities Vector
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Probability distribution generated by Python XGBoost Classifier across all supported classes (DRIFT is removed from live display).
                </p>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem' }}>
                <ProbabilityBarChart
                  probabilities={analysis.class_probabilities}
                  predictedClass={rootCause}
                  height={280}
                />
              </div>
            </div>
          )}

          {/* TAB 3: EVIDENCE & ISOLATION FOREST */}
          {activeTab === 'evidence' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                    Isolation Forest Novelty / Outlier Score
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Continuous anomaly score from unsupervised Isolation Forest tree path length.
                  </div>
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: iforestScore >= 0.5 ? '#dc2626' : '#16a34a', fontFamily: 'var(--font-mono)' }}>
                  {iforestScore.toFixed(4)}
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>
                  Multi-Tier Evidence Pillars (Class-Aware Fusion)
                </h3>
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem' }}>
                  <MultiEvidenceRadarChart evidence={analysis.evidence || analysis.scores} />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SHAP CONTRIBUTIONS */}
          {activeTab === 'shap' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                  SHAP (SHapley Additive exPlanations) Feature Attributions
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Exact signed feature contributions calculated by Python TreeExplainer for the predicted class.
                </p>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem' }}>
                <ShapWaterfallChart factors={shapFactors} height={280} />
              </div>
            </div>
          )}

          {/* TAB 5: AI REPORT & MAINTENANCE */}
          {activeTab === 'ai_report' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* IMPORTANT: Explicit separation of Model Prediction from AI-Generated Narrative */}
              <div style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                padding: '0.85rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ fontSize: '0.8rem', color: '#1e40af' }}>
                  <strong>ARCHITECTURE NOTE:</strong> Python ML Decision Engine is the <em>SINGLE SOURCE OF TRUTH</em> for predictions. The AI explanation is purely an advisory synthesis and never overrides model classifications.
                </div>
                <button
                  onClick={handleGenerateOnDemandAiReport}
                  disabled={isGeneratingReport}
                  className="btn btn-secondary btn-sm"
                  style={{ background: '#ffffff', fontSize: '0.75rem' }}
                >
                  {isGeneratingReport ? <RefreshCw size={12} className="spin" /> : <Sparkles size={12} />}
                  <span>{isGeneratingReport ? 'Synthesizing...' : 'Regenerate Narrative'}</span>
                </button>
              </div>

              {/* LLM Narrative */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <Bot size={18} color="#0284c7" />
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
                    AI-Generated Meteorological Diagnostic Narrative
                  </h4>
                </div>

                {llmReport ? (
                  <div style={{ fontSize: '0.875rem', color: '#334155', lineHeight: '1.6', background: '#f8fafc', padding: '1rem', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
                    {llmReport}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b', fontSize: '0.85rem' }}>
                    No automated narrative generated yet. Click 'Regenerate Narrative' to query the LLM engine.
                  </div>
                )}
              </div>

              {/* Maintenance Recommendation */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <Wrench size={18} color="#d97706" />
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
                    Actionable Maintenance Recommendation
                  </h4>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>
                    {maint.recommended_action || 'Continue routine operational monitoring.'}
                  </div>
                  {maint.priority && (
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      Dispatch Priority: <strong>{maint.priority}</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-primary">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
