import { WebSocketServer } from "ws";
import { addClient, broadcast, removeClient } from "./websocket.manager.js";
import logger from "../utils/logger.js";
import { activeWebSocketConnections } from "../utils/metrics.js";

export const initializeWebSocket = (server) => {
    const wss = new WebSocketServer({ server, path: "/ws" });
    
    wss.on("connection", (ws, req) => {
        logger.info(`WebSocket client connected from ${req?.socket?.remoteAddress || 'unknown'}`);
        try {
            activeWebSocketConnections.inc();
        } catch {}
        
        addClient(ws);

        // Send initial connection welcome message
        ws.send(JSON.stringify({
            type: "connected",
            message: "SkyGuard WebSocket connected successfully",
            timestamp: new Date().toISOString()
        }));

        ws.on("message", (msg) => {
            try {
                const parsed = JSON.parse(msg.toString());
                if (parsed.type === "ping") {
                    ws.send(JSON.stringify({ type: "pong", timestamp: new Date().toISOString() }));
                }
            } catch {}
        });

        ws.on("close", () => {
            logger.info("WebSocket client disconnected");
            try {
                activeWebSocketConnections.dec();
            } catch {}
            removeClient(ws);
        });

        ws.on("error", (err) => {
            logger.debug({ err: err.message }, "WebSocket client connection error");
            removeClient(ws);
        });
    });

    return wss;
};

export default initializeWebSocket;