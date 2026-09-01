import { Feedback } from "./feedback.model.js";
import { findAnalysisById, updateAnalysisFeedback } from "../analyses/analysis.repository.js";
import logger from "../../utils/logger.js";
import crypto from "crypto";

export const createFeedback = async (feedbackInput) => {
    const analysisId = feedbackInput.analysis_id || feedbackInput.incident_id || feedbackInput.analysisId;
    const stationId = feedbackInput.station_id || feedbackInput.stationId || "DEMO-001";
    const decision = feedbackInput.operator_decision || feedbackInput.decision || "confirmed";
    const correctedRootCause = feedbackInput.corrected_root_cause || feedbackInput.correctedRootCause || null;
    const comment = feedbackInput.comment || "";
    const operatorId = feedbackInput.operator_id || feedbackInput.operatorId || "operator_station_lead";

    // 1. Validate that the referenced analysis exists
    let existingAnalysis = null;
    if (analysisId) {
        existingAnalysis = await findAnalysisById(analysisId);
    }

    const origPred = existingAnalysis ? {
        root_cause: existingAnalysis.anomaly?.root_cause || "normal",
        decision: existingAnalysis.anomaly?.decision || "normal",
        confidence: existingAnalysis.anomaly?.confidence || 0.95,
        severity: existingAnalysis.anomaly?.severity || "NONE"
    } : {
        root_cause: feedbackInput.original_root_cause || "unknown",
        decision: feedbackInput.original_decision || "unknown",
        confidence: feedbackInput.original_confidence || 0.9,
        severity: feedbackInput.original_severity || "NONE"
    };

    const feedbackId = `FB-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;

    // Determine effective ground truth label for future retrain dataset
    let effectiveLabel = origPred.root_cause;
    let weight = 1.0;
    if (decision === "false_alarm") {
        effectiveLabel = "normal";
        weight = 2.0;
    } else if (decision === "corrected" && correctedRootCause) {
        effectiveLabel = correctedRootCause;
        weight = 2.5;
    } else if (decision === "confirmed") {
        effectiveLabel = origPred.root_cause;
        weight = 1.2;
    }

    const feedbackDoc = {
        feedback_id: feedbackId,
        analysis_id: analysisId || `SYN-${Date.now()}`,
        station_id: stationId,
        operator_id: operatorId,
        operator_decision: decision,
        original_prediction: origPred,
        correction: {
            corrected_root_cause: correctedRootCause,
            comment
        },
        model_improvement: {
            dataset_target: "training_retrain_queue",
            labeled_for_retraining: true,
            effective_ground_truth: effectiveLabel,
            training_weight: weight
        },
        timestamp: new Date()
    };

    const savedFeedback = new Feedback(feedbackDoc);
    await savedFeedback.save();

    // Update the analysis document with operator feedback if exists
    if (analysisId) {
        await updateAnalysisFeedback(analysisId, {
            status: decision,
            corrected_root_cause: correctedRootCause,
            comment,
            operator_id: operatorId,
            submitted_at: new Date()
        });
    }

    logger.info({ feedbackId, analysisId, decision, effectiveLabel }, "Operator feedback successfully logged and registered for future model improvement");

    return {
        status: "success",
        message: "Operator feedback recorded and queued for continuous model improvement",
        feedback_id: feedbackId,
        analysis_id: analysisId,
        operator_decision: decision,
        effective_ground_truth: effectiveLabel,
        labeled_for_retraining: true,
        recorded_at: new Date().toISOString()
    };
};

export const getFeedbacks = async (limit = 50) => {
    try {
        return await Feedback.find().sort({ timestamp: -1 }).limit(limit).lean();
    } catch (error) {
        logger.error({ error: error.message }, "Error fetching feedbacks");
        return [];
    }
};
