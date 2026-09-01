import { z } from "zod";

const nullableSensorNumber = z.preprocess((val) => {
    if (val === null || val === undefined || val === "") return null;
    const num = Number(val);
    return isNaN(num) ? null : num;
}, z.number().nullable().optional());

export const sensorReadingSchema = z.object({
    stationId: z.string().optional(),
    station_id: z.string().optional(),
    stationName: z.string().optional(),
    station_name: z.string().optional(),
    city: z.string().optional(),
    cluster: z.string().optional(),
    latitude: z.coerce.number().optional().nullable(),
    longitude: z.coerce.number().optional().nullable(),
    timestamp: z.union([z.string(), z.coerce.date()]).optional().nullable(),
    temperature: nullableSensorNumber,
    temperature_c: nullableSensorNumber,
    humidity: nullableSensorNumber,
    humidity_pct: nullableSensorNumber,
    pressure: nullableSensorNumber,
    pressure_hpa: nullableSensorNumber,
    _simulation: z.any().optional()
}).refine(data => Boolean(data.stationId || data.station_id), {
    message: "stationId or station_id is required"
});

export const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(50),
    station_id: z.string().optional(),
    stationId: z.string().optional(),
    cluster: z.string().optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional()
});