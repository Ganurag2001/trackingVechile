import React from 'react';

export function AppHeader({ isSimulating, simulationSpeed }) {
  return (
    <header className="app-header">
      <div className="header-content">
        <h1 className="app-title">🚚 Fleet Tracking Dashboard</h1>
        <p className="app-subtitle">Real-time monitoring of concurrent trips</p>
      </div>
      <div className="header-status">
        <span className={`status-indicator ${isSimulating ? 'active' : ''}`}>
          {isSimulating ? '● Live Monitoring' : '○ Simulation Ready'}
        </span>
        {isSimulating && (
          <span className="speed-badge">
            ⚡ {simulationSpeed}x Speed
          </span>
        )}
      </div>
    </header>
  );
}
