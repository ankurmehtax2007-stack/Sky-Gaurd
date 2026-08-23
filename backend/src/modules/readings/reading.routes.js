import { Router } from "express";
// local modules import
import {
    getLatestReadings,
    getStationReadings,
} from "./reading.controller.js";

const readingRoutes = Router();

readingRoutes.route("/").get(getLatestReadings);
readingRoutes.route("/:stationId").get(getStationReadings);

export default readingRoutes;
