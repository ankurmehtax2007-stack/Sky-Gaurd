import React from "react";
import StationGraph from "./StationGraph";

function TemperatureChart({ readings = [], stationName = "Weather Station", initialRange = "24h" }) {
  return (
    <StationGraph
      readings={readings}
      stationName={stationName}
      initialRange={initialRange}
      initialMetric="temperature"
    />
  );
}

export default TemperatureChart;
