import React from "react";

function Topbar({
  simulatorRunning = true,
  onToggleSimulator,
  wsConnected = true,
  onOpenInjectModal,
  activeInjection = null
}) {
  const isInjecting = Boolean(activeInjection && activeInjection.status === "active");

  return (
    <header className="topbar">
      <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
        {/* WEBSOCKET CONNECTION INDICATOR */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            className="live-dot"
            style={{
              background: wsConnected ? "#35df9a" : "#ef3d59",
              boxShadow: wsConnected ? "0 0 12px #35df9a" : "0 0 12px #ef3d59"
            }}
          />
          <span style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "0.5px" }}>
            {wsConnected ? "LIVE TELEMETRY" : "CONNECTING..."}
          </span>
        </div>

        {/* STREAM CONTROLS */}
        <div className="sim-controls">
          <div className="sim-status-pill">
            <span className={simulatorRunning ? "dot-active" : "dot-paused"} />
            <span>{simulatorRunning ? "STREAM: 10s" : "STREAM: PAUSED"}</span>
          </div>

          <button
            className={`sim-btn ${simulatorRunning ? "sim-btn-stop" : "sim-btn-start"}`}
            onClick={onToggleSimulator}
            title={simulatorRunning ? "Pause incoming telemetry simulation" : "Start telemetry stream every 10s"}
          >
            {simulatorRunning ? "⏸ Pause Stream" : "▶ Resume (10s)"}
          </button>
        </div>

        {/* ACTIVE INJECTION PILL (IF ACTIVE) */}
        {isInjecting && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(255, 123, 0, 0.15)",
              border: "1px solid rgba(255, 123, 0, 0.4)",
              padding: "4px 10px",
              borderRadius: "20px",
              fontSize: "11px",
              fontWeight: "700",
              color: "#ff7b00",
              animation: "pulse 2s infinite"
            }}
          >
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef3d59", boxShadow: "0 0 8px #ef3d59" }} />
            <span>
              INJECTING: {(activeInjection.anomaly_type || "ANOMALY").replace(/_/g, " ").toUpperCase()} ({activeInjection.records_emitted || 1}/6)
            </span>
          </div>
        )}

        {/* MANUAL ANOMALY INJECTION LAUNCHER BUTTON */}
        <button
          onClick={onOpenInjectModal}
          style={{
            background: isInjecting
              ? "rgba(239, 61, 89, 0.2)"
              : "linear-gradient(135deg, rgba(239, 61, 89, 0.8), rgba(255, 123, 0, 0.8))",
            border: `1px solid ${isInjecting ? "#ef3d59" : "rgba(255, 255, 255, 0.2)"}`,
            color: "#fff",
            padding: "5px 14px",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: "700",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            boxShadow: isInjecting ? "0 0 15px rgba(239, 61, 89, 0.5)" : "0 4px 15px rgba(239, 61, 89, 0.25)",
            transition: "all 0.2s"
          }}
          title="Open manual anomaly injection panel"
        >
          <span>⚡</span>
          <span>{isInjecting ? "Injection in Progress..." : "Inject Anomaly"}</span>
        </button>
      </div>

      <div className="topbar-right" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ textAlign: "right" }}>
          <strong style={{ fontSize: "12px", color: "#f5f7ff", display: "block" }}>IMD Operator</strong>
          <span style={{ fontSize: "10px", color: "#35df9a" }}>● System Administrator</span>
        </div>
        <div className="top-avatar" style={{ background: "linear-gradient(135deg, #6877ff, #35df9a)", color: "#fff", fontWeight: "bold" }}>
          A
        </div>
      </div>
    </header>
  );
}

export default Topbar;
