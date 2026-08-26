import React from "react";

function About() {
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">ABOUT SKYGUARD</p>
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
            anomaly detection, station monitoring and AI-assisted diagnosis
            in a single dashboard.
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
            Provide model-based diagnosis, evidence and recommended actions
            for detected anomalies.
          </p>
        </div>
      </div>
    </>
  );
}

export default About;
