import React from "react";

function StationCard({ station, onView }) {
  const isOffline = station.status === "OFFLINE";
  const sId = station.station_id || station.stationId || "AWS-001";
  const sName = station.station_name || "AWS Node";
  const sLoc = station.location || station.city || "India";
  const temp = station.temperature !== undefined ? `${Number(station.temperature).toFixed(1)}°C` : "N/A";
  const press = station.pressure !== undefined ? `${Number(station.pressure).toFixed(1)} hPa` : "N/A";
  const hum = station.humidity !== undefined ? `${Number(station.humidity).toFixed(1)}%` : "N/A";
  const status = station.status || "ONLINE";

  return (
    <div className="station-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <div>
        <div className="station-card-top">
          <div className="station-icon" style={{ background: "linear-gradient(135deg, #6877ff, #35df9a)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "8px", width: "32px", height: "32px" }}>
            ☁
          </div>

          <span className={`station-status ${status.toLowerCase()}`}>
            ● {status}
          </span>
        </div>

        <p className="station-id" style={{ marginTop: "10px" }}>{sId}</p>

        <h2 style={{ fontSize: "16px", marginBottom: "4px" }}>{sName}</h2>

        <p className="station-location" style={{ fontSize: "12px", color: "#747d94", marginBottom: "14px" }}>
          📍 {sLoc} · {station.cluster || "Regional"}
        </p>

        {!isOffline ? (
          <div className="station-readings" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", background: "#0b0f19", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.04)", marginBottom: "16px" }}>
            <div>
              <span style={{ fontSize: "10px", color: "#747d94", display: "block" }}>Temp</span>
              <strong style={{ fontSize: "13px", color: "#f5f7ff" }}>{temp}</strong>
            </div>

            <div>
              <span style={{ fontSize: "10px", color: "#747d94", display: "block" }}>Pressure</span>
              <strong style={{ fontSize: "13px", color: "#f5f7ff" }}>{press}</strong>
            </div>

            <div>
              <span style={{ fontSize: "10px", color: "#747d94", display: "block" }}>Humidity</span>
              <strong style={{ fontSize: "13px", color: "#f5f7ff" }}>{hum}</strong>
            </div>
          </div>
        ) : (
          <div style={{ padding: "12px", background: "rgba(239, 61, 89, 0.08)", color: "#ef3d59", borderRadius: "8px", fontSize: "11px", marginBottom: "16px" }}>
            ⚠️ Station is currently offline.
          </div>
        )}
      </div>

      <button className="station-button" onClick={onView} style={{ width: "100%", padding: "8px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>
        View Details & 10-Day Charts →
      </button>
    </div>
  );
}

export default StationCard;
