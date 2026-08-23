// local modules import
import { fetchLatestReadings, fetchStationReadings } from "./reading.service.js";
import { paginationSchema } from "./reading.validator.js";

export const getLatestReadings = async (req, res) => {
    try {
        const readings = await fetchLatestReadings();
        res.status(200).json({
            success: true,
            message: "Latest readings fetched successfully",
            data: readings,
        });
    } catch (error) {
        console.error("Error fetching latest readings:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch latest readings",
        });
    }
};

export const getStationReadings = async (req, res) => {
    try {
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
    } catch (error) {
        console.error("Error fetching station readings:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch station readings controller",
        });
    }
};