// SkyGuard AI - Connection State Warning Banner
import React from 'react';
import { ConnectionStatus } from '../websocket/useWebSocket';
import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react';

interface ConnectionBannerProps {
  status: ConnectionStatus;
  isStale: boolean;
  onReconnect: () => void;
}

export const ConnectionBanner: React.FC<ConnectionBannerProps> = ({
  status,
  isStale,
  onReconnect
}) => {
  if (status === 'connected' && !isStale) return null;

  if (isStale) {
    return (
      <div style={{
        background: '#fffbeb',
        border: '1px solid #fde68a',
        padding: '0.65rem 1rem',
        borderRadius: '8px',
        marginBottom: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.85rem',
        color: '#92400e'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={16} color="#d97706" />
          <span><strong>Telemetry Stream Paused:</strong> No new readings received in &gt; 35 seconds. Ensure the Simulator service is running.</span>
        </div>
        <button onClick={onReconnect} className="btn btn-secondary btn-sm" style={{ background: '#ffffff', fontSize: '0.75rem' }}>
          <RefreshCw size={12} />
          <span>Refresh</span>
        </button>
      </div>
    );
  }

  return (
    <div style={{
      background: '#fee2e2',
      border: '1px solid #fca5a5',
      padding: '0.65rem 1rem',
      borderRadius: '8px',
      marginBottom: '1.25rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontSize: '0.85rem',
      color: '#991b1b'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <WifiOff size={16} color="#dc2626" />
        <span><strong>WebSocket Disconnected:</strong> Reconnecting to backend live gateway...</span>
      </div>
      <button onClick={onReconnect} className="btn btn-secondary btn-sm" style={{ background: '#ffffff', fontSize: '0.75rem' }}>
        <RefreshCw size={12} />
        <span>Reconnect Now</span>
      </button>
    </div>
  );
};
