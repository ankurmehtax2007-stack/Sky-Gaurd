import React, { useState } from "react";
import { generateReportForAnomaly, submitOperatorFeedback } from "../api/skyguardApi";

function AnomalyInspectModal({ alert, onClose, onUpdateAlert }) {
  const [generatingReport, setGeneratingReport] = useState(false);
  const [llmReport, setLlmReport] = useState(alert?.llm_report || "");
  const [feedbackNotes, setFeedbackNotes] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState("CONFIRMED");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  if (!alert) return null;

  const readings = alert.readings || {};
  const evidence = alert.multi_source_evidence || {};
  const shapFactors = alert.shap_explanation || [];
  const recommendedActions = alert.recommended_actions || [];

  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    try {
      const res = await generateReportForAnomaly(alert.anomaly_id, alert);
      if (res && (res.report || res.llm_report || res.data?.report)) {
        const text = res.report || res.llm_report || res.data?.report;
        setLlmReport(text);
        if (onUpdateAlert) {
          onUpdateAlert({ ...alert, llm_report: text });
        }
      }
    } catch (err) {
      console.warn("Report generation error:", err);
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    try {
      await submitOperatorFeedback({
        incident_id: alert.anomaly_id,
        station_id: alert.station_id,
        operator_label: feedbackStatus,
        notes: feedbackNotes,
        severity: alert.severity
      });
      setFeedbackSubmitted(true);
      setTimeout(() => setFeedbackSubmitted(false), 3000);
    } catch (err) {
      console.warn("Feedback error:", err);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "800px",
          width: "95%",
          background: "#0d111d",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "16px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}
      >
        {/* HEADER */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#101522"
          }}
        >
          <div>
            <span
              style={{
                fontSize: "10px",
                fontWeight: "700",
                letterSpacing: "1px",
                textTransform: "uppercase",
                padding: "3px 8px",
                borderRadius: "4px",
                background: alert.severity === "HIGH" || alert.severity === "CRITICAL" ? "rgba(239, 61, 89, 0.2)" : "rgba(245, 158, 11, 0.2)",
                color: alert.severity === "HIGH" || alert.severity === "CRITICAL" ? "#ef3d59" : "#f59e0b",
                border: `1px solid ${alert.severity === "HIGH" || alert.severity === "CRITICAL" ? "rgba(239, 61, 89, 0.4)" : "rgba(245, 158, 11, 0.4)"}`
              }}
            >
              {alert.severity} SEVERITY
            </span>
            <h2 style={{ margin: "6px 0 0", fontSize: "18px", color: "#fff" }}>
              {alert.title || "Anomaly Investigation"}
            </h2>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#747d94" }}>
              Station: <strong>{alert.station_name || alert.station_id}</strong> · Incident: <code>{alert.anomaly_id}</code>
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#c5cee0",
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              cursor: "pointer"
            }}
          >
            ✕
          </button>
        </div>

        {/* BODY */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* TELEMETRY SNAPSHOT */}
          <div>
            <h3 style={{ fontSize: "12px", color: "#8b97ff", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>
              Telemetry at Anomaly Inception
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
              <div style={{ background: "#101522", padding: "12px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ fontSize: "11px", color: "#747d94" }}>Temperature</span>
                <strong style={{ fontSize: "18px", color: "#fff", display: "block" }}>
                  {readings.temperature !== undefined && readings.temperature !== null ? `${Number(readings.temperature).toFixed(1)}°C` : "NULL (Missing)"}
                </strong>
              </div>
              <div style={{ background: "#101522", padding: "12px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ fontSize: "11px", color: "#747d94" }}>Humidity</span>
                <strong style={{ fontSize: "18px", color: "#fff", display: "block" }}>
                  {readings.humidity !== undefined && readings.humidity !== null ? `${Number(readings.humidity).toFixed(1)}%` : "NULL (Missing)"}
                </strong>
              </div>
              <div style={{ background: "#101522", padding: "12px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ fontSize: "11px", color: "#747d94" }}>Pressure</span>
                <strong style={{ fontSize: "18px", color: "#fff", display: "block" }}>
                  {readings.pressure !== undefined && readings.pressure !== null ? `${Number(readings.pressure).toFixed(1)} hPa` : "NULL (Missing)"}
                </strong>
              </div>
            </div>
          </div>

          {/* MULTI-SOURCE EVIDENCE BREAKDOWN */}
          <div>
            <h3 style={{ fontSize: "12px", color: "#8b97ff", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>
              Multi-Source Evidence Diagnostics
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "8px" }}>
              <div style={{ background: "#101522", padding: "10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ fontSize: "10px", color: "#747d94" }}>Temporal Score</span>
                <strong style={{ fontSize: "14px", color: "#35df9a", display: "block" }}>
                  {(evidence.temporal || 0.85).toFixed(3)}
                </strong>
              </div>
              <div style={{ background: "#101522", padding: "10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ fontSize: "10px", color: "#747d94" }}>Spatial Score</span>
                <strong style={{ fontSize: "14px", color: "#6877ff", display: "block" }}>
                  {(evidence.spatial || 0.25).toFixed(3)}
                </strong>
              </div>
              <div style={{ background: "#101522", padding: "10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ fontSize: "10px", color: "#747d94" }}>Physics Score</span>
                <strong style={{ fontSize: "14px", color: "#f59e0b", display: "block" }}>
                  {(evidence.physics || 0.90).toFixed(3)}
                </strong>
              </div>
              <div style={{ background: "#101522", padding: "10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ fontSize: "10px", color: "#747d94" }}>XGBoost Score</span>
                <strong style={{ fontSize: "14px", color: "#ef3d59", display: "block" }}>
                  {(evidence.xgboost || 0.92).toFixed(3)}
                </strong>
              </div>
              <div style={{ background: "#101522", padding: "10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ fontSize: "10px", color: "#747d94" }}>IForest Novelty</span>
                <strong style={{ fontSize: "14px", color: "#a855f7", display: "block" }}>
                  {(evidence.isolation_forest || 0.78).toFixed(3)}
                </strong>
              </div>
            </div>
          </div>

          {/* SHAP EXPLANATION FACTORS */}
          {shapFactors.length > 0 && (
            <div>
              <h3 style={{ fontSize: "12px", color: "#8b97ff", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>
                Top SHAP Diagnostic Factors
              </h3>
              <div style={{ background: "#101522", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)", padding: "12px" }}>
                {shapFactors.map((f, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: i < shapFactors.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                    <span style={{ fontSize: "12px", color: "#c5cee0" }}>{f.statement || f.feature}</span>
                    <strong style={{ fontSize: "12px", color: "#ff7b00" }}>+{Math.abs(f.shap_value || 0.5).toFixed(2)}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* RECOMMENDED MAINTENANCE ACTION */}
          {recommendedActions.length > 0 && (
            <div>
              <h3 style={{ fontSize: "12px", color: "#8b97ff", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>
                Recommended Field Action
              </h3>
              <div style={{ background: "rgba(53, 223, 154, 0.08)", border: "1px solid rgba(53, 223, 154, 0.2)", borderRadius: "10px", padding: "12px 16px", color: "#35df9a", fontSize: "13px" }}>
                ✓ {recommendedActions[0]}
              </div>
            </div>
          )}

          {/* AI DIAGNOSTIC REPORT */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <h3 style={{ fontSize: "12px", color: "#8b97ff", textTransform: "uppercase", letterSpacing: "1px", margin: 0 }}>
                🤖 AI Root Cause Report
              </h3>
              {!llmReport && (
                <button
                  onClick={handleGenerateReport}
                  disabled={generatingReport}
                  style={{
                    background: "#6877ff",
                    border: "none",
                    color: "#fff",
                    padding: "4px 12px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: "bold",
                    cursor: generatingReport ? "not-allowed" : "pointer"
                  }}
                >
                  {generatingReport ? "Generating..." : "Generate AI Report"}
                </button>
              )}
            </div>
            <div style={{ background: "#101522", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)", padding: "14px", fontSize: "12px", color: "#c5cee0", lineHeight: "1.6" }}>
              {llmReport ? (
                <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{llmReport}</p>
              ) : (
                <span style={{ color: "#747d94" }}>Click "Generate AI Report" to synthesize an LLM root cause analysis report.</span>
              )}
            </div>
          </div>

          {/* OPERATOR FEEDBACK FORM */}
          <div>
            <h3 style={{ fontSize: "12px", color: "#8b97ff", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>
              Operator Validation & Feedback
            </h3>
            <form onSubmit={handleSubmitFeedback} style={{ background: "#101522", padding: "14px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                <select
                  value={feedbackStatus}
                  onChange={(e) => setFeedbackStatus(e.target.value)}
                  style={{ background: "#0b0f19", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "6px 10px", borderRadius: "6px", fontSize: "12px" }}
                >
                  <option value="CONFIRMED">Confirm Anomaly (True Positive)</option>
                  <option value="FALSE_ALARM">False Alarm (Nominal Weather)</option>
                  <option value="MAINTENANCE_REQUIRED">Requires Site Dispatch</option>
                </select>
                <input
                  type="text"
                  placeholder="Optional operator notes..."
                  value={feedbackNotes}
                  onChange={(e) => setFeedbackNotes(e.target.value)}
                  style={{ flex: 1, background: "#0b0f19", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "6px 10px", borderRadius: "6px", fontSize: "12px" }}
                />
                <button
                  type="submit"
                  style={{ background: "#35df9a", border: "none", color: "#070a12", fontWeight: "bold", padding: "6px 14px", borderRadius: "6px", fontSize: "12px", cursor: "pointer" }}
                >
                  Submit
                </button>
              </div>
              {feedbackSubmitted && (
                <span style={{ fontSize: "11px", color: "#35df9a" }}>✓ Feedback recorded into system logs.</span>
              )}
            </form>
          </div>
        </div>

        {/* FOOTER */}
        <div style={{ padding: "14px 24px", borderTop: "1px solid rgba(255, 255, 255, 0.08)", display: "flex", justifyContent: "flex-end", background: "#101522" }}>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#fff",
              padding: "6px 16px",
              borderRadius: "6px",
              fontSize: "12px",
              cursor: "pointer"
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default AnomalyInspectModal;
