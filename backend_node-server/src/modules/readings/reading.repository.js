import { SensorReading } from "./reading.model.js";
import logger from "../../utils/logger.js";

export const saveReading = async (reading) => {
    try {
        const sensorReading = new SensorReading(reading);
        await sensorReading.save();
        return sensorReading;
    } catch (error) {
        logger.error({ error: error.message }, "Error saving reading");
        throw error;
    }
};

export const findLatestReadings = async () => {
    try {
        const readings = await SensorReading.aggregate([
            { $sort: { timestamp: -1 } },
            {
                $group: {
                    _id: { $ifNull: ["$station_id", "$stationId"] },
                    latestReading: { $first: "$$ROOT" }
                }
            },
            { $replaceRoot: { newRoot: "$latestReading" } }
        ]);
        return readings;
    } catch (error) {
        logger.error({ error: error.message }, "Error fetching latest readings");
        throw error;
    }
};

export const findRecentHistoryByStation = async (stationId, limit = 24) => {
    try {
        const readings = await SensorReading.find({
            $or: [{ stationId }, { station_id: stationId }]
        })
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();
        return readings.reverse();
    } catch (error) {
        logger.warn({ error: error.message }, "Error fetching recent station history");
        return [];
    }
};

export const findRecentClusterReadings = async (cluster, limit = 20) => {
    try {
        if (!cluster) return [];
        const readings = await SensorReading.find({ cluster })
            .sort({ timestamp: -1 })
            .limit(limit)
            .lean();
        return readings;
    } catch (error) {
        logger.warn({ error: error.message }, "Error fetching cluster neighbor readings");
        return [];
    }
};

export const findReadingById = async (id) => {
    try {
        const reading = await SensorReading.findById(id);
        return reading;
    } catch (error) {
        logger.error({ error: error.message }, "Error fetching reading by id");
        throw error;
    }
};

const buildReadingFilter = (stationId, options = {}) => {
    const filter = stationId
        ? { $or: [{ stationId }, { station_id: stationId }] }
        : {};

    if (options.from || options.to) {
        filter.timestamp = {};
        if (options.from) filter.timestamp.$gte = new Date(options.from);
        if (options.to) filter.timestamp.$lte = new Date(options.to);
    }
    return filter;
};

export const findReadingsByStation = async (stationId, options = {}) => {
    try {
        const filter = buildReadingFilter(stationId, options);
        const limit = options.limit || 50;
        const skip = options.skip || 0;
        const readings = await SensorReading.find(filter)
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit);
        return readings;
    } catch (error) {
        logger.error({ error: error.message }, "Error fetching readings by station");
        throw error;
    }
};

export const countReadingsByStation = async (stationId, options = {}) => {
    try {
        const query = buildReadingFilter(stationId, options);
        const count = await SensorReading.countDocuments(query);
        return count;
    } catch (error) {
        logger.error({ error: error.message }, "Error counting readings");
        throw error;
    }
};

export const findPendingReadings = async () => {
    try {
        const readings = await SensorReading.find({ mlStatus: "pending" }).limit(100);
        return readings;
    } catch (error) {
        logger.error({ error: error.message }, "Error finding pending readings");
        throw error;
    }
};

export const findDetectedAnomalies = async () => {
    try {
        const readings = await SensorReading.find({ anomalyStatus: "detected" }).limit(100);
        return readings;
    } catch (error) {
        logger.error({ error: error.message }, "Error finding detected anomalies");
        throw error;
    }
};

export const updateReading = async (id, updates) => {
    try {
        const reading = await SensorReading.findByIdAndUpdate(id, updates, { returnDocument: "after" });
        return reading;
    } catch (error) {
        logger.error({ error: error.message }, "Error updating reading");
        throw error;
    }
};