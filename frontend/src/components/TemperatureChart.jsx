import React from "react";

const SMALL_PATH =
  "M0 170 C40 150, 70 160, 100 145 S150 120, 180 140 S230 180, 260 155 S310 100, 340 125 S390 150, 420 115 S470 80, 500 105 S550 135, 580 90 S630 65, 660 95 S720 120, 750 65 S780 45, 800 55";

const LARGE_PATH =
  "M0 220 C70 200, 100 210, 150 180 S230 160, 270 190 S350 120, 400 150 S470 110, 520 135 S600 90, 650 125 S720 80, 760 105 S830 60, 900 80";

function TemperatureChart({ size = "small" }) {
  if (size === "large") {
    return (
      <div className="big-chart">
        <svg viewBox="0 0 900 300" preserveAspectRatio="none">
          <path d={LARGE_PATH} className="chart-line" />
        </svg>
      </div>
    );
  }

  return (
    <div className="chart-card">
      <div className="chart-y-axis">
        <span>50°</span>
        <span>40°</span>
        <span>30°</span>
        <span>20°</span>
        <span>10°</span>
      </div>

      <div className="chart">
        <div className="grid-line line1"></div>
        <div className="grid-line line2"></div>
        <div className="grid-line line3"></div>
        <div className="grid-line line4"></div>

        <svg viewBox="0 0 800 250" preserveAspectRatio="none">
          <defs>
            <linearGradient id="temperatureGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopOpacity="0.35" />
              <stop offset="100%" stopOpacity="0" />
            </linearGradient>
          </defs>

          <path d={`${SMALL_PATH} L800 250 L0 250 Z`} className="chart-area" />
          <path d={SMALL_PATH} className="chart-line" />
        </svg>

        <div className="chart-labels">
          <span>12 AM</span>
          <span>4 AM</span>
          <span>8 AM</span>
          <span>12 PM</span>
          <span>4 PM</span>
          <span>8 PM</span>
          <span>Now</span>
        </div>
      </div>
    </div>
  );
}

export default TemperatureChart;
