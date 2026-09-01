import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "../../../.env") });
dotenv.config();

const config = {
    port: parseInt(process.env.PORT || process.env.NODE_PORT || "3000", 10),
    mongoURI: process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/skyguard",
    mqttURL: process.env.MQTT_URL || (process.env.MQTT_BROKER ? `mqtt://${process.env.MQTT_BROKER}:${process.env.MQTT_PORT || 1883}` : "mqtt://localhost:1883"),
    mqttBroker: process.env.MQTT_BROKER || "localhost",
    mqttPort: parseInt(process.env.MQTT_PORT || "1883", 10),
    mqttTopic: process.env.MQTT_TOPIC || "weather/readings/+",

    mlServiceURL: (process.env.ML_SERVICE_URL || "http://localhost:8000").replace(/\/+$/, ""),

    accessTokenSecret: process.env.JWT_ACCESS_SECRET || "skyguard_jwt_access_secret_key_2026",
    refreshTokenSecret: process.env.JWT_REFRESH_SECRET || "skyguard_jwt_refresh_secret_key_2026",

    nodeEnv: process.env.NODE_ENV || "development"
};

export default config;