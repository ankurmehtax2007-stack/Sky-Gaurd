import { paginationSchema } from "../readings/reading.validator.js";
import { fetchAnomalies, fetchAnomalyById, updateAnomalyStatus } from "./anomaly.service.js";
import { findAnalysisById, findAnalyses } from "../analyses/analysis.repository.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { z } from "zod";

export const anomalyStatusSchema = z.object({
    status: z.enum(["acknowledged", "resolved", "confirmed", "false_alarm", "corrected"])
});

export const getAnomalies = asyncHandler(async (req, res) => {
    const result = paginationSchema.safeParse(req.query);
    const stationId = req.query.station_id || req.query.stationId;
    const limit = result.success ? result.data.limit : 50;
    const page = result.success ? result.data.page : 1;

    // First try fetching rich Analysis documents with anomaly detected
    const query = {
        $or: [
            { "anomaly.detected": true },
            { "anomaly.root_cause": { $nin: ["normal", null] } },
            { "anomaly.decision": { $nin: ["normal", null] } }
        ]
    };
    if (stationId) query.station_id = stationId;
    
    const analyses = await findAnalyses(query, { limit, skip: (page - 1) * limit });
    
    if (analyses.length > 0) {
        // Return format compatible with React dashboard App.jsx
        const formatted = analyses.map(a => ({
            _id: a._id,
            incident_id: a.incident_id || a.analysis_id,
            analysis_id: a.analysis_id,
            station_id: a.station_id || a.station?.id,
            station_name: a.station?.name || "AWS Node",
            city: a.station?.city || "New Delhi",
            cluster: a.station?.cluster || "NCR",
            latitude: a.station?.latitude ?? 28.6139,
            longitude: a.station?.longitude ?? 77.2090,
            timestamp: a.timestamp ? new Date(a.timestamp).toISOString() : new Date().toISOString(),
            temperature_c: a.telemetry?.temperature_c ?? 25.0,
            humidity_pct: a.telemetry?.humidity_pct ?? 50.0,
            pressure_hpa: a.telemetry?.pressure_hpa ?? 1013.25,
            root_cause: a.anomaly?.root_cause || "normal",
            decision: a.anomaly?.decision || "normal",
            confidence: a.anomaly?.confidence || 0.95,
            confidence_pct: `${((a.anomaly?.confidence || 0.95) * 100).toFixed(1)}%`,
            severity: a.anomaly?.severity || "NONE",
            severity_score: a.anomaly?.severity_score || 0.0,
            fused_anomaly_score: a.anomaly?.fused_anomaly_score || 0.0,
            sensor_health_score: a.health?.score || 100,
            health_score: a.health?.score || 100,
            health_status: a.health?.status || "GOOD",
            multi_source_evidence: a.evidence || {},
            evidence: a.evidence || {},
            shap_factors: a.explanation?.shap_factors || [],
            maintenance: a.maintenance || {},
            llm_report: a.llm?.report || "",
            llm_source: a.llm?.provider || "mistral",
            raw_record: a
        }));
        return res.status(200).json(formatted);
    }

    // Fallback to basic anomalies collection
    const anomalies = await fetchAnomalies(stationId, page, limit);
    return res.status(200).json(anomalies?.anomalies || []);
});

export const getAnomalyById = asyncHandler(async (req, res) => {
    const id = req.params.anomalyId || req.params.id;
    
    // Check Analysis collection first
    const analysis = await findAnalysisById(id);
    if (analysis) {
        return res.status(200).json({
            success: true,
            message: "Analysis fetched successfully",
            data: analysis
        });
    }

    const anomaly = await fetchAnomalyById(id);
    return res.status(200).json({
        success: true,
        message: "Anomaly fetched successfully",
        data: anomaly
    });
});

export const getReportById = asyncHandler(async (req, res) => {
    const id = req.params.id || req.params.anomalyId;
    const analysis = await findAnalysisById(id);
    if (!analysis) {
        return res.status(404).json({ success: false, message: "Report not found" });
    }
    return res.status(200).json({
        success: true,
        report_id: `REP-${analysis.analysis_id}`,
        analysis_id: analysis.analysis_id,
        station_id: analysis.station_id,
        timestamp: analysis.timestamp,
        telemetry: analysis.telemetry,
        diagnosis: analysis.anomaly,
        evidence: analysis.evidence,
        health: analysis.health,
        shap_explanation: analysis.explanation,
        maintenance: analysis.maintenance,
        ai_narrative: analysis.llm
    });
});

export const updateAnomalyStatusController = asyncHandler(async (req, res) => {
    const result = anomalyStatusSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({
            success: false,
            message: "Invalid anomaly status parameters",
            error: result.error.issues
        });
    }
    const { anomalyId } = req.params;
    const { status } = result.data;
    const userId = req.user?.id || "operator_lead";
    const updatedAnomaly = await updateAnomalyStatus(anomalyId, status, userId);
    return res.status(200).json({
        success: true,
        message: "Anomaly status updated successfully",
        data: updatedAnomaly
    });
});

export const getStationAnomalies = getAnomalies;
