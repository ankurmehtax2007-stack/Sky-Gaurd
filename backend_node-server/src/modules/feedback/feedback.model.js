import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({
    feedback_id: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    analysis_id: {
        type: String,
        required: true,
        index: true
    },
    station_id: {
        type: String,
        required: true,
        index: true
    },
    operator_id: {
        type: String,
        default: "operator_station_lead"
    },
    operator_decision: {
        type: String,
        enum: ["confirmed", "false_alarm", "corrected"],
        required: true
    },
    original_prediction: {
        root_cause: String,
        decision: String,
        confidence: Number,
        severity: String
    },
    correction: {
        corrected_root_cause: String,
        comment: String
    },
    model_improvement: {
        dataset_target: {
            type: String,
            default: "training_retrain_queue"
        },
        labeled_for_retraining: {
            type: Boolean,
            default: true
        },
        effective_ground_truth: String,
        training_weight: Number
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true
});

export const Feedback = mongoose.model("Feedback", feedbackSchema);
export default Feedback;
