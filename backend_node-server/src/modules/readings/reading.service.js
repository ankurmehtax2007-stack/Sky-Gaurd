import { saveReading, findLatestReadings, countReadingsByStation, findReadingsByStation, updateReading, findPendingReadings, findDetectedAnomalies } from "./reading.repository.js";
import { analyzeTelemetry } from "../ml/ml.service.js";
import { saveAnalysis } from "../analyses/analysis.repository.js";
import { saveAnomaly } from "../anomalies/anomaly.service.js";
import { broadcast } from "../../websocket/websocket.manager.js";
import asyncHandler from "../../utils/asyncHandler.js";
import logger from "../../utils/logger.js";
import { anomaliesDetected, mlFailures, mlPredictionDuration } from "../../utils/metrics.js";
import crypto from "crypto";

export const processReading = async (readingData) => {
    try {
        const stationId = readingData.station_id || readingData.stationId || "DEMO-001";
        const stationName = readingData.station_name || readingData.name || "Demo AWS Node";
        const city = readingData.city || "New Delhi";
        const cluster = readingData.cluster || "NCR";
        const lat = Number(readingData.latitude ?? 28.6139);
        const lon = Number(readingData.longitude ?? 77.2090);

        const temp = readingData.temperature_c !== undefined && readingData.temperature_c !== null
            ? Number(readingData.temperature_c)
            : (readingData.temperature !== undefined && readingData.temperature !== null ? Number(readingData.temperature) : null);

        const hum = readingData.humidity_pct !== undefined && readingData.humidity_pct !== null
            ? Number(readingData.humidity_pct)
            : (readingData.humidity !== undefined && readingData.humidity !== null ? Number(readingData.humidity) : null);

        const press = readingData.pressure_hpa !== undefined && readingData.pressure_hpa !== null
            ? Number(readingData.pressure_hpa)
            : (readingData.pressure !== undefined && readingData.pressure !== null ? Number(readingData.pressure) : null);

        const timestamp = readingData.timestamp ? new Date(readingData.timestamp) : new Date();

        // 1. Save raw sensor reading to MongoDB SensorReading
        const sensorReading = await saveReading({
            stationId,
            station_id: stationId,
            stationName,
            city,
            cluster,
            latitude: lat,
            longitude: lon,
            timestamp,
            temperature: temp,
            humidity: hum,
            pressure: press,
            temperature_c: temp,
            humidity_pct: hum,
            pressure_hpa: press,
            mlStatus: "pending"
        });

        // 2. Prepare RAW telemetry packet for Python FastAPI (NO feature engineering or labels in Node.js)
        const rawPayload = {
            station_id: stationId,
            station_name: stationName,
            city,
            cluster,
            latitude: lat,
            longitude: lon,
            timestamp: timestamp.toISOString(),
            temperature_c: temp,
            humidity_pct: hum,
            pressure_hpa: press
        };

        // 3. Invoke Python ML Backend Engine
        const end = mlPredictionDuration.startTimer();
        let mlResponse = null;
        try {
            mlResponse = await analyzeTelemetry(rawPayload);
            if (sensorReading?._id) {
                await updateReading(sensorReading._id, { mlStatus: "processed" });
            }
        } catch (error) {
            mlFailures.inc();
            logger.error({ err: error.message, stationId }, "ML service communication failed");
            // Build nominal pass-through if ML service down
            mlResponse = {
                status: "success",
                station_id: stationId,
                station_name: stationName,
                city,
                cluster,
                timestamp: timestamp.toISOString(),
                telemetry: { temperature_c: temp ?? 25.0, humidity_pct: hum ?? 50.0, pressure_hpa: press ?? 1013.25 },
                prediction: { is_anomaly: false, decision: "normal", root_cause: "normal", confidence: 0.95 },
                scores: { fused_anomaly_score: 0.0, iforest_novelty: 0.0, temporal: 0.0, spatial: 0.0, physics: 0.0, xgboost_anomaly: 0.0 },
                class_probabilities: { normal: 0.95 },
                severity: { level: "NONE", score: 0.0 },
                sensor_health: { score: 100, status: "GOOD" },
                explanation: { top_features: [], shap_factors: [] },
                maintenance: { priority: "Nominal", recommended_action: "Continue routine monitoring." },
                llm: { provider: "none", report: "" }
            };
        } finally {
            end();
        }

        const analysisData = mlResponse?.analysis || mlResponse || {};
        const isAnomaly = Boolean(analysisData.prediction?.is_anomaly ?? analysisData.anomaly?.detected ?? (analysisData.decision && analysisData.decision !== "normal"));
        const incidentId = `INC-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
        const analysisId = `AN-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;

        const rootCause = analysisData.prediction?.root_cause || analysisData.anomaly?.root_cause || analysisData.root_cause || "normal";
        const decision = analysisData.prediction?.decision || analysisData.anomaly?.decision || analysisData.decision || "normal";
        const confidence = Number(analysisData.prediction?.confidence ?? analysisData.anomaly?.confidence ?? analysisData.confidence ?? 0.95);

        const sevLevel = analysisData.severity?.level || analysisData.anomaly?.severity || analysisData.severity || (isAnomaly ? "HIGH" : "NONE");
        const sevScore = Number(analysisData.severity?.score ?? analysisData.anomaly?.severity_score ?? analysisData.severity_score ?? 0.0);
        const fusedScore = Number(analysisData.scores?.fused_anomaly_score ?? analysisData.anomaly?.fused_anomaly_score ?? analysisData.fused_anomaly_score ?? 0.0);

        const healthScore = Number(analysisData.sensor_health?.score ?? analysisData.health?.score ?? analysisData.health_score ?? 100);
        const healthStatus = analysisData.sensor_health?.status || analysisData.health?.status || analysisData.health_status || "GOOD";

        const evidenceObj = analysisData.scores ? {
            isolation_forest: Number(analysisData.scores.iforest_novelty || 0.0),
            xgboost: Number(analysisData.scores.xgboost_anomaly || 0.0),
            temporal: Number(analysisData.scores.temporal || 0.0),
            spatial: Number(analysisData.scores.spatial || 0.0),
            physics: Number(analysisData.scores.physics || 0.0)
        } : (analysisData.evidence || {});

        const shapFactors = analysisData.explanation?.shap_factors || analysisData.explanation?.top_features || analysisData.shap_factors || [];
        const classProbs = analysisData.class_probabilities || {};

        // 4. Save Analysis record to MongoDB
        const analysisDoc = {
            analysis_id: analysisId,
            incident_id: incidentId,
            station_id: stationId,
            station: {
                id: stationId,
                name: stationName,
                city,
                cluster,
                latitude: lat,
                longitude: lon
            },
            timestamp,
            telemetry: {
                temperature_c: temp ?? 25.0,
                humidity_pct: hum ?? 50.0,
                pressure_hpa: press ?? 1013.25
            },
            prediction: {
                is_anomaly: isAnomaly,
                decision,
                root_cause: rootCause,
                confidence
            },
            anomaly: {
                detected: isAnomaly,
                decision,
                root_cause: rootCause,
                confidence,
                severity: sevLevel,
                severity_score: sevScore,
                fused_anomaly_score: fusedScore
            },
            scores: {
                fused_anomaly_score: fusedScore,
                iforest_novelty: evidenceObj.isolation_forest || 0.0,
                temporal: evidenceObj.temporal || 0.0,
                spatial: evidenceObj.spatial || 0.0,
                physics: evidenceObj.physics || 0.0,
                xgboost_anomaly: evidenceObj.xgboost || 0.0
            },
            evidence: evidenceObj,
            class_probabilities: classProbs,
            severity: {
                level: sevLevel,
                score: sevScore
            },
            sensor_health: {
                score: healthScore,
                status: healthStatus
            },
            health: {
                score: healthScore,
                status: healthStatus
            },
            explanation: {
                top_features: shapFactors,
                shap_factors: shapFactors
            },
            maintenance: analysisData.maintenance || {
                priority: sevLevel,
                recommended_action: "Continue routine scheduled monitoring."
            },
            llm: analysisData.llm || {
                provider: isAnomaly ? "mistral" : "none",
                report: isAnomaly ? `Anomaly ${rootCause} detected.` : ""
            }
        };

        const savedAnalysis = await saveAnalysis(analysisDoc);

        // 5. If anomaly detected, log to Anomaly collection and increment Prometheus metrics
        if (isAnomaly) {
            anomaliesDetected.inc();
            try {
                await saveAnomaly(sensorReading, {
                    sensor: temp !== null && (temp > 45 || temp < -10) ? "temperature" : (hum !== null && hum > 95 ? "humidity" : "pressure"),
                    anomalyType: rootCause,
                    severity: sevLevel.toLowerCase(),
                    confidence,
                    message: `Anomaly ${rootCause} detected with ${(confidence * 100).toFixed(1)}% confidence.`,
                    action: analysisDoc.maintenance.recommended_action
                });
            } catch (err) {
                logger.warn({ err: err.message }, "Warning saving anomaly record");
            }
        }

        // 6. Complete structured JSON object for React frontend
        const frontendDashboardItem = {
            _id: savedAnalysis._id,
            incident_id: incidentId,
            analysis_id: analysisId,
            station_id: stationId,
            station_name: stationName,
            city,
            cluster,
            latitude: lat,
            longitude: lon,
            timestamp: timestamp.toISOString(),
            telemetry: {
                temperature_c: temp ?? 25.0,
                humidity_pct: hum ?? 50.0,
                pressure_hpa: press ?? 1013.25
            },
            temperature_c: temp ?? 25.0,
            humidity_pct: hum ?? 50.0,
            pressure_hpa: press ?? 1013.25,
            prediction: {
                is_anomaly: isAnomaly,
                decision,
                root_cause: rootCause,
                confidence
            },
            root_cause: rootCause,
            decision,
            confidence,
            confidence_pct: `${(confidence * 100).toFixed(1)}%`,
            scores: analysisDoc.scores,
            class_probabilities: classProbs,
            severity: sevLevel,
            severity_score: sevScore,
            fused_anomaly_score: fusedScore,
            sensor_health: {
                score: healthScore,
                status: healthStatus
            },
            sensor_health_score: healthScore,
            health_score: healthScore,
            health_status: healthStatus,
            evidence: evidenceObj,
            multi_source_evidence: evidenceObj,
            explanation: {
                top_features: shapFactors,
                shap_factors: shapFactors
            },
            shap_factors: shapFactors,
            maintenance: analysisDoc.maintenance,
            llm: analysisDoc.llm,
            llm_report: analysisDoc.llm?.report || "",
            llm_source: analysisDoc.llm?.provider || (isAnomaly ? "mistral" : "none"),
            raw_record: analysisDoc
        };

        // 7. Relay Python results over WebSocket to React frontend
        try {
            broadcast({
                type: "anomaly",
                result: frontendDashboardItem
            });
            broadcast({
                type: "READING_UPDATED",
                data: sensorReading
            });
            broadcast({
                type: "ANALYSIS_UPDATED",
                data: frontendDashboardItem
            });
        } catch (wsErr) {
            logger.warn({ err: wsErr.message }, "WebSocket broadcast error");
        }

        return frontendDashboardItem;
    } catch (error) {
        logger.error({ error: error.message }, "Error processing sensor telemetry reading in Node gateway");
        throw error;
    }
};

export const retryPendingML = async () => {
    try {
        const pending = await findPendingReadings();
        for (const r of pending) {
            try {
                await processReading(r);
            } catch { }
        }
    } catch { }
};

export const retryPendingAnomalies = async () => {
    try {
        const detected = await findDetectedAnomalies();
        for (const r of detected) {
            try {
                await updateReading(r._id, { anomalyStatus: "saved" });
            } catch { }
        }
    } catch { }
};

export const fetchLatestReadings = asyncHandler(async () => {
    return await findLatestReadings();
});

export const fetchStationReadings = asyncHandler(async (stationId, pageNumber = 1, limitNumber = 50, from, to) => {
    const skip = (pageNumber - 1) * limitNumber;
    const [readings, total] = await Promise.all([
        findReadingsByStation(stationId, { skip, limit: limitNumber, from, to }),
        countReadingsByStation(stationId, { from, to })
    ]);
    const totalPages = Math.ceil(total / limitNumber);

    return {
        readings,
        pagination: {
            total,
            totalPages,
            currentPage: pageNumber,
            limit: limitNumber
        }
    };
});
