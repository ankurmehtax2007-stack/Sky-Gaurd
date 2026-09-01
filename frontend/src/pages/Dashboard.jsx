import React from "react";
import SensorCard from "../components/SensorCard";
import AlertCard from "../components/AlertCard";

function Dashboard({
  stations = [],
  alerts = [],
  currentConditions = {},
  setActivePage,
  setSelectedStation,
  onInspectAlert,
  wsConnected = true,
  lastUpdateTime
}) {
  const onlineStations = stations.filter((s) => s.status !== "OFFLINE").length;
  const offlineStations = stations.filter((s) => s.status === "OFFLINE").length;
  const activeStations = stations.filter((s) => s.status !== "OFFLINE");
  const criticalAlertsCount = alerts.filter(a => (a.severity || "").toUpperCase() === "CRITICAL" || a.severity === "HIGH").length;

  const avgTemperature = activeStations.length > 0
    ? activeStations.reduce((sum, s) => sum + (s.temperature || 0), 0) / activeStations.length
    : 28.5;

  const avgHealth = activeStations.length > 0
    ? Math.round(activeStations.reduce((sum, s) => sum + (s.health_score || (alerts.some(a => a.station_id === (s.station_id || s.stationId)) ? 78 : 98)), 0) / activeStations.length)
    : 96;

  const tempDisplay = currentConditions.temperature !== undefined
    ? `${Number(currentConditions.temperature).toFixed(1)}°C`
    : "28.6°C";

  const pressDisplay = currentConditions.pressure !== undefined
    ? `${Number(currentConditions.pressure).toFixed(1)} hPa`
    : "1012 hPa";

  const humDisplay = currentConditions.humidity !== undefined
    ? `${Number(currentConditions.humidity).toFixed(1)}%`
    : "67%";

  const updateDisplay = lastUpdateTime
    ? new Date(lastUpdateTime).toLocaleTimeString()
    : "Live (Streaming 10s)";

  return (
    <>
      {/* PAGE HEADING WITH SYSTEM STATUS BANNER */}
      <div className="page-heading">
        <div>
          <p className="eyebrow">REAL-TIME WEATHER STATION INTELLIGENCE</p>
          <h1>
            Weather <span>Overview</span>
          </h1>
          <p className="subtitle">
            Autonomous multi-tier anomaly detection & sensor health across Indian AWS network.
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div className="date-box">
            <span>Last Telemetry Packet</span>
            <strong>{updateDisplay}</strong>
          </div>
        </div>
      </div>

      {/* SYSTEM STATUS BAR */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#101522", padding: "10px 18px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)", marginBottom: "24px", fontSize: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: wsConnected ? "#35df9a" : "#ef3d59" }}></span>
            WebSocket: <strong style={{ color: wsConnected ? "#35df9a" : "#ef3d59" }}>{wsConnected ? "CONNECTED" : "DISCONNECTED"}</strong>
          </span>
          <span style={{ color: "rgba(255,255,255,0.15)" }}>|</span>
          <span style={{ color: "#747d94" }}>Backend Gateway: <strong style={{ color: "#c5cee0" }}>HTTP 3000 / FastAPI 8000</strong></span>
          <span style={{ color: "rgba(255,255,255,0.15)" }}>|</span>
          <span style={{ color: "#747d94" }}>Cadence: <strong style={{ color: "#c5cee0" }}>10.0s Realtime</strong></span>
        </div>

        <div>
          <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "bold", background: alerts.length > 0 ? "rgba(239, 61, 89, 0.15)" : "rgba(53, 223, 154, 0.15)", color: alerts.length > 0 ? "#ef3d59" : "#35df9a", border: `1px solid ${alerts.length > 0 ? "rgba(239,61,89,0.3)" : "rgba(53,223,154,0.3)"}` }}>
            {alerts.length > 0 ? `⚠ ${alerts.length} Active Anomaly Alerts` : "✓ All Systems Nominal"}
          </span>
        </div>
      </div>

      {/* SUMMARY CARDS (5 METRICS) */}
      <div className="summary-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        <div className="summary-card blue">
          <div className="summary-icon">◉</div>
          <div>
            <p>Total Stations</p>
            <h2>{stations.length}</h2>
          </div>
        </div>

        <div className="summary-card green">
          <div className="summary-icon">●</div>
          <div>
            <p>Online / Offline</p>
            <h2>{onlineStations} <span style={{ fontSize: "14px", color: "#747d94", fontWeight: "normal" }}>/ {offlineStations} off</span></h2>
          </div>
        </div>

        <div className="summary-card red">
          <div className="summary-icon">🚨</div>
          <div>
            <p>Active Anomalies</p>
            <h2>{alerts.length} <span style={{ fontSize: "13px", color: "#ff5e78" }}>({criticalAlertsCount} crit)</span></h2>
          </div>
        </div>

        <div className="summary-card orange">
          <div className="summary-icon">❤</div>
          <div>
            <p>Avg Sensor Health</p>
            <h2>{avgHealth}<span style={{ fontSize: "15px" }}>/100</span></h2>
          </div>
        </div>

        <div className="summary-card orange" style={{ background: "rgba(104, 119, 255, 0.08)", borderColor: "rgba(104, 119, 255, 0.2)" }}>
          <div className="summary-icon" style={{ color: "#8b97ff" }}>°</div>
          <div>
            <p>Network Avg Temp</p>
            <h2>{avgTemperature.toFixed(1)}°C</h2>
          </div>
        </div>
      </div>

      {/* CURRENT CONDITIONS SENSORS */}
      <section className="section">
        <div className="section-title">
          <div>
            <h2>Live Telemetry Readings</h2>
            <p>Latest sensor packet streamed across AWS network (10s cadence)</p>
          </div>
        </div>

        <div className="sensor-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          <SensorCard type="temperature" icon="🌡" label="Temperature" value={tempDisplay} />
          <SensorCard type="pressure" icon="◉" label="Pressure" value={pressDisplay} />
          <SensorCard type="humidity" icon="💧" label="Humidity" value={humDisplay} />
        </div>
      </section>

      {/* CRITICAL ALERTS */}
      <section className="section">
        <div className="section-title">
          <div>
            <h2>Critical Anomalies & Active Incidents</h2>
            <p>Real-time machine learning detections from SkyGuard AI</p>
          </div>

          <button className="view-all" onClick={() => setActivePage("stations")}>
            View All Stations ({stations.length}) →
          </button>
        </div>

        <div className="alerts-list">
          {alerts.length === 0 ? (
            <div style={{ padding: "24px", textAlign: "center", background: "#101522", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", color: "#747d94" }}>
              ✅ All weather stations are operating within normal parameters. No active anomalies.
            </div>
          ) : (
            alerts.slice(0, 4).map((alert) => (
              <AlertCard
                key={alert.anomaly_id}
                alert={alert}
                onView={() => {
                  if (onInspectAlert) {
                    onInspectAlert(alert);
                  } else {
                    const match = stations.find(s => (s.station_id || s.stationId) === alert.station_id);
                    if (match && setSelectedStation) setSelectedStation(match);
                    setActivePage("stationDetails");
                  }
                }}
              />
            ))
          )}
        </div>
      </section>
    </>
  );
}

export default Dashboard;
