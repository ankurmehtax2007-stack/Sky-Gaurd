import React from "react";
import { alerts } from "../data/mockData";

function Sidebar({ activePage, setActivePage }) {
  return (
    <aside className="sidebar">
      <div className="brand" onClick={() => setActivePage("dashboard")}>
        <div className="brand-icon">☁</div>
        <div>
          <strong>SkyGuard</strong>
          <span>AI MONITORING</span>
        </div>
      </div>

      <div className="nav-section">
        <p>MAIN MENU</p>

        <button
          className={activePage === "dashboard" ? "nav-item active" : "nav-item"}
          onClick={() => setActivePage("dashboard")}
        >
          <span>⌂</span>
          Dashboard
        </button>

        <button
          className={
            activePage === "stations" || activePage === "stationDetails"
              ? "nav-item active"
              : "nav-item"
          }
          onClick={() => setActivePage("stations")}
        >
          <span>◉</span>
          Stations
        </button>

        <button
          className={
            activePage === "alerts" || activePage === "alertDetails"
              ? "nav-item active"
              : "nav-item"
          }
          onClick={() => setActivePage("alerts")}
        >
          <span>🚨</span>
          Alerts
          <b>{alerts.length}</b>
        </button>
      </div>

      <div className="nav-section">
        <p>INFORMATION</p>

        <button
          className={activePage === "about" ? "nav-item active" : "nav-item"}
          onClick={() => setActivePage("about")}
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
  );
}

export default Sidebar;
