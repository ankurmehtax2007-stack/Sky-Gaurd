import mqtt from "mqtt";

const client = mqtt.connect("mqtt://localhost:1883");

const publishMessage = (topic, data) => {
    try {
        client.publish(topic, JSON.stringify(data));
    } catch (error) {
        console.log("Invalid sensor reading:", data);
    }
};

export { client, publishMessage };