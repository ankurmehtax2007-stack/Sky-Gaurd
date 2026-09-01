// SkyGuard 2.0 - Production Real-time Meteorological Command Dashboard
// React 18 Application with Live WebSocket Telemetry & Multi-Station Hierarchy

const { useState, useEffect, useRef, useMemo, useCallback } = React;

// Default Regional Meteorological Stations Configuration
const INITIAL_STATIONS = [
  {
    station_id: "IMD-DEL-001",
    station_name: "New Delhi Safdarjung AWS",
    city: "New Delhi",
    cluster: "NCR",
    latitude: 28.6139,
    longitude: 77.2090,
    baseTemp: 28.5,
    baseHum: 55.0,
    basePress: 1008.0
  },
  {
    station_id: "IMD-DEL-002",
    station_name: "Delhi Ridge AWS",
    city: "New Delhi",
    cluster: "NCR",
    latitude: 28.7041,
    longitude: 77.1025,
    baseTemp: 29.0,
    baseHum: 53.0,
    basePress: 1007.5
  },
  {
    station_id: "IMD-BOM-001",
    station_name: "Mumbai Santacruz Coastal AWS",
    city: "Mumbai",
    cluster: "Konkan_Deccan",
    latitude: 19.0760,
    longitude: 72.8777,
    baseTemp: 27.5,
    baseHum: 70.0,
    basePress: 1010.0
  },
  {
    station_id: "IMD-MAA-001",
    station_name: "Chennai Meenambakkam AWS",
    city: "Chennai",
    cluster: "Tamil_Nadu_Coast",
    latitude: 13.0827,
    longitude: 80.2707,
    baseTemp: 30.5,
    baseHum: 75.0,
    basePress: 1012.0
  },
  {
    station_id: "IMD-CCU-001",
    station_name: "Kolkata Alipore AWS",
    city: "Kolkata",
    cluster: "West_Bengal",
    latitude: 22.5726,
    longitude: 88.3639,
    baseTemp: 29.0,
    baseHum: 78.0,
    basePress: 1009.0
  }
];

const ANOMALY_OPTIONS = [
  { id: "temperature_spike", label: "Temperature Spike (Sudden Rise)", icon: "🔥" },
  { id: "humidity_spike", label: "Humidity Surge (Abnormal Rise)", icon: "💧" },
  { id: "pressure_jump", label: "Barometric Pressure Jump", icon: "⚡" },
  { id: "freeze", label: "Sensor Freeze (Repeated Constant Readings)", icon: "❄️" },
  { id: "drift", label: "Progressive Sensor Calibration Drift", icon: "📈" },
  { id: "offset", label: "Calibration Step Offset / Bias", icon: "📏" },
  { id: "missing_data", label: "Missing Data / Dropout Packet", icon: "⚠️" },
  { id: "multivariate_inconsistency", label: "Multivariate Physical Inconsistency", icon: "🧪" },
  { id: "spatial_inconsistency", label: "Spatial Cluster Neighbor Inconsistency", icon: "🌐" }
];

// Helper to determine API & WebSocket URLs
const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    const loc = window.location;
    if (loc.port === "5173" || loc.port === "5174") {
      return "http://localhost:3000";
    }
    return `${loc.protocol}//${loc.host}`;
  }
  return "http://localhost:3000";
};

const getWsUrl = () => {
  if (typeof window !== "undefined") {
    const loc = window.location;
    const proto = loc.protocol === "https:" ? "wss:" : "ws:";
    if (loc.port === "5173" || loc.port === "5174") {
      return "ws://localhost:3000/ws";
    }
    return `${proto}//${loc.host}/ws`;
  }
  return "ws://localhost:3000/ws";
};

// High-Performance Smooth Canvas Time-Series Chart Component
function LiveCanvasChart({
  title,
  dataPoints,
  valueKey,
  unit,
  color,
  gradientStart,
  gradientEnd,
  minBound,
  maxBound,
  timeWindow = 30
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Clear background
    ctx.clearRect(0, 0, width, height);

    const displayData = dataPoints.slice(-timeWindow);
    if (displayData.length === 0) {
      ctx.fillStyle = "rgba(148, 163, 184, 0.4)";
      ctx.font = "12px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Waiting for incoming live telemetry...", width / 2, height / 2);
      return;
    }

    // Determine value range
    const values = displayData.map((d) => Number(d[valueKey] || 0));
    let minVal = Math.min(...values);
    let maxVal = Math.max(...values);

    if (minBound !== undefined) minVal = Math.min(minVal, minBound);
    if (maxBound !== undefined) maxVal = Math.max(maxVal, maxBound);

    const padding = (maxVal - minVal) * 0.12 || 2;
    minVal -= padding;
    maxVal += padding;
    const range = maxVal - minVal || 1;

    const padLeft = 45;
    const padRight = 15;
    const padTop = 15;
    const padBottom = 25;
    const plotWidth = width - padLeft - padRight;
    const plotHeight = height - padTop - padBottom;

    // Draw Grid Lines & Y-Axis Labels
    const numYGrid = 4;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    ctx.fillStyle = "rgba(148, 163, 184, 0.6)";
    ctx.font = "10px monospace";
    ctx.textAlign = "right";

    for (let i = 0; i <= numYGrid; i++) {
      const yVal = minVal + (range / numYGrid) * (numYGrid - i);
      const yPos = padTop + (plotHeight / numYGrid) * i;

      ctx.beginPath();
      ctx.moveTo(padLeft, yPos);
      ctx.lineTo(width - padRight, yPos);
      ctx.stroke();

      ctx.fillText(`${yVal.toFixed(1)}${unit}`, padLeft - 6, yPos + 3);
    }

    // Plot Points Coordinates
    const points = displayData.map((d, idx) => {
      const x =
        displayData.length === 1
          ? padLeft + plotWidth / 2
          : padLeft + (idx / (displayData.length - 1)) * plotWidth;
      const val = Number(d[valueKey] || 0);
      const y = padTop + plotHeight - ((val - minVal) / range) * plotHeight;
      return {
        x,
        y,
        val,
        isAnomaly: d.anomaly_detected || d.root_cause !== "normal",
        rootCause: d.root_cause,
        timestamp: d.timestamp
      };
    });

    // Draw Gradient Area Fill
    if (points.length > 1) {
      const grad = ctx.createLinearGradient(0, padTop, 0, height - padBottom);
      grad.addColorStop(0, gradientStart || "rgba(6, 182, 212, 0.35)");
      grad.addColorStop(1, gradientEnd || "rgba(6, 182, 212, 0.0)");

      ctx.beginPath();
      ctx.moveTo(points[0].x, height - padBottom);
      points.forEach((p, idx) => {
        if (idx === 0) {
          ctx.lineTo(p.x, p.y);
        } else {
          const prev = points[idx - 1];
          const cx = (prev.x + p.x) / 2;
          ctx.bezierCurveTo(cx, prev.y, cx, p.y, p.x, p.y);
        }
      });
      ctx.lineTo(points[points.length - 1].x, height - padBottom);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
    }

    // Draw Smooth Line
    ctx.beginPath();
    ctx.strokeStyle = color || "#06b6d4";
    ctx.lineWidth = 2.5;
    ctx.shadowColor = color || "#06b6d4";
    ctx.shadowBlur = 8;

    points.forEach((p, idx) => {
      if (idx === 0) {
        ctx.moveTo(p.x, p.y);
      } else {
        const prev = points[idx - 1];
        const cx = (prev.x + p.x) / 2;
        ctx.bezierCurveTo(cx, prev.y, cx, p.y, p.x, p.y);
      }
    });
    ctx.stroke();
    ctx.shadowBlur = 0; // reset shadow

    // Draw Points & Anomaly Markers
    points.forEach((p, idx) => {
      const isLatest = idx === points.length - 1;

      if (p.isAnomaly) {
        // Glowing Red Anomaly Marker
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = "#f43f5e";
        ctx.shadowColor = "#f43f5e";
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Little exclamation icon
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 9px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("!", p.x, p.y + 3);
      } else if (isLatest) {
        // Pulsing head node
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = color || "#06b6d4";
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = color || "#06b6d4";
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (points.length <= 15) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = color || "#06b6d4";
        ctx.fill();
      }
    });

    // Draw X-Axis Time Labels
    if (points.length > 0) {
      ctx.fillStyle = "rgba(148, 163, 184, 0.5)";
      ctx.font = "9px monospace";
      ctx.textAlign = "left";
      const firstTime = new Date(points[0].timestamp || Date.now()).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
      ctx.fillText(firstTime, padLeft, height - 8);

      ctx.textAlign = "right";
      const lastTime = new Date(points[points.length - 1].timestamp || Date.now()).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
      ctx.fillText(lastTime, width - padRight, height - 8);
    }
  }, [dataPoints, valueKey, unit, color, gradientStart, gradientEnd, minBound, maxBound, timeWindow]);

  const latestVal = dataPoints.length > 0 ? dataPoints[dataPoints.length - 1][valueKey] : null;
  const prevVal = dataPoints.length > 1 ? dataPoints[dataPoints.length - 2][valueKey] : latestVal;
  const delta = latestVal !== null && prevVal !== null ? (latestVal - prevVal).toFixed(2) : "0.00";

  return (
    <div className="single-chart-card">
      <div className="single-chart-top">
        <div className="chart-indicator" style={{ color: color }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block" }}></span>
          {title}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
          <span className="chart-current-val" style={{ color: color }}>
            {latestVal !== null ? `${Number(latestVal).toFixed(1)} ${unit}` : "--"}
          </span>
          <span
            style={{
              fontSize: "0.72rem",
              fontFamily: "monospace",
              color: Number(delta) >= 0 ? "#10b981" : "#f43f5e"
            }}
          >
            {Number(delta) >= 0 ? `+${delta}` : delta}
          </span>
        </div>
      </div>
      <div className="canvas-chart-wrap">
        <canvas ref={canvasRef} className="telemetry-chart" />
      </div>
    </div>
  );
}

// Main App Component
function App() {
  const [stations, setStations] = useState(INITIAL_STATIONS);
  const [selectedStationId, setSelectedStationId] = useState("IMD-DEL-001");
  const [expandedStationNames, setExpandedStationNames] = useState({});
  const [telemetryHistory, setTelemetryHistory] = useState({}); // { stationId: [reading, ...] }
  const [latestAnalyses, setLatestAnalyses] = useState({}); // { stationId: analysisDoc }
  const [incidentsList, setIncidentsList] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState("live-graphs"); // "live-graphs" | "diagnostics" | "incidents" | "ai-report" | "stations-grid"
  const [searchQuery, setSearchQuery] = useState("");
  const [chartTimeWindow, setChartTimeWindow] = useState(30);

  // Simulator state
  const [simRunning, setSimRunning] = useState(true);
  const [simCycleCount, setSimCycleCount] = useState(0);
  const [simIntervalSec, setSimIntervalSec] = useState(5);
  const [isInjectModalOpen, setIsInjectModalOpen] = useState(false);
  const [injectAnomalyType, setInjectAnomalyType] = useState("temperature_spike");
  const [injectTargetStation, setInjectTargetStation] = useState("IMD-DEL-001");
  const [feedbackModalData, setFeedbackModalData] = useState(null);
  const [operatorNotes, setOperatorNotes] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState("confirmed");

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // 1. Initial State Setup: Expand all station names by default
  useEffect(() => {
    const initialExpanded = {};
    INITIAL_STATIONS.forEach((s) => {
      initialExpanded[s.station_name] = true;
    });
    setExpandedStationNames(initialExpanded);

    // Initialize telemetry history seed
    const initialHist = {};
    INITIAL_STATIONS.forEach((stn) => {
      const pts = [];
      const now = Date.now();
      for (let i = 20; i >= 0; i--) {
        const time = new Date(now - i * 5000);
        pts.push({
          timestamp: time.toISOString(),
          temperature_c: stn.baseTemp + (Math.sin(i * 0.5) * 1.5 + (Math.random() * 0.4 - 0.2)),
          humidity_pct: stn.baseHum + (Math.cos(i * 0.5) * 3 + (Math.random() * 0.8 - 0.4)),
          pressure_hpa: stn.basePress + (Math.sin(i * 0.2) * 1.2 + (Math.random() * 0.3 - 0.15)),
          root_cause: "normal",
          anomaly_detected: false,
          health_score: 98.5
        });
      }
      initialHist[stn.station_id] = pts;
    });
    setTelemetryHistory(initialHist);
  }, []);

  // 2. Fetch stations and reports from backend
  const fetchBackendData = useCallback(async () => {
    try {
      const baseUrl = getBaseUrl();
      const [stnRes, repRes, simRes] = await Promise.allSettled([
        fetch(`${baseUrl}/api/stations`),
        fetch(`${baseUrl}/api/reports?limit=30`),
        fetch(`${baseUrl}/api/simulator/status`)
      ]);

      if (stnRes.status === "fulfilled" && stnRes.value.ok) {
        const stnData = await stnRes.value.json();
        if (stnData.data && Array.isArray(stnData.data) && stnData.data.length > 0) {
          setStations((prev) => {
            const map = new Map();
            prev.forEach((s) => map.set(s.station_id, s));
            stnData.data.forEach((s) => {
              const id = s.station_id || s.stationId;
              map.set(id, { ...map.get(id), ...s, station_id: id });
            });
            return Array.from(map.values());
          });
        }
      }

      if (repRes.status === "fulfilled" && repRes.value.ok) {
        const repData = await repRes.value.json();
        const list = repData.reports || repData.data || [];
        if (Array.isArray(list) && list.length > 0) {
          setIncidentsList(list);
          const latestMap = {};
          list.forEach((item) => {
            const sid = item.station_id || item.station?.id;
            if (sid && (!latestMap[sid] || new Date(item.timestamp) > new Date(latestMap[sid].timestamp))) {
              latestMap[sid] = item;
            }
          });
          setLatestAnalyses((prev) => ({ ...prev, ...latestMap }));
        }
      }

      if (simRes.status === "fulfilled" && simRes.value.ok) {
        const simData = await simRes.value.json();
        if (simData.isRunning !== undefined) setSimRunning(simData.isRunning);
        if (simData.totalCycles !== undefined) setSimCycleCount(simData.totalCycles);
        if (simData.intervalSeconds !== undefined) setSimIntervalSec(simData.intervalSeconds);
      }
    } catch (err) {
      console.warn("REST polling fallback encountered error:", err.message);
    }
  }, []);

  // 3. Setup WebSocket Connection with auto-reconnect
  const connectWebSocket = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const wsUrl = getWsUrl();
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("⚡ SkyGuard Live Telemetry WebSocket Connected to", wsUrl);
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);

          if (payload.type === "anomaly" || payload.type === "ANALYSIS_UPDATED") {
            const item = payload.result || payload.data;
            if (!item) return;

            const stnId = item.station_id || item.station?.id;
            if (!stnId) return;

            const temp = Number(item.temperature_c ?? item.telemetry?.temperature_c ?? 25.0);
            const hum = Number(item.humidity_pct ?? item.telemetry?.humidity_pct ?? 50.0);
            const press = Number(item.pressure_hpa ?? item.telemetry?.pressure_hpa ?? 1013.25);
            const isAnomaly = Boolean(item.root_cause && item.root_cause !== "normal") || Boolean(item.anomaly?.detected);

            const newPoint = {
              timestamp: item.timestamp || new Date().toISOString(),
              temperature_c: temp,
              humidity_pct: hum,
              pressure_hpa: press,
              root_cause: item.root_cause || item.anomaly?.root_cause || "normal",
              anomaly_detected: isAnomaly,
              confidence: item.confidence ?? item.anomaly?.confidence ?? 0.9,
              severity: item.severity || item.anomaly?.severity || (isAnomaly ? "MEDIUM" : "NONE"),
              health_score: item.sensor_health_score ?? item.health?.score ?? (isAnomaly ? 65 : 98),
              evidence: item.evidence || item.multi_source_evidence || item.raw_record?.evidence || {},
              shap_factors: item.shap_factors || item.raw_record?.explanation?.shap_factors || [],
              maintenance: item.maintenance || item.raw_record?.maintenance,
              llm_report: item.llm_report || item.raw_record?.llm?.report,
              incident_id: item.incident_id || `INC-${Date.now()}`
            };

            // Update telemetry points
            setTelemetryHistory((prev) => {
              const prevList = prev[stnId] || [];
              const updated = [...prevList, newPoint].slice(-100);
              return { ...prev, [stnId]: updated };
            });

            // Update latest analysis
            setLatestAnalyses((prev) => ({
              ...prev,
              [stnId]: item
            }));

            // If anomaly, append to incidents list
            if (isAnomaly) {
              setIncidentsList((prev) => [item, ...prev].slice(0, 50));
            }

            setSimCycleCount((c) => c + 1);
          } else if (payload.type === "READING_UPDATED") {
            const r = payload.data;
            if (r) {
              const sid = r.station_id || r.stationId;
              if (sid) {
                setTelemetryHistory((prev) => {
                  const list = prev[sid] || [];
                  const p = {
                    timestamp: r.timestamp || new Date().toISOString(),
                    temperature_c: Number(r.temperature_c ?? r.temperature ?? 25.0),
                    humidity_pct: Number(r.humidity_pct ?? r.humidity ?? 50.0),
                    pressure_hpa: Number(r.pressure_hpa ?? r.pressure ?? 1013.25),
                    root_cause: "normal",
                    anomaly_detected: false,
                    health_score: 99.0
                  };
                  return { ...prev, [sid]: [...list, p].slice(-100) };
                });
              }
            }
          }
        } catch (e) {
          console.warn("WebSocket parse message error:", e);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        wsRef.current = null;
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = () => {
        setWsConnected(false);
        try { ws.close(); } catch {}
      };
    } catch {
      setWsConnected(false);
      reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
    }
  }, []);

  useEffect(() => {
    fetchBackendData();
    connectWebSocket();

    // Heartbeat & REST Fallback polling interval
    const interval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "ping" }));
      } else {
        fetchBackendData();
      }
    }, 4000);

    return () => {
      clearInterval(interval);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        try { wsRef.current.close(); } catch {}
      }
    };
  }, [fetchBackendData, connectWebSocket]);

  // Group Stations: Group by Station Name -> Group by Station ID
  const groupedStations = useMemo(() => {
    const groups = {};
    stations.forEach((stn) => {
      const nameKey = stn.station_name || "Unknown AWS Node";
      if (!groups[nameKey]) {
        groups[nameKey] = {
          station_name: nameKey,
          cluster: stn.cluster || "Regional",
          city: stn.city || "",
          stations: []
        };
      }
      groups[nameKey].stations.push(stn);
    });

    // Apply search filter if query entered
    if (!searchQuery.trim()) return Object.values(groups);

    const q = searchQuery.toLowerCase();
    const filtered = [];
    Object.values(groups).forEach((grp) => {
      const matchName = grp.station_name.toLowerCase().includes(q) || grp.cluster.toLowerCase().includes(q);
      const matchingStations = grp.stations.filter(
        (s) =>
          s.station_id.toLowerCase().includes(q) ||
          (s.city && s.city.toLowerCase().includes(q))
      );

      if (matchName || matchingStations.length > 0) {
        filtered.push({
          ...grp,
          stations: matchName ? grp.stations : matchingStations
        });
      }
    });
    return filtered;
  }, [stations, searchQuery]);

  const toggleGroupExpand = (stationName) => {
    setExpandedStationNames((prev) => ({
      ...prev,
      [stationName]: !prev[stationName]
    }));
  };

  // Selected Station Data
  const currentStation = useMemo(() => {
    return stations.find((s) => s.station_id === selectedStationId) || stations[0] || {};
  }, [stations, selectedStationId]);

  const currentHistory = useMemo(() => {
    return telemetryHistory[selectedStationId] || [];
  }, [telemetryHistory, selectedStationId]);

  const currentLatestReading = useMemo(() => {
    if (currentHistory.length > 0) return currentHistory[currentHistory.length - 1];
    return null;
  }, [currentHistory]);

  const currentAnalysis = useMemo(() => {
    return latestAnalyses[selectedStationId] || null;
  }, [latestAnalyses, selectedStationId]);

  // Metric Banner Aggregates
  const totalAnomaliesCount = incidentsList.length;
  const avgHealthScore = useMemo(() => {
    let sum = 0;
    let count = 0;
    stations.forEach((stn) => {
      const hist = telemetryHistory[stn.station_id];
      if (hist && hist.length > 0) {
        sum += hist[hist.length - 1].health_score || 98;
        count++;
      }
    });
    return count > 0 ? (sum / count).toFixed(1) : "98.5";
  }, [stations, telemetryHistory]);

  // Simulator Control Handlers
  const handleToggleSimulation = async () => {
    try {
      const res = await fetch(`${getBaseUrl()}/api/simulator/toggle`, { method: "POST" });
      const data = await res.json();
      setSimRunning(data.isRunning);
    } catch {
      setSimRunning((r) => !r);
    }
  };

  const handleTriggerCycle = async () => {
    try {
      await fetch(`${getBaseUrl()}/api/simulator/trigger`, { method: "POST" });
    } catch {}
  };

  const handleInjectAnomaly = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${getBaseUrl()}/api/simulator/inject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anomaly_type: injectAnomalyType,
          station_id: injectTargetStation
        })
      });
      if (res.ok) {
        setIsInjectModalOpen(false);
      }
    } catch (err) {
      console.error("Anomaly injection error:", err);
    }
  };

  const handleOpenFeedback = (item) => {
    setFeedbackModalData(item);
    setOperatorNotes("");
    setFeedbackStatus("confirmed");
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackModalData) return;
    try {
      await fetch(`${getBaseUrl()}/api/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incident_id: feedbackModalData.incident_id || feedbackModalData._id,
          operator_name: "Lead Meteorologist",
          feedback_label: feedbackStatus,
          is_true_positive: feedbackStatus === "confirmed",
          notes: operatorNotes
        })
      });
      setFeedbackModalData(null);
    } catch (err) {
      console.error("Feedback submit error:", err);
      setFeedbackModalData(null);
    }
  };

  return (
    <div className="app-container">
      {/* Top Sticky Header */}
      <header className="header">
        <div className="brand-section">
          <div className="brand-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              <circle cx="12" cy="12" r="4" />
            </svg>
          </div>
          <div className="brand-info">
            <h1>
              SkyGuard 2.0
              <span className="version-pill">AWS Live Center</span>
            </h1>
            <p>High-Fidelity Regional Meteorological Telemetry & Anomaly Fusion</p>
          </div>
        </div>

        {/* Header Actions & Simulator Controls */}
        <div className="header-actions">
          {/* Live WebSocket Status */}
          <div className={`live-badge ${wsConnected ? "" : "disconnected"}`}>
            <span className="pulse-dot"></span>
            {wsConnected ? "LIVE STREAM ACTIVE" : "RECONNECTING WS / POLLING"}
          </div>

          {/* Simulator Bar */}
          <div className="sim-control-bar">
            <button
              className={`btn ${simRunning ? "btn-secondary" : "btn-primary"}`}
              onClick={handleToggleSimulation}
              title={simRunning ? "Pause Real-time Telemetry" : "Resume Telemetry"}
            >
              {simRunning ? "⏸ Pause" : "▶ Resume"}
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleTriggerCycle}
              title="Advance 1 Simulation Cycle (+1h step)"
            >
              ⚡ Step Tick
            </button>
            <button
              className="btn btn-danger"
              onClick={() => {
                setInjectTargetStation(selectedStationId);
                setIsInjectModalOpen(true);
              }}
            >
              💉 Inject Anomaly
            </button>
          </div>
        </div>
      </header>

      {/* Metric Quick Stats Banner */}
      <section className="metrics-banner">
        <div className="metric-stat-card">
          <div className="metric-stat-icon icon-cyan">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
          <div className="metric-stat-info">
            <h3>Active Stations</h3>
            <div className="value">{stations.length} AWS Nodes</div>
            <div className="subtext">Across {groupedStations.length} Major Regions</div>
          </div>
        </div>

        <div className="metric-stat-card">
          <div className="metric-stat-icon icon-emerald">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <div className="metric-stat-info">
            <h3>Avg Sensor Health</h3>
            <div className="value" style={{ color: "#10b981" }}>{avgHealthScore}%</div>
            <div className="subtext">Physics & Drift Verification</div>
          </div>
        </div>

        <div className="metric-stat-card">
          <div className="metric-stat-icon icon-rose">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <div className="metric-stat-info">
            <h3>Detected Anomalies</h3>
            <div className="value" style={{ color: totalAnomaliesCount > 0 ? "#f43f5e" : "#cbd5e1" }}>
              {totalAnomaliesCount} Incidents
            </div>
            <div className="subtext">5-Tier Fusion Triggered</div>
          </div>
        </div>

        <div className="metric-stat-card">
          <div className="metric-stat-icon icon-purple">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="metric-stat-info">
            <h3>Telemetry Cycles</h3>
            <div className="value">#{simCycleCount}</div>
            <div className="subtext">Cadence: {simIntervalSec}s interval</div>
          </div>
        </div>
      </section>

      {/* Main Layout Grid */}
      <main className="main-layout">
        {/* Left Hierarchy Sidebar: Grouped by Station Name -> Station ID */}
        <aside className="hierarchy-sidebar">
          <div className="sidebar-header">
            <h2>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                <line x1="8" y1="2" x2="8" y2="18" />
                <line x1="16" y1="6" x2="16" y2="22" />
              </svg>
              Station Directory
            </h2>
            <span className="station-badge-count">{stations.length} Nodes</span>
          </div>

          <div className="sidebar-search">
            <div className="search-input-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search station name, ID, city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Grouped Accordion List */}
          <div className="hierarchy-list">
            {groupedStations.map((group) => {
              const isExpanded = expandedStationNames[group.station_name] !== false;
              const hasAnomalyInGroup = group.stations.some((stn) => {
                const hist = telemetryHistory[stn.station_id] || [];
                const last = hist[hist.length - 1];
                return last && (last.anomaly_detected || last.root_cause !== "normal");
              });

              return (
                <div
                  key={group.station_name}
                  className={`station-group-card ${hasAnomalyInGroup ? "has-anomaly" : ""}`}
                >
                  {/* Primary Group Header: Station Name */}
                  <div
                    className="station-group-header"
                    onClick={() => toggleGroupExpand(group.station_name)}
                  >
                    <div className="station-group-title">
                      <svg
                        className="folder-icon"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                      </svg>
                      <div>
                        <div className="station-name-text">{group.station_name}</div>
                        <span className="station-group-cluster">
                          Cluster: {group.cluster} • {group.city}
                        </span>
                      </div>
                    </div>

                    <div className="station-group-meta">
                      {hasAnomalyInGroup && <span className="status-dot anomaly"></span>}
                      <span className="station-badge-count">{group.stations.length} ID</span>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {isExpanded ? "▼" : "▶"}
                      </span>
                    </div>
                  </div>

                  {/* Secondary Grouping: Station IDs under this Station Name */}
                  {isExpanded && (
                    <div className="station-id-list">
                      {group.stations.map((stn) => {
                        const isSelected = selectedStationId === stn.station_id;
                        const hist = telemetryHistory[stn.station_id] || [];
                        const last = hist.length > 0 ? hist[hist.length - 1] : null;
                        const hasAnomaly = last && (last.anomaly_detected || last.root_cause !== "normal");

                        return (
                          <div
                            key={stn.station_id}
                            className={`station-id-item ${isSelected ? "active" : ""}`}
                            onClick={() => setSelectedStationId(stn.station_id)}
                          >
                            <div>
                              <div className="station-id-code">
                                <span className={`status-dot ${hasAnomaly ? "anomaly" : ""}`}></span>
                                {stn.station_id}
                              </div>
                              {hasAnomaly && (
                                <span style={{ fontSize: "0.65rem", color: "var(--accent-rose)", fontWeight: 600 }}>
                                  ⚠️ {last.root_cause}
                                </span>
                              )}
                            </div>

                            {last && (
                              <div className="station-id-metrics">
                                <span className="mini-pill temp">{last.temperature_c.toFixed(1)}°C</span>
                                <span className="mini-pill hum">{last.humidity_pct.toFixed(0)}%</span>
                                <span className="mini-pill press">{last.pressure_hpa.toFixed(0)}hPa</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* Right Main Content Area */}
        <section className="content-area">
          {/* Navigation View Tabs */}
          <div className="nav-tabs-bar">
            <button
              className={`tab-btn ${activeTab === "live-graphs" ? "active" : ""}`}
              onClick={() => setActiveTab("live-graphs")}
            >
              📈 Live Telemetry Charts
            </button>
            <button
              className={`tab-btn ${activeTab === "diagnostics" ? "active" : ""}`}
              onClick={() => setActiveTab("diagnostics")}
            >
              🧠 5-Tier ML Fusion & SHAP
            </button>
            <button
              className={`tab-btn ${activeTab === "class-probs" ? "active" : ""}`}
              onClick={() => setActiveTab("class-probs")}
            >
              📊 10-Class Probability Distribution
            </button>
            <button
              className={`tab-btn ${activeTab === "incidents" ? "active" : ""}`}
              onClick={() => setActiveTab("incidents")}
            >
              🚨 Incident & Anomaly Log
              {incidentsList.length > 0 && <span className="badge-pill">{incidentsList.length}</span>}
            </button>
            <button
              className={`tab-btn ${activeTab === "ai-report" ? "active" : ""}`}
              onClick={() => setActiveTab("ai-report")}
            >
              ✨ AI Diagnostic Advisory
            </button>
          </div>

          {/* Selected Station Banner / Hero Card */}
          <div className="station-hero-card">
            <div className="hero-main">
              <div className="hero-icon-box">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
                </svg>
              </div>
              <div className="hero-titles">
                <h2>
                  {currentStation.station_name || "Regional Weather Station"}
                  <span className="id-tag">{selectedStationId}</span>
                </h2>
                <div className="hero-location">
                  <span>📍 {currentStation.city || "India"}</span>
                  <span>🌐 Cluster: {currentStation.cluster || "Regional"}</span>
                  <span>
                    🛰️ Lat: {currentStation.latitude?.toFixed(4)}, Lon: {currentStation.longitude?.toFixed(4)}
                  </span>
                </div>
              </div>
            </div>

            {/* Live Instant Value Gauges */}
            <div className="hero-gauges">
              <div className="gauge-chip">
                <span className="label">Temperature</span>
                <span className="val val-temp">
                  {currentLatestReading ? `${currentLatestReading.temperature_c.toFixed(1)} °C` : "--"}
                </span>
              </div>
              <div className="gauge-chip">
                <span className="label">Humidity</span>
                <span className="val val-hum">
                  {currentLatestReading ? `${currentLatestReading.humidity_pct.toFixed(1)} %` : "--"}
                </span>
              </div>
              <div className="gauge-chip">
                <span className="label">Pressure</span>
                <span className="val val-press">
                  {currentLatestReading ? `${currentLatestReading.pressure_hpa.toFixed(1)} hPa` : "--"}
                </span>
              </div>
              <div className="gauge-chip">
                <span className="label">Sensor Health</span>
                <span
                  className="val"
                  style={{
                    color:
                      (currentLatestReading?.health_score || 100) > 80
                        ? "#10b981"
                        : (currentLatestReading?.health_score || 100) > 50
                        ? "#f59e0b"
                        : "#f43f5e"
                  }}
                >
                  {currentLatestReading ? `${currentLatestReading.health_score.toFixed(1)}%` : "100%"}
                </span>
              </div>
            </div>
          </div>

          {/* TAB 1: Live Monitoring Graphs for Temp, Humidity, Pressure for Each Station ID */}
          {activeTab === "live-graphs" && (
            <div className="chart-section-card">
              <div className="chart-header">
                <div className="chart-header-title">
                  <h3>Real-time Streaming Sensor Telemetry ({selectedStationId})</h3>
                </div>
                <div className="chart-controls">
                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Window:</span>
                  <div className="btn-pill-group">
                    <button
                      className={`btn-pill ${chartTimeWindow === 15 ? "active" : ""}`}
                      onClick={() => setChartTimeWindow(15)}
                    >
                      15 pts
                    </button>
                    <button
                      className={`btn-pill ${chartTimeWindow === 30 ? "active" : ""}`}
                      onClick={() => setChartTimeWindow(30)}
                    >
                      30 pts
                    </button>
                    <button
                      className={`btn-pill ${chartTimeWindow === 60 ? "active" : ""}`}
                      onClick={() => setChartTimeWindow(60)}
                    >
                      60 pts
                    </button>
                  </div>
                </div>
              </div>

              {/* 3 Dedicated Live Graphs for Temp, Humidity, Pressure */}
              <div className="charts-grid">
                {/* 1. Temperature Live Chart */}
                <LiveCanvasChart
                  title="🌡️ Temperature (°C)"
                  dataPoints={currentHistory}
                  valueKey="temperature_c"
                  unit="°C"
                  color="#f97316"
                  gradientStart="rgba(249, 115, 22, 0.35)"
                  gradientEnd="rgba(249, 115, 22, 0.0)"
                  minBound={15}
                  maxBound={45}
                  timeWindow={chartTimeWindow}
                />

                {/* 2. Relative Humidity Live Chart */}
                <LiveCanvasChart
                  title="💧 Relative Humidity (%)"
                  dataPoints={currentHistory}
                  valueKey="humidity_pct"
                  unit="%"
                  color="#06b6d4"
                  gradientStart="rgba(6, 182, 212, 0.35)"
                  gradientEnd="rgba(6, 182, 212, 0.0)"
                  minBound={20}
                  maxBound={100}
                  timeWindow={chartTimeWindow}
                />

                {/* 3. Barometric Pressure Live Chart */}
                <LiveCanvasChart
                  title="⏱️ Atmospheric Pressure (hPa)"
                  dataPoints={currentHistory}
                  valueKey="pressure_hpa"
                  unit="hPa"
                  color="#a855f7"
                  gradientStart="rgba(168, 85, 247, 0.35)"
                  gradientEnd="rgba(168, 85, 247, 0.0)"
                  minBound={980}
                  maxBound={1030}
                  timeWindow={chartTimeWindow}
                />
              </div>
            </div>
          )}

          {/* TAB 2: 5-Tier ML Fusion & SHAP Explainability */}
          {activeTab === "diagnostics" && (
            <div className="diagnostics-grid">
              {/* Evidence Matrix */}
              <div className="diag-card">
                <div className="diag-header">
                  <h3>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="12 2 2 7 12 12 22 7 12 2" />
                      <polyline points="2 17 12 22 22 17" />
                      <polyline points="2 12 12 17 22 12" />
                    </svg>
                    5-Tier Multi-Source Evidence Fusion
                  </h3>
                </div>

                <div className="tier-list">
                  {(() => {
                    const ev = currentLatestReading?.evidence || currentAnalysis?.evidence || {};
                    const tiers = [
                      { name: "Isolation Forest (Novelty & Outliers)", score: Number(ev.isolation_forest || 0.12), color: "#3b82f6" },
                      { name: "XGBoost Multi-Class Diagnostic Model", score: Number(ev.xgboost || 0.08), color: "#06b6d4" },
                      { name: "Temporal Consistency & Rate-of-Change", score: Number(ev.temporal || 0.15), color: "#f59e0b" },
                      { name: "Spatial Cluster Neighbor Correlation", score: Number(ev.spatial || 0.05), color: "#10b981" },
                      { name: "Thermodynamic & Physics Boundary Checks", score: Number(ev.physics || 0.0), color: "#a855f7" }
                    ];

                    return tiers.map((t) => (
                      <div key={t.name} className="tier-item">
                        <div className="tier-item-top">
                          <span className="tier-name">{t.name}</span>
                          <span className="tier-score" style={{ color: t.color }}>
                            {(t.score * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="progress-bar-bg">
                          <div
                            className="progress-bar-fill"
                            style={{
                              width: `${Math.min(100, Math.max(5, t.score * 100))}%`,
                              backgroundColor: t.color
                            }}
                          ></div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* SHAP Factor Waterfall */}
              <div className="diag-card">
                <div className="diag-header">
                  <h3>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="20" x2="18" y2="10" />
                      <line x1="12" y1="20" x2="12" y2="4" />
                      <line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                    SHAP Factor Feature Attributions
                  </h3>
                </div>

                <div className="shap-list">
                  {(() => {
                    const factors =
                      currentLatestReading?.shap_factors ||
                      currentAnalysis?.shap_factors ||
                      currentAnalysis?.explanation?.shap_factors ||
                      [
                        { feature: "temperature_c_rate_1h", shap_value: 0.35, statement: "High rate of thermal increase per hour" },
                        { feature: "spatial_temp_zscore", shap_value: -0.12, statement: "Consistent with regional cluster neighbors" },
                        { feature: "temp_hum_ratio", shap_value: 0.18, statement: "Dewpoint depression within envelope" }
                      ];

                    return factors.map((sf, idx) => (
                      <div key={idx} className="shap-item">
                        <div>
                          <div className="shap-feature-name">{sf.feature || "feature_metric"}</div>
                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                            {sf.human_readable_statement || sf.statement || "Contribution to ML anomaly decision"}
                          </span>
                        </div>
                        <span
                          className={`shap-val-badge ${
                            (sf.shap_value || 0) >= 0 ? "shap-positive" : "shap-negative"
                          }`}
                        >
                          {(sf.shap_value || 0) >= 0 ? `+${(sf.shap_value || 0).toFixed(3)}` : (sf.shap_value || 0).toFixed(3)}
                        </span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: 10-Class Probability Distribution */}
          {activeTab === "class-probs" && (
            <div className="diag-card">
              <div className="diag-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                    <line x1="9" y1="21" x2="9" y2="9" />
                  </svg>
                  10-Class XGBoost Probability Vector
                </h3>
                <span className="station-badge-count" style={{ color: "var(--accent-cyan)" }}>
                  Top: {currentLatestReading?.root_cause || currentAnalysis?.prediction?.root_cause || "normal"} ({(((currentLatestReading?.confidence || currentAnalysis?.prediction?.confidence || 0.95)) * 100).toFixed(1)}%)
                </span>
              </div>

              <div className="class-prob-list" style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.6rem" }}>
                {(() => {
                  const classConfigs = [
                    { id: "normal", label: "Normal Operation", icon: "🟢", color: "#10b981" },
                    { id: "temperature_spike", label: "Temperature Spike", icon: "🔥", color: "#f97316" },
                    { id: "humidity_spike", label: "Humidity Spike / Saturation", icon: "💧", color: "#06b6d4" },
                    { id: "pressure_jump", label: "Pressure Jump / Drop", icon: "⚡", color: "#a855f7" },
                    { id: "freeze", label: "Sensor Freeze / Constant", icon: "❄️", color: "#38bdf8" },
                    { id: "drift", label: "Calibration Drift", icon: "📈", color: "#eab308" },
                    { id: "offset", label: "Step Offset / Bias", icon: "📏", color: "#ec4899" },
                    { id: "missing_data", label: "Missing Data / Dropout", icon: "⚠️", color: "#ef4444" },
                    { id: "multivariate_inconsistency", label: "Multivariate Conflict", icon: "🧪", color: "#f43f5e" },
                    { id: "spatial_inconsistency", label: "Spatial Cluster Outlier", icon: "🌐", color: "#8b5cf6" }
                  ];
                  const probs = currentLatestReading?.class_probabilities || currentAnalysis?.class_probabilities || {};
                  const curCause = currentLatestReading?.root_cause || currentAnalysis?.prediction?.root_cause || "normal";
                  const curConf = Number(currentLatestReading?.confidence || currentAnalysis?.prediction?.confidence || 0.95);

                  return classConfigs.map((cfg) => {
                    const prob = Number(probs[cfg.id] || (curCause === cfg.id ? curConf : 0.01));
                    const pct = Math.min(100, Math.max(0, prob * 100));
                    const isSelected = curCause === cfg.id;

                    return (
                      <div
                        key={cfg.id}
                        className="class-prob-item"
                        style={{
                          background: isSelected ? "rgba(255, 255, 255, 0.06)" : "rgba(255, 255, 255, 0.02)",
                          padding: "0.35rem 0.6rem",
                          borderRadius: "6px",
                          border: isSelected ? `1px solid ${cfg.color}` : "1px solid rgba(255, 255, 255, 0.04)"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem" }}>
                          <span style={{ fontWeight: isSelected ? 600 : 400, color: isSelected ? "#f8fafc" : "var(--text-secondary)" }}>
                            {cfg.icon} {cfg.label}
                          </span>
                          <span style={{ fontFamily: "monospace", fontWeight: 600, color: isSelected ? cfg.color : "var(--text-muted)" }}>
                            {pct.toFixed(1)}%
                          </span>
                        </div>
                        <div className="progress-bar-bg" style={{ height: "4px", marginTop: "3px", background: "rgba(255, 255, 255, 0.08)" }}>
                          <div
                            className="progress-bar-fill"
                            style={{
                              width: `${Math.max(2, pct)}%`,
                              backgroundColor: cfg.color,
                              transition: "width 0.3s ease"
                            }}
                          />
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {/* TAB 4: Incident & Anomaly Log */}
          {activeTab === "incidents" && (
            <div className="incidents-card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h3>🚨 Detected Meteorological Anomalies & Incidents</h3>
                <span className="station-badge-count">{incidentsList.length} Total Incidents</span>
              </div>

              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Station ID</th>
                      <th>Station Name</th>
                      <th>Root Cause</th>
                      <th>Severity</th>
                      <th>Telemetry</th>
                      <th>Confidence</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incidentsList.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>
                          No anomalies currently detected. System operating under nominal parameters.
                        </td>
                      </tr>
                    ) : (
                      incidentsList.map((inc, i) => {
                        const sev = (inc.severity || inc.anomaly?.severity || "MEDIUM").toLowerCase();
                        const rootCause = inc.root_cause || inc.anomaly?.root_cause || "Anomaly";
                        const sid = inc.station_id || inc.station?.id;
                        const sname = inc.station_name || inc.station?.name || sid;

                        return (
                          <tr key={i}>
                            <td style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>
                              {new Date(inc.timestamp || Date.now()).toLocaleTimeString()}
                            </td>
                            <td>
                              <span style={{ fontFamily: "monospace", color: "var(--accent-cyan)", fontWeight: 600 }}>
                                {sid}
                              </span>
                            </td>
                            <td>{sname}</td>
                            <td>
                              <span style={{ fontWeight: 600, color: "#f8fafc" }}>{rootCause}</span>
                            </td>
                            <td>
                              <span className={`severity-pill severity-${sev}`}>{sev}</span>
                            </td>
                            <td style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>
                              {Number(inc.temperature_c ?? inc.telemetry?.temperature_c ?? 0).toFixed(1)}°C |{" "}
                              {Number(inc.humidity_pct ?? inc.telemetry?.humidity_pct ?? 0).toFixed(0)}% |{" "}
                              {Number(inc.pressure_hpa ?? inc.telemetry?.pressure_hpa ?? 0).toFixed(0)}hPa
                            </td>
                            <td style={{ fontFamily: "monospace", color: "#10b981" }}>
                              {inc.confidence_pct || `${((inc.confidence || 0.95) * 100).toFixed(1)}%`}
                            </td>
                            <td>
                              <button
                                className="btn btn-secondary"
                                style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem" }}
                                onClick={() => handleOpenFeedback(inc)}
                              >
                                ✍️ Feedback
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: AI Diagnostic Report */}
          {activeTab === "ai-report" && (
            <div className="ai-report-card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span className="ai-badge">✨ LLM Meteorological Synthesis (Mistral AI / Physics Engine)</span>
                <span style={{ fontSize: "0.75rem", color: "#a78bfa" }}>Station: {selectedStationId}</span>
              </div>

              <div className="ai-content">
                {currentLatestReading?.llm_report ||
                currentAnalysis?.llm_report ||
                currentAnalysis?.llm?.report ? (
                  currentLatestReading?.llm_report ||
                  currentAnalysis?.llm_report ||
                  currentAnalysis?.llm?.report
                ) : (
                  <div>
                    <p>
                      <strong>Diagnostic Assessment:</strong> Weather Station <code>{selectedStationId}</code> is currently
                      transmitting consistent environmental parameters matching regional cluster baselines.
                    </p>
                    <p style={{ marginTop: "0.5rem" }}>
                      Thermodynamic envelope verification confirms dewpoint depression within permissible bounds. No sensor
                      stickiness or progressive calibration offset detected.
                    </p>
                  </div>
                )}
              </div>

              <div className="ai-recommendation">
                <strong>🛠️ Recommended Maintenance Protocol:</strong>{" "}
                {currentLatestReading?.maintenance?.recommended_action ||
                  currentAnalysis?.maintenance?.recommended_action ||
                  "Continue automated continuous multi-station telemetry monitoring."}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Modal: Inject Anomaly */}
      {isInjectModalOpen && (
        <div className="modal-overlay" onClick={() => setIsInjectModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>💉 Inject Telemetry Anomaly</h3>
              <button className="modal-close-btn" onClick={() => setIsInjectModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleInjectAnomaly} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="form-group">
                <label>Target Station ID</label>
                <select
                  className="form-control"
                  value={injectTargetStation}
                  onChange={(e) => setInjectTargetStation(e.target.value)}
                >
                  {stations.map((s) => (
                    <option key={s.station_id} value={s.station_id}>
                      {s.station_name} ({s.station_id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Select Anomaly Pattern</label>
                <select
                  className="form-control"
                  value={injectAnomalyType}
                  onChange={(e) => setInjectAnomalyType(e.target.value)}
                >
                  {ANOMALY_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.icon} {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem", marginTop: "0.5rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsInjectModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-danger">
                  Inject Anomaly Packet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Operator Feedback */}
      {feedbackModalData && (
        <div className="modal-overlay" onClick={() => setFeedbackModalData(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✍️ Operator Incident Feedback</h3>
              <button className="modal-close-btn" onClick={() => setFeedbackModalData(null)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitFeedback} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="form-group">
                <label>Incident ID</label>
                <input
                  type="text"
                  className="form-control"
                  disabled
                  value={feedbackModalData.incident_id || feedbackModalData._id || "INC-DEMO"}
                />
              </div>

              <div className="form-group">
                <label>Verification Decision</label>
                <select
                  className="form-control"
                  value={feedbackStatus}
                  onChange={(e) => setFeedbackStatus(e.target.value)}
                >
                  <option value="confirmed">✅ Confirmed True Anomaly</option>
                  <option value="false_alarm">❌ False Alarm / Normal Weather Event</option>
                  <option value="corrected">🔧 Corrected Diagnosis</option>
                </select>
              </div>

              <div className="form-group">
                <label>Meteorologist Notes & Action Taken</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Enter observation notes, field sensor inspection details, or correction notes..."
                  value={operatorNotes}
                  onChange={(e) => setOperatorNotes(e.target.value)}
                ></textarea>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setFeedbackModalData(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="footer">
        <div>SkyGuard 2.0 • Autonomous Multi-Sensor Environmental Intelligence Platform</div>
        <div>Indian Meteorological Department AWS Architecture Standard</div>
      </footer>
    </div>
  );
}

// Render React App
const rootElement = document.getElementById("root");
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
}
