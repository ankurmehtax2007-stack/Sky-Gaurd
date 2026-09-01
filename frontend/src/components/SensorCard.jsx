import React from "react";

function SensorCard({ type, icon, label, value, status = "Normal" }) {
  return (
    <div className={`sensor-card ${type}`}>
      <div className="sensor-top">
        <div className="sensor-symbol">{icon}</div>
        <span className="status-dot green-dot"></span>
      </div>

      <p>{label}</p>
      <h3>{value}</h3>
      <span className="normal">{status}</span>
    </div>
  );
}

export default SensorCard;
