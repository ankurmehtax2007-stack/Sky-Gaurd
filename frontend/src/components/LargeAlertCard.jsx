import React from "react";

function LargeAlertCard({ alert, onInvestigate }) {
  return (
    <div className={`large-alert ${alert.severity.toLowerCase()}`}>
      <div className="large-alert-icon">🚨</div>

      <div className="large-alert-content">
        <div className="large-alert-heading">
          <span className={`severity ${alert.severity.toLowerCase()}`}>
            {alert.severity}
          </span>
          <span>{alert.anomaly_id}</span>
        </div>

        <h2>{alert.title}</h2>

        <p>
          <strong>{alert.station_name}</strong> · Current reading{" "}
          <strong>{alert.readings.temperature}°C</strong>
        </p>

        <p className="alert-description">{alert.evidence[0]}</p>

        <div className="alert-actions">
          <span>
            Model confidence: <strong>{Math.round(alert.confidence * 100)}%</strong>
          </span>

          <button onClick={onInvestigate}>Investigate →</button>
        </div>
      </div>
    </div>
  );
}

export default LargeAlertCard;
