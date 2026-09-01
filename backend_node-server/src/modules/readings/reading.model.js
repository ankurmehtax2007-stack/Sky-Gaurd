import mongoose from "mongoose";

const readingSchema = new mongoose.Schema({
    stationId: {
        type: String,
        required: true,
        index: true
    },
    station_id: {
        type: String,
        index: true
    },
    stationName: String,
    city: String,
    cluster: String,
    latitude: Number,
    longitude: Number,
    timestamp: {
        type: Date,
        required: true,
        default: Date.now,
        index: true
    },
    temperature: {
        type: Number,
        required: true
    },
    humidity: {
        type: Number,
        required: true
    },
    pressure: {
        type: Number,
        required: true
    },
    temperature_c: Number,
    humidity_pct: Number,
    pressure_hpa: Number,
    mlStatus: {
        type: String,
        enum: ["pending", "processed", "failed"],
        default: "pending"
    },
    anomalyStatus: {
        type: String,
        enum: ["none", "detected", "saved"],
        default: "none"
    },
    anomalyPrediction: {
        type: Object
    }
}, {
    timestamps: true
});

readingSchema.index({ stationId: 1, timestamp: -1 });
readingSchema.index({ station_id: 1, timestamp: -1 });

export const SensorReading = mongoose.model("SensorReading", readingSchema);
export default SensorReading;
