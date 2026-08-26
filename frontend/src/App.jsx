import { useState } from "react";
import "./App.css";

import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";

import Dashboard from "./pages/Dashboard";
import Stations from "./pages/Stations";
import StationDetails from "./pages/StationDetails";
import Alerts from "./pages/Alerts";
import AlertDetails from "./pages/AlertDetails";
import About from "./pages/About";

function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [selectedStation, setSelectedStation] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);

  const renderPage = () => {
    switch (activePage) {
      case "stations":
        return (
          <Stations
            setActivePage={setActivePage}
            setSelectedStation={setSelectedStation}
          />
        );

      case "stationDetails":
        return (
          <StationDetails station={selectedStation} setActivePage={setActivePage} />
        );

      case "alerts":
        return (
          <Alerts setActivePage={setActivePage} setSelectedAlert={setSelectedAlert} />
        );

      case "alertDetails":
        return <AlertDetails alert={selectedAlert} setActivePage={setActivePage} />;

      case "about":
        return <About />;

      default:
        return (
          <Dashboard
            setActivePage={setActivePage}
            setSelectedAlert={setSelectedAlert}
          />
        );
    }
  };

  return (
    <div className="app">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />

      <main className="main">
        <Topbar />
        <div className="content">{renderPage()}</div>
      </main>
    </div>
  );
}

export default App;
