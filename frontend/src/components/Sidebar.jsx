import React from "react";

function Sidebar({ activePage, setActivePage }) {

  return (

    <aside className="sidebar">

      {/* LOGO */}

      <div
        className="sidebar-logo"
        onClick={() => setActivePage("dashboard")}
      >

        <img
          src="https://plus.unsplash.com/premium_photo-1677744408402-6c198d22d528?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="SkyGuard"
          className="skyguard-logo"
        />

        <div>

          <h2>SkyGuard</h2>

          <span>AI WEATHER</span>

        </div>

      </div>


      {/* MENU */}

      <div className="sidebar-menu">

        <p className="menu-title">
          MONITORING
        </p>


        <button
          className={
            activePage === "dashboard"
              ? "menu-item active"
              : "menu-item"
          }
          onClick={() => setActivePage("dashboard")}
        >
          <span>⌂</span>
          Dashboard
        </button>


        <button
          className={
            activePage === "stations" ||
            activePage === "stationDetails"
              ? "menu-item active"
              : "menu-item"
          }
          onClick={() => setActivePage("stations")}
        >
          <span>◉</span>
          Stations
        </button>


        <button
          className={
            activePage === "alerts" ||
            activePage === "alertDetails"
              ? "menu-item active"
              : "menu-item"
          }
          onClick={() => setActivePage("alerts")}
        >
          <span>🚨</span>

          Alerts

          <b className="alert-number">
            4
          </b>

        </button>


        <p className="menu-title second-title">
          INFORMATION
        </p>


        <button
          className={
            activePage === "about"
              ? "menu-item active"
              : "menu-item"
          }
          onClick={() => setActivePage("about")}
        >
          <span>ⓘ</span>
          About
        </button>

      </div>


      {/* USER */}

      <div className="sidebar-user">

        <div className="user-avatar">
          A
        </div>

        <div>

          <strong>Ankita</strong>

          <small>
            Administrator
          </small>

        </div>

      </div>

    </aside>

  );
}

export default Sidebar;