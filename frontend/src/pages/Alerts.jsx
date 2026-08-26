import React from "react";
import { alerts } from "../data/mockData";
import LargeAlertCard from "../components/LargeAlertCard";

function Alerts({ setActivePage, setSelectedAlert }) {
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">ANOMALY MONITORING</p>
          <h1>
            Active <span>Alerts</span>
          </h1>
          <p className="subtitle">
            AI-detected anomalies across your weather stations.
          </p>
        </div>
      </div>

      <div className="alert-page-list">
        {alerts.map((alert) => (
          <LargeAlertCard
            key={alert.anomaly_id}
            alert={alert}
            onInvestigate={() => {
              setSelectedAlert(alert);
              setActivePage("alertDetails");
            }}
          />
        ))}
      </div>
    </>
  );
}

export default Alerts;
