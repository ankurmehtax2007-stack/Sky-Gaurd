import React from "react";

function StationCard({ station, onView }) {
  const isOffline = station.status === "OFFLINE";

  return (
    <div className="station-card">
      <div className="station-card-top">
        <div className="station-icon">☁</div>

        <span className={`station-status ${station.status.toLowerCase()}`}>
          ● {station.status}
        </span>
      </div>

      <p className="station-id">{station.station_id}</p>

      <h2>{station.station_name}</h2>

      <p className="station-location">📍 {station.location}</p>

      {!isOffline && (
        <div className="station-readings">
          <div>
            <span>Temperature</span>
            <strong>{station.temperature}°C</strong>
          </div>

          <div>
            <span>Pressure</span>
            <strong>{station.pressure}</strong>
          </div>

          <div>
            <span>Humidity</span>
            <strong>{station.humidity}%</strong>
          </div>
        </div>
      )}

      <button className="station-button" onClick={onView}>
        View Station →
      </button>
    </div>
  );
}

export default StationCard;
