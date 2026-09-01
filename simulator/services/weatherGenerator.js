// weatherGenerator.js
import { applyManualAnomaly } from "./anomalyInjector.js";

/*
 * SkyGuard AI - Realistic AWS Weather Generator
 *
 * Generates 100% NORMAL weather by default.
 * Anomalies are ONLY applied when explicitly triggered by manual injection.
 * Real-time temporal continuity ensures realistic atmospheric telemetry.
 */

const stationStates = new Map();

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const gaussianNoise = (std = 1) => {
    // Box-Muller transform
    let u = 0;
    let v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();

    return (
        Math.sqrt(-2.0 * Math.log(u)) *
        Math.cos(2.0 * Math.PI * v) *
        std
    );
};

const getState = (station, dateObj) => {
    const stationId = station.station_id || station.stationId;

    if (!stationStates.has(stationId)) {
        stationStates.set(stationId, {
            lastTimestamp: null,
            temperatureResidual: gaussianNoise(0.15),
            humidityResidual: gaussianNoise(0.4),
            pressureResidual: gaussianNoise(0.15),
            temperature: station.baseTemperature ?? 28.5,
            humidity: station.baseHumidity ?? 55.0,
            pressure: station.basePressure ?? 1008.0,
            lastHour: dateObj.getHours()
        });
    }

    return stationStates.get(stationId);
};

/**
 * Generates a single AWS weather reading.
 *
 * @param {Object} station - Station metadata
 * @param {Object|null} injectionConfig - Active injection config (if station is in an active injection window)
 * @param {Date|string} simulatedDate - Real-time timestamp
 * @returns {Object} AWS sensor reading
 */
export const generateReading = (
    station,
    injectionConfig = null,
    simulatedDate = new Date()
) => {
    const dateObj =
        simulatedDate instanceof Date
            ? simulatedDate
            : new Date(simulatedDate);

    const state = getState(station, dateObj);

    // Continuous intraday cycle based on real wall-clock time
    const fractionalHour = dateObj.getHours() + dateObj.getMinutes() / 60.0 + dateObj.getSeconds() / 3600.0;

    /*
     * 1. DAILY DIURNAL WEATHER CYCLE
     */
    const tempAmplitude = station.tempAmplitude ?? 5.5;
    const temperatureCycle = Math.sin(((fractionalHour - 8) * Math.PI) / 12) * tempAmplitude;

    const humidityAmplitude = station.humidityAmplitude ?? 12;
    const humidityCycle = -Math.sin(((fractionalHour - 8) * Math.PI) / 12) * humidityAmplitude;

    const pressureCycle = Math.sin(((fractionalHour - 3) * Math.PI) / 12) * 1.5;

    /*
     * 2. TEMPORAL AUTOCORRELATION (AR-1 RESIDUAL PROCESS)
     */
    state.temperatureResidual = 0.88 * state.temperatureResidual + gaussianNoise(0.08);
    state.humidityResidual = 0.88 * state.humidityResidual + gaussianNoise(0.2);
    state.pressureResidual = 0.94 * state.pressureResidual + gaussianNoise(0.05);

    /*
     * 3. BASE WEATHER COMPONENTS
     */
    const baseTemperature = (station.baseTemperature ?? 28.5) + temperatureCycle;
    const temperatureHumidityEffect = -(temperatureCycle * 0.9);

    let humidity =
        (station.baseHumidity ?? 55.0) +
        humidityCycle +
        temperatureHumidityEffect +
        state.humidityResidual;

    let temperature =
        baseTemperature +
        state.temperatureResidual +
        gaussianNoise(0.05);

    let pressure =
        (station.basePressure ?? 1008.0) +
        pressureCycle +
        state.pressureResidual +
        gaussianNoise(0.04);

    /*
     * 4. OPTIONAL REGIONAL REGIME
     */
    const regime = station.weatherRegime || "normal";
    if (regime === "rainy") {
        humidity += 8;
        pressure -= 2;
        temperature -= 1.5;
    } else if (regime === "cloudy") {
        humidity += 5;
        temperature -= 1;
    } else if (regime === "dry") {
        humidity -= 12;
        temperature += 1;
    }

    /*
     * 5. PHYSICAL BOUNDS & ROUNDING
     */
    temperature = clamp(temperature, -10, 48);
    humidity = clamp(humidity, 10, 98);
    pressure = clamp(pressure, 950, 1050);

    const rawTemp = Number(temperature.toFixed(2));
    const rawHumidity = Number(humidity.toFixed(1));
    const rawPressure = Number(pressure.toFixed(1));

    /*
     * Store normal baseline state (unaffected by temporary manual injections)
     */
    state.temperature = rawTemp;
    state.humidity = rawHumidity;
    state.pressure = rawPressure;
    state.lastTimestamp = dateObj.toISOString();
    state.lastHour = dateObj.getHours();

    /*
     * 6. CREATE PURE RAW AWS READING
     */
    const reading = {
        station_id: station.station_id || station.stationId,
        stationId: station.station_id || station.stationId,
        station_name: station.station_name || station.stationName || "AWS Node",
        city: station.city || "New Delhi",
        state: station.state || "Delhi",
        cluster: station.cluster || "NCR",
        latitude: station.latitude ?? 28.6139,
        longitude: station.longitude ?? 77.2090,
        timestamp: dateObj.toISOString(),

        temperature_c: rawTemp,
        temperature: rawTemp,

        humidity_pct: rawHumidity,
        humidity: rawHumidity,

        pressure_hpa: rawPressure,
        pressure: rawPressure,

        sensor_status: "online",
        data_quality: "good"
    };

    /*
     * 7. APPLY MANUAL INJECTION (IF ACTIVE FOR THIS STATION)
     * If no injectionConfig, returns pure normal reading!
     */
    if (injectionConfig) {
        return applyManualAnomaly(reading, injectionConfig);
    }

    return reading;
};

export default generateReading;