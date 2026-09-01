// anomalyInjector.js
/*
 * SkyGuard AI - Manual Anomaly Injection Engine
 *
 * Supported 9 Anomaly Types:
 * 1. temperature_spike           -> Sudden abnormal temperature shift
 * 2. humidity_spike              -> Sudden abnormal RH saturation jump
 * 3. pressure_jump               -> Sudden abnormal barometric pressure change
 * 4. freeze                      -> Sensor value locked unchanged across consecutive readings
 * 5. drift                       -> Monotonic gradual calibration drift away from baseline
 * 6. offset                      -> Sudden persistent calibration step bias
 * 7. missing_data                -> Null/missing sensor values with preserved timestamp
 * 8. multivariate_inconsistency  -> Psychrometric / thermodynamic cross-sensor conflict
 * 9. spatial_inconsistency       -> Station deviates sharply from companion station in same city
 *
 * IMPORTANT:
 * Normal telemetry is sent by default. Manual injection affects a 6-record window (60s),
 * after which the station automatically returns to normal without permanent baseline changes.
 */

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const normalizeAnomalyType = (type) => {
    if (!type) return null;

    const mapping = {
        1: "temperature_spike",
        2: "humidity_spike",
        3: "pressure_jump",
        4: "freeze",
        5: "drift",
        6: "offset",
        7: "missing_data",
        8: "multivariate_inconsistency",
        9: "spatial_inconsistency",

        temp_spike: "temperature_spike",
        temperature_spike: "temperature_spike",
        temperature: "temperature_spike",

        humidity_spike: "humidity_spike",
        humidity_saturation: "humidity_spike",
        humidity: "humidity_spike",

        pressure_jump: "pressure_jump",
        pressure_drop: "pressure_jump",
        pressure: "pressure_jump",

        freeze: "freeze",
        frozen: "freeze",
        frozen_sensor: "freeze",

        drift: "drift",
        sensor_drift: "drift",

        offset: "offset",
        offset_step: "offset",

        missing_data: "missing_data",
        null_data: "missing_data",

        multivariate_inconsistency: "multivariate_inconsistency",
        physics_conflict: "multivariate_inconsistency",

        spatial_inconsistency: "spatial_inconsistency",
        spatial_outlier: "spatial_inconsistency"
    };

    const key = String(type).trim().toLowerCase();
    return mapping[key] || key;
};

/**
 * Applies a manual anomaly transformation to a single reading based on injection config and current step (1..6).
 *
 * @param {Object} reading - The generated normal AWS reading object
 * @param {Object} injectionConfig - Active injection details
 * @param {string} injectionConfig.anomaly_type - Normalized anomaly type
 * @param {number} injectionConfig.stepIndex - 1-based index in the 6-record sequence (1..6)
 * @param {string} [injectionConfig.sensor] - Target sensor ('temperature', 'humidity', 'pressure', or 'all')
 * @param {string} [injectionConfig.intensity] - 'medium', 'high', 'extreme'
 * @param {any} [injectionConfig.frozenValue] - Cached value for freeze
 * @returns {Object} Modified reading
 */
export const applyManualAnomaly = (reading, injectionConfig) => {
    if (!injectionConfig || !injectionConfig.anomaly_type) {
        return reading;
    }

    const type = normalizeAnomalyType(injectionConfig.anomaly_type);
    const step = injectionConfig.stepIndex || 1;
    const intensity = injectionConfig.intensity || "high";
    const targetSensor = injectionConfig.sensor || "temperature";

    switch (type) {
        /*
         * 1. TEMPERATURE SPIKE
         * Sudden large ΔT jump
         */
        case "temperature_spike": {
            const delta = intensity === "medium" ? 12.5 : (intensity === "extreme" ? 22.0 : 16.5);
            reading.temperature_c = Number((reading.temperature_c + delta).toFixed(2));
            reading.temperature = reading.temperature_c;
            reading.data_quality = "suspect";
            break;
        }

        /*
         * 2. HUMIDITY SATURATION / SPIKE
         * Sudden abnormal RH increase toward saturation (RH >= 98.5%)
         */
        case "humidity_spike": {
            const targetRh = intensity === "medium" ? 96.5 : 99.5;
            reading.humidity_pct = clamp(targetRh, 10, 100);
            reading.humidity = reading.humidity_pct;
            reading.data_quality = "suspect";
            break;
        }

        /*
         * 3. PRESSURE JUMP / DROP
         * Sudden abnormal barometric pressure change (-20 hPa)
         */
        case "pressure_jump": {
            const deltaP = intensity === "medium" ? -14.0 : (intensity === "extreme" ? -28.0 : -22.0);
            reading.pressure_hpa = Number((reading.pressure_hpa + deltaP).toFixed(1));
            reading.pressure = reading.pressure_hpa;
            reading.data_quality = "suspect";
            break;
        }

        /*
         * 4. FREEZE
         * Sensor locked at constant value across consecutive readings (variance = 0)
         */
        case "freeze": {
            const frozenVal = injectionConfig.frozenValue;
            if (targetSensor === "humidity") {
                const val = frozenVal !== undefined ? frozenVal : reading.humidity_pct;
                injectionConfig.frozenValue = val;
                reading.humidity_pct = val;
                reading.humidity = val;
            } else if (targetSensor === "pressure") {
                const val = frozenVal !== undefined ? frozenVal : reading.pressure_hpa;
                injectionConfig.frozenValue = val;
                reading.pressure_hpa = val;
                reading.pressure = val;
            } else {
                const val = frozenVal !== undefined ? frozenVal : reading.temperature_c;
                injectionConfig.frozenValue = val;
                reading.temperature_c = val;
                reading.temperature = val;
            }
            reading.data_quality = "suspect";
            break;
        }

        /*
         * 5. DRIFT
         * Monotonic progressive deviation across the 6-record sequence
         */
        case "drift": {
            const stepMultiplier = step; // 1, 2, 3, 4, 5, 6
            if (targetSensor === "humidity") {
                const stepSize = intensity === "medium" ? 2.5 : 4.0;
                reading.humidity_pct = clamp(Number((reading.humidity_pct + (stepMultiplier * stepSize)).toFixed(1)), 5, 100);
                reading.humidity = reading.humidity_pct;
            } else if (targetSensor === "pressure") {
                const stepSize = intensity === "medium" ? 0.8 : 1.5;
                reading.pressure_hpa = Number((reading.pressure_hpa + (stepMultiplier * stepSize)).toFixed(1));
                reading.pressure = reading.pressure_hpa;
            } else {
                const stepSize = intensity === "medium" ? 0.75 : 1.25;
                reading.temperature_c = Number((reading.temperature_c + (stepMultiplier * stepSize)).toFixed(2));
                reading.temperature = reading.temperature_c;
            }
            reading.data_quality = "suspect";
            break;
        }

        /*
         * 6. OFFSET
         * Sudden persistent calibration bias that stays stable across the 6-record window
         */
        case "offset": {
            if (targetSensor === "humidity") {
                const bias = intensity === "medium" ? 18.0 : 25.0;
                reading.humidity_pct = clamp(Number((reading.humidity_pct + bias).toFixed(1)), 5, 100);
                reading.humidity = reading.humidity_pct;
            } else if (targetSensor === "pressure") {
                const bias = intensity === "medium" ? 10.0 : 16.0;
                reading.pressure_hpa = Number((reading.pressure_hpa + bias).toFixed(1));
                reading.pressure = reading.pressure_hpa;
            } else {
                const bias = intensity === "medium" ? 6.5 : 9.5;
                reading.temperature_c = Number((reading.temperature_c + bias).toFixed(2));
                reading.temperature = reading.temperature_c;
            }
            reading.data_quality = "suspect";
            break;
        }

        /*
         * 7. MISSING DATA
         * Sends null/missing values while preserving real timestamp & station identity
         */
        case "missing_data": {
            if (targetSensor === "humidity") {
                reading.humidity_pct = null;
                reading.humidity = null;
            } else if (targetSensor === "pressure") {
                reading.pressure_hpa = null;
                reading.pressure = null;
            } else if (targetSensor === "all" || targetSensor === "all_sensors") {
                reading.temperature_c = null;
                reading.temperature = null;
                reading.humidity_pct = null;
                reading.humidity = null;
                reading.pressure_hpa = null;
                reading.pressure = null;
            } else {
                // Default: temperature missing or primary missing channel
                reading.temperature_c = null;
                reading.temperature = null;
            }
            reading.data_quality = "missing";
            break;
        }

        /*
         * 8. MULTIVARIATE INCONSISTENCY (PHYSICS CONFLICT)
         * Extreme temperature (43.8°C) + saturated humidity (94%) violating thermodynamics
         */
        case "multivariate_inconsistency": {
            reading.temperature_c = 43.8;
            reading.temperature = 43.8;
            reading.humidity_pct = 94.0;
            reading.humidity = 94.0;
            reading.data_quality = "suspect";
            break;
        }

        /*
         * 9. SPATIAL INCONSISTENCY
         * One station diverges sharply (+16°C) from its companion in the same city
         */
        case "spatial_inconsistency": {
            const spatialDelta = intensity === "medium" ? 12.0 : 16.5;
            reading.temperature_c = Number((reading.temperature_c + spatialDelta).toFixed(2));
            reading.temperature = reading.temperature_c;
            reading.data_quality = "suspect";
            break;
        }

        default:
            break;
    }

    return reading;
};

export default {
    normalizeAnomalyType,
    applyManualAnomaly
};