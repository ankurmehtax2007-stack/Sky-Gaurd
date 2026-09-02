// SkyGuard AI - Root React Application
import React, { useState, useCallback, useEffect } from 'react';
import { useWebSocket } from './websocket/useWebSocket';
import { useStations } from './hooks/useStations';
import { useAnomalies } from './hooks/useAnomalies';
import { Header } from './components/Header';
import { Navigation, NavTabId } from './components/Navigation';
import { ConnectionBanner } from './components/ConnectionBanner';
import { StationDetailsModal } from './components/StationDetailsModal';
import { AnomalyInspectionModal } from './components/AnomalyInspectionModal';
import { InjectAnomalyModal } from './components/InjectAnomalyModal';

// Pages
import { OverviewPage } from './pages/OverviewPage';
import { LiveMonitoringPage } from './pages/LiveMonitoringPage';
import { AnomalyCenterPage } from './pages/AnomalyCenterPage';
import { NetworkMapPage } from './pages/NetworkMapPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SensorHealthPage } from './pages/SensorHealthPage';
import { AIInsightsPage } from './pages/AIInsightsPage';
import { SystemStatusPage } from './pages/SystemStatusPage';

import { toggleSimulator, triggerCycle, clearAllRecords, fetchSimulatorStatus } from './services/api';
import { LiveAnalysisRecord } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTabId>('overview');
  const [isInjectModalOpen, setIsInjectModalOpen] = useState<boolean>(false);
  const [isSimulatorRunning, setIsSimulatorRunning] = useState<boolean>(true);

  // Custom Hooks
  const {
    stations,
    latestAnalyses,
    historyByStation,
    selectedStation,
    selectedStationAnalysis,
    selectedStationHistory,
    inspectAnalysis,
    setSelectedStationId,
    setInspectAnalysis,
    handleLiveAnalysis,
    resetStationAnomalies
  } = useStations();

  const {
    anomalies,
    addLiveAnomaly,
    clearAnomalies
  } = useAnomalies();

  // Synchronize initial simulator status on mount
  useEffect(() => {
    let isMounted = true;
    const syncStatus = async () => {
      const status = await fetchSimulatorStatus();
      if (isMounted && status && typeof status.isRunning === 'boolean') {
        setIsSimulatorRunning(status.isRunning);
      }
    };
    syncStatus();
    return () => { isMounted = false; };
  }, []);

  // Unified WebSocket handler
  const onLiveAnalysisPacket = useCallback((record: LiveAnalysisRecord) => {
    handleLiveAnalysis(record);
    addLiveAnomaly(record);
  }, [handleLiveAnalysis, addLiveAnomaly]);

  const onRecordsCleared = useCallback(() => {
    clearAnomalies();
    resetStationAnomalies();
  }, [clearAnomalies, resetStationAnomalies]);

  const {
    status: connectionStatus,
    isStale,
    messageCount,
    reconnect
  } = useWebSocket({
    onAnalysisReceived: onLiveAnalysisPacket,
    onRecordsCleared: onRecordsCleared
  });

  // Simulator Controls
  const handleToggleSimulator = async () => {
    try {
      const res = await toggleSimulator();
      setIsSimulatorRunning(res.isRunning ?? !isSimulatorRunning);
    } catch {
      setIsSimulatorRunning(prev => !prev);
    }
  };

  const handleTriggerCycle = async () => {
    try {
      await triggerCycle();
    } catch {}
  };

  // Clear All Database Records & Streaming Buffers
  const handleClearRecords = async () => {
    if (!window.confirm("Clear all database records, anomaly alerts, and ML streaming buffers?")) {
      return;
    }
    try {
      await clearAllRecords();
      clearAnomalies();
      resetStationAnomalies();
    } catch (err: any) {
      alert("Failed to clear records: " + (err.message || err));
    }
  };

  // Inspect anomaly action handler
  const handleInspect = (record: LiveAnalysisRecord) => {
    setInspectAnalysis(record);
  };

  return (
    <div className="app-container">
      {/* 1. Header */}
      <Header
        connectionStatus={connectionStatus}
        isStale={isStale}
        messageCount={messageCount}
        isSimulatorRunning={isSimulatorRunning}
        onToggleSimulator={handleToggleSimulator}
        onTriggerCycle={handleTriggerCycle}
        onOpenInjectModal={() => setIsInjectModalOpen(true)}
        onClearRecords={handleClearRecords}
        onReconnect={reconnect}
      />

      {/* 2. Main Navigation Tabs */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        activeAnomalyCount={anomalies.length}
      />

      {/* 3. Main Operational Content Area */}
      <main className="main-content">
        {/* Connection status warning banner if disconnected/stale */}
        <ConnectionBanner
          status={connectionStatus}
          isStale={isStale}
          onReconnect={reconnect}
        />

        {/* 8 Primary Navigation Pages */}
        {activeTab === 'overview' && (
          <OverviewPage
            stations={stations}
            anomalies={anomalies}
            latestAnalyses={latestAnalyses}
            onInspect={handleInspect}
            onSelectStation={setSelectedStationId}
            onOpenInject={() => setIsInjectModalOpen(true)}
          />
        )}

        {activeTab === 'live-monitoring' && (
          <LiveMonitoringPage
            stations={stations}
            latestAnalyses={latestAnalyses}
            onSelectStation={setSelectedStationId}
            onInspect={handleInspect}
            onOpenInject={() => setIsInjectModalOpen(true)}
          />
        )}

        {activeTab === 'anomaly-center' && (
          <AnomalyCenterPage
            anomalies={anomalies}
            onInspect={handleInspect}
            onOpenInject={() => setIsInjectModalOpen(true)}
            onClearRecords={handleClearRecords}
          />
        )}

        {activeTab === 'network-map' && (
          <NetworkMapPage
            stations={stations}
            latestAnalyses={latestAnalyses}
            onSelectStation={setSelectedStationId}
            onInspect={handleInspect}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsPage
            stations={stations}
            anomalies={anomalies}
            historyByStation={historyByStation}
          />
        )}

        {activeTab === 'sensor-health' && (
          <SensorHealthPage
            stations={stations}
            latestAnalyses={latestAnalyses}
            onSelectStation={setSelectedStationId}
            onInspect={handleInspect}
          />
        )}

        {activeTab === 'ai-insights' && (
          <AIInsightsPage
            anomalies={anomalies}
            onInspect={handleInspect}
          />
        )}

        {activeTab === 'system-status' && (
          <SystemStatusPage
            connectionStatus={connectionStatus}
            messageCount={messageCount}
          />
        )}
      </main>

      {/* 4. Station Details Modal */}
      {selectedStation && (
        <StationDetailsModal
          station={selectedStation}
          analysis={selectedStationAnalysis}
          history={selectedStationHistory}
          onClose={() => setSelectedStationId(null)}
          onInspect={handleInspect}
        />
      )}

      {/* 5. Deep Anomaly Inspection Modal */}
      {inspectAnalysis && (
        <AnomalyInspectionModal
          analysis={inspectAnalysis}
          onClose={() => setInspectAnalysis(null)}
        />
      )}

      {/* 6. Anomaly Injection Modal */}
      {isInjectModalOpen && (
        <InjectAnomalyModal
          stations={stations}
          onClose={() => setIsInjectModalOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
