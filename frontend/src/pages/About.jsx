import React from "react";

function About() {

  return (
    <div className="page about-page">

      <p className="eyebrow">
        ABOUT SKyGUARD
      </p>

      <h1>
        SkyGuard <span>AI</span>
      </h1>

      <p className="about-intro">
        Intelligent anomaly detection and monitoring
        for Automatic Weather Stations.
      </p>


      <div className="about-grid">

        <div className="about-box">

          <div className="about-icon">
            ◉
          </div>

          <h2>Real-Time Monitoring</h2>

          <p>
            SkyGuard continuously monitors sensor
            readings from Automatic Weather Stations
            including temperature, humidity and
            atmospheric pressure.
          </p>

        </div>


        <div className="about-box">

          <div className="about-icon">
            ✦
          </div>

          <h2>AI Anomaly Detection</h2>

          <p>
            Machine learning models identify unusual
            sensor behaviour and calculate anomaly
            scores and confidence.
          </p>

        </div>


        <div className="about-box">

          <div className="about-icon">
            🚨
          </div>

          <h2>Intelligent Alerts</h2>

          <p>
            Detected anomalies are transformed into
            actionable alerts with severity,
            diagnosis and recommended actions.
          </p>

        </div>


        <div className="about-box">

          <div className="about-icon">
            ◎
          </div>

          <h2>Explainable AI</h2>

          <p>
            SHAP evidence helps explain which sensor
            features contributed to the detected
            anomaly.
          </p>

        </div>

      </div>

    </div>
  );
}

export default About;