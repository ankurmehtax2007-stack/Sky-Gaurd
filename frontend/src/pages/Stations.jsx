import React, { useState, useMemo } from "react";

function Stations({ stations = [], alerts = [], stationHistory = {}, setActivePage, setSelectedStation, onInspectAlert }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCityFilter, setSelectedCityFilter] = useState("ALL");

  // Group stations by City
  const groupedByCity = useMemo(() => {
    const map = {};
    for (const st of stations) {
      const city = st.city || st.location || "Regional";
      if (!map[city]) map[city] = [];
      map[city].push(st);
    }
    return map;
  }, [stations]);

  const cities = useMemo(() => Object.keys(groupedByCity), [groupedByCity]);

  // Filter stations
  const filteredCities = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const result = {};

    for (const [city, stList] of Object.entries(groupedByCity)) {
      if (selectedCityFilter !== "ALL" && city !== selectedCityFilter) continue;

      const matched = stList.filter(s => {
        const name = (s.station_name || "").toLowerCase();
        const id = (s.station_id || s.stationId || "").toLowerCase();
        const cluster = (s.cluster || "").toLowerCase();
        return !q || name.includes(q) || id.includes(q) || city.toLowerCase().includes(q) || cluster.includes(q);
      });

      if (matched.length > 0) {
        result[city] = matched;
      }
    }
    return result;
  }, [groupedByCity, searchQuery, selectedCityFilter]);

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">AUTOMATIC WEATHER STATION (AWS) MONITORING</p>
          <h1>
            Live <span>Stations</span> by City
          </h1>
          <p className="subtitle">
            Real-time multi-parameter telemetry, health scores, and live anomaly streams organized across Indian metropolitan nodes.
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div className="date-box">
            <span>Monitored Cities</span>
            <strong style={{ color: "#35df9a" }}>{cities.length} Cities ({stations.length} Nodes)</strong>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "24px", background: "#101522", padding: "14px 18px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)", alignItems: "center" }}>
        <div style={{ flex: "1 1 240px" }}>
          <input
            type="text"
            placeholder="Search by station name, ID (e.g. IMD-DEL-001), or cluster..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: "100%", background: "#0b0f19", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "8px 12px", borderRadius: "6px", fontSize: "12px" }}
          />
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span style={{ fontSize: "11px", color: "#747d94" }}>City:</span>
          <select
            value={selectedCityFilter}
            onChange={(e) => setSelectedCityFilter(e.target.value)}
            style={{ background: "#0b0f19", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "8px 12px", borderRadius: "6px", fontSize: "12px" }}
          >
            <option value="ALL">All Cities ({stations.length})</option>
            {cities.map(c => (
              <option key={c} value={c}>{c} ({groupedByCity[c]?.length || 0})</option>
            ))}
          </select>
        </div>
      </div>

      {/* CITY SECTIONS */}
      {Object.keys(filteredCities).length === 0 ? (
        <div style={{ padding: "40px", textAlign: "center", background: "#101522", borderRadius: "12px", color: "#747d94" }}>
          No weather stations match the specified search or filter criteria.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          {Object.entries(filteredCities).map(([city, stList]) => {
            const cityAlerts = alerts.filter(a => stList.some(s => (s.station_id || s.stationId) === (a.station_id || a.station?.id)));
            const hasCityAnomaly = cityAlerts.length > 0;

            return (
              <section key={city} style={{ background: "#0d111d", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.07)", padding: "20px" }}>
                {/* CITY HEADER */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "20px" }}>📍</span>
                    <div>
                      <h2 style={{ margin: 0, fontSize: "17px", color: "#f5f7ff" }}>
                        {city} <span style={{ fontSize: "12px", color: "#747d94", fontWeight: "normal" }}>({stList.length} Station{stList.length > 1 ? "s" : ""})</span>
                      </h2>
                      <span style={{ fontSize: "11px", color: "#747d94" }}>Regional cluster: {stList[0]?.cluster || "Regional"}</span>
                    </div>
                  </div>

                  <div>
                    <span style={{
                      padding: "4px 10px",
                      borderRadius: "20px",
                      fontSize: "11px",
                      fontWeight: "bold",
                      background: hasCityAnomaly ? "rgba(239, 61, 89, 0.15)" : "rgba(53, 223, 154, 0.15)",
                      color: hasCityAnomaly ? "#ef3d59" : "#35df9a",
                      border: `1px solid ${hasCityAnomaly ? "rgba(239,61,89,0.3)" : "rgba(53,223,154,0.3)"}`
                    }}>
                      {hasCityAnomaly ? `⚠ ${cityAlerts.length} Active Anomaly` : "✓ Nominal Status"}
                    </span>
                  </div>
                </div>

                {/* STATIONS LIST UNDER THIS CITY */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "16px" }}>
                  {stList.map(station => {
                    const sId = station.station_id || station.stationId;
                    const stAlerts = alerts.filter(a => (a.station_id || a.station?.id) === sId);
                    const isOnline = station.status !== "OFFLINE";
                    const currentAnomaly = stAlerts.length > 0 ? stAlerts[0] : null;
                    const healthScore = station.health_score ?? (currentAnomaly ? 68 : 98);
                    const healthColor = healthScore >= 80 ? "#35df9a" : healthScore >= 60 ? "#f59e0b" : "#ef3d59";

                    const hist = stationHistory[sId] || [];

                    return (
                      <div
                        key={sId}
                        style={{
                          background: "#101522",
                          borderRadius: "12px",
                          border: currentAnomaly ? "1px solid rgba(239, 61, 89, 0.4)" : "1px solid rgba(255,255,255,0.06)",
                          padding: "16px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "14px",
                          boxShadow: currentAnomaly ? "0 0 15px rgba(239, 61, 89, 0.08)" : "none"
                        }}
                      >
                        {/* STATION TITLE & ID */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <strong style={{ fontSize: "14px", color: "#f5f7ff", display: "block" }}>
                              {station.station_name}
                            </strong>
                            <span style={{ fontSize: "11px", color: "#6877ff", fontFamily: "monospace" }}>
                              Station ID: {sId}
                            </span>
                          </div>

                          <div style={{ textAlign: "right" }}>
                            <span style={{
                              padding: "2px 8px",
                              borderRadius: "4px",
                              fontSize: "10px",
                              fontWeight: "bold",
                              background: isOnline ? "rgba(53,223,154,0.15)" : "rgba(239,61,89,0.15)",
                              color: isOnline ? "#35df9a" : "#ef3d59"
                            }}>
                              ● {station.status || "ONLINE"}
                            </span>
                          </div>
                        </div>

                        {/* LIVE TELEMETRY SENSOR ROW */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", background: "rgba(0,0,0,0.25)", padding: "10px", borderRadius: "8px" }}>
                          <div>
                            <span style={{ fontSize: "10px", color: "#747d94", display: "block" }}>🌡 Temp</span>
                            <strong style={{ fontSize: "14px", color: "#ff995e" }}>
                              {Number(station.temperature ?? 28.5).toFixed(1)}°C
                            </strong>
                          </div>

                          <div>
                            <span style={{ fontSize: "10px", color: "#747d94", display: "block" }}>💧 Humidity</span>
                            <strong style={{ fontSize: "14px", color: "#35c8ff" }}>
                              {Number(station.humidity ?? 55.0).toFixed(0)}%
                            </strong>
                          </div>

                          <div>
                            <span style={{ fontSize: "10px", color: "#747d94", display: "block" }}>◉ Pressure</span>
                            <strong style={{ fontSize: "14px", color: "#c084fc" }}>
                              {Number(station.pressure ?? 1008.0).toFixed(0)} hPa
                            </strong>
                          </div>
                        </div>

                        {/* SENSOR HEALTH & CURRENT ANOMALY STATUS */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "10px" }}>
                          <div>
                            <span style={{ color: "#747d94" }}>Health Score: </span>
                            <strong style={{ color: healthColor }}>{healthScore}/100</strong>
                          </div>

                          <div>
                            {currentAnomaly ? (
                              <span style={{ color: "#ef3d59", fontWeight: "bold" }}>
                                ⚠ {String(currentAnomaly.root_cause || "Anomaly").replace(/_/g, " ").toUpperCase()}
                              </span>
                            ) : (
                              <span style={{ color: "#35df9a" }}>
                                ✓ Normal State
                              </span>
                            )}
                          </div>
                        </div>

                        {/* STATION ANOMALY HISTORY LIST (WITH INSPECT BUTTON) */}
                        <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: "8px", padding: "10px", border: "1px solid rgba(255,255,255,0.04)" }}>
                          <span style={{ fontSize: "11px", color: "#747d94", fontWeight: "600", display: "block", marginBottom: "6px" }}>
                            Station Anomaly History ({stAlerts.length})
                          </span>

                          {stAlerts.length === 0 ? (
                            <span style={{ fontSize: "11px", color: "#747d94" }}>No active incidents logged for this node.</span>
                          ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                              {stAlerts.map(alt => (
                                <div
                                  key={alt.anomaly_id}
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    background: "#0b0f19",
                                    padding: "6px 10px",
                                    borderRadius: "6px",
                                    border: "1px solid rgba(255,255,255,0.04)"
                                  }}
                                >
                                  <div>
                                    <strong style={{ fontSize: "11px", color: "#ff5e78", display: "block" }}>
                                      {String(alt.root_cause || "Anomaly").replace(/_/g, " ").toUpperCase()}
                                    </strong>
                                    <span style={{ fontSize: "10px", color: "#747d94" }}>
                                      {new Date(alt.timestamp || Date.now()).toLocaleTimeString()} · Conf: {(Number(alt.confidence || 0.92) * 100).toFixed(0)}%
                                    </span>
                                  </div>

                                  <button
                                    className="sim-btn sim-btn-trigger"
                                    style={{ padding: "4px 10px", fontSize: "10px" }}
                                    onClick={() => {
                                      if (onInspectAlert) onInspectAlert(alt);
                                    }}
                                  >
                                    🔍 INSPECT
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* DEEP DIVE BUTTON */}
                        <button
                          className="sim-btn"
                          style={{
                            width: "100%",
                            textAlign: "center",
                            fontSize: "11px",
                            padding: "8px 0",
                            background: "rgba(104, 119, 255, 0.1)",
                            border: "1px solid rgba(104, 119, 255, 0.3)",
                            color: "#8b97ff"
                          }}
                          onClick={() => {
                            if (setSelectedStation) setSelectedStation(station);
                            setActivePage("stationDetails");
                          }}
                        >
                          Deep Dive & Historical Waveforms →
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}

export default Stations;
