import React from "react";

function AlertDetails({ alert, setActivePage }) {
  if (!alert) {
    return (
      <div className="empty-state">
        <h2>No alert selected</h2>
        <button onClick={() => setActivePage("alerts")}>Go to Alerts</button>
      </div>
    );
  }

  return (
    <>
      <button className="back-button" onClick={() => setActivePage("alerts")}>
        ← Back to Alerts
      </button>

      {/* HEADER */}
      <div className="report-header">
        <div>
          <p className="eyebrow">ANOMALY REPORT · {alert.anomaly_id}</p>
          <h1>{alert.title}</h1>
          <p>
            {alert.station_name} · {alert.station_id}
          </p>
        </div>

        <div className={`report-severity ${alert.severity.toLowerCase()}`}>
          🚨
          <strong>{alert.severity}</strong>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="report-box">
        <h2>Incident Summary</h2>
        <p>
          An abnormal reading was detected at the station. The anomaly
          detector produced a score of {alert.anomaly_score} and the model
          identified <strong>{alert.root_cause}</strong> with{" "}
          <strong>{Math.round(alert.confidence * 100)}%</strong> confidence.
        </p>
      </div>

      {/* SENSOR STATUS */}
      <h2 className="report-section-title">Sensor Status</h2>

      <div className="sensor-status-grid">
        {Object.entries(alert.sensor_status).map(([sensor, value]) => (
          <div key={sensor}>
            <span>{sensor}</span>
            <strong className={value === "ABNORMAL" ? "abnormal" : "normal-text"}>
              {value}
            </strong>
          </div>
        ))}
      </div>

      {/* READINGS */}
      <h2 className="report-section-title">Sensor Readings</h2>

      <div className="reading-report-grid">
        <div>
          🌡
          <span>Temperature</span>
          <strong>{alert.readings.temperature}°C</strong>
        </div>

        <div>
          💧
          <span>Humidity</span>
          <strong>{alert.readings.humidity}%</strong>
        </div>

        <div>
          ◉
          <span>Pressure</span>
          <strong>{alert.readings.pressure} hPa</strong>
        </div>
      </div>

      {/* DIAGNOSIS */}
      <div className="two-column-report">
        <div className="report-box">
          <h2>AI Diagnosis</h2>

          <p>Root Cause</p>
          <strong className="cause">{alert.root_cause}</strong>

          <p>Model Confidence</p>
          <strong className="confidence-big">
            {Math.round(alert.confidence * 100)}%
          </strong>
        </div>

        <div className="report-box">
          <h2>SHAP Evidence</h2>

          {alert.shap_explanation.map((item) => (
            <div className="shap-row" key={item.feature}>
              <span>{item.feature}</span>

              <div className="shap-bar">
                <div style={{ width: `${item.impact * 100}%` }} />
              </div>

              <strong>{item.impact}</strong>
            </div>
          ))}
        </div>
      </div>

      {/* EVIDENCE */}
      <div className="report-box">
        <h2>Evidence</h2>
        <ul className="evidence-list">
          {alert.evidence.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>

      {/* ACTIONS */}
      <div className="report-box action-box">
        <h2>Recommended Actions</h2>

        {alert.recommended_actions.map((action, index) => (
          <div className="action-item" key={index}>
            <span>{index + 1}</span>
            <p>{action}</p>
          </div>
        ))}
      </div>

      {/* UNCERTAINTY */}
      <div className="uncertainty">
        <strong>Model Uncertainty</strong>
        <p>{alert.uncertainty}</p>
      </div>
    </>
  );
}

export default AlertDetails;
