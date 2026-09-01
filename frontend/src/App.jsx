import { useState, useEffect, useRef } from "react";
import "./App.css";

import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import AnomalyInspectModal from "./components/AnomalyInspectModal";
import InjectAnomalyModal from "./components/InjectAnomalyModal";

import Dashboard from "./pages/Dashboard";
import Stations from "./pages/Stations";
import StationDetails from "./pages/StationDetails";
import About from "./pages/About";

import { stations as initialStations, alerts as initialAlerts } from "./data/mockData";
import {
  fetchStations,
  fetchAlerts,
  fetchSimulatorStatus,
  fetchInjectionStatus,
  fetchStationHistory,
  toggleSimulatorStream
} from "./api/skyguardApi";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:3000/ws";

function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [selectedStation, setSelectedStation] = useState(null);
  const [inspectingAlert, setInspectingAlert] = useState(null);
  const [isInjectModalOpen, setIsInjectModalOpen] = useState(false);
  const [activeInjection, setActiveInjection] = useState(null);

  const [stations, setStations] = useState(initialStations);
  const [alerts, setAlerts] = useState(initialAlerts);
  const [simulatorRunning, setSimulatorRunning] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);

  // 10-day frontend display buffer: exactly 10 days * 24 hours = 240 hourly records per station
  const [stationHistory, setStationHistory] = useState({});

  const [currentConditions, setCurrentConditions] = useState({
    temperature: 28.6,
    pressure: 1012.0,
    humidity: 67.0
  });

  const wsRef = useRef(null);

  // 1. Initial REST data hydration & 10-day display window loading
  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      const [backendStations, backendAlerts, simStatus, injStatus] = await Promise.all([
        fetchStations(),
        fetchAlerts(),
        fetchSimulatorStatus(),
        fetchInjectionStatus()
      ]);

      if (!mounted) return;

      const activeStList = (backendStations && backendStations.length > 0) ? backendStations : initialStations;

      if (backendStations && backendStations.length > 0) {
        setStations(prev => {
          const merged = backendStations.map(bs => {
            const match = prev.find(p => (p.station_id || p.stationId) === (bs.station_id || bs.stationId));
            return {
              ...bs,
              station_id: bs.station_id || bs.stationId,
              station_name: bs.station_name || match?.station_name || "AWS Node",
              location: bs.location || bs.city || match?.location || "India",
              city: bs.city || bs.location || match?.city || "New Delhi",
              status: bs.status || "ONLINE"
            };
          });
          return merged.length > 0 ? merged : prev;
        });
      }

      // Pre-hydrate historical window
      const historyMap = {};
      await Promise.all(
        activeStList.map(async (st) => {
          const sId = st.station_id || st.stationId;
          const hist = await fetchStationHistory(sId, 240);
          historyMap[sId] = Array.isArray(hist) ? hist : [];
        })
      );

      if (mounted) {
        setStationHistory(historyMap);
      }

      if (backendAlerts && backendAlerts.length > 0) {
        setAlerts(prev => {
          const formatted = backendAlerts.map(ba => ({
            anomaly_id: ba.analysis_id || ba.incident_id || ba.anomaly_id || `ANM-${Date.now()}`,
            station_id: ba.station_id || ba.station?.id || "IMD-001",
            station_name: ba.station_name || ba.station?.name || "AWS Node",
            timestamp: ba.timestamp || new Date().toISOString(),
            severity: (ba.severity || ba.anomaly?.severity || "HIGH").toUpperCase(),
            title: `${(ba.root_cause || ba.anomaly?.root_cause || "Anomaly").replace(/_/g, " ").toUpperCase()} Detected`,
            anomaly_score: Number(ba.fused_anomaly_score || ba.anomaly?.fused_anomaly_score || 0.88),
            root_cause: ba.root_cause || ba.anomaly?.root_cause || "unknown",
            confidence: Number(ba.confidence || ba.anomaly?.confidence || 0.92),
            sensor_status: {
              temperature: (ba.temperature_c > 45 || ba.temperature_c < -10 || ba.root_cause?.includes("temperature")) ? "ABNORMAL" : "NORMAL",
              humidity: (ba.humidity_pct > 95 || ba.humidity_pct < 10 || ba.root_cause?.includes("humidity")) ? "ABNORMAL" : "NORMAL",
              pressure: (ba.pressure_hpa < 950 || ba.pressure_hpa > 1050 || ba.root_cause?.includes("pressure")) ? "ABNORMAL" : "NORMAL"
            },
            readings: {
              temperature: Number(ba.temperature_c ?? ba.telemetry?.temperature_c ?? 28.5),
              humidity: Number(ba.humidity_pct ?? ba.telemetry?.humidity_pct ?? 55.0),
              pressure: Number(ba.pressure_hpa ?? ba.telemetry?.pressure_hpa ?? 1008.0)
            },
            evidence: Array.isArray(ba.evidence) ? ba.evidence : [
              `Fused anomaly score: ${(ba.fused_anomaly_score || ba.anomaly?.fused_anomaly_score || 0.85).toFixed(3)}`,
              `Physics consistency level: ${(ba.multi_source_evidence?.physics || ba.evidence?.physics || 0).toFixed(2)}`,
              `Spatial deviation: ${(ba.multi_source_evidence?.spatial || ba.evidence?.spatial || 0).toFixed(3)}`
            ],
            multi_source_evidence: ba.multi_source_evidence || ba.evidence || {},
            shap_explanation: (ba.shap_factors || ba.explanation?.shap_factors || []).map(sf => ({
              feature: sf.feature || "sensor_reading",
              shap_value: sf.shap_value || sf.impact || 0.35,
              impact: Math.abs(sf.shap_value || 0.5)
            })),
            recommended_actions: ba.maintenance?.recommended_action ? [ba.maintenance.recommended_action] : [
              "Validate reading against adjacent cluster weather stations.",
              "Inspect sensor wiring, enclosure, and communication channel."
            ],
            uncertainty: "Generated by SkyGuard AI multi-tier fusion engine.",
            llm_report: ba.llm_report || ba.llm?.report || ""
          }));
          return formatted.length > 0 ? formatted : prev;
        });
      }

      if (simStatus && simStatus.isRunning !== undefined) {
        setSimulatorRunning(simStatus.isRunning);
      }

      if (injStatus && injStatus.hasActive && injStatus.active?.length > 0) {
        setActiveInjection(injStatus.active[0]);
      }
    }

    hydrate();

    return () => {
      mounted = false;
    };
  }, []);

  // 2. Poll Active Injection Status
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      const injStatus = await fetchInjectionStatus();
      if (injStatus && injStatus.hasActive && injStatus.active?.length > 0) {
        setActiveInjection(injStatus.active[0]);
      } else {
        setActiveInjection(null);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, []);

  // 3. Real-time WebSocket connection to Backend Node Server
  useEffect(() => {
    let reconnectTimeout = null;
    let ws = null;

    function connect() {
      try {
        ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
          setWsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);

            if (msg.type === "READING_UPDATED" && msg.data) {
              const reading = msg.data;
              const sId = reading.station_id || reading.stationId;
              const temp = reading.temperature_c !== null && reading.temperature_c !== undefined
                ? Number(reading.temperature_c)
                : (reading.temperature !== null && reading.temperature !== undefined ? Number(reading.temperature) : null);
              const hum = reading.humidity_pct !== null && reading.humidity_pct !== undefined
                ? Number(reading.humidity_pct)
                : (reading.humidity !== null && reading.humidity !== undefined ? Number(reading.humidity) : null);
              const press = reading.pressure_hpa !== null && reading.pressure_hpa !== undefined
                ? Number(reading.pressure_hpa)
                : (reading.pressure !== null && reading.pressure !== undefined ? Number(reading.pressure) : null);
              const timestamp = reading.timestamp || new Date().toISOString();

              // Update Station in state
              setStations(prev => prev.map(s => {
                if ((s.station_id || s.stationId) === sId) {
                  return {
                    ...s,
                    temperature: temp ?? s.temperature,
                    humidity: hum ?? s.humidity,
                    pressure: press ?? s.pressure,
                    status: s.status === "OFFLINE" ? "OFFLINE" : s.status
                  };
                }
                return s;
              }));

              if (temp !== null) {
                setCurrentConditions(prev => ({
                  temperature: temp,
                  pressure: press ?? prev.pressure,
                  humidity: hum ?? prev.humidity
                }));
              }

              setLastUpdateTime(timestamp);

              // Merge into rolling window buffer
              const newRec = {
                station_id: sId,
                timestamp,
                temperature_c: temp,
                humidity_pct: hum,
                pressure_hpa: press,
                temperature: temp,
                humidity: hum,
                pressure: press
              };

              setStationHistory(prev => {
                const currentArr = prev[sId] || [];
                const deduped = currentArr.filter(r => r.timestamp !== timestamp);
                return {
                  ...prev,
                  [sId]: [...deduped, newRec].slice(-240)
                };
              });
            }

            if (msg.type === "ANALYSIS_UPDATED" && msg.data) {
              const analysis = msg.data;
              const sId = analysis.station_id || analysis.station?.id;
              const isAnomaly = analysis.anomaly?.detected ?? (analysis.decision !== "normal" && analysis.decision !== "UNKNOWN");

              if (isAnomaly) {
                const rawRec = analysis.raw_record || {};
                const topFeatures = rawRec.explanation?.top_features || analysis.explanation?.shap_factors || [];

                const mappedShap = topFeatures.map(f => ({
                  feature: f.feature || f.feature_name || "sensor_reading",
                  shap_value: f.shap_value || f.impact || 0.45,
                  statement: f.human_readable_statement || f.statement || "Significant diagnostic feature weight"
                }));

                const multiEvidence = analysis.evidence || rawRec.evidence || {};
                const evidenceList = [
                  `Temporal evidence: ${Number(multiEvidence.temporal || 0.85).toFixed(3)}`,
                  `Spatial deviation: ${Number(multiEvidence.spatial || 0.25).toFixed(3)}`,
                  `Physics consistency: ${Number(multiEvidence.physics || 0.90).toFixed(3)}`,
                  `XGBoost class score: ${Number(multiEvidence.xgboost || 0.92).toFixed(3)}`,
                  `IF novelty score: ${Number(multiEvidence.isolation_forest || 0.78).toFixed(3)}`
                ];

                const rootCauseClean = (analysis.anomaly?.root_cause || analysis.root_cause || "temperature_spike").replace(/_/g, " ").toUpperCase();

                const newAlert = {
                  anomaly_id: analysis.analysis_id || analysis.incident_id || `ANM-${Date.now()}`,
                  station_id: sId,
                  station_name: analysis.station?.name || `AWS ${sId}`,
                  timestamp: analysis.timestamp || new Date().toISOString(),
                  severity: (analysis.anomaly?.severity || analysis.severity || "HIGH").toUpperCase(),
                  title: `${rootCauseClean} Detected`,
                  anomaly_score: Number(analysis.anomaly?.fused_anomaly_score || analysis.fused_anomaly_score || 0.88),
                  root_cause: analysis.anomaly?.root_cause || analysis.root_cause || "temperature_spike",
                  confidence: Number(analysis.anomaly?.confidence || analysis.confidence || 0.92),
                  readings: {
                    temperature: analysis.telemetry?.temperature_c ?? 28.5,
                    humidity: analysis.telemetry?.humidity_pct ?? 55.0,
                    pressure: analysis.telemetry?.pressure_hpa ?? 1008.0
                  },
                  sensor_status: {
                    temperature: (analysis.telemetry?.temperature_c > 45 || analysis.telemetry?.temperature_c < -10 || analysis.root_cause?.includes("temperature")) ? "ABNORMAL" : "NORMAL",
                    humidity: (analysis.telemetry?.humidity_pct > 95 || analysis.telemetry?.humidity_pct < 10 || analysis.root_cause?.includes("humidity")) ? "ABNORMAL" : "NORMAL",
                    pressure: (analysis.telemetry?.pressure_hpa < 950 || analysis.telemetry?.pressure_hpa > 1050 || analysis.root_cause?.includes("pressure")) ? "ABNORMAL" : "NORMAL"
                  },
                  evidence: evidenceList,
                  multi_source_evidence: multiEvidence,
                  shap_explanation: mappedShap.length > 0 ? mappedShap : [
                    { feature: "temperature_rate_1h", shap_value: 0.82, statement: "High thermal derivative per hour" },
                    { feature: "spatial_cluster_zscore", shap_value: 0.65, statement: "Spatial temperature divergence from cluster" },
                    { feature: "rolling_std_24h", shap_value: 0.41, statement: "Variance anomaly in 24h window" }
                  ],
                  recommended_actions: analysis.maintenance?.recommended_action
                    ? [analysis.maintenance.recommended_action]
                    : ["Inspect sensor physical calibration and electrical connections."],
                  uncertainty: "Generated by SkyGuard AI multi-tier fusion engine.",
                  llm_report: rawRec.llm?.report || analysis.llm_report || "",
                  raw_record: rawRec
                };

                setAlerts(prev => {
                  const dedup = prev.filter(a => a.anomaly_id !== newAlert.anomaly_id);
                  return [newAlert, ...dedup].slice(0, 50);
                });
              }
            }
          } catch (err) {
            console.warn("WebSocket parse error:", err);
          }
        };

        ws.onclose = () => {
          setWsConnected(false);
          reconnectTimeout = setTimeout(connect, 3000);
        };

        ws.onerror = () => {
          setWsConnected(false);
          try { ws.close(); } catch {}
        };
      } catch (err) {
        setWsConnected(false);
        reconnectTimeout = setTimeout(connect, 3000);
      }
    }

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) {
        try { ws.close(); } catch {}
      }
    };
  }, []);

  const handleToggleSimulator = async () => {
    const res = await toggleSimulatorStream();
    if (res && res.isRunning !== undefined) {
      setSimulatorRunning(res.isRunning);
    } else {
      setSimulatorRunning(prev => !prev);
    }
  };

  const handleInspectAlert = (alert) => {
    setInspectingAlert(alert);
  };

  const handleUpdateAlert = (updatedAlert) => {
    setAlerts(prev => prev.map(a => a.anomaly_id === updatedAlert.anomaly_id ? updatedAlert : a));
    setInspectingAlert(updatedAlert);
  };

  // Find live updated selected station
  const liveSelectedStation = selectedStation
    ? stations.find(s => (s.station_id || s.stationId) === (selectedStation.station_id || selectedStation.stationId)) || selectedStation
    : null;

  const selectedStationId = liveSelectedStation ? (liveSelectedStation.station_id || liveSelectedStation.stationId) : null;
  const currentStationReadings = selectedStationId ? (stationHistory[selectedStationId] || []) : [];

  const renderPage = () => {
    switch (activePage) {
      case "stations":
        return (
          <Stations
            stations={stations}
            alerts={alerts}
            stationHistory={stationHistory}
            setActivePage={setActivePage}
            setSelectedStation={setSelectedStation}
            onInspectAlert={handleInspectAlert}
          />
        );

      case "stationDetails":
        return (
          <StationDetails
            station={liveSelectedStation}
            setActivePage={setActivePage}
            alerts={alerts}
            readings={currentStationReadings}
            onInspectAlert={handleInspectAlert}
          />
        );

      case "about":
        return <About />;

      default:
        return (
          <Dashboard
            stations={stations}
            alerts={alerts}
            currentConditions={currentConditions}
            setActivePage={setActivePage}
            setSelectedStation={setSelectedStation}
            onInspectAlert={handleInspectAlert}
            wsConnected={wsConnected}
            lastUpdateTime={lastUpdateTime}
          />
        );
    }
  };

  return (
    <div className="app">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
      />

      <main className="main">
        <Topbar
          simulatorRunning={simulatorRunning}
          onToggleSimulator={handleToggleSimulator}
          wsConnected={wsConnected}
          onOpenInjectModal={() => setIsInjectModalOpen(true)}
          activeInjection={activeInjection}
        />
        <div className="content">{renderPage()}</div>
      </main>

      {/* MANUAL ANOMALY INJECTION MODAL */}
      <InjectAnomalyModal
        isOpen={isInjectModalOpen}
        onClose={() => setIsInjectModalOpen(false)}
        stations={stations}
        onInjectionStarted={(inj) => setActiveInjection(inj)}
      />

      {/* DETAILED ANOMALY INVESTIGATION MODAL */}
      {inspectingAlert && (
        <AnomalyInspectModal
          alert={inspectingAlert}
          onClose={() => setInspectingAlert(null)}
          onUpdateAlert={handleUpdateAlert}
        />
      )}
    </div>
  );
}

export default App;
