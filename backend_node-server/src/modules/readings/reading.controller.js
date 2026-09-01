import { fetchLatestReadings, fetchStationReadings, processReading } from "./reading.service.js";
import { paginationSchema, sensorReadingSchema } from "./reading.validator.js";
import asyncHandler from "../../utils/asyncHandler.js";

export const getLatestReadings = asyncHandler(async (req, res) => {
    const readings = await fetchLatestReadings();
    res.status(200).json({
        success: true,
        message: "Latest readings fetched successfully",
        data: readings,
    });
});

export const getStationReadings = asyncHandler(async (req, res) => {
    const { stationId } = req.params;
    const result = paginationSchema.safeParse(req.query);
    if (!result.success) {
        return res.status(400).json({
            success: false,
            message: "Invalid pagination parameters",
            error: result.error
        });
    }
    const { page, limit, from, to } = result.data;
    const readings = await fetchStationReadings(stationId, page, limit, from, to);
    res.status(200).json({
        success: true,
        message: "Station readings fetched successfully",
        data: readings,
    });
});

export const ingestTelemetryController = asyncHandler(async (req, res) => {
    const rawData = req.body || {};
    const readingData = rawData.telemetry ? {
        ...rawData.telemetry,
        station_id: rawData.station?.id || rawData.station_id || rawData.stationId || "DEMO-001",
        station_name: rawData.station?.name || rawData.station_name,
        city: rawData.station?.city || rawData.city,
        cluster: rawData.station?.cluster || rawData.cluster,
        latitude: rawData.station?.latitude ?? rawData.latitude,
        longitude: rawData.station?.longitude ?? rawData.longitude,
        timestamp: rawData.timestamp
    } : rawData;

    const result = await processReading(readingData);
    return res.status(200).json({
        status: "success",
        success: true,
        message: "Telemetry processed and analyzed successfully",
        result,
        data: result
    });
});