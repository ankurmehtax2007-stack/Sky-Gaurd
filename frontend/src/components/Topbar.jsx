import React from "react";

function Topbar() {
  return (
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
  );
}

export default Topbar;
