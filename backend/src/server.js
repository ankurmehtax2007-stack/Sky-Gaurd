// local modules import
import app from "./app.js";
import connectDB from "./config/database.js";
import connectMQTT from "./mqtt/mqttClient.js";
import config from "./config/config.js";

const startServer = async () => {
    try {
        await connectDB(); 
        connectMQTT();
        console.log("Backend started successfully");
    } catch (error) {
        console.error("Failed to start backend:", error.message);
    }
};

const PORT = config.port || 8000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

startServer();