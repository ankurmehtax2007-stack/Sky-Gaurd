import config from "../../config/config.js";
import logger from "../../utils/logger.js";

/**
 * Forwards RAW telemetry directly to the Python FastAPI ML Engine.
 * Node.js performs NO feature engineering, ML inference, physics checks, or anomaly classification.
 */
export const analyzeTelemetry = async (rawTelemetryPayload) => {
    const mlUrl = (config.mlServiceURL || "http://localhost:8000").replace(/\/+$/, "");
    try {
        const response = await fetch(`${mlUrl}/api/analyze`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(rawTelemetryPayload)
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Python ML Engine returned HTTP ${response.status}: ${errText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        logger.error({ err: error.message }, "Error communicating with Python FastAPI ML service");
        throw error;
    }
};

export const predictReading = analyzeTelemetry;
export default { analyzeTelemetry, predictReading };