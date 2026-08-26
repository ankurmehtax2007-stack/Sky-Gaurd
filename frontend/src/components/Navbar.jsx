import React from "react";

function Navbar() {

  return (

    <header className="navbar">

      <div>

        <p className="nav-small">
          AUTOMATIC WEATHER STATION NETWORK
        </p>

        <h2>
          SkyGuard Monitoring
        </h2>

      </div>


      <div className="nav-right">

        <div className="live-status">

          <span></span>

          LIVE DATA

        </div>


        <div className="nav-date">

          26 Aug 2026

        </div>

      </div>

    </header>

  );
}

export default Navbar;