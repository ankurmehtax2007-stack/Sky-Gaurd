import express from "express";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import mongoose from "mongoose";
import logger from "./utils/logger.js";
import register from "./utils/metrics.js";
import { errorHandler } from "./middlewares/error.middleware.js";

// Routes import
import readingRoutes from "./modules/readings/reading.routes.js";
import anomalyRouter from "./modules/anomalies/anomaly.routes.js";
import authRoutes from "./auth/auth.routes.js";
import healthRoutes from "./health/health.routes.js";
import { processReading } from "./modules/readings/reading.service.js";
import { createFeedback, getFeedbacks } from "./modules/feedback/feedback.service.js";
import { getReportById } from "./modules/anomalies/anomaly.controller.js";
import { findAnalyses } from "./modules/analyses/analysis.repository.js";

const app = express();

app.use(pinoHttp({ logger, autoLogging: false }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// CORS middleware for frontend React app
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }
    next();
});

// 1. Health Endpoint
app.use("/api/health", healthRoutes);

// 2. Direct ML Analysis Endpoint (POST /api/analyze)
app.post("/api/analyze", async (req, res, next) => {
    try {
        const rawData = req.body || {};
        const readingData = rawData.telemetry ? {
            ...rawData.telemetry,
            station_id: rawData.station?.id || rawData.station_id || rawData.stationId || "DEMO-001",
            station_name: rawData.station?.name || rawData.station_name,
            city: rawData.station?.city || rawData.city,
            cluster: rawData.station?.cluster || rawData.cluster,
            latitude: rawData.station?.latitude ?? rawData.latitude,
            longitude: rawData.station?.longitude ?? rawData.longitude,
            timestamp: rawData.timestamp
        } : rawData;

        const result = await processReading(readingData);
        return res.status(200).json({
            status: "success",
            analysis: result.raw_record ? {
                station: result.raw_record.station,
                timestamp: result.raw_record.timestamp,
                telemetry: result.raw_record.telemetry,
                anomaly: result.raw_record.anomaly,
                evidence: result.raw_record.evidence,
                health: result.raw_record.health,
                explanation: result.raw_record.explanation,
                maintenance: result.raw_record.maintenance,
                llm: result.raw_record.llm
            } : result
        });
    } catch (err) {
        next(err);
    }
});

// 3. Telemetry Ingestion Endpoints
app.post("/api/telemetry", async (req, res, next) => {
    try {
        const result = await processReading(req.body);
        return res.status(200).json({
            status: "success",
            result,
            data: result
        });
    } catch (err) {
        next(err);
    }
});

app.post("/api/test/telemetry", async (req, res, next) => {
    try {
        const payload = req.body && Object.keys(req.body).length > 0 ? req.body : {
            station_id: "DEMO-001",
            station_name: "New Delhi AWS",
            city: "New Delhi",
            cluster: "NCR",
            latitude: 28.6139,
            longitude: 77.2090,
            temperature_c: 28.5 + (Math.random() * 4 - 2),
            humidity_pct: 55.0 + (Math.random() * 10 - 5),
            pressure_hpa: 1008.0 + (Math.random() * 4 - 2),
            timestamp: new Date().toISOString()
        };
        const result = await processReading(payload);
        return res.status(200).json({
            status: "success",
            result,
            data: result
        });
    } catch (err) {
        next(err);
    }
});

// 4. Operator Feedback Endpoints (POST /api/feedback)
app.post("/api/feedback", async (req, res, next) => {
    try {
        const feedbackResult = await createFeedback(req.body);
        return res.status(200).json(feedbackResult);
    } catch (err) {
        next(err);
    }
});

app.get("/api/feedbacks", async (req, res, next) => {
    try {
        const list = await getFeedbacks(parseInt(req.query.limit || "50", 10));
        return res.status(200).json({ status: "success", feedbacks: list });
    } catch (err) {
        next(err);
    }
});

// 5. Reports & Anomalies Endpoints
app.get("/api/reports", async (req, res, next) => {
    try {
        const list = await findAnalyses({}, { limit: parseInt(req.query.limit || "50", 10) });
        return res.status(200).json({ status: "success", success: true, reports: list, data: list });
    } catch (err) {
        next(err);
    }
});

app.delete("/api/reports", async (req, res, next) => {
    try {
        const Analysis = mongoose.model("Analysis");
        await Analysis.deleteMany({});
        return res.status(200).json({ status: "success", message: "All reports successfully cleared", count: 0 });
    } catch (err) {
        next(err);
    }
});
app.post("/api/reports/clear", async (req, res, next) => {
    try {
        const Analysis = mongoose.model("Analysis");
        await Analysis.deleteMany({});
        return res.status(200).json({ status: "success", message: "All reports successfully cleared", count: 0 });
    } catch (err) {
        next(err);
    }
});

app.delete("/api/anomalies", async (req, res, next) => {
    try {
        const Anomaly = mongoose.model("Anomaly");
        await Anomaly.deleteMany({});
        return res.status(200).json({ status: "success", message: "All anomalies successfully cleared", count: 0 });
    } catch (err) {
        next(err);
    }
});
app.post("/api/anomalies/clear", async (req, res, next) => {
    try {
        const Anomaly = mongoose.model("Anomaly");
        await Anomaly.deleteMany({});
        return res.status(200).json({ status: "success", message: "All anomalies successfully cleared", count: 0 });
    } catch (err) {
        next(err);
    }
});

app.get("/api/reports/:id", getReportById);
app.use("/api/anomalies", anomalyRouter);

// 6. Sensor Readings Endpoints
app.use("/api/readings", readingRoutes);

// 7. Auth Endpoints
app.use("/api/auth", authRoutes);

// 8. On-Demand LLM Report Generation Endpoint
app.post("/api/generate-report", async (req, res, next) => {
    try {
        const payload = req.body || {};
        const mlServiceUrl = (process.env.ML_SERVICE_URL || "http://localhost:8000").replace(/\/+$/, "");
        const response = await fetch(`${mlServiceUrl}/api/generate-report`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`ML service returned status ${response.status}`);
        }

        const data = await response.json();
        return res.status(200).json(data);
    } catch (err) {
        next(err);
    }
});

// 7.5 Reset In-Memory Streaming State (ML buffer reset without deleting DB)
app.post("/api/reset-state", async (req, res, next) => {
    try {
        const mlUrl = process.env.ML_SERVICE_URL || "http://localhost:8000";
        try {
            await fetch(`${mlUrl}/api/reset-state`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                timeout: 2000
            });
        } catch (mlErr) {
            logger.warn({ err: mlErr.message }, "ML reset-state proxy warning");
        }
        return res.status(200).json({
            status: "success",
            message: "Dashboard and in-memory streaming buffers reset successfully. MongoDB records preserved."
        });
    } catch (err) {
        next(err);
    }
});

// 8. Simulator Control Endpoints
const SIMULATOR_URL = process.env.SIMULATOR_URL || "http://localhost:3001";
let localSimRunning = true;

app.get("/api/simulator/status", async (req, res) => {
    try {
        const response = await fetch(`${SIMULATOR_URL}/status`, { timeout: 1500 });
        if (response.ok) {
            const data = await response.json();
            return res.status(200).json(data);
        }
    } catch { }
    return res.status(200).json({
        status: "success",
        isRunning: localSimRunning,
        intervalMs: 10000,
        intervalSeconds: 10,
        source: "backend_gateway",
        activeInjections: []
    });
});

app.get("/api/simulator/injection-status", async (req, res) => {
    try {
        const response = await fetch(`${SIMULATOR_URL}/injection-status`, { timeout: 1500 });
        if (response.ok) {
            const data = await response.json();
            return res.status(200).json(data);
        }
    } catch { }
    return res.status(200).json({
        status: "success",
        hasActive: false,
        active: [],
        completed: []
    });
});

app.all(["/api/simulator/start", "/api/simulator/stop", "/api/simulator/toggle", "/api/simulator/trigger", "/api/simulator/inject"], async (req, res) => {
    const action = req.path.split("/").pop();
    try {
        const response = await fetch(`${SIMULATOR_URL}/${action}`, {
            method: req.method,
            headers: { "Content-Type": "application/json" },
            body: req.method === "POST" ? JSON.stringify(req.body) : undefined,
            timeout: 2000
        });
        if (response.ok) {
            const data = await response.json();
            localSimRunning = data.isRunning !== undefined ? data.isRunning : localSimRunning;
            return res.status(200).json(data);
        }
    } catch { }

    if (action === "start") localSimRunning = true;
    if (action === "stop") localSimRunning = false;
    if (action === "toggle") localSimRunning = !localSimRunning;

    return res.status(200).json({
        status: "success",
        message: `Simulator ${action} executed`,
        isRunning: localSimRunning,
        intervalSeconds: 10
    });
});

// 9. Stations List Endpoint
app.get("/api/stations", async (req, res, next) => {
    try {
        const defaultStations = [
            { station_id: "IMD-DEL-001", station_name: "New Delhi Safdarjung AWS", location: "New Delhi", city: "New Delhi", cluster: "NCR", status: "ONLINE", temperature: 28.5, humidity: 55.0, pressure: 1008.0 },
            { station_id: "IMD-DEL-002", station_name: "Delhi Ridge AWS", location: "Delhi", city: "New Delhi", cluster: "NCR", status: "ONLINE", temperature: 29.0, humidity: 53.0, pressure: 1007.5 },
            { station_id: "IMD-BOM-001", station_name: "Mumbai Santacruz Coastal AWS", location: "Mumbai", city: "Mumbai", cluster: "Konkan_Deccan", status: "ONLINE", temperature: 27.5, humidity: 70.0, pressure: 1010.0 },
            { station_id: "IMD-MAA-001", station_name: "Chennai Meenambakkam AWS", location: "Chennai", city: "Chennai", cluster: "Tamil_Nadu_Coast", status: "ONLINE", temperature: 30.5, humidity: 75.0, pressure: 1012.0 },
            { station_id: "IMD-CCU-001", station_name: "Kolkata Alipore AWS", location: "Kolkata", city: "Kolkata", cluster: "West_Bengal", status: "ONLINE", temperature: 29.0, humidity: 78.0, pressure: 1009.0 }
        ];
        return res.status(200).json({
            status: "success",
            success: true,
            data: defaultStations
        });
    } catch (err) {
        next(err);
    }
});

// 10. Prometheus Metrics Endpoint
app.get("/metrics", async (req, res) => {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
});

app.use(errorHandler);

export default app;
