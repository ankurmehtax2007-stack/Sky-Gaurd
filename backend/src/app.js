import express from "express";
import readingRoutes from "./modules/readings/reading.routes.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));

// Routes
app.use("/api/readings", readingRoutes);


export default app;

