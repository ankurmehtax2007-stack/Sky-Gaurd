import mqtt from "mqtt";
import handleReading from "../modules/readings/reading.handler.js";

// local module import
import config from "../config/config.js";

const connectMQTT = () => {

    const client = mqtt.connect({
        host: config.mqttBroker,
        port: config.mqttPort
    });

    client.on("connect", () => {
        console.log("MQTT Client connected");

        client.subscribe("weather/readings/+");
    });

    client.on("message", (topic, message) => {

        let data;

        try {
            data = JSON.parse(message.toString());
        } catch (error) {
            console.error("Invalid JSON:", error.message);
            return;
        }

        try {
            handleReading(data);
        } catch (error) {
            console.error("Invalid sensor reading:", error.message);
        }

    });

    return client;
};

export default connectMQTT;