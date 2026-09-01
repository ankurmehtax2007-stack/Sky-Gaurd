import logger from "../utils/logger.js";

export const errorHandler = (err, req, res, next) => {
    const log = req.log ?? logger;
    log.error({ err: err.message || err, stack: err.stack }, "Error processing request");

    const statusCode = typeof err.statusCode === "number" ? err.statusCode : typeof err.status === "number" ? err.status : 500;
    const status = err.status && typeof err.status === "string" ? err.status : "error";
    const message = err.message || "Internal server error";

    return res.status(statusCode).json({
        success: false,
        status,
        message
    });
};

export default errorHandler;