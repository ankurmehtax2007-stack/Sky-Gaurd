import React from 'react';
import { ConnectionStatus } from '../websocket/useWebSocket';
import { ShieldCheck, Play, Pause, Zap, Radio, RefreshCw, Trash2 } from 'lucide-react';

interface HeaderProps {
  connectionStatus: ConnectionStatus;
  isStale: boolean;
  messageCount: number;
  isSimulatorRunning: boolean;
  onToggleSimulator: () => void;
  onTriggerCycle: () => void;
  onOpenInjectModal: () => void;
  onClearRecords: () => void;
  onReconnect: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  connectionStatus,
  isStale,
  messageCount,
  isSimulatorRunning,
  onToggleSimulator,
  onTriggerCycle,
  onOpenInjectModal,
  onClearRecords,
  onReconnect
}) => {
  const getStatusBadge = () => {
    if (isStale) {
      return (
        <div className="badge badge-warning" title="No live packet received in > 35s">
          <span className="badge-dot" />
          <span>Stream Stale</span>
        </div>
      );
    }
    switch (connectionStatus) {
      case 'connected':
        return (
          <div className="badge badge-normal" title="Connected to WebSocket real-time feed">
            <span className="badge-dot" />
            <span>Live Stream</span>
          </div>
        );
      case 'connecting':
        return (
          <div className="badge badge-warning">
            <span className="badge-dot" />
            <span>Connecting...</span>
          </div>
        );
      case 'disconnected':
      case 'error':
      default:
        return (
          <div
            className="badge badge-critical"
            style={{ cursor: 'pointer' }}
            onClick={onReconnect}
            title="Click to reconnect"
          >
            <span className="badge-dot" />
            <span>Offline (Reconnect)</span>
          </div>
        );
    }
  };

  return (
    <header className="app-header">
      <div className="header-inner">
        {/* Brand */}
        <div className="header-brand">
          <div className="brand-icon">
            <ShieldCheck size={22} strokeWidth={2.5} />
          </div>
          <div>
            <div className="brand-title">
              SkyGuard <span style={{ color: 'var(--brand-500)' }}>AI</span>
              <span className="brand-badge">SIH Edition</span>
            </div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>
              Multi-Tier Weather Station Anomaly Diagnostics
            </div>
          </div>
        </div>

        {/* Action Controls & Live Status */}
        <div className="header-actions">
          {/* WebSocket Status */}
          {getStatusBadge()}

          {/* Telemetry Counter */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              background: '#f8fafc',
              padding: '0.3rem 0.6rem',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              fontFamily: 'var(--font-mono)'
            }}
          >
            <Radio size={14} color="#0284c7" />
            <span>{messageCount} pkts</span>
          </div>

          {/* Simulator Quick Controls */}
          <button
            onClick={onToggleSimulator}
            className="btn btn-secondary btn-sm"
            title={isSimulatorRunning ? 'Pause Simulator' : 'Resume Simulator'}
          >
            {isSimulatorRunning ? <Pause size={14} /> : <Play size={14} />}
            <span>{isSimulatorRunning ? 'Pause Sim' : 'Start Sim'}</span>
          </button>

          <button
            onClick={onTriggerCycle}
            className="btn btn-secondary btn-sm"
            title="Trigger immediate 10s cycle across all stations"
          >
            <RefreshCw size={14} />
            <span>Step Cycle</span>
          </button>

          {/* Clear Records Button */}
          <button
            onClick={onClearRecords}
            className="btn btn-secondary btn-sm"
            title="Clear all database telemetry records, anomalies, and ML streaming buffers"
            style={{ color: '#dc2626', borderColor: '#fecaca', background: '#fff5f5' }}
          >
            <Trash2 size={14} />
            <span>Clear Records</span>
          </button>

          {/* Inject Anomaly Trigger Button */}
          <button
            onClick={onOpenInjectModal}
            className="btn btn-primary btn-sm"
            style={{ background: 'linear-gradient(135deg, #0284c7, #0d9488)' }}
          >
            <Zap size={14} />
            <span>Inject Anomaly</span>
          </button>
        </div>
      </div>
    </header>
  );
};
