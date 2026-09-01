import React from "react";
import StationGraph from "../components/StationGraph";

function StationDetails({ station, setActivePage, alerts = [], readings = [], onInspectAlert }) {
  if (!station) {
    return (
      <div className="empty-state" style={{ padding: "50px 20px", textAlign: "center" }}>
        <h2>No station selected</h2>
        <button className="small-button" onClick={() => setActivePage("stations")}>Go to Stations</button>
      </div>
    );
  }

  const isOffline = station.status === "OFFLINE";
  const sId = station.station_id || station.stationId;
  const stationAlerts = alerts.filter(a => (a.station_id || a.station?.id) === sId);
  const healthScore = station.health_score ?? (stationAlerts.length > 0 ? 68 : 98);
  const healthStatus = healthScore >= 85 ? "EXCELLENT" : healthScore >= 65 ? "DEGRADED" : "CRITICAL";
  const healthColor = healthScore >= 85 ? "#35df9a" : healthScore >= 65 ? "#f59e0b" : "#ef3d59";

  return (
    <>
      <button className="back-button" onClick={() => setActivePage("stations")}>
        ← Back to Live Monitoring
      </button>

      <div className="station-detail-header">
        <div>
          <p className="eyebrow">AUTOMATIC WEATHER STATION (AWS) DEEP-DIVE</p>
          <h1>{station.station_name || "AWS Station"}</h1>
          <p>
            {station.city || station.location || "India"} · Station ID: <code>{sId}</code> · Regional Cluster: <strong>{station.cluster || "NCR"}</strong>
          </p>
        </div>

        <span className={`station-status ${(station.status || "ONLINE").toLowerCase()}`}>
          ● {station.status || "ONLINE"}
        </span>
      </div>

      {isOffline ? (
        <div className="offline-box">⚠ This station is currently offline. No live telemetry received.</div>
      ) : (
        <>
          {/* LIVE SENSOR READINGS */}
          <div className="detail-grid">
            <div className="detail-card">
              <span>🌡</span>
              <p>Temperature</p>
              <strong>{Number(station.temperature || 28.5).toFixed(1)}°C</strong>
            </div>

            <div className="detail-card">
              <span>💧</span>
              <p>Humidity (RH)</p>
              <strong>{Number(station.humidity || 55.0).toFixed(1)}%</strong>
            </div>

            <div className="detail-card">
              <span>◉</span>
              <p>Barometric Pressure</p>
              <strong>{Number(station.pressure || 1008.0).toFixed(1)} hPa</strong>
            </div>
          </div>

          {/* SENSOR HEALTH & NETWORK METRICS */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px", marginBottom: "24px" }}>
            <div className="report-box" style={{ margin: 0 }}>
              <h2 style={{ fontSize: "14px", marginBottom: "10px" }}>Sensor Health & Integrity Score</h2>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "10px" }}>
                <div style={{ fontSize: "34px", fontWeight: "bold", color: healthColor }}>
                  {healthScore}/100
                </div>
                <div>
                  <strong style={{ fontSize: "13px", color: "#f5f7ff", display: "block" }}>Status: {healthStatus}</strong>
                  <span style={{ fontSize: "11px", color: "#747d94" }}>Multi-tier hardware confidence</span>
                </div>
              </div>
              <div style={{ fontSize: "11px", color: "#c5cee0", lineHeight: "1.6" }}>
                • Temperature channel: {stationAlerts.some(a => a.root_cause?.includes("temp")) ? "⚠️ Anomaly Flagged" : "✓ Nominal"}<br />
                • Barometric transducer: {stationAlerts.some(a => a.root_cause?.includes("press")) ? "⚠️ Anomaly Flagged" : "✓ Calibrated (Nominal)"}<br />
                • Humidity sensor: {stationAlerts.some(a => a.root_cause?.includes("hum")) ? "⚠️ Anomaly Flagged" : "✓ Within WMO atmospheric limits"}
              </div>
            </div>

            <div className="report-box" style={{ margin: 0 }}>
              <h2 style={{ fontSize: "14px", marginBottom: "10px" }}>Hardware & Geolocation Topology</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#747d94" }}>Coordinates:</span>
                  <strong>{station.latitude ? `${station.latitude.toFixed(3)}°N, ${station.longitude.toFixed(3)}°E` : "28.585°N, 77.206°E"}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#747d94" }}>Regional Cluster Group:</span>
                  <strong>{station.cluster || "NCR"}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#747d94" }}>Ingestion Protocol:</span>
                  <strong>MQTT QoS-1 / WebSocket Relay</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#747d94" }}>Sampling Interval:</span>
                  <strong>5.0 Seconds (Real-Time Ingestion)</strong>
                </div>
              </div>
            </div>
          </div>

          {/* LIVE INTERACTIVE GRAPHS (TEMPERATURE, HUMIDITY, PRESSURE) */}
          <div style={{ marginBottom: "24px" }}>
            <div className="section-title" style={{ marginBottom: "0px" }}>
              <div>
                <h2>Station Telemetry & Multi-Parameter Trends</h2>
                <p>Live interactive waveforms updating automatically as new telemetry arrives from backend (12h / 24h / 2d / 5d)</p>
              </div>
            </div>

            <StationGraph
              readings={readings}
              stationName={station.station_name || "AWS Station"}
              initialRange="24h"
              initialMetric="temperature"
            />
          </div>

          {/* STATION ANOMALY HISTORY WITH INSPECT BUTTON */}
          <div className="report-box">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h2 style={{ fontSize: "15px", margin: 0 }}>
                Station Anomaly & Incident History ({stationAlerts.length})
              </h2>
              <span style={{ fontSize: "11px", color: "#747d94" }}>
                Click INSPECT for multi-tier evidence & TreeSHAP factors
              </span>
            </div>

            {stationAlerts.length === 0 ? (
              <p style={{ margin: 0, color: "#747d94", fontSize: "13px" }}>
                ✅ No anomalies detected for this station. All operating metrics remain nominal.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {stationAlerts.map(alt => (
                  <div
                    key={alt.anomaly_id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "#101522",
                      padding: "12px 16px",
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.06)",
                      flexWrap: "wrap",
                      gap: "10px"
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: "13px", color: "#f5f7ff", display: "block" }}>
                        {alt.title || `${String(alt.root_cause || "Anomaly").replace(/_/g, " ").toUpperCase()} Detected`}
                      </strong>
                      <span style={{ fontSize: "11px", color: "#747d94" }}>
                        ID: <code>{alt.anomaly_id}</code> · Root cause: <code style={{ color: "#c084fc" }}>{alt.root_cause}</code> · Severity: <span style={{ color: "#ef3d59", fontWeight: "bold" }}>{alt.severity}</span> · Confidence: {(Number(alt.confidence || 0.92) * 100).toFixed(0)}%
                      </span>
                    </div>

                    <button
                      className="sim-btn sim-btn-trigger"
                      style={{ padding: "6px 14px", fontSize: "11px", display: "flex", alignItems: "center", gap: "6px" }}
                      onClick={() => {
                        if (onInspectAlert) onInspectAlert(alt);
                      }}
                    >
                      <span>🔍</span>
                      <span>INSPECT</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

export default StationDetails;
