import { Router } from "express";
import { getLatestReadings, getStationReadings, ingestTelemetryController } from "./reading.controller.js";

const readingRoutes = Router();

readingRoutes.get("/", getLatestReadings);
readingRoutes.post("/", ingestTelemetryController);
readingRoutes.post("/telemetry", ingestTelemetryController);
readingRoutes.get("/station/:stationId", getStationReadings);

export default readingRoutes;
