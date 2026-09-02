import http from "http";
import stations from "./config/stations.js";
import generateReading from "./services/weatherGenerator.js";
import { normalizeAnomalyType } from "./services/anomalyInjector.js";
import { publishMessage } from "./services/mqttService.js";

const intervalMs = parseInt(process.env.SIMULATION_INTERVAL_MS || "10000", 10);
const port = parseInt(process.env.SIMULATOR_PORT || "3001", 10);

let isRunning = true;
let intervalTimer = null;
let lastCycleTime = null;
let totalCycles = 0;

// Current real time timestamp increasing by exactly 10 seconds per generated record
let currentSimulatedTime = new Date();

// Active manual anomaly injections map: stationId -> InjectionState
const activeInjections = new Map();
const completedInjections = [];

export const getActiveInjectionsList = () => {
    return Array.from(activeInjections.values()).map(inj => ({
        id: inj.id,
        station_id: inj.station_id,
        station_name: inj.station_name,
        city: inj.city,
        cluster: inj.cluster,
        anomaly_type: inj.anomaly_type,
        sensor: inj.sensor,
        intensity: inj.intensity,
        status: "active",
        records_emitted: inj.records_emitted,
        remaining_records: inj.remaining_records,
        total_records: inj.total_records,
        progress: `${inj.records_emitted}/${inj.total_records}`,
        progress_pct: Math.round((inj.records_emitted / inj.total_records) * 100),
        start_time: inj.start_time,
        last_emitted_time: inj.last_emitted_time
    }));
};

export const publishReading = (station, injectionConfig = null, simulatedDate = currentSimulatedTime) => {
    const data = generateReading(station, injectionConfig, simulatedDate);
    const stationId = station.station_id || station.stationId;
    const topic = `weather/readings/${stationId}`;

    publishMessage(topic, data);
    return data;
};

export const triggerCycle = () => {
    lastCycleTime = new Date().toISOString();
    // Advance simulated timestamp using current wall clock date
    currentSimulatedTime = new Date();
    totalCycles++;

    const results = [];

    for (const station of stations) {
        const stationId = station.station_id || station.stationId;
        let injConfig = null;

        if (activeInjections.has(stationId)) {
            const inj = activeInjections.get(stationId);
            inj.records_emitted += 1;
            inj.remaining_records = inj.total_records - inj.records_emitted;
            inj.last_emitted_time = currentSimulatedTime.toISOString();
            inj.stepIndex = inj.records_emitted;

            injConfig = {
                anomaly_type: inj.anomaly_type,
                stepIndex: inj.stepIndex,
                sensor: inj.sensor,
                intensity: inj.intensity,
                frozenValue: inj.frozenValue
            };

            const res = publishReading(station, injConfig, currentSimulatedTime);
            // Cache frozen value if freeze anomaly
            if (injConfig.frozenValue !== undefined) {
                inj.frozenValue = injConfig.frozenValue;
            }
            results.push(res);

            console.log(`[Simulator] ⚡ Anomaly Injected: [${inj.anomaly_type}] on ${stationId} (${station.city}) | Record ${inj.records_emitted}/${inj.total_records} (Remaining: ${inj.remaining_records})`);

            // Window finished: automatically return station to normal stream
            if (inj.remaining_records <= 0) {
                inj.status = "completed";
                inj.completed_time = currentSimulatedTime.toISOString();
                completedInjections.unshift({
                    id: inj.id,
                    station_id: inj.station_id,
                    station_name: inj.station_name,
                    city: inj.city,
                    anomaly_type: inj.anomaly_type,
                    total_records: inj.total_records,
                    completed_time: inj.completed_time
                });
                if (completedInjections.length > 20) completedInjections.pop();

                activeInjections.delete(stationId);
                console.log(`[Simulator] ✅ 6-record window complete for [${inj.anomaly_type}] on ${stationId}. Automatically returning to 100% normal stream.`);
            }
        } else {
            // Normal 10-second telemetry stream
            const res = publishReading(station, null, currentSimulatedTime);
            results.push(res);
        }
    }

    const activeCount = activeInjections.size;
    console.log(`[Simulator] Cycle #${totalCycles} | Time: ${currentSimulatedTime.toISOString()} (+10s step) | Stations: ${stations.length} | Active Injections: ${activeCount}`);
    return results;
};

export const registerManualInjection = ({
    city = null,
    station_id = null,
    anomaly_type = "temperature_spike",
    sensor = "temperature",
    intensity = "high",
    duration_records = 6
}) => {
    const normalizedType = normalizeAnomalyType(anomaly_type) || "temperature_spike";

    // 1. Resolve Target Station
    let targetStation = null;
    if (station_id) {
        targetStation = stations.find(s =>
            (s.station_id && s.station_id.toLowerCase() === station_id.toLowerCase()) ||
            (s.stationId && s.stationId.toLowerCase() === station_id.toLowerCase())
        );
    }

    if (!targetStation && city) {
        targetStation = stations.find(s => s.city && s.city.toLowerCase() === city.toLowerCase());
    }

    if (!targetStation) {
        targetStation = stations[0]; // Default to first AWS node (IMD-DEL-001)
    }

    const targetId = targetStation.station_id || targetStation.stationId;
    const targetCity = targetStation.city || "New Delhi";
    const targetCluster = targetStation.cluster || "NCR";

    // 2. Dual-Station Spatial Pairing Check
    let companionStation = null;
    if (normalizedType === "spatial_inconsistency") {
        companionStation = stations.find(s =>
            (s.station_id || s.stationId) !== targetId &&
            (s.city === targetCity || s.cluster === targetCluster)
        );
    }

    const totalRecs = Math.max(1, parseInt(duration_records || 6, 10));

    const injectionState = {
        id: `INJ-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        station_id: targetId,
        station_name: targetStation.station_name || targetStation.stationName || "AWS Node",
        city: targetCity,
        cluster: targetCluster,
        anomaly_type: normalizedType,
        sensor: sensor || "temperature",
        intensity: intensity || "high",
        total_records: totalRecs,
        records_emitted: 0,
        remaining_records: totalRecs,
        status: "pending",
        start_time: new Date().toISOString(),
        last_emitted_time: null,
        companion_station_id: companionStation ? (companionStation.station_id || companionStation.stationId) : null,
        companion_station_name: companionStation ? (companionStation.station_name || companionStation.stationName) : null
    };

    activeInjections.set(targetId, injectionState);

    console.log("==================================================");
    console.log(`⚡ MANUAL ANOMALY INJECTION SCHEDULED: [${normalizedType.toUpperCase()}]`);
    console.log(`Station: ${targetId} (${targetStation.station_name}) - City: ${targetCity}`);
    console.log(`Window: ${totalRecs} consecutive records (Cadence: ${intervalMs / 1000}s per record = ${totalRecs * (intervalMs / 1000)}s duration)`);
    if (companionStation) {
        console.log(`Spatial Reference Station (Normal): ${companionStation.station_id || companionStation.stationId} (${companionStation.station_name}) in ${targetCity}`);
    }
    console.log("==================================================");

    return injectionState;
};

export const startSimulation = () => {
    if (intervalTimer) {
        clearInterval(intervalTimer);
        intervalTimer = null;
    }
    isRunning = true;
    intervalTimer = setInterval(() => {
        triggerCycle();
    }, intervalMs);
    console.log(`[Simulator] ▶ Started recurring telemetry emissions every ${intervalMs / 1000}s with 10-second real-time step`);
    return true;
};

export const stopSimulation = () => {
    if (intervalTimer) {
        clearInterval(intervalTimer);
        intervalTimer = null;
    }
    isRunning = false;
    console.log("[Simulator] ⏸ Paused telemetry emissions.");
    return true;
};

export const toggleSimulation = () => {
    if (isRunning) {
        stopSimulation();
    } else {
        startSimulation();
    }
    return isRunning;
};

// Start initial cycle and interval loop
console.log("==================================================");
console.log("🌦️  SKYGUARD TELEMETRY SIMULATOR INITIALIZED");
console.log(`Configured ${stations.length} regional weather stations.`);
console.log(`Publishing cadence: ${intervalMs / 1000}s (realtime interval)`);
console.log(`Simulated time step: ${intervalMs / 1000}s (+10s per packet)`);
console.log(`Initial real timestamp: ${currentSimulatedTime.toISOString()}`);
console.log(`Control API listening on http://localhost:${port}`);
console.log("==================================================");

triggerCycle();
startSimulation();

// HTTP Control Server
const server = http.createServer((req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
    }

    const url = new URL(req.url, `http://localhost:${port}`);
    const pathname = url.pathname;

    const sendJson = (statusCode, payload) => {
        res.writeHead(statusCode, { "Content-Type": "application/json" });
        res.end(JSON.stringify(payload));
    };

    if (pathname === "/status" || pathname === "/api/simulator/status") {
        return sendJson(200, {
            status: "success",
            isRunning,
            intervalMs,
            intervalSeconds: intervalMs / 1000,
            simulatedStepSeconds: intervalMs / 1000,
            currentSimulatedTime: currentSimulatedTime.toISOString(),
            stationsCount: stations.length,
            totalCycles,
            lastCycleTime,
            activeInjections: getActiveInjectionsList(),
            hasActiveInjection: activeInjections.size > 0,
            completedInjections: completedInjections.slice(0, 5)
        });
    }

    if (pathname === "/injection-status" || pathname === "/api/simulator/injection-status") {
        return sendJson(200, {
            status: "success",
            hasActive: activeInjections.size > 0,
            active: getActiveInjectionsList(),
            completed: completedInjections.slice(0, 10)
        });
    }

    if (pathname === "/start" || pathname === "/api/simulator/start") {
        startSimulation();
        return sendJson(200, {
            status: "success",
            message: "Simulator started",
            isRunning: true,
            intervalSeconds: intervalMs / 1000
        });
    }

    if (pathname === "/stop" || pathname === "/api/simulator/stop") {
        stopSimulation();
        return sendJson(200, {
            status: "success",
            message: "Simulator stopped",
            isRunning: false
        });
    }

    if (pathname === "/toggle" || pathname === "/api/simulator/toggle") {
        const state = toggleSimulation();
        return sendJson(200, {
            status: "success",
            message: state ? "Simulator resumed" : "Simulator paused",
            isRunning: state,
            intervalSeconds: intervalMs / 1000
        });
    }

    if (pathname === "/trigger" || pathname === "/api/simulator/trigger") {
        const results = triggerCycle();
        return sendJson(200, {
            status: "success",
            message: `Emitted 1 cycle across ${stations.length} stations`,
            count: results.length
        });
    }

    if (pathname === "/inject" || pathname === "/api/simulator/inject") {
        let body = "";
        req.on("data", chunk => { body += chunk; });
        req.on("end", () => {
            try {
                const parsed = body ? JSON.parse(body) : {};
                const anom = parsed.anomaly_type || parsed.anomalyType || "temperature_spike";
                const stationId = parsed.station_id || parsed.stationId || null;
                const city = parsed.city || null;
                const sensor = parsed.sensor || "temperature";
                const intensity = parsed.intensity || "high";
                const duration = parsed.duration_points || parsed.duration_records || parsed.duration || 6;

                const injection = registerManualInjection({
                    city,
                    station_id: stationId,
                    anomaly_type: anom,
                    sensor,
                    intensity,
                    duration_records: duration
                });

                // Immediately emit the abnormal reading so the UI updates instantly!
                try {
                    triggerCycle();
                } catch (e) {
                    console.error("[Simulator] Error during immediate cycle trigger:", e.message);
                }

                return sendJson(200, {
                    status: "success",
                    message: `Scheduled ${duration}-record ${anom} injection on ${injection.station_id}`,
                    injection
                });
            } catch (err) {
                return sendJson(400, { status: "error", message: err.message });
            }
        });
        return;
    }

    sendJson(404, { status: "error", message: "Not found" });
});

server.listen(port, "0.0.0.0", () => {
    console.log(`[Simulator] HTTP Control Server running on port ${port}`);
});

export default {
    publishReading,
    triggerCycle,
    registerManualInjection,
    startSimulation,
    stopSimulation,
    toggleSimulation,
    getActiveInjectionsList
};