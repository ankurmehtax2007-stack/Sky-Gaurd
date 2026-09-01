import React from "react";

function About() {
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">SYSTEM ARCHITECTURE & SPECIFICATIONS</p>
          <h1>
            About <span>SkyGuard AI</span>
          </h1>
          <p className="subtitle">
            Autonomous multi-tier sensor health diagnostics and anomaly intelligence platform for Automatic Weather Stations.
          </p>
        </div>

        <div className="date-box">
          <span>Release Version</span>
          <strong style={{ color: "#8b97ff" }}>v2.4 Production</strong>
        </div>
      </div>

      {/* HERO SYSTEM OVERVIEW */}
      <div className="about-grid" style={{ marginBottom: "24px" }}>
        <div className="about-card about-main" style={{ gridColumn: "1 / -1", background: "linear-gradient(135deg, rgba(104,119,255,0.12), rgba(16,21,34,0.9))", border: "1px solid rgba(104,119,255,0.3)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "linear-gradient(135deg, #6877ff, #35df9a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", boxShadow: "0 0 20px rgba(104,119,255,0.4)" }}>
              ☁️
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "22px", color: "#f5f7ff" }}>SkyGuard Enterprise Platform</h2>
              <span style={{ fontSize: "12px", color: "#8b97ff" }}>Autonomous AWS Diagnostic & Machine Learning Pipeline</span>
            </div>
          </div>

          <p style={{ lineHeight: "1.7", color: "#c5cee0", fontSize: "14px" }}>
            SkyGuard is an enterprise-grade telemetry intelligence engine engineered for Automatic Weather Station (AWS) networks.
            By fusing physical atmospheric laws, unsupervised novelty detection, gradient-boosted multiclass classification, and explainable AI (SHAP),
            the platform delivers autonomous hardware failure diagnosis, sensor health scoring, and on-demand generative incident briefings via Mistral AI.
          </p>
        </div>
      </div>

      {/* 4 CORE PILLARS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div className="about-card">
          <span className="about-number">01</span>
          <h3 style={{ color: "#6877ff", marginTop: "8px" }}>Physics Consistency</h3>
          <p style={{ fontSize: "12px", lineHeight: "1.6", color: "#a0aec0" }}>
            Enforces thermodynamic laws including the Magnus-Tetens dew-point formulation, 5°C/hr gradient rate bounds, and cross-channel sensor consistency checks.
          </p>
        </div>

        <div className="about-card">
          <span className="about-number">02</span>
          <h3 style={{ color: "#35df9a", marginTop: "8px" }}>Novelty & Drift Detection</h3>
          <p style={{ fontSize: "12px", lineHeight: "1.6", color: "#a0aec0" }}>
            Isolation Forest models trained on multi-dimensional feature representations identify out-of-distribution drifts, calibration shifts, and uncharacteristic anomalies.
          </p>
        </div>

        <div className="about-card">
          <span className="about-number">03</span>
          <h3 style={{ color: "#f59e0b", marginTop: "8px" }}>Multiclass XGBoost</h3>
          <p style={{ fontSize: "12px", lineHeight: "1.6", color: "#a0aec0" }}>
            10-class gradient boosting model classifying failure mechanisms (spikes, drift, stuck values, multivariate conflicts, spatial inconsistencies) with calibrated confidence.
          </p>
        </div>

        <div className="about-card">
          <span className="about-number">04</span>
          <h3 style={{ color: "#ef3d59", marginTop: "8px" }}>On-Demand Mistral AI</h3>
          <p style={{ fontSize: "12px", lineHeight: "1.6", color: "#a0aec0" }}>
            Generates operator-ready incident briefs on demand with plain-English SHAP feature explainability, root cause analysis, and field maintenance protocols.
          </p>
        </div>
      </div>

      {/* AWS METEOROLOGICAL NETWORK SPECIFICATIONS */}
      <div className="report-box" style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "16px", marginBottom: "12px" }}>Configured IMD Weather Station Network</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
          {[
            { id: "IMD-DEL-001", name: "New Delhi Safdarjung AWS", cluster: "NCR", lat: 28.585, lon: 77.206 },
            { id: "IMD-DEL-002", name: "Delhi Ridge AWS", cluster: "NCR", lat: 28.690, lon: 77.210 },
            { id: "IMD-BOM-001", name: "Mumbai Santacruz Coastal AWS", cluster: "Konkan_Deccan", lat: 19.113, lon: 72.867 },
            { id: "IMD-MAA-001", name: "Chennai Meenambakkam AWS", cluster: "Tamil_Nadu_Coast", lat: 12.994, lon: 80.180 },
            { id: "IMD-CCU-001", name: "Kolkata Alipore AWS", cluster: "West_Bengal", lat: 22.533, lon: 88.324 }
          ].map(st => (
            <div key={st.id} style={{ background: "#101522", padding: "12px 14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
              <strong style={{ fontSize: "13px", color: "#f5f7ff", display: "block" }}>{st.name}</strong>
              <div style={{ fontSize: "11px", color: "#747d94", marginTop: "4px" }}>
                <code>{st.id}</code> · {st.cluster}
              </div>
              <div style={{ fontSize: "10px", color: "#35df9a", marginTop: "4px" }}>
                📍 {st.lat}°N, {st.lon}°E
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DIAGNOSTIC CAPABILITIES MATRIX */}
      <div className="report-box">
        <h2 style={{ fontSize: "16px", marginBottom: "12px" }}>Supported Hardware & Environmental Anomaly Classes</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "10px", fontSize: "12px" }}>
          {[
            { name: "Temperature Spike", type: "Sensor Fault", desc: "Sudden unphysical thermal surge exceeding thermodynamic limits." },
            { name: "Humidity Saturation", type: "Transducer Saturation", desc: "Moisture condensation locking sensor at 100% relative humidity." },
            { name: "Pressure Step Discontinuity", type: "Barometric Anomaly", desc: "Abrupt unphysical barometric pressure drop or sensor blockage." },
            { name: "Frozen / Stuck Sensor", type: "ADC Lockup", desc: "Identical value repeated over consecutive transmission cycles." },
            { name: "Sensor Calibration Drift", type: "Aging Transducer", desc: "Monotonic progressive baseline shift over multi-day horizon." },
            { name: "Multivariate Inconsistency", type: "Physics Violation", desc: "Mutually conflicting sensor parameters (e.g., 45°C + 98% RH)." },
            { name: "Spatial Outlier", type: "Cluster Inconsistency", desc: "Severe deviation (>4σ) compared to adjacent regional weather stations." }
          ].map(an => (
            <div key={an.name} style={{ background: "#101522", padding: "10px 14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <strong style={{ color: "#8b97ff" }}>{an.name}</strong>
                <span style={{ fontSize: "10px", color: "#747d94" }}>{an.type}</span>
              </div>
              <p style={{ margin: 0, fontSize: "11px", color: "#a0aec0", lineHeight: "1.4" }}>{an.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default About;
