import { Router } from "express";
import { getAnomalies, getAnomalyById, getReportById, updateAnomalyStatusController, getStationAnomalies } from "./anomaly.controller.js";

const anomalyRouter = Router();

anomalyRouter.get("/", getAnomalies);
anomalyRouter.get("/station/:stationId", getStationAnomalies);
anomalyRouter.get("/reports/:id", getReportById);
anomalyRouter.get("/:anomalyId", getAnomalyById);
anomalyRouter.patch("/:anomalyId/status", updateAnomalyStatusController);

export default anomalyRouter;
