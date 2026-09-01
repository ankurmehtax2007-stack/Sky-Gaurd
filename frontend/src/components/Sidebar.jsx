import React from "react";

function Sidebar({ activePage, setActivePage }) {
  return (
    <aside className="sidebar">
      {/* BRAND & LOGO */}
      <div className="brand" onClick={() => setActivePage("dashboard")} style={{ cursor: "pointer" }}>
        <div className="brand-icon" style={{ background: "linear-gradient(135deg, #6877ff, #35df9a)", borderRadius: "10px", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 16px rgba(104,119,255,0.4)" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" fill="rgba(255,255,255,0.15)"/>
            <polyline points="13 11 10 14 14 14 11 17"/>
          </svg>
        </div>
        <div>
          <strong style={{ fontSize: "16px", letterSpacing: "0.5px" }}>SkyGuard</strong>
          <span style={{ fontSize: "9px", color: "#8b97ff", letterSpacing: "1px", fontWeight: "700" }}>AI OPERATOR</span>
        </div>
      </div>

      {/* NAVIGATION MENU */}
      <div className="nav-section" style={{ flex: 1, overflowY: "auto" }}>
        <p>OPERATIONS</p>

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
          Live Monitoring
        </button>

        <p style={{ marginTop: "24px" }}>INFORMATION</p>

        <button
          className={activePage === "about" ? "nav-item active" : "nav-item"}
          onClick={() => setActivePage("about")}
        >
          <span>ⓘ</span>
          Architecture
        </button>
      </div>

      {/* ADMIN & SYSTEM HEALTH PROFILE */}
      <div className="sidebar-bottom">
        <div className="profile" style={{ background: "rgba(255,255,255,0.03)", padding: "10px 12px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="avatar" style={{ background: "linear-gradient(135deg, #6877ff, #35df9a)", color: "#fff", fontWeight: "bold" }}>A</div>
          <div>
            <strong style={{ fontSize: "12px", color: "#f5f7ff" }}>IMD Control</strong>
            <span style={{ fontSize: "10px", color: "#8b97ff", display: "block" }}>Autonomous Met AI</span>
          </div>
        </div>

        <div className="system-status" style={{ marginTop: "10px" }}>
          <span></span>
          ML Diagnostic Mesh Active
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
