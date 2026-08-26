import { useState } from "react";
import "./App.css";

const stations = [
  {
    id: "AWS001",
    name: "Naini AWS",
    location: "Prayagraj",
    status: "Online",
    temperature: 31.4,
    humidity: 64,
    pressure: 1009,
    wind: 14,
  },
  {
    id: "AWS002",
    name: "Delhi AWS",
    location: "Delhi",
    status: "Online",
    temperature: 48.7,
    humidity: 72,
    pressure: 1008,
    wind: 18,
  },
  {
    id: "AWS003",
    name: "Lucknow AWS",
    location: "Lucknow",
    status: "Online",
    temperature: 34.2,
    humidity: 61,
    pressure: 1011,
    wind: 11,
  },
  {
    id: "AWS004",
    name: "Kanpur AWS",
    location: "Kanpur",
    status: "Offline",
    temperature: 29.8,
    humidity: 69,
    pressure: 1013,
    wind: 8,
  },
  {
    id: "AWS005",
    name: "Varanasi AWS",
    location: "Varanasi",
    status: "Online",
    temperature: 32.6,
    humidity: 67,
    pressure: 1010,
    wind: 13,
  },
  {
    id: "AWS006",
    name: "Gwalior AWS",
    location: "Gwalior",
    status: "Offline",
    temperature: 30.2,
    humidity: 58,
    pressure: 1014,
    wind: 9,
  },
];

const alerts = [
  {
    id: "ANM001",
    station: "Delhi AWS",
    type: "Temperature Spike",
    value: "48.7°C",
    severity: "HIGH",
    confidence: 94,
    message: "Temperature is substantially above its 24-hour baseline.",
  },
  {
    id: "ANM002",
    station: "Naini AWS",
    type: "Pressure Drop",
    value: "1009 hPa",
    severity: "MEDIUM",
    confidence: 87,
    message: "Pressure changed sharply relative to the previous observation.",
  },
];

function Dashboard({ setPage }) {
  const onlineStations = stations.filter(
    (station) => station.status === "Online"
  ).length;

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">REAL-TIME MONITORING</p>
          <h1>
            Weather <span>Overview</span>
          </h1>
          <p className="subtitle">
            Monitor your Automatic Weather Station network.
          </p>
        </div>

        <div className="date-box">
          <span>Today</span>
          <strong>26 Aug 2026</strong>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="summary-grid">
        <div className="summary-card blue">
          <div className="summary-icon">◉</div>
          <div>
            <p>Total Stations</p>
            <h2>{stations.length}</h2>
          </div>
        </div>

        <div className="summary-card green">
          <div className="summary-icon">●</div>
          <div>
            <p>Online Stations</p>
            <h2>{onlineStations}</h2>
          </div>
        </div>

        <div className="summary-card red">
          <div className="summary-icon">🚨</div>
          <div>
            <p>Active Alerts</p>
            <h2>{alerts.length}</h2>
          </div>
        </div>

        <div className="summary-card orange">
          <div className="summary-icon">°</div>
          <div>
            <p>Avg Temperature</p>
            <h2>33.3°C</h2>
          </div>
        </div>
      </div>

      {/* SENSOR OVERVIEW */}
      <section className="section">
        <div className="section-title">
          <div>
            <h2>Current Conditions</h2>
            <p>Latest readings across the network</p>
          </div>
        </div>

        <div className="sensor-grid">
          <div className="sensor-card temperature">
            <div className="sensor-top">
              <div className="sensor-symbol">🌡</div>
              <span className="status-dot green-dot"></span>
            </div>
            <p>Temperature</p>
            <h3>28.6°C</h3>
            <span className="normal">Normal</span>
          </div>

          <div className="sensor-card pressure">
            <div className="sensor-top">
              <div className="sensor-symbol">◉</div>
              <span className="status-dot green-dot"></span>
            </div>
            <p>Pressure</p>
            <h3>1012 hPa</h3>
            <span className="normal">Normal</span>
          </div>

          <div className="sensor-card humidity">
            <div className="sensor-top">
              <div className="sensor-symbol">💧</div>
              <span className="status-dot green-dot"></span>
            </div>
            <p>Humidity</p>
            <h3>67%</h3>
            <span className="normal">Normal</span>
          </div>

          <div className="sensor-card wind">
            <div className="sensor-top">
              <div className="sensor-symbol">〰</div>
              <span className="status-dot green-dot"></span>
            </div>
            <p>Wind Speed</p>
            <h3>12 km/h</h3>
            <span className="normal">Light Breeze</span>
          </div>
        </div>
      </section>

      {/* GRAPH */}
      <section className="section">
        <div className="section-title">
          <div>
            <h2>Temperature Trend</h2>
            <p>Last 24 hours</p>
          </div>

          <button className="small-button">24 Hours ▾</button>
        </div>

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
                <linearGradient
                  id="temperatureGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopOpacity="0.35" />
                  <stop offset="100%" stopOpacity="0" />
                </linearGradient>
              </defs>

              <path
                d="M0 170
                   C40 150, 70 160, 100 145
                   S150 120, 180 140
                   S230 180, 260 155
                   S310 100, 340 125
                   S390 150, 420 115
                   S470 80, 500 105
                   S550 135, 580 90
                   S630 65, 660 95
                   S720 120, 750 65
                   S780 45, 800 55
                   L800 250
                   L0 250 Z"
                className="chart-area"
              />

              <path
                d="M0 170
                   C40 150, 70 160, 100 145
                   S150 120, 180 140
                   S230 180, 260 155
                   S310 100, 340 125
                   S390 150, 420 115
                   S470 80, 500 105
                   S550 135, 580 90
                   S630 65, 660 95
                   S720 120, 750 65
                   S780 45, 800 55"
                className="chart-line"
              />
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
      </section>

      {/* ALERTS */}
      <section className="section">
        <div className="section-title">
          <div>
            <h2>Critical Alerts</h2>
            <p>Recent anomalies detected by SkyGuard</p>
          </div>

          <button
            className="view-all"
            onClick={() => setPage("alerts")}
          >
            View All →
          </button>
        </div>

        <div className="alerts-list">
          {alerts.map((alert) => (
            <div
              className={`alert-card ${alert.severity.toLowerCase()}`}
              key={alert.id}
            >
              <div className="alert-icon">🚨</div>

              <div className="alert-info">
                <h3>{alert.type} Detected</h3>
                <p>
                  {alert.station} · {alert.value}
                </p>
              </div>

              <div className="alert-confidence">
                <strong>{alert.severity}</strong>
                <span>{alert.confidence}% confidence</span>
              </div>

              <button
                className="alert-button"
                onClick={() => setPage("alerts")}
              >
                View →
              </button>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function Stations({ setSelectedStation, setPage }) {
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">AWS NETWORK</p>
          <h1>
            Weather <span>Stations</span>
          </h1>
          <p className="subtitle">
            Monitor individual Automatic Weather Stations.
          </p>
        </div>
      </div>

      <div className="station-grid">
        {stations.map((station) => (
          <div className="station-card" key={station.id}>
            <div className="station-card-top">
              <div className="station-icon">☁</div>

              <span
                className={
                  station.status === "Online"
                    ? "station-status online"
                    : "station-status offline"
                }
              >
                ● {station.status}
              </span>
            </div>

            <p className="station-id">{station.id}</p>

            <h2>{station.name}</h2>

            <p className="station-location">📍 {station.location}</p>

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

            <button
              className="station-button"
              onClick={() => {
                setSelectedStation(station);
                setPage("station-details");
              }}
            >
              View Station →
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

function StationDetails({ station, setPage }) {
  if (!station) {
    return (
      <div className="empty-state">
        <h2>No station selected</h2>
        <button onClick={() => setPage("stations")}>
          Go to Stations
        </button>
      </div>
    );
  }

  return (
    <>
      <button className="back-button" onClick={() => setPage("stations")}>
        ← Back to Stations
      </button>

      <div className="station-detail-header">
        <div>
          <p className="eyebrow">STATION DETAILS</p>
          <h1>{station.name}</h1>
          <p>{station.location} · {station.id}</p>
        </div>

        <span className="station-status online">● Online</span>
      </div>

      <div className="detail-grid">
        <div className="detail-card temperature-detail">
          <span>🌡</span>
          <p>Temperature</p>
          <strong>{station.temperature}°C</strong>
        </div>

        <div className="detail-card pressure-detail">
          <span>◉</span>
          <p>Pressure</p>
          <strong>{station.pressure} hPa</strong>
        </div>

        <div className="detail-card humidity-detail">
          <span>💧</span>
          <p>Humidity</p>
          <strong>{station.humidity}%</strong>
        </div>

        <div className="detail-card wind-detail">
          <span>〰</span>
          <p>Wind Speed</p>
          <strong>{station.wind} km/h</strong>
        </div>
      </div>

      <div className="detail-chart-card">
        <div className="section-title">
          <div>
            <h2>Station Temperature</h2>
            <p>Temperature variation over the last 24 hours</p>
          </div>
        </div>

        <div className="big-chart">
          <svg viewBox="0 0 900 300" preserveAspectRatio="none">
            <path
              d="M0 220
              C70 200, 100 210, 150 180
              S230 160, 270 190
              S350 120, 400 150
              S470 110, 520 135
              S600 90, 650 125
              S720 80, 760 105
              S830 60, 900 80"
              className="chart-line"
            />
          </svg>
        </div>
      </div>
    </>
  );
}

function Alerts({ setPage }) {
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">ANOMALY MONITORING</p>
          <h1>
            Active <span>Alerts</span>
          </h1>
          <p className="subtitle">
            AI-detected anomalies across your weather stations.
          </p>
        </div>
      </div>

      <div className="alert-page-list">
        {alerts.map((alert) => (
          <div
            className={`large-alert ${alert.severity.toLowerCase()}`}
            key={alert.id}
          >
            <div className="large-alert-icon">🚨</div>

            <div className="large-alert-content">
              <div className="large-alert-heading">
                <span className={`severity ${alert.severity.toLowerCase()}`}>
                  {alert.severity}
                </span>
                <span>{alert.id}</span>
              </div>

              <h2>{alert.type} Detected</h2>

              <p>
                <strong>{alert.station}</strong> · Current reading{" "}
                <strong>{alert.value}</strong>
              </p>

              <p className="alert-description">{alert.message}</p>

              <div className="alert-actions">
                <span>
                  Model confidence: <strong>{alert.confidence}%</strong>
                </span>

                <button
                  onClick={() => setPage("station-details")}
                >
                  Investigate →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function About() {
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">ABOUT SKyGUARD</p>
          <h1>
            Intelligent <span>Weather Monitoring</span>
          </h1>
          <p className="subtitle">
            Understanding the system behind SkyGuard AI.
          </p>
        </div>
      </div>

      <div className="about-grid">
        <div className="about-card about-main">
          <div className="about-logo">☁</div>

          <h2>SkyGuard AI</h2>

          <p>
            SkyGuard is an intelligent monitoring platform designed to
            observe Automatic Weather Stations and identify unusual sensor
            behaviour.
          </p>

          <p>
            The platform brings together real-time weather readings,
            anomaly detection, station monitoring and AI-assisted
            diagnosis in a single dashboard.
          </p>
        </div>

        <div className="about-card">
          <span className="about-number">01</span>
          <h3>Real-Time Monitoring</h3>
          <p>
            Monitor temperature, pressure, humidity and other station
            readings.
          </p>
        </div>

        <div className="about-card">
          <span className="about-number">02</span>
          <h3>Anomaly Detection</h3>
          <p>
            Detect unusual sensor behaviour and highlight potentially
            critical events.
          </p>
        </div>

        <div className="about-card">
          <span className="about-number">03</span>
          <h3>AI Diagnosis</h3>
          <p>
            Provide model-based diagnosis, evidence and recommended
            actions for detected anomalies.
          </p>
        </div>
      </div>
    </>
  );
}

function App() {
  const [page, setPage] = useState("dashboard");
  const [selectedStation, setSelectedStation] = useState(null);

  const renderPage = () => {
    if (page === "stations") {
      return (
        <Stations
          setSelectedStation={setSelectedStation}
          setPage={setPage}
        />
      );
    }

    if (page === "station-details") {
      return (
        <StationDetails
          station={selectedStation}
          setPage={setPage}
        />
      );
    }

    if (page === "alerts") {
      return <Alerts setPage={setPage} />;
    }

    if (page === "about") {
      return <About />;
    }

    return <Dashboard setPage={setPage} />;
  };

  return (
    <div className="app">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="brand" onClick={() => setPage("dashboard")}>
          <div className="brand-icon">☁</div>
          <div>
            <strong>SkyGuard</strong>
            <span>AI MONITORING</span>
          </div>
        </div>

        <div className="nav-section">
          <p>MAIN MENU</p>

          <button
            className={page === "dashboard" ? "nav-item active" : "nav-item"}
            onClick={() => setPage("dashboard")}
          >
            <span>⌂</span>
            Dashboard
          </button>

          <button
            className={
              page === "stations" || page === "station-details"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => setPage("stations")}
          >
            <span>◉</span>
            Stations
          </button>

          <button
            className={page === "alerts" ? "nav-item active" : "nav-item"}
            onClick={() => setPage("alerts")}
          >
            <span>🚨</span>
            Alerts
            <b>{alerts.length}</b>
          </button>
        </div>

        <div className="nav-section">
          <p>INFORMATION</p>

          <button
            className={page === "about" ? "nav-item active" : "nav-item"}
            onClick={() => setPage("about")}
          >
            <span>ⓘ</span>
            About
          </button>
        </div>

        <div className="sidebar-bottom">
          <div className="profile">
            <div className="avatar">A</div>
            <div>
              <strong>Ankita</strong>
              <span>Administrator</span>
            </div>
          </div>

          <div className="system-status">
            <span></span>
            System monitoring active
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main">
        <header className="topbar">
          <div>
            <span className="live-dot"></span>
            LIVE MONITORING
          </div>

          <div className="topbar-right">
            <button className="notification">🔔</button>
            <span>Admin</span>
            <div className="top-avatar">A</div>
          </div>
        </header>

        <div className="content">{renderPage()}</div>
      </main>
    </div>
  );
}

export default App;