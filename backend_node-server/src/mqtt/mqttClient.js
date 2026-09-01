import mqtt from "mqtt";
import handleReading from "../modules/readings/reading.handler.js";
import config from "../config/config.js";
import logger from "../utils/logger.js";

let client = null;
let mqttConnected = false;
let shuttingDown = false;

export const connectMQTT = () => {
    try {
        const brokerUrl = config.mqttURL || `mqtt://${config.mqttBroker}:${config.mqttPort}`;
        logger.info(`Connecting to MQTT broker at ${brokerUrl}...`);
        
        client = mqtt.connect(brokerUrl, {
            reconnectPeriod: 5000,
            connectTimeout: 10000
        });

        client.on("connect", () => {
            mqttConnected = true;
            logger.info("MQTT Client connected successfully");
            
            // Subscribe to both standard topic patterns
            client.subscribe("weather/readings/#", (err) => {
                if (err) logger.warn({ err }, "Error subscribing to weather/readings/#");
            });
            client.subscribe("skyguard/telemetry/#", (err) => {
                if (err) logger.warn({ err }, "Error subscribing to skyguard/telemetry/#");
            });
            client.subscribe("skyguard/telemetry", (err) => {
                if (err) logger.warn({ err }, "Error subscribing to skyguard/telemetry");
            });
        });

        client.on("error", (err) => {
            mqttConnected = false;
            logger.warn({ err: err.message }, "MQTT Client connection error (will retry)");
        });

        client.on("close", () => {
            mqttConnected = false;
            if (!shuttingDown) {
                logger.debug("MQTT connection closed");
            }
        });

        client.on("message", async (topic, message) => {
            if (shuttingDown) return;

            let data;
            try {
                data = JSON.parse(message.toString());
            } catch (error) {
                logger.warn({ error: error.message, topic }, "MQTT message is not valid JSON");
                return;
            }

            try {
                await handleReading(data);
            } catch (error) {
                logger.error({ error: error.message }, "Error processing MQTT sensor reading");
            }
        });

        return client;
    } catch (err) {
        logger.warn({ err: err.message }, "MQTT initialization error");
        return null;
    }
};

export const stopMQTT = () => {
    shuttingDown = true;
    return new Promise((resolve) => {
        if (!client) {
            resolve();
            return;
        }
        client.end(false, {}, () => {
            mqttConnected = false;
            logger.info("MQTT connection closed cleanly");
            resolve();
        });
    });
};

export const isMqttConnected = () => {
    return mqttConnected;
};

export default connectMQTT;