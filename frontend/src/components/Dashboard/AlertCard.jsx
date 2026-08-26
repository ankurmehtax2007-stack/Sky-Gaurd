function AlertCard({ alert }) {
  return (
    <div className="alert-card">
      <div className="alert-icon">🚨</div>

      <div className="alert-content">
        <div className="alert-header">
          <h3>{alert.title}</h3>

          <span className="severity">
            {alert.severity}
          </span>
        </div>

        <p>{alert.stationName}</p>

        <div className="alert-info">
          <span>
            Score: {alert.anomalyScore}
          </span>

          <span>
            Confidence: {alert.confidence * 100}%
          </span>
        </div>
      </div>
    </div>
  );
}

export default AlertCard;