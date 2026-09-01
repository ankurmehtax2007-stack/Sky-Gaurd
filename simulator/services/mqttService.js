// mqttService.js

import mqtt from "mqtt";

/*
 * SkyGuard AI MQTT Transport
 *
 * MQTT is the primary telemetry transport.
 * HTTP is used as a fallback when MQTT is unavailable.
 */

const brokerHost =
    process.env.MQTT_BROKER || "localhost";

const brokerPort =
    process.env.MQTT_PORT || "1883";

const brokerUrl =
    process.env.MQTT_URL ||
    `mqtt://${brokerHost}:${brokerPort}`;

const nodeApiUrl =
    (
        process.env.NODE_API_URL ||
        process.env.BACKEND_URL ||
        "http://localhost:3000"
    ).replace(/\/+$/, "");

const mqttTopic =
    process.env.MQTT_TOPIC ||
    "skyguard/telemetry";

const mqttQos =
    Number(process.env.MQTT_QOS || 1);

const mqttRetain =
    process.env.MQTT_RETAIN === "true";

const httpFallbackEnabled =
    process.env.HTTP_FALLBACK !== "false";

let client = null;

let mqttConnected = false;

/*
 * ---------------------------------------------------------
 * MQTT INITIALIZATION
 * ---------------------------------------------------------
 */

try {
    client = mqtt.connect(
        brokerUrl,
        {
            reconnectPeriod: 4000,
            connectTimeout: 8000,

            /*
             * Clean session means simulator reconnects cleanly.
             */
            clean: true,

            /*
             * Keep connection alive.
             */
            keepalive: 30,

            /*
             * Disable MQTT's own automatic topic publication
             * until connection is established.
             */
        }
    );

    client.on("connect", () => {
        mqttConnected = true;

        console.log(
            `[SkyGuard MQTT] Connected: ${brokerUrl}`
        );

        console.log(
            `[SkyGuard MQTT] Topic: ${mqttTopic}`
        );
    });

    client.on("reconnect", () => {
        console.log(
            "[SkyGuard MQTT] Reconnecting..."
        );
    });

    client.on("offline", () => {
        mqttConnected = false;

        console.log(
            "[SkyGuard MQTT] Offline"
        );
    });

    client.on("close", () => {
        mqttConnected = false;

        console.log(
            "[SkyGuard MQTT] Connection closed"
        );
    });

    client.on("error", (err) => {
        mqttConnected = false;

        console.error(
            `[SkyGuard MQTT] Error: ${err.message}`
        );
    });

} catch (err) {
    mqttConnected = false;

    console.error(
        `[SkyGuard MQTT] Initialization error: ${err.message}`
    );
}

/*
 * ---------------------------------------------------------
 * MQTT PUBLISH
 * ---------------------------------------------------------
 */

const publishMqtt = (
    topic,
    data
) => {
    return new Promise(
        (resolve, reject) => {

            if (!client || !mqttConnected) {
                reject(
                    new Error(
                        "MQTT client is not connected"
                    )
                );

                return;
            }

            const payload =
                JSON.stringify(data);

            client.publish(
                topic,
                payload,
                {
                    qos: mqttQos,
                    retain: mqttRetain
                },
                (error) => {

                    if (error) {
                        reject(error);
                        return;
                    }

                    resolve();
                }
            );
        }
    );
};

/*
 * ---------------------------------------------------------
 * HTTP FALLBACK
 * ---------------------------------------------------------
 */

const publishHttpFallback = async (
    data
) => {
    const url =
        `${nodeApiUrl}/api/telemetry`;

    const response =
        await fetch(
            url,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify(data)
            }
        );

    if (!response.ok) {
        throw new Error(
            `HTTP ${response.status}`
        );
    }

    /*
     * Backend diagnosis is useful during simulator testing.
     */
    let json = null;

    try {
        json = await response.json();
    } catch {
        json = null;
    }

    return json;
};

/*
 * ---------------------------------------------------------
 * PUBLIC PUBLISH FUNCTION
 * ---------------------------------------------------------
 */

export const publishMessage = async (
    topic = mqttTopic,
    data
) => {

    if (!data) {
        throw new Error(
            "publishMessage requires data"
        );
    }

    /*
     * -----------------------------------------------------
     * PATH 1: MQTT
     * -----------------------------------------------------
     */

    if (mqttConnected && client) {

        try {

            await publishMqtt(
                topic,
                data
            );

            console.log(
                `[Simulator -> MQTT] ` +
                `${data.station_id || data.stationId} ` +
                `-> ${topic}`
            );

            /*
             * IMPORTANT:
             * Do NOT send HTTP as well.
             *
             * This prevents duplicate telemetry.
             */
            return {
                transport: "mqtt",
                success: true
            };

        } catch (error) {

            console.error(
                `[SkyGuard MQTT] Publish failed: ` +
                `${error.message}`
            );
        }
    }

    /*
     * -----------------------------------------------------
     * PATH 2: HTTP FALLBACK
     * -----------------------------------------------------
     */

    if (httpFallbackEnabled) {

        try {

            const result =
                await publishHttpFallback(
                    data
                );

            const rootCause =
                result?.result?.root_cause ||
                result?.result?.anomaly?.root_cause ||
                "normal";

            const severity =
                result?.result?.severity ||
                result?.result?.anomaly?.severity ||
                "NONE";

            console.log(
                `[Simulator -> HTTP Fallback] ` +
                `${data.station_id || data.stationId} ` +
                `-> Diagnosis: [${rootCause}] ` +
                `Severity: [${severity}]`
            );

            return {
                transport: "http",
                success: true,
                diagnosis: result
            };

        } catch (error) {

            console.error(
                `[SkyGuard HTTP] Fallback failed: ` +
                `${error.message}`
            );

            return {
                transport: "none",
                success: false,
                error: error.message
            };
        }
    }

    return {
        transport: "none",
        success: false,
        error: "MQTT unavailable and HTTP fallback disabled"
    };
};

/*
 * ---------------------------------------------------------
 * CONNECTION STATUS
 * ---------------------------------------------------------
 */

export const isMqttConnected = () => {
    return mqttConnected;
};

export const getMqttStatus = () => {
    return {
        connected: mqttConnected,
        broker: brokerUrl,
        topic: mqttTopic,
        qos: mqttQos
    };
};

export {
    client
};

export default {
    client,
    publishMessage,
    isMqttConnected,
    getMqttStatus
};