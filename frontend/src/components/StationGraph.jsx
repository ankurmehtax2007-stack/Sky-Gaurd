import React, { useState, useMemo } from "react";

const TIME_RANGES = [
  { label: "12 Hours", value: "12h", points: 12 },
  { label: "24 Hours", value: "24h", points: 24 },
  { label: "2 Days", value: "2d", points: 48 },
  { label: "5 Days", value: "5d", points: 120 }
];

const METRICS = [
  { key: "temperature", label: "Temperature", unit: "°C", icon: "🌡️", color: "#6877ff", gradStart: "rgba(104, 119, 255, 0.4)", gradEnd: "rgba(104, 119, 255, 0.0)" },
  { key: "humidity", label: "Humidity", unit: "%", icon: "💧", color: "#35df9a", gradStart: "rgba(53, 223, 154, 0.4)", gradEnd: "rgba(53, 223, 154, 0.0)" },
  { key: "pressure", label: "Barometric Pressure", unit: "hPa", icon: "◉", color: "#f59e0b", gradStart: "rgba(245, 158, 11, 0.4)", gradEnd: "rgba(245, 158, 11, 0.0)" }
];

function StationGraph({
  readings = [],
  stationName = "Weather Station",
  initialRange = "24h",
  initialMetric = "temperature"
}) {
  const [selectedRange, setSelectedRange] = useState(initialRange);
  const [selectedMetricKey, setSelectedMetricKey] = useState(initialMetric);
  const [hoverIndex, setHoverIndex] = useState(null);

  const activeMetric = useMemo(() => {
    return METRICS.find(m => m.key === selectedMetricKey) || METRICS[0];
  }, [selectedMetricKey]);

  const rangeConfig = useMemo(() => {
    return TIME_RANGES.find(r => r.value === selectedRange) || TIME_RANGES[1];
  }, [selectedRange]);

  // Extract sliced dataset for current timeframe
  const displayData = useMemo(() => {
    if (!Array.isArray(readings) || readings.length === 0) return [];
    
    // Slice according to selected range count (max 120 for 5d, 48 for 2d, 24 for 24h, 12 for 12h)
    const count = rangeConfig.points;
    const sliced = readings.slice(-count);

    return sliced.map((r, idx) => {
      let val = null;
      if (selectedMetricKey === "temperature") {
        val = r.temperature_c ?? r.temperature;
      } else if (selectedMetricKey === "humidity") {
        val = r.humidity_pct ?? r.humidity;
      } else if (selectedMetricKey === "pressure") {
        val = r.pressure_hpa ?? r.pressure;
      }

      const numVal = val !== undefined && val !== null && !isNaN(Number(val)) ? Number(val) : null;
      const ts = r.timestamp || r.createdAt || new Date().toISOString();

      return {
        index: idx,
        timestamp: ts,
        value: numVal,
        formattedTime: formatTimestamp(ts, selectedRange)
      };
    });
  }, [readings, rangeConfig, selectedMetricKey, selectedRange]);

  // Calculate dynamic min / max with padding
  const { minVal, maxVal, validValues } = useMemo(() => {
    const valid = displayData.filter(d => d.value !== null).map(d => d.value);
    if (valid.length === 0) {
      return { minVal: 0, maxVal: 100, validValues: [] };
    }
    const rawMin = Math.min(...valid);
    const rawMax = Math.max(...valid);

    let padding = (rawMax - rawMin) * 0.15;
    if (padding === 0) padding = 2;

    return {
      minVal: Math.floor(rawMin - padding),
      maxVal: Math.ceil(rawMax + padding),
      validValues: valid
    };
  }, [displayData]);

  // Generate SVG Path
  const { linePath, areaPath, points } = useMemo(() => {
    if (displayData.length === 0) return { linePath: "", areaPath: "", points: [] };

    const svgWidth = 800;
    const svgHeight = 220;
    const paddingX = 40;
    const paddingY = 20;
    const drawWidth = svgWidth - paddingX * 2;
    const drawHeight = svgHeight - paddingY * 2;
    const rangeY = maxVal - minVal || 1;

    const computedPoints = displayData.map((d, i) => {
      const x = displayData.length > 1
        ? paddingX + (i / (displayData.length - 1)) * drawWidth
        : paddingX + drawWidth / 2;
      
      const y = d.value !== null
        ? svgHeight - paddingY - ((d.value - minVal) / rangeY) * drawHeight
        : svgHeight - paddingY;

      return { x, y, data: d };
    });

    if (computedPoints.length === 1) {
      const p = computedPoints[0];
      return {
        linePath: `M${p.x - 10} ${p.y} L${p.x + 10} ${p.y}`,
        areaPath: `M${p.x - 10} ${p.y} L${p.x + 10} ${p.y} L${p.x + 10} ${svgHeight} L${p.x - 10} ${svgHeight} Z`,
        points: computedPoints
      };
    }

    let dLine = `M ${computedPoints[0].x} ${computedPoints[0].y}`;
    for (let i = 1; i < computedPoints.length; i++) {
      const prev = computedPoints[i - 1];
      const curr = computedPoints[i];
      const cpX1 = prev.x + (curr.x - prev.x) / 2;
      const cpY1 = prev.y;
      const cpX2 = prev.x + (curr.x - prev.x) / 2;
      const cpY2 = curr.y;
      dLine += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${curr.x} ${curr.y}`;
    }

    const firstPoint = computedPoints[0];
    const lastPoint = computedPoints[computedPoints.length - 1];
    const dArea = `${dLine} L ${lastPoint.x} ${svgHeight - paddingY} L ${firstPoint.x} ${svgHeight - paddingY} Z`;

    return { linePath: dLine, areaPath: dArea, points: computedPoints };
  }, [displayData, minVal, maxVal]);

  const currentReading = displayData.length > 0 && displayData[displayData.length - 1].value !== null
    ? `${displayData[displayData.length - 1].value.toFixed(1)} ${activeMetric.unit}`
    : "N/A";

  const minReading = validValues.length > 0 ? `${Math.min(...validValues).toFixed(1)} ${activeMetric.unit}` : "N/A";
  const maxReading = validValues.length > 0 ? `${Math.max(...validValues).toFixed(1)} ${activeMetric.unit}` : "N/A";
  const avgReading = validValues.length > 0 ? `${(validValues.reduce((a, b) => a + b, 0) / validValues.length).toFixed(1)} ${activeMetric.unit}` : "N/A";

  return (
    <div style={{ background: "#0e1320", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.07)", padding: "20px", marginTop: "16px" }}>
      {/* HEADER CONTROLS: METRIC TABS + TIMEFRAME DROPDOWN */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "18px" }}>
        {/* Metric Selector Tabs */}
        <div style={{ display: "flex", gap: "6px" }}>
          {METRICS.map(m => {
            const isActive = m.key === selectedMetricKey;
            return (
              <button
                key={m.key}
                onClick={() => setSelectedMetricKey(m.key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: "600",
                  cursor: "pointer",
                  border: `1px solid ${isActive ? m.color : "rgba(255,255,255,0.08)"}`,
                  background: isActive ? `${m.color}20` : "#101522",
                  color: isActive ? m.color : "#747d94",
                  transition: "all 0.2s ease"
                }}
              >
                <span>{m.icon}</span>
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Time Range Dropdown */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "11px", color: "#747d94", textTransform: "uppercase", letterSpacing: "0.5px" }}>Time Range:</span>
          <select
            value={selectedRange}
            onChange={(e) => setSelectedRange(e.target.value)}
            style={{
              background: "#101522",
              border: "1px solid rgba(104, 119, 255, 0.4)",
              color: "#f5f7ff",
              padding: "6px 12px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            {TIME_RANGES.map(tr => (
              <option key={tr.value} value={tr.value}>
                {tr.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* STATS LEGEND BAR */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#101522", padding: "10px 16px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.04)", marginBottom: "14px", fontSize: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: activeMetric.color, display: "inline-block", boxShadow: `0 0 8px ${activeMetric.color}` }}></span>
          <strong style={{ color: "#f5f7ff" }}>{stationName} · {activeMetric.label}</strong>
          <span style={{ color: "#747d94" }}>({displayData.length} records in {rangeConfig.label})</span>
        </div>

        <div style={{ display: "flex", gap: "16px", fontSize: "11px" }}>
          <span>Latest: <strong style={{ color: activeMetric.color }}>{currentReading}</strong></span>
          <span style={{ color: "rgba(255,255,255,0.1)" }}>|</span>
          <span>Min: <strong style={{ color: "#c5cee0" }}>{minReading}</strong></span>
          <span style={{ color: "rgba(255,255,255,0.1)" }}>|</span>
          <span>Max: <strong style={{ color: "#c5cee0" }}>{maxReading}</strong></span>
          <span style={{ color: "rgba(255,255,255,0.1)" }}>|</span>
          <span>Avg: <strong style={{ color: "#c5cee0" }}>{avgReading}</strong></span>
        </div>
      </div>

      {/* GRAPH CANVAS & Y-AXIS */}
      {displayData.length === 0 ? (
        <div style={{ padding: "60px 20px", textAlign: "center", color: "#747d94", fontSize: "13px" }}>
          <p style={{ margin: "0 0 6px", fontSize: "20px" }}>⏳</p>
          N/A — Waiting for telemetry stream to populate station records...
        </div>
      ) : (
        <div style={{ display: "flex", gap: "10px", position: "relative" }}>
          {/* Y-Axis Labels */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "220px", fontSize: "10px", color: "#747d94", textAlign: "right", minWidth: "55px", padding: "10px 0" }}>
            <span>{maxVal.toFixed(0)} {activeMetric.unit}</span>
            <span>{((maxVal + minVal) / 2).toFixed(0)} {activeMetric.unit}</span>
            <span>{minVal.toFixed(0)} {activeMetric.unit}</span>
          </div>

          {/* SVG Chart */}
          <div style={{ flex: 1, position: "relative" }}>
            <svg
              viewBox="0 0 800 220"
              style={{ width: "100%", height: "220px", overflow: "visible" }}
              preserveAspectRatio="none"
              onMouseLeave={() => setHoverIndex(null)}
            >
              <defs>
                <linearGradient id={`grad-${selectedMetricKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={activeMetric.color} stopOpacity="0.35" />
                  <stop offset="100%" stopColor={activeMetric.color} stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="40" y1="20" x2="760" y2="20" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
              <line x1="40" y1="110" x2="760" y2="110" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
              <line x1="40" y1="200" x2="760" y2="200" stroke="rgba(255,255,255,0.05)" />

              {/* Gradient Fill Area */}
              {areaPath && <path d={areaPath} fill={`url(#grad-${selectedMetricKey})`} />}

              {/* Line Stroke */}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke={activeMetric.color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Data Points on Hover */}
              {points.map((p, idx) => (
                <circle
                  key={idx}
                  cx={p.x}
                  cy={p.y}
                  r={hoverIndex === idx ? 6 : 3}
                  fill={hoverIndex === idx ? "#fff" : activeMetric.color}
                  stroke={activeMetric.color}
                  strokeWidth={hoverIndex === idx ? 3 : 1}
                  style={{ cursor: "pointer", transition: "r 0.15s ease" }}
                  onMouseEnter={() => setHoverIndex(idx)}
                />
              ))}
            </svg>

            {/* Hover Tooltip Card */}
            {hoverIndex !== null && points[hoverIndex] && (
              <div
                style={{
                  position: "absolute",
                  left: `${(points[hoverIndex].x / 800) * 100}%`,
                  top: `${Math.max(10, points[hoverIndex].y - 50)}px`,
                  transform: "translateX(-50%)",
                  background: "#101522",
                  border: `1px solid ${activeMetric.color}`,
                  padding: "6px 10px",
                  borderRadius: "6px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                  pointerEvents: "none",
                  zIndex: 10,
                  whiteSpace: "nowrap"
                }}
              >
                <div style={{ fontSize: "10px", color: "#747d94" }}>{points[hoverIndex].data.formattedTime}</div>
                <div style={{ fontSize: "12px", fontWeight: "bold", color: "#f5f7ff" }}>
                  {points[hoverIndex].data.value !== null ? `${points[hoverIndex].data.value.toFixed(1)} ${activeMetric.unit}` : "N/A"}
                </div>
              </div>
            )}

            {/* X-Axis Timestamps */}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 20px 0", fontSize: "10px", color: "#747d94" }}>
              {getXAxisLabels(displayData, selectedRange).map((lbl, idx) => (
                <span key={idx}>{lbl}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatTimestamp(isoStr, range) {
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return "N/A";
    if (range === "12h" || range === "24h") {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
    }
    return `${d.getDate()} ${d.toLocaleString("en-US", { month: "short" })} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}`;
  } catch {
    return "N/A";
  }
}

function getXAxisLabels(data, range) {
  if (data.length === 0) return [];
  if (data.length <= 6) return data.map(d => d.formattedTime);

  const step = Math.floor((data.length - 1) / 5);
  const labels = [];
  for (let i = 0; i < data.length; i += step) {
    labels.push(data[i].formattedTime);
    if (labels.length === 5) break;
  }
  if (labels.length < 6) {
    labels.push(data[data.length - 1].formattedTime);
  }
  return labels;
}

export default StationGraph;
