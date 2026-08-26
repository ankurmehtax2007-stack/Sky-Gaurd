import React from "react";
import { stations, alerts } from "../data/mockData";
import SensorCard from "../components/SensorCard";
import AlertCard from "../components/AlertCard";
import TemperatureChart from "../components/TemperatureChart";

function Dashboard({ setActivePage, setSelectedAlert }) {
  const onlineStations = stations.filter((s) => s.status !== "OFFLINE").length;

  const activeStations = stations.filter((s) => s.status !== "OFFLINE");
  const avgTemperature =
    activeStations.reduce((sum, s) => sum + s.temperature, 0) /
    activeStations.length;

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">REAL-TIME MONITORING</p>
          <h1>
            Weather <span>Overview</span>
          </h1>
          <p className="subtitle">
            Monitor your Automatic Weather Station network.
          </p>
        </div>

        <div className="date-box">
          <span>Today</span>
          <strong>26 Aug 2026</strong>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="summary-grid">
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
            <p>Online Stations</p>
            <h2>{onlineStations}</h2>
          </div>
        </div>

        <div className="summary-card red">
          <div className="summary-icon">🚨</div>
          <div>
            <p>Active Alerts</p>
            <h2>{alerts.length}</h2>
          </div>
        </div>

        <div className="summary-card orange">
          <div className="summary-icon">°</div>
          <div>
            <p>Avg Temperature</p>
            <h2>{avgTemperature.toFixed(1)}°C</h2>
          </div>
        </div>
      </div>

      {/* CURRENT CONDITIONS */}
      <section className="section">
        <div className="section-title">
          <div>
            <h2>Current Conditions</h2>
            <p>Latest readings across the network</p>
          </div>
        </div>

        <div className="sensor-grid">
          <SensorCard type="temperature" icon="🌡" label="Temperature" value="28.6°C" />
          <SensorCard type="pressure" icon="◉" label="Pressure" value="1012 hPa" />
          <SensorCard type="humidity" icon="💧" label="Humidity" value="67%" />
          <SensorCard type="wind" icon="〰" label="Wind Speed" value="12 km/h" status="Light Breeze" />
        </div>
      </section>

      {/* GRAPH */}
      <section className="section">
        <div className="section-title">
          <div>
            <h2>Temperature Trend</h2>
            <p>Last 24 hours</p>
          </div>

          <button className="small-button">24 Hours ▾</button>
        </div>

        <TemperatureChart size="small" />
      </section>

      {/* ALERTS */}
      <section className="section">
        <div className="section-title">
          <div>
            <h2>Critical Alerts</h2>
            <p>Recent anomalies detected by SkyGuard</p>
          </div>

          <button className="view-all" onClick={() => setActivePage("alerts")}>
            View All →
          </button>
        </div>

        <div className="alerts-list">
          {alerts.map((alert) => (
            <AlertCard
              key={alert.anomaly_id}
              alert={alert}
              onView={() => {
                setSelectedAlert(alert);
                setActivePage("alertDetails");
              }}
            />
          ))}
        </div>
      </section>
    </>
  );
}

export default Dashboard;
