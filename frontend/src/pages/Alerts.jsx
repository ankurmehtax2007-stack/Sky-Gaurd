import React from "react";
import { alerts } from "../data/mockData";

function Alerts({ setActivePage, setSelectedAlert }) {

  return (
    <div className="page">

      <div className="page-heading">

        <p className="eyebrow">
          AI ANOMALY DETECTION
        </p>

        <h1>
          Anomaly <span>Alerts</span>
        </h1>

        <p>
          Detected abnormal conditions across the station network.
        </p>

      </div>


      <div className="alert-list">

        {alerts.map((alert) => (

          <div
            className={`large-alert ${alert.severity.toLowerCase()}`}
            key={alert.anomaly_id}
          >

            <div className="large-alert-icon">
              🚨
            </div>


            <div className="large-alert-content">

              <div className="alert-title-row">

                <h2>{alert.title}</h2>

                <span className="severity-badge">
                  {alert.severity}
                </span>

              </div>

              <p>
                {alert.station_name} · {alert.station_id}
              </p>

              <div className="alert-mini-info">

                <span>
                  Anomaly score:{" "}
                  <strong>
                    {alert.anomaly_score}
                  </strong>
                </span>

                <span>
                  Confidence:{" "}
                  <strong>
                    {Math.round(alert.confidence * 100)}%
                  </strong>
                </span>

                <span>
                  Cause:{" "}
                  <strong>
                    {alert.root_cause}
                  </strong>
                </span>

              </div>

            </div>


            <button
              onClick={() => {
                setSelectedAlert(alert);
                setActivePage("alertDetails");
              }}
            >
              View Report →
            </button>

          </div>

        ))}

      </div>

    </div>
  );
}

export default Alerts;