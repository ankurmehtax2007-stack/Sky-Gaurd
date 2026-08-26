import React from "react";
import { stations } from "../data/mockData";

function Stations({ setActivePage, setSelectedStation }) {

  return (
    <div className="page">

      <div className="page-heading">

        <div>

          <p className="eyebrow">
            WEATHER NETWORK
          </p>

          <h1>
            AWS <span>Stations</span>
          </h1>

          <p>
            Monitor individual Automatic Weather Stations.
          </p>

        </div>

      </div>


      <div className="station-page-grid">

        {stations.map((station) => (

          <div
            className="station-card"
            key={station.station_id}
            onClick={() => {
              setSelectedStation(station);
              setActivePage("stationDetails");
            }}
          >

            <div className="station-card-top">

              <div className="station-symbol">
                ◉
              </div>

              <span
                className={`station-badge ${station.status.toLowerCase()}`}
              >
                ● {station.status}
              </span>

            </div>


            <h2>{station.station_name}</h2>

            <p>{station.location}</p>

            <div className="station-id">
              {station.station_id}
            </div>


            {station.status !== "OFFLINE" && (

              <div className="station-readings">

                <div>
                  <small>Temperature</small>
                  <strong>{station.temperature}°C</strong>
                </div>

                <div>
                  <small>Humidity</small>
                  <strong>{station.humidity}%</strong>
                </div>

                <div>
                  <small>Pressure</small>
                  <strong>{station.pressure}</strong>
                </div>

              </div>

            )}


            <div className="station-view">
              View Station →
            </div>

          </div>

        ))}

      </div>

    </div>
  );
}

export default Stations;