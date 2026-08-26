function SensorCard({ icon, title, value, unit, status }) {
  return (
    <div className="sensor-card">
      <div className="sensor-icon">{icon}</div>

      <div>
        <p className="sensor-title">{title}</p>

        <h2>
          {value}
          <span>{unit}</span>
        </h2>

        <p className={`sensor-status ${status?.toLowerCase()}`}>
          ● {status}
        </p>
      </div>
    </div>
  );
}

export default SensorCard;