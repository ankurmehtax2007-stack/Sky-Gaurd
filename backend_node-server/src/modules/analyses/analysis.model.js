import mongoose from "mongoose";

const analysisSchema = new mongoose.Schema({
    analysis_id: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    incident_id: {
        type: String,
        index: true
    },
    station_id: {
        type: String,
        required: true,
        index: true
    },
    station: {
        id: String,
        name: String,
        city: String,
        cluster: String,
        latitude: Number,
        longitude: Number
    },
    timestamp: {
        type: Date,
        required: true,
        default: Date.now,
        index: true
    },
    telemetry: {
        temperature_c: Number,
        humidity_pct: Number,
        pressure_hpa: Number
    },
    anomaly: {
        detected: Boolean,
        decision: String,
        root_cause: String,
        confidence: Number,
        severity: String,
        severity_score: Number,
        fused_anomaly_score: Number
    },
    evidence: {
        isolation_forest: Number,
        xgboost: Number,
        temporal: Number,
        spatial: Number,
        physics: Number
    },
    health: {
        score: Number,
        status: String
    },
    explanation: {
        shap_factors: [{
            feature: String,
            shap_value: Number,
            human_readable_statement: String
        }]
    },
    maintenance: {
        priority: String,
        recommended_action: String
    },
    llm: {
        provider: String,
        report: String
    },
    operator_feedback: {
        status: {
            type: String,
            enum: ["pending", "confirmed", "false_alarm", "corrected"],
            default: "pending"
        },
        corrected_root_cause: String,
        comment: String,
        operator_id: String,
        submitted_at: Date
    }
}, {
    timestamps: true
});

analysisSchema.index({ "station.id": 1, timestamp: -1 });
analysisSchema.index({ "anomaly.detected": 1, timestamp: -1 });
analysisSchema.index({ "anomaly.severity": 1, timestamp: -1 });

export const Analysis = mongoose.model("Analysis", analysisSchema);
export default Analysis;
