import React from "react";
import { stations } from "../data/mockData";
import StationCard from "../components/StationCard";

function Stations({ setActivePage, setSelectedStation }) {
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
          <StationCard
            key={station.station_id}
            station={station}
            onView={() => {
              setSelectedStation(station);
              setActivePage("stationDetails");
            }}
          />
        ))}
      </div>
    </>
  );
}

export default Stations;
