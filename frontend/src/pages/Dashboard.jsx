import React from "react";
import { stations, alerts } from "../data/mockData";

function Dashboard({ setActivePage, setSelectedAlert }) {

  const onlineStations = stations.filter(
    (station) => station.status === "ONLINE"
  ).length;

  const activeAlerts = alerts.length;

  const averageTemperature =
    stations
      .filter((station) => station.status !== "OFFLINE")
      .reduce((sum, station) => sum + station.temperature, 0) /
    stations.filter((station) => station.status !== "OFFLINE").length;

  return (
    <div className="page">

      <div className="page-heading">
        <div>
          <p className="eyebrow">REAL-TIME MONITORING</p>

          <h1>
            Weather <span>Overview</span>
          </h1>

          <p>
            Monitor your Automatic Weather Station network.
          </p>
        </div>
      </div>


      {/* MAIN STATS */}

      <div className="stats-grid">

        <div className="stat-card">
          <div className="stat-icon purple">◉</div>

          <div>
            <small>Total Stations</small>
            <h2>{stations.length}</h2>
          </div>
        </div>


        <div className="stat-card">
          <div className="stat-icon green">●</div>

          <div>
            <small>Online Stations</small>
            <h2>{onlineStations}</h2>
          </div>
        </div>


        <div className="stat-card">
          <div className="stat-icon red">🚨</div>

          <div>
            <small>Active Alerts</small>
            <h2>{activeAlerts}</h2>
          </div>
        </div>


        <div className="stat-card">
          <div className="stat-icon orange">°</div>

          <div>
            <small>Avg Temperature</small>
            <h2>{averageTemperature.toFixed(1)}°C</h2>
          </div>
        </div>

      </div>


      {/* CURRENT CONDITIONS */}

      <div className="section-title">
        <h2>Current Conditions</h2>

        <button
          onClick={() => setActivePage("stations")}
        >
          View Stations →
        </button>
      </div>


      <div className="condition-grid">

        <div className="condition-card temperature">
          <span>🌡</span>
          <small>Temperature</small>
          <strong>28.6°C</strong>
          <p>Normal</p>
        </div>


        <div className="condition-card pressure">
          <span>◉</span>
          <small>Pressure</small>
          <strong>1012 hPa</strong>
          <p>Normal</p>
        </div>


        <div className="condition-card humidity">
          <span>💧</span>
          <small>Humidity</small>
          <strong>67%</strong>
          <p>Normal</p>
        </div>


        <div className="condition-card wind">
          <span>〰</span>
          <small>Wind Speed</small>
          <strong>12 km/h</strong>
          <p>Light breeze</p>
        </div>

      </div>


      {/* ALERTS */}

      <div className="section-title">
        <h2>Critical Alerts</h2>

        <button
          onClick={() => setActivePage("alerts")}
        >
          View All →
        </button>
      </div>


      <div className="dashboard-alerts">

        {alerts.map((alert) => (

          <div
            className={`dashboard-alert ${alert.severity.toLowerCase()}`}
            key={alert.anomaly_id}
          >

            <div className="alert-icon">
              🚨
            </div>

            <div className="alert-information">

              <strong>{alert.title}</strong>

              <p>
                {alert.station_name} ·{" "}
                {alert.readings.temperature}°C
              </p>

            </div>

            <div className="alert-confidence">

              <span>{alert.severity}</span>

              <small>
                {Math.round(alert.confidence * 100)}% confidence
              </small>

            </div>

            <button
              onClick={() => {
                setSelectedAlert(alert);
                setActivePage("alertDetails");
              }}
            >
              View →
            </button>

          </div>

        ))}

      </div>

    </div>
  );
}

export default Dashboard;