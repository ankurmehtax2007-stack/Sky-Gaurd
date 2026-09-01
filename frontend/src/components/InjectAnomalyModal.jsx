import React, { useState, useEffect } from "react";
import { injectAnomaly, fetchInjectionStatus } from "../api/skyguardApi";

const ANOMALY_CATALOG = [
  {
    id: "temperature_spike",
    name: "Temperature Spike",
    icon: "🌡️",
    badge: "Temporal Jump",
    description: "Sudden large thermal spike (+14°C to +18°C) diverging sharply from historical rolling baseline.",
    category: "temporal",
    sensors: ["temperature"]
  },
  {
    id: "humidity_spike",
    name: "Humidity Saturation",
    icon: "💧",
    badge: "Psychrometric Surge",
    description: "Sudden abnormal RH surge reaching 99–100% saturation, violating natural atmospheric drying rates.",
    category: "temporal",
    sensors: ["humidity"]
  },
  {
    id: "pressure_jump",
    name: "Barometric Pressure Jump",
    icon: "◉",
    badge: "Transducer Step",
    description: "Rapid barometric pressure drop or rise (-20 hPa step) exceeding meteorological gradient bounds.",
    category: "temporal",
    sensors: ["pressure"]
  },
  {
    id: "freeze",
    name: "Frozen Sensor",
    icon: "❄️",
    badge: "Zero Variance",
    description: "Sensor reading becomes locked at an unchanging constant value across consecutive telemetry packets.",
    category: "statistical",
    sensors: ["temperature", "humidity", "pressure"]
  },
  {
    id: "drift",
    name: "Sensor Drift",
    icon: "📈",
    badge: "Monotonic Trend",
    description: "Progressive linear calibration drift steadily moving the sensor away from regional baseline.",
    category: "statistical",
    sensors: ["temperature", "humidity", "pressure"]
  },
  {
    id: "offset",
    name: "Offset Step Bias",
    icon: "⚖️",
    badge: "Calibration Shift",
    description: "Sudden persistent calibration offset bias (+7.5°C) that remains stable at the shifted level.",
    category: "statistical",
    sensors: ["temperature", "humidity", "pressure"]
  },
  {
    id: "missing_data",
    name: "Missing Sensor Data",
    icon: "⚠️",
    badge: "Null Telemetry",
    description: "Emits null sensor payload while preserving valid station identity and real-time timestamps.",
    category: "integrity",
    sensors: ["temperature", "humidity", "pressure", "all"]
  },
  {
    id: "multivariate_inconsistency",
    name: "Multivariate Inconsistency",
    icon: "⚡",
    badge: "Thermodynamic Conflict",
    description: "Combines extreme temperature (43.8°C) with saturated humidity (94%), physically impossible in natural atmosphere.",
    category: "physics",
    sensors: ["multivariate"]
  },
  {
    id: "spatial_inconsistency",
    name: "Spatial Inconsistency",
    icon: "📍",
    badge: "Intra-City Divergence",
    description: "Diverges target station while keeping companion station in the same city normal to test spatial consensus.",
    category: "spatial",
    sensors: ["temperature"]
  }
];

function InjectAnomalyModal({ isOpen, onClose, stations = [], onInjectionStarted }) {
  const [selectedStationId, setSelectedStationId] = useState(stations[0]?.station_id || stations[0]?.stationId || "IMD-DEL-001");
  const [selectedAnomaly, setSelectedAnomaly] = useState("temperature_spike");
  const [selectedSensor, setSelectedSensor] = useState("temperature");
  const [selectedIntensity, setSelectedIntensity] = useState("high");
  const [injectionStatus, setInjectionStatus] = useState("idle"); // idle | pending | active | completed
  const [statusDetails, setStatusDetails] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Sync default station when stations load
  useEffect(() => {
    if (stations.length > 0 && !selectedStationId) {
      setSelectedStationId(stations[0].station_id || stations[0].stationId);
    }
  }, [stations, selectedStationId]);

  // Selected station metadata
  const currentStation = stations.find(s => (s.station_id || s.stationId) === selectedStationId) || stations[0];
  const currentCity = currentStation?.city || currentStation?.location || "New Delhi";
  const currentCluster = currentStation?.cluster || "NCR";

  // Identify companion station in the same city/cluster for spatial inconsistency
  const companionStation = stations.find(s =>
    (s.station_id || s.stationId) !== selectedStationId &&
    (s.city === currentCity || s.cluster === currentCluster)
  );

  const selectedAnomalyMeta = ANOMALY_CATALOG.find(a => a.id === selectedAnomaly) || ANOMALY_CATALOG[0];

  // Poll injection status when active
  useEffect(() => {
    if (!isOpen) return;

    let pollInterval = null;

    const checkStatus = async () => {
      const res = await fetchInjectionStatus();
      if (res && res.hasActive && res.active?.length > 0) {
        const activeInj = res.active[0];
        setInjectionStatus("active");
        setStatusDetails(activeInj);
      } else if (injectionStatus === "active") {
        setInjectionStatus("completed");
      }
    };

    checkStatus();
    pollInterval = setInterval(checkStatus, 2000);

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [isOpen, injectionStatus]);

  if (!isOpen) return null;

  const handleTriggerInject = async () => {
    setInjectionStatus("pending");
    setErrorMessage("");

    const payload = {
      city: currentCity,
      station_id: selectedStationId,
      anomaly_type: selectedAnomaly,
      sensor: selectedSensor,
      intensity: selectedIntensity,
      duration_records: 6
    };

    try {
      const res = await injectAnomaly(payload);
      if (res && res.status === "success") {
        setInjectionStatus("active");
        setStatusDetails(res.injection || {
          anomaly_type: selectedAnomaly,
          station_id: selectedStationId,
          total_records: 6,
          records_emitted: 0,
          remaining_records: 6
        });
        if (onInjectionStarted) {
          onInjectionStarted(res.injection);
        }
      } else {
        setInjectionStatus("idle");
        setErrorMessage(res?.message || "Failed to trigger anomaly injection.");
      }
    } catch (err) {
      setInjectionStatus("idle");
      setErrorMessage(err.message || "Communication error with backend.");
    }
  };

  const handleReset = () => {
    setInjectionStatus("idle");
    setStatusDetails(null);
    setErrorMessage("");
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "840px",
          width: "95%",
          background: "#0d111d",
          border: "1px solid rgba(104, 119, 255, 0.25)",
          borderRadius: "16px",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(104, 119, 255, 0.15)",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}
      >
        {/* HEADER */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "linear-gradient(90deg, rgba(104,119,255,0.1), transparent)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #ef3d59, #ff7b00)",
                display: "grid",
                placeItems: "center",
                fontSize: "20px",
                boxShadow: "0 0 20px rgba(239, 61, 89, 0.4)"
              }}
            >
              ⚡
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "18px", color: "#f5f7ff", fontWeight: "700" }}>
                Manual Anomaly Injector
              </h2>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#747d94" }}>
                6-Record Real-Time Streaming Injection Window (6 × 10s = 60s Duration)
              </p>
            </div>
          </div>

          <button
            className="modal-close-btn"
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
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
          {errorMessage && (
            <div
              style={{
                background: "rgba(239, 61, 89, 0.15)",
                border: "1px solid rgba(239, 61, 89, 0.3)",
                color: "#ff5e78",
                padding: "10px 14px",
                borderRadius: "8px",
                marginBottom: "16px",
                fontSize: "12px"
              }}
            >
              ⚠ {errorMessage}
            </div>
          )}

          {/* LIVE INJECTION STATUS CARD */}
          {injectionStatus !== "idle" && (
            <div
              style={{
                background: injectionStatus === "completed"
                  ? "rgba(53, 223, 154, 0.08)"
                  : "rgba(255, 123, 0, 0.1)",
                border: `1px solid ${injectionStatus === "completed" ? "rgba(53, 223, 154, 0.3)" : "rgba(255, 123, 0, 0.4)"}`,
                borderRadius: "12px",
                padding: "16px 20px",
                marginBottom: "20px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span
                    style={{
                      display: "inline-block",
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      background: injectionStatus === "completed" ? "#35df9a" : (injectionStatus === "pending" ? "#f59e0b" : "#ef3d59"),
                      boxShadow: `0 0 10px ${injectionStatus === "completed" ? "#35df9a" : "#ef3d59"}`
                    }}
                  />
                  <strong style={{ fontSize: "14px", color: "#f5f7ff", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Status: {injectionStatus}
                  </strong>
                </div>

                <span style={{ fontSize: "12px", color: "#8b97ff" }}>
                  Target: <strong>{statusDetails?.station_id || selectedStationId}</strong> ({statusDetails?.city || currentCity})
                </span>
              </div>

              {injectionStatus === "active" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#c5cee0", marginBottom: "6px" }}>
                    <span>Progress: <strong>Record {statusDetails?.records_emitted || 1} of 6</strong></span>
                    <span>Remaining: <strong>{statusDetails?.remaining_records ?? (6 - (statusDetails?.records_emitted || 1))} records (~{(statusDetails?.remaining_records ?? 5) * 10}s)</strong></span>
                  </div>
                  <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.1)", borderRadius: "4px", overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${Math.min(100, Math.max(10, ((statusDetails?.records_emitted || 1) / 6) * 100))}%`,
                        height: "100%",
                        background: "linear-gradient(90deg, #ff7b00, #ef3d59)",
                        transition: "width 0.5s ease"
                      }}
                    />
                  </div>
                  <p style={{ margin: "10px 0 0", fontSize: "11px", color: "#747d94" }}>
                    📡 Emitting raw anomalous telemetry to Python ML Service every 10 seconds.
                  </p>
                </div>
              )}

              {injectionStatus === "completed" && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <p style={{ margin: 0, fontSize: "12px", color: "#35df9a" }}>
                    ✓ 6-record anomaly window completed! Telemetry automatically restored to 100% normal stream.
                  </p>
                  <button
                    onClick={handleReset}
                    style={{
                      background: "#1e293b",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#fff",
                      padding: "4px 12px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      cursor: "pointer"
                    }}
                  >
                    Inject Another
                  </button>
                </div>
              )}

              {injectionStatus === "pending" && (
                <p style={{ margin: 0, fontSize: "12px", color: "#f59e0b" }}>
                  ⏳ Submitting injection request to simulator engine...
                </p>
              )}
            </div>
          )}

          {/* STEP 1: STATION / CITY SELECTOR */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#8b97ff", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "8px" }}>
              1. Select Target Weather Station
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px" }}>
              {stations.map(st => {
                const sId = st.station_id || st.stationId;
                const isSelected = sId === selectedStationId;
                return (
                  <div
                    key={sId}
                    onClick={() => setSelectedStationId(sId)}
                    style={{
                      background: isSelected ? "rgba(104, 119, 255, 0.15)" : "#101522",
                      border: `1px solid ${isSelected ? "#6877ff" : "rgba(255,255,255,0.06)"}`,
                      borderRadius: "10px",
                      padding: "10px 14px",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong style={{ fontSize: "13px", color: isSelected ? "#fff" : "#c5cee0" }}>
                        {st.city || "AWS"}
                      </strong>
                      <span style={{ fontSize: "10px", color: isSelected ? "#35df9a" : "#747d94", fontWeight: "bold" }}>
                        {sId}
                      </span>
                    </div>
                    <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#747d94", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {st.station_name || "AWS Node"}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* STEP 2: SELECT ONE ANOMALY TYPE (9 SUPPORTED) */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#8b97ff", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "8px" }}>
              2. Select Anomaly Type (Choose 1 of 9)
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "10px" }}>
              {ANOMALY_CATALOG.map(anom => {
                const isSelected = anom.id === selectedAnomaly;
                return (
                  <div
                    key={anom.id}
                    onClick={() => setSelectedAnomaly(anom.id)}
                    style={{
                      background: isSelected ? "rgba(239, 61, 89, 0.12)" : "#101522",
                      border: `1px solid ${isSelected ? "#ef3d59" : "rgba(255,255,255,0.06)"}`,
                      borderRadius: "10px",
                      padding: "12px 14px",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <span style={{ fontSize: "16px" }}>{anom.icon}</span>
                      <span
                        style={{
                          fontSize: "9px",
                          fontWeight: "700",
                          letterSpacing: "0.5px",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          background: isSelected ? "rgba(239,61,89,0.25)" : "rgba(255,255,255,0.05)",
                          color: isSelected ? "#ff7b00" : "#747d94"
                        }}
                      >
                        {anom.badge}
                      </span>
                    </div>
                    <strong style={{ fontSize: "12px", color: isSelected ? "#fff" : "#c5cee0", display: "block" }}>
                      {anom.name}
                    </strong>
                    <p style={{ margin: "4px 0 0", fontSize: "10px", color: "#747d94", lineHeight: "1.4" }}>
                      {anom.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SPATIAL INCONSISTENCY DUAL-STATION EXPLANATION BANNER */}
          {selectedAnomaly === "spatial_inconsistency" && (
            <div
              style={{
                background: "rgba(104, 119, 255, 0.08)",
                border: "1px solid rgba(104, 119, 255, 0.25)",
                borderRadius: "10px",
                padding: "12px 16px",
                marginBottom: "20px"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <span style={{ fontSize: "14px" }}>📍</span>
                <strong style={{ fontSize: "12px", color: "#8b97ff" }}>
                  Dual-Station Spatial Pair in {currentCity} ({currentCluster})
                </strong>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "11px" }}>
                <div style={{ background: "rgba(239, 61, 89, 0.1)", border: "1px solid rgba(239,61,89,0.3)", padding: "8px 10px", borderRadius: "6px" }}>
                  <span style={{ color: "#ef3d59", fontWeight: "bold" }}>● Target (Anomalous):</span>
                  <div style={{ color: "#fff", marginTop: "2px" }}>{selectedStationId} ({currentStation?.station_name})</div>
                  <div style={{ color: "#747d94", fontSize: "10px" }}>Receives +16.5°C spatial deviation</div>
                </div>
                <div style={{ background: "rgba(53, 223, 154, 0.1)", border: "1px solid rgba(53,223,154,0.3)", padding: "8px 10px", borderRadius: "6px" }}>
                  <span style={{ color: "#35df9a", fontWeight: "bold" }}>● Reference (Normal):</span>
                  <div style={{ color: "#fff", marginTop: "2px" }}>
                    {companionStation ? `${companionStation.station_id || companionStation.stationId} (${companionStation.station_name})` : "IMD-DEL-002 (Delhi Ridge)"}
                  </div>
                  <div style={{ color: "#747d94", fontSize: "10px" }}>Maintains normal synchronized baseline</div>
                </div>
              </div>
              <p style={{ margin: "8px 0 0", fontSize: "10px", color: "#747d94" }}>
                Both stations stream simultaneously every 10 seconds. The ML engine detects spatial deviation against the neighbor consensus.
              </p>
            </div>
          )}

          {/* STEP 3: OPTIONAL PARAMETERS */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "20px" }}>
            {selectedAnomalyMeta.sensors.length > 1 && (
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#8b97ff", marginBottom: "6px" }}>
                  TARGET SENSOR CHANNEL
                </label>
                <select
                  value={selectedSensor}
                  onChange={(e) => setSelectedSensor(e.target.value)}
                  style={{ width: "100%", background: "#101522", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "8px 12px", borderRadius: "6px", fontSize: "12px" }}
                >
                  {selectedAnomalyMeta.sensors.map(s => (
                    <option key={s} value={s}>{s.toUpperCase()}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#8b97ff", marginBottom: "6px" }}>
                INJECTION INTENSITY
              </label>
              <select
                value={selectedIntensity}
                onChange={(e) => setSelectedIntensity(e.target.value)}
                style={{ width: "100%", background: "#101522", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "8px 12px", borderRadius: "6px", fontSize: "12px" }}
              >
                <option value="medium">Medium (Detectable)</option>
                <option value="high">High (Standard Benchmark)</option>
                <option value="extreme">Extreme (Severe Outlier)</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#8b97ff", marginBottom: "6px" }}>
                WINDOW DURATION
              </label>
              <div style={{ background: "#101522", border: "1px solid rgba(255,255,255,0.06)", color: "#c5cee0", padding: "8px 12px", borderRadius: "6px", fontSize: "12px" }}>
                6 Records (60 Seconds)
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#0a0e17"
          }}
        >
          <div style={{ fontSize: "11px", color: "#747d94" }}>
            Window: <strong>6 records</strong> (10s cadence = 60s total)
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={onClose}
              style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#c5cee0",
                padding: "8px 16px",
                borderRadius: "8px",
                fontSize: "12px",
                cursor: "pointer"
              }}
            >
              Close
            </button>

            <button
              onClick={handleTriggerInject}
              disabled={injectionStatus === "pending" || injectionStatus === "active"}
              style={{
                background: injectionStatus === "active"
                  ? "rgba(255, 123, 0, 0.3)"
                  : "linear-gradient(135deg, #ef3d59, #ff7b00)",
                border: "none",
                color: "#fff",
                fontWeight: "700",
                padding: "8px 20px",
                borderRadius: "8px",
                fontSize: "12px",
                cursor: injectionStatus === "active" ? "not-allowed" : "pointer",
                boxShadow: injectionStatus === "active" ? "none" : "0 0 20px rgba(239, 61, 89, 0.4)",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              {injectionStatus === "pending" ? "⏳ Submitting..." : (injectionStatus === "active" ? "⚡ Injection Active" : "⚡ Trigger 6-Record Injection")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InjectAnomalyModal;
