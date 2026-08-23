import { saveReading, findLatestReadings, countReadingsByStation, findReadingsByStation } from "./reading.repository.js";

const processReading = async (reading) => {
    try {
        await saveReading(reading);
    } catch (error) {
        console.error("Error processing reading:", error.message);
    }
};

export default processReading;

export const fetchLatestReadings = async () => {
    try {
        const readings = await findLatestReadings();
        return readings;
    } catch (error) {
        console.error("Error fetching latest readings:", error.message);
        throw error;
    }
}

export const fetchStationReadings = async (stationId, pageNumber, limitNumber, from, to) => {
    try {
        const skip = (pageNumber - 1) * limitNumber;
        const [readings, total] = await Promise.all([
            findReadingsByStation(stationId, { skip, limit: limitNumber, from, to }),
            countReadingsByStation(stationId , { from , to})
        ]);
        const totalPages = Math.ceil(total / limitNumber);

        return {
            readings,
            pagination: {
                total,
                totalPages,
                currentPage: pageNumber,
                limit: limitNumber
            }
        };
    } catch (error) {
        console.error("Error fetching station readings: service", error.message);
        throw error;
    }
}
