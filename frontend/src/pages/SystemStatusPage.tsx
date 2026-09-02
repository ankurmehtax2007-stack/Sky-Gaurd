// SkyGuard AI - System & Services Status Dashboard Page
import React, { useState, useEffect } from 'react';
import { ConnectionStatus } from '../websocket/useWebSocket';
import { resetStreamingState, checkSystemHealth, fetchSimulatorStatus, toggleSimulator } from '../services/api';
import { SimulatorStatus } from '../types';
import {
  Server,
  Activity,
  Radio,
  Cpu,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Sliders,
  Play,
  Pause
} from 'lucide-react';

interface SystemStatusPageProps {
  connectionStatus: ConnectionStatus;
  messageCount: number;
}

export const SystemStatusPage: React.FC<SystemStatusPageProps> = ({
  connectionStatus,
  messageCount
}) => {
  const [backendAlive, setBackendAlive] = useState<boolean>(true);
  const [mlAlive, setMlAlive] = useState<boolean>(true);
  const [simStatus, setSimStatus] = useState<SimulatorStatus | null>(null);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const checkHealth = async () => {
    try {
      const { backend, mlService } = await checkSystemHealth();
      setBackendAlive(backend);
      setMlAlive(mlService);
    } catch {}

    try {
      const sim = await fetchSimulatorStatus();
      setSimStatus(sim);
    } catch {}
  };

  useEffect(() => {
    checkHealth();
    const timer = setInterval(checkHealth, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleResetBuffers = async () => {
    setIsResetting(true);
    setResetMessage(null);
    try {
      const res = await resetStreamingState();
      setResetMessage(res.message || 'Streaming buffers reset successfully.');
    } catch (err: any) {
      setResetMessage(`Reset failed: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  const handleToggleSim = async () => {
    try {
      await toggleSimulator();
      const updated = await fetchSimulatorStatus();
      setSimStatus(updated);
    } catch {}
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: '#e0f2fe', padding: '0.65rem', borderRadius: '10px', color: '#0284c7' }}>
            <Server size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>
              System Architecture & Health Status
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Operational health of all 5 SkyGuard microservices and real-time streaming pipeline.
            </p>
          </div>
        </div>

        <button onClick={checkHealth} className="btn btn-secondary btn-sm">
          <RefreshCw size={14} />
          <span>Refresh Health</span>
        </button>
      </div>

      {/* Microservices Status Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        {/* 1. FastAPI ML Engine */}
        <div className="card" style={{ borderLeft: `4px solid ${mlAlive ? '#16a34a' : '#dc2626'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>PORT 8000</div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>FastAPI ML Engine</h3>
            </div>
            {mlAlive ? <CheckCircle2 size={20} color="#16a34a" /> : <XCircle size={20} color="#dc2626" />}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.5rem' }}>
            XGBoost + Isolation Forest + SHAP + Physics Rules
          </div>
          <div style={{ fontSize: '0.725rem', color: '#94a3b8', marginTop: '0.25rem' }}>
            Status: <strong style={{ color: mlAlive ? '#16a34a' : '#dc2626' }}>{mlAlive ? 'Operational' : 'Unavailable'}</strong>
          </div>
        </div>

        {/* 2. Node.js Backend Gateway */}
        <div className="card" style={{ borderLeft: `4px solid ${backendAlive ? '#16a34a' : '#dc2626'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>PORT 3000</div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Node.js API Gateway</h3>
            </div>
            {backendAlive ? <CheckCircle2 size={20} color="#16a34a" /> : <XCircle size={20} color="#dc2626" />}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.5rem' }}>
            Express REST APIs + MongoDB Database Adapter
          </div>
          <div style={{ fontSize: '0.725rem', color: '#94a3b8', marginTop: '0.25rem' }}>
            Status: <strong style={{ color: backendAlive ? '#16a34a' : '#dc2626' }}>{backendAlive ? 'Operational' : 'Unavailable'}</strong>
          </div>
        </div>

        {/* 3. WebSocket Real-Time Channel */}
        <div className="card" style={{ borderLeft: `4px solid ${connectionStatus === 'connected' ? '#16a34a' : '#dc2626'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>PATH /ws</div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>WebSocket Server</h3>
            </div>
            {connectionStatus === 'connected' ? <CheckCircle2 size={20} color="#16a34a" /> : <XCircle size={20} color="#dc2626" />}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.5rem' }}>
            Push telemetry relay to React dashboard ({messageCount} pkts)
          </div>
          <div style={{ fontSize: '0.725rem', color: '#94a3b8', marginTop: '0.25rem' }}>
            Status: <strong style={{ color: connectionStatus === 'connected' ? '#16a34a' : '#dc2626' }}>{connectionStatus.toUpperCase()}</strong>
          </div>
        </div>

        {/* 4. Telemetry Simulator */}
        <div className="card" style={{ borderLeft: `4px solid ${simStatus?.isRunning ? '#16a34a' : '#d97706'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>PORT 3001</div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Telemetry Simulator</h3>
            </div>
            {simStatus?.isRunning ? <CheckCircle2 size={20} color="#16a34a" /> : <AlertTriangle size={20} color="#d97706" />}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.5rem' }}>
            Cadence: 10s per cycle across all 5 regional stations
          </div>
          <div style={{ fontSize: '0.725rem', color: '#94a3b8', marginTop: '0.25rem' }}>
            Status: <strong style={{ color: simStatus?.isRunning ? '#16a34a' : '#d97706' }}>{simStatus?.isRunning ? 'Running' : 'Paused'}</strong>
          </div>
        </div>
      </div>

      {/* Operational Maintenance Actions Card */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Sliders size={18} color="#0284c7" />
            <span>Streaming Buffer & Simulator Controls</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {resetMessage && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem', color: '#166534' }}>
              {resetMessage}
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {/* Reset Streaming State Button */}
            <button
              onClick={handleResetBuffers}
              disabled={isResetting}
              className="btn btn-secondary"
            >
              <RotateCcw size={15} />
              <span>{isResetting ? 'Resetting...' : 'Reset ML In-Memory Buffers'}</span>
            </button>

            {/* Simulator Toggle */}
            <button onClick={handleToggleSim} className="btn btn-secondary">
              {simStatus?.isRunning ? <Pause size={15} /> : <Play size={15} />}
              <span>{simStatus?.isRunning ? 'Pause Telemetry Stream' : 'Resume Telemetry Stream'}</span>
            </button>
          </div>

          <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            Resetting in-memory rolling buffers flushes the lag-feature history in FastAPI and allows fresh cold-start baseline evaluation without deleting historical records in MongoDB.
          </p>
        </div>
      </div>
    </div>
  );
};
