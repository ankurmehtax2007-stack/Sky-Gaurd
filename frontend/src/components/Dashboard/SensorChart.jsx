function SensorChart({ title, values, unit }) {
  const max = Math.max(...values);
  const min = Math.min(...values);

  return (
    <div className="chart-card">
      <div className="chart-header">
        <h3>{title}</h3>
        <span>{unit}</span>
      </div>

      <div className="chart">
        {values.map((value, index) => {
          const height =
            ((value - min) / (max - min || 1)) * 100;

          return (
            <div className="chart-column" key={index}>
              <div
                className="chart-bar"
                style={{ height: `${height + 10}%` }}
              />

              <small>{index + 1}</small>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SensorChart;