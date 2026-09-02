// SkyGuard AI - AI Insights & Diagnostic Reports Page
import React, { useState } from 'react';
import { LiveAnalysisRecord } from '../types';
import { formatDateTime, formatAnomalyLabel } from '../utils/formatters';
import { getSeverityColor } from '../utils/colorMap';
import { generateAiReport } from '../services/api';
import { BrainCircuit, Sparkles, Bot, Wrench, ShieldAlert, CheckCircle2, RefreshCw } from 'lucide-react';

interface AIInsightsPageProps {
  anomalies: LiveAnalysisRecord[];
  onInspect: (record: LiveAnalysisRecord) => void;
}

export const AIInsightsPage: React.FC<AIInsightsPageProps> = ({
  anomalies,
  onInspect
}) => {
  const [selectedIncident, setSelectedIncident] = useState<LiveAnalysisRecord | null>(null);
  const [onDemandReport, setOnDemandReport] = useState<string>('');
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);

  const currentIncident = (selectedIncident && anomalies.some(a => (a.analysis_id || a._id) === (selectedIncident.analysis_id || selectedIncident._id)))
    ? selectedIncident
    : (anomalies[0] || null);

  const handleGenerateOnDemand = async (record: LiveAnalysisRecord) => {
    setIsSynthesizing(true);
    setOnDemandReport('');
    try {
      const res = await generateAiReport(record.raw_record || record);
      if (res && res.report) {
        setOnDemandReport(res.report);
      }
    } catch (err) {
      console.warn('On-demand LLM generation failed:', err);
    } finally {
      setIsSynthesizing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: '#e0f2fe', padding: '0.65rem', borderRadius: '10px', color: '#0284c7' }}>
            <BrainCircuit size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>
              AI Meteorological Insights & LLM Diagnostic Reports
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Actionable root-cause narratives synthesized by Mistral LLM coupled with multi-tier ML evidence.
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Incident Selector & Full AI Report Viewer */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.25rem' }}>
        {/* Incident List */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Select Incident</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Active and logged anomaly events
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '520px', overflowY: 'auto' }}>
            {anomalies.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                No active anomalies to generate AI reports for.
              </div>
            ) : (
              anomalies.map((item, idx) => {
                const isSelected = (currentIncident?.analysis_id && currentIncident.analysis_id === item.analysis_id) || (currentIncident?._id && currentIncident._id === item._id);
                const rootCause = item.root_cause || item.prediction?.root_cause || 'anomaly';
                const sevColor = getSeverityColor(String(item.severity));

                return (
                  <div
                    key={item.analysis_id || item._id || idx}
                    onClick={() => {
                      setSelectedIncident(item);
                      setOnDemandReport('');
                    }}
                    style={{
                      padding: '0.85rem',
                      borderRadius: '8px',
                      border: `1px solid ${isSelected ? '#0284c7' : '#e2e8f0'}`,
                      background: isSelected ? '#f0f9ff' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>
                        {item.station_name || item.station_id}
                      </span>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          color: sevColor.text,
                          background: `${sevColor.text}15`,
                          padding: '0.15rem 0.4rem',
                          borderRadius: '4px'
                        }}
                      >
                        {String(item.severity || 'NONE').toUpperCase()}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.775rem', color: '#64748b', marginTop: '0.25rem' }}>
                      {formatAnomalyLabel(rootCause)} • {item.city}
                    </div>

                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                      {formatDateTime(item.timestamp)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Detailed AI Report View */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {currentIncident ? (
            <>
              {/* Architecture disclaimer banner */}
              <div style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                fontSize: '0.8rem',
                color: '#1e40af',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <strong>Model Prediction:</strong> {formatAnomalyLabel(currentIncident.root_cause || currentIncident.prediction?.root_cause)} (Confidence: {((currentIncident.confidence || 0.95) * 100).toFixed(1)}%)
                </div>
                <button
                  onClick={() => handleGenerateOnDemand(currentIncident)}
                  disabled={isSynthesizing}
                  className="btn btn-secondary btn-sm"
                  style={{ background: '#ffffff', fontSize: '0.75rem' }}
                >
                  {isSynthesizing ? <RefreshCw size={12} className="spin" /> : <Sparkles size={12} />}
                  <span>{isSynthesizing ? 'Generating...' : 'Synthesize LLM'}</span>
                </button>
              </div>

              {/* Narrative Report */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <Bot size={18} color="#0284c7" />
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                    Meteorological LLM Narrative Advisory
                  </h3>
                </div>

                <div style={{
                  fontSize: '0.875rem',
                  lineHeight: '1.65',
                  color: '#334155',
                  background: '#f8fafc',
                  padding: '1.15rem',
                  borderRadius: '6px',
                  border: '1px solid #f1f5f9'
                }}>
                  {onDemandReport || currentIncident.llm?.report || currentIncident.llm_report || (
                    <div style={{ textAlign: 'center', padding: '1rem', color: '#64748b' }}>
                      No automated narrative generated yet. Click 'Synthesize LLM' above to generate an on-demand report.
                    </div>
                  )}
                </div>
              </div>

              {/* Actionable Maintenance Recommendation */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <Wrench size={18} color="#d97706" />
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                    Maintenance Dispatch & Remediation Protocol
                  </h3>
                </div>

                <div style={{ fontSize: '0.875rem', color: '#1e293b', fontWeight: 600 }}>
                  {currentIncident.maintenance?.recommended_action || 'Continue routine operational telemetry monitoring.'}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => onInspect(currentIncident)} className="btn btn-primary">
                  <BrainCircuit size={15} />
                  <span>Open Deep Multi-Source Inspector</span>
                </button>
              </div>
            </>
          ) : (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
              Select an incident from the left to view the AI diagnostic narrative.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
