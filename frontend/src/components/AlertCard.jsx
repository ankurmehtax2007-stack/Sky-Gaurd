import React from "react";

function AlertCard({ alert, onView }) {
  return (
    <div className={`alert-card ${alert.severity.toLowerCase()}`}>
      <div className="alert-icon">🚨</div>

      <div className="alert-info">
        <h3>{alert.title}</h3>
        <p>
          {alert.station_name} · {alert.readings.temperature}°C
        </p>
      </div>

      <div className="alert-confidence">
        <strong>{alert.severity}</strong>
        <span>{Math.round(alert.confidence * 100)}% confidence</span>
      </div>

      <button className="alert-button" onClick={onView}>
        View →
      </button>
    </div>
  );
}

export default AlertCard;
