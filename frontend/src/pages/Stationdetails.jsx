import React from "react";

function StationDetails({ station, setActivePage }) {

  if (!station) {
    return <p>No station selected.</p>;
  }

  return (
    <div className="page">

      <button
        className="back-button"
        onClick={() => setActivePage("stations")}
      >
        ← Back to Stations
      </button>


      <div className="station-detail-header">

        <div>

          <p className="eyebrow">
            {station.station_id}
          </p>

          <h1>
            {station.station_name}
          </h1>

          <p>{station.location}</p>

        </div>

        <span
          className={`station-badge ${station.status.toLowerCase()}`}
        >
          ● {station.status}
        </span>

      </div>


      {station.status === "OFFLINE" ? (

        <div className="offline-box">
          ⚠ This station is currently offline.
        </div>

      ) : (

        <>
          <div className="condition-grid">

            <div className="condition-card temperature">
              <span>🌡</span>
              <small>Temperature</small>
              <strong>{station.temperature}°C</strong>
              <p>Current reading</p>
            </div>

            <div className="condition-card humidity">
              <span>💧</span>
              <small>Humidity</small>
              <strong>{station.humidity}%</strong>
              <p>Current reading</p>
            </div>

            <div className="condition-card pressure">
              <span>◉</span>
              <small>Pressure</small>
              <strong>{station.pressure} hPa</strong>
              <p>Current reading</p>
            </div>

          </div>


          <div className="chart-placeholder">

            <h2>Sensor Trends</h2>

            <p>
              Temperature / Humidity / Pressure historical
              data will appear here.
            </p>

            <div className="graph-placeholder">
              Temperature Trend
              <br />
              ╱╲___╱╲____╱╲
            </div>

          </div>

        </>

      )}

    </div>
  );
}

export default StationDetails;