import { Analysis } from "./analysis.model.js";
import logger from "../../utils/logger.js";

export const saveAnalysis = async (analysisData) => {
    try {
        const analysis = new Analysis(analysisData);
        await analysis.save();
        return analysis;
    } catch (error) {
        if (error.code === 11000) {
            // Already exists, update it
            return await Analysis.findOneAndUpdate(
                { analysis_id: analysisData.analysis_id },
                analysisData,
                { returnDocument: "after" }
            );
        }
        logger.error({ error: error.message }, "Error saving analysis to MongoDB");
        throw error;
    }
};

export const findAnalyses = async (query = {}, options = {}) => {
    try {
        const limit = options.limit || 50;
        const skip = options.skip || 0;
        return await Analysis.find(query)
            .sort({ createdAt: -1, _id: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
    } catch (error) {
        logger.error({ error: error.message }, "Error fetching analyses");
        return [];
    }
};

import mongoose from "mongoose";

export const findAnalysisById = async (id) => {
    try {
        const orClauses = [{ analysis_id: id }, { incident_id: id }];
        if (mongoose.Types.ObjectId.isValid(id)) {
            orClauses.push({ _id: id });
        }
        return await Analysis.findOne({ $or: orClauses }).lean();
    } catch (error) {
        logger.error({ error: error.message }, "Error fetching analysis by id");
        return null;
    }
};

export const updateAnalysisFeedback = async (analysisId, feedbackData) => {
    try {
        const orClauses = [{ analysis_id: analysisId }, { incident_id: analysisId }];
        if (mongoose.Types.ObjectId.isValid(analysisId)) {
            orClauses.push({ _id: analysisId });
        }
        return await Analysis.findOneAndUpdate(
            { $or: orClauses },
            { $set: { operator_feedback: feedbackData } },
            { returnDocument: "after" }
        );
    } catch (error) {
        logger.error({ error: error.message }, "Error updating analysis feedback");
        return null;
    }
};
