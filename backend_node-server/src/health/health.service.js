import mongoose from "mongoose";
import { isMqttConnected } from "../mqtt/mqttClient.js";
import config from "../config/config.js";

const checkMongoDB = async () => {
    try {
        if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
            await mongoose.connection.db.admin().ping();
            return { status: "up" };
        }
        return { status: "disconnected" };
    } catch (error) {
        return { status: "down", error: error.message };
    }
};

const checkMQTT = async () => {
    return {
        status: isMqttConnected() ? "up" : "disconnected"
    };
};

const checkMLService = async () => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const res = await fetch(`${config.mlServiceURL}/api/health`, {
            method: "GET",
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (res.ok) {
            const data = await res.json();
            return { status: "up", ...data };
        }
        return { status: "degraded", http_status: res.status };
    } catch (err) {
        return { status: "down", error: err.message };
    }
};

export const checkHealth = async () => {
    const [mongo, mqtt, ml] = await Promise.all([
        checkMongoDB(),
        checkMQTT(),
        checkMLService()
    ]);

    const isHealthy = mongo.status === "up" || ml.status === "up";

    return {
        status: isHealthy ? "healthy" : "degraded",
        timestamp: new Date().toISOString(),
        services: {
            mongodb: mongo,
            mqtt: mqtt,
            ml_service: ml
        }
    };
};