import http from "http";
import app from "./app.js";
import connectDB, { disconnectDB } from "./config/database.js";
import connectMQTT, { stopMQTT } from "./mqtt/mqttClient.js";
import config from "./config/config.js";
import { initializeWebSocket } from "./websocket/websocket.server.js";
import { startMLRetryWorker, stopMLRetryWorker } from "./modules/worker/mlRetry.worker.js";
import { startAnomalyRetryWorker, stopAnomalyRetryWorker } from "./modules/worker/anomalyRetry.worker.js";
import logger from "./utils/logger.js";

const server = http.createServer(app);
const wss = initializeWebSocket(server);

const startServer = async () => {
    try {
        await connectDB();
        logger.info("MongoDB connection initialized");
    } catch (error) {
        logger.warn({ error: error.message }, "MongoDB initial connection failed - will operate with resilient fallbacks and auto-reconnect");
    }

    try {
        connectMQTT();
    } catch (error) {
        logger.warn({ error: error.message }, "MQTT initial connection failed - will auto-reconnect");
    }

    try {
        startMLRetryWorker();
        startAnomalyRetryWorker();
    } catch (error) {
        logger.warn({ error: error.message }, "Retry workers initialization error");
    }
};

const closeHTTPServer = () => {
    return new Promise((resolve, reject) => {
        server.close((error) => {
            if (error) {
                reject(error);
                return;
            }
            logger.info("HTTP server closed cleanly");
            resolve();
        });
    });
};

const shutdownServer = async () => {
    logger.info("Shutting down SkyGuard Node.js Gateway...");
    try {
        stopMLRetryWorker();
        stopAnomalyRetryWorker();
        await stopMQTT();
        for (const client of wss.clients) {
            try { client.close(); } catch {}
        }
        await closeHTTPServer();
        await disconnectDB();
        logger.info("Shutdown complete.");
    } catch (error) {
        logger.error({ error: error.message }, "Error during server shutdown");
    }
};

process.on("SIGTERM", shutdownServer);
process.on("SIGINT", shutdownServer);

const PORT = config.port || 3000;
server.listen(PORT, () => {
    logger.info(`🚀 SkyGuard Node.js Gateway & WebSocket listening on http://localhost:${PORT}`);
    startServer();
});