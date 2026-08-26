function StationCard({ station, onClick }) {
  return (
    <div className="station-card">

      <div className="station-card-top">
        <div className="station-icon">
          📍
        </div>

        <span className={`station-status ${station.status.toLowerCase()}`}>
          ● {station.status}
        </span>
      </div>

      <h3>{station.name}</h3>

      <p className="station-location">
        {station.location}
      </p>

      <div className="station-readings">

        <div>
          <span>🌡️</span>
          <strong>{station.temperature}°C</strong>
          <small>Temperature</small>
        </div>

        <div>
          <span>💧</span>
          <strong>{station.humidity}%</strong>
          <small>Humidity</small>
        </div>

        <div>
          <span>◉</span>
          <strong>{station.pressure}</strong>
          <small>hPa</small>
        </div>

      </div>

      <button
        className="view-station-btn"
        onClick={() => onClick(station.id)}
      >
        View Station →
      </button>

    </div>
  );
}

export default StationCard;