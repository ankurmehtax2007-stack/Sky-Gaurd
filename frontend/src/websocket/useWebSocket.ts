// SkyGuard AI - Real-time WebSocket Client Hook
import { useEffect, useRef, useState, useCallback } from 'react';
import { WS_URL } from '../utils/constants';
import { LiveAnalysisRecord } from '../types';

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

interface UseWebSocketOptions {
  onAnalysisReceived?: (data: LiveAnalysisRecord) => void;
  onRawReadingReceived?: (data: any) => void;
  onRecordsCleared?: () => void;
  reconnectInterval?: number;
}

export const useWebSocket = ({
  onAnalysisReceived,
  onRawReadingReceived,
  onRecordsCleared,
  reconnectInterval = 3000
}: UseWebSocketOptions = {}) => {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [lastMessageTime, setLastMessageTime] = useState<Date | null>(null);
  const [isStale, setIsStale] = useState<boolean>(false);
  const [messageCount, setMessageCount] = useState<number>(0);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const pingIntervalRef = useRef<any>(null);
  const isMountedRef = useRef<boolean>(true);

  const connect = useCallback(() => {
    if (!isMountedRef.current) return;

    try {
      if (socketRef.current) {
        socketRef.current.close();
      }

      setStatus('connecting');
      const ws = new WebSocket(WS_URL);
      socketRef.current = ws;

      ws.onopen = () => {
        if (!isMountedRef.current) return;
        setStatus('connected');
        setIsStale(false);

        // Periodic ping
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 15000);
      };

      ws.onmessage = (event) => {
        if (!isMountedRef.current) return;
        setLastMessageTime(new Date());
        setIsStale(false);
        setMessageCount(prev => prev + 1);

        try {
          const message = JSON.parse(event.data);

          if (message.type === 'connected' || message.type === 'pong') {
            return;
          }

          if (message.type === 'RECORDS_CLEARED') {
            onRecordsCleared?.();
            return;
          }

          if (message.type === 'anomaly' && message.result) {
            onAnalysisReceived?.(message.result);
          } else if (message.type === 'ANALYSIS_UPDATED' && message.data) {
            onAnalysisReceived?.(message.data);
          } else if (message.type === 'READING_UPDATED' && message.data) {
            onRawReadingReceived?.(message.data);
          } else if (message.station_id || message.analysis_id) {
            // Direct analysis payload
            onAnalysisReceived?.(message as LiveAnalysisRecord);
          }
        } catch (err) {
          console.warn('Malformed WebSocket message payload received:', err);
        }
      };

      ws.onclose = () => {
        if (!isMountedRef.current) return;
        setStatus('disconnected');
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);

        // Schedule auto-reconnect
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            connect();
          }
        }, reconnectInterval);
      };

      ws.onerror = (err) => {
        if (!isMountedRef.current) return;
        console.warn('WebSocket connection encountered an issue:', err);
        setStatus('error');
      };
    } catch (error) {
      if (isMountedRef.current) {
        setStatus('error');
        reconnectTimeoutRef.current = setTimeout(connect, reconnectInterval);
      }
    }
  }, [onAnalysisReceived, onRawReadingReceived, reconnectInterval]);

  // Check for stale data (e.g. no messages received in > 35 seconds when connected)
  useEffect(() => {
    const staleChecker = setInterval(() => {
      if (status === 'connected' && lastMessageTime) {
        const diffMs = Date.now() - lastMessageTime.getTime();
        setIsStale(diffMs > 35000);
      }
    }, 5000);

    return () => clearInterval(staleChecker);
  }, [status, lastMessageTime]);

  useEffect(() => {
    isMountedRef.current = true;
    connect();

    return () => {
      isMountedRef.current = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  const reconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    connect();
  }, [connect]);

  return {
    status,
    lastMessageTime,
    isStale,
    messageCount,
    reconnect
  };
};
