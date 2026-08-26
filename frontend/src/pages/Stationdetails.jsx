import React from "react";
import TemperatureChart from "../components/TemperatureChart";

function StationDetails({ station, setActivePage }) {
  if (!station) {
    return (
      <div className="empty-state">
        <h2>No station selected</h2>
        <button onClick={() => setActivePage("stations")}>Go to Stations</button>
      </div>
    );
  }

  const isOffline = station.status === "OFFLINE";

  return (
    <>
      <button className="back-button" onClick={() => setActivePage("stations")}>
        ← Back to Stations
      </button>

      <div className="station-detail-header">
        <div>
          <p className="eyebrow">STATION DETAILS</p>
          <h1>{station.station_name}</h1>
          <p>
            {station.location} · {station.station_id}
          </p>
        </div>

        <span className={`station-status ${station.status.toLowerCase()}`}>
          ● {station.status}
        </span>
      </div>

      {isOffline ? (
        <div className="offline-box">⚠ This station is currently offline.</div>
      ) : (
        <>
          <div className="detail-grid">
            <div className="detail-card">
              <span>🌡</span>
              <p>Temperature</p>
              <strong>{station.temperature}°C</strong>
            </div>

            <div className="detail-card">
              <span>◉</span>
              <p>Pressure</p>
              <strong>{station.pressure} hPa</strong>
            </div>

            <div className="detail-card">
              <span>💧</span>
              <p>Humidity</p>
              <strong>{station.humidity}%</strong>
            </div>
          </div>

          <div className="detail-chart-card">
            <div className="section-title">
              <div>
                <h2>Station Temperature</h2>
                <p>Temperature variation over the last 24 hours</p>
              </div>
            </div>

            <TemperatureChart size="large" />
          </div>
        </>
      )}
    </>
  );
}

export default StationDetails;
