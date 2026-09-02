// SkyGuard AI - Navigation Tabs Component
import React from 'react';
import {
  LayoutDashboard,
  Activity,
  AlertOctagon,
  Map,
  BarChart3,
  HeartPulse,
  BrainCircuit,
  Server
} from 'lucide-react';

export type NavTabId =
  | 'overview'
  | 'live-monitoring'
  | 'anomaly-center'
  | 'network-map'
  | 'analytics'
  | 'sensor-health'
  | 'ai-insights'
  | 'system-status';

interface NavigationProps {
  activeTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
  activeAnomalyCount?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  activeAnomalyCount = 0
}) => {
  const tabs: Array<{ id: NavTabId; label: string; icon: React.ReactNode; badge?: number }> = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={16} /> },
    { id: 'live-monitoring', label: 'Live Monitoring', icon: <Activity size={16} /> },
    {
      id: 'anomaly-center',
      label: 'Anomaly Center',
      icon: <AlertOctagon size={16} />,
      badge: activeAnomalyCount > 0 ? activeAnomalyCount : undefined
    },
    { id: 'network-map', label: 'Network Map', icon: <Map size={16} /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={16} /> },
    { id: 'sensor-health', label: 'Sensor Health', icon: <HeartPulse size={16} /> },
    { id: 'ai-insights', label: 'AI Insights', icon: <BrainCircuit size={16} /> },
    { id: 'system-status', label: 'System Status', icon: <Server size={16} /> }
  ];

  return (
    <nav className="app-nav">
      <div className="nav-inner">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  style={{
                    backgroundColor: '#fee2e2',
                    color: '#dc2626',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.1rem 0.4rem',
                    borderRadius: '9999px',
                    marginLeft: '0.2rem'
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
