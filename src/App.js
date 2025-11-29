import React, { useState, useMemo, useEffect } from 'react';
import './App.css';
import { useFleetData, useSimulation } from './hooks/useFleetData';
import { FleetOverview } from './components/FleetOverview';
import { TripsGrid } from './components/TripCard';
import { SimulationControls } from './components/SimulationControls';
import { ErrorBoundary } from './components/ErrorBoundary';
import { calculateTripMetrics, TRIP_NAMES } from './utils/dataLoader';
import { initializePerformanceMonitoring } from './utils/performanceOptimization';

// Initialize performance monitoring
initializePerformanceMonitoring();

function AppContent() {
  const { trips, metrics, loading, error, fleetCompletion } = useFleetData();
  const [expandedTrips, setExpandedTrips] = useState({});
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [activeTab, setActiveTab] = useState('overview');
  const [liveEvents, setLiveEvents] = useState({});

  const { currentTime, simulationMetrics, resetSimulation, progress, seekToProgress } = useSimulation(
    trips,
    isSimulating,
    simulationSpeed
  );

  const displayMetrics = useMemo(() => {
    if (isSimulating && Object.keys(simulationMetrics).length > 0) {
      return simulationMetrics;
    }
    return metrics;
  }, [isSimulating, simulationMetrics, metrics]);

  const simulationStartTime = useMemo(() => {
    if (!trips || Object.keys(trips).length === 0) return null;
    const allEvents = Object.values(trips).flat();
    return allEvents.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))[0]?.timestamp;
  }, [trips]);

  const simulationEndTime = useMemo(() => {
    if (!trips || Object.keys(trips).length === 0) return null;
    const allEvents = Object.values(trips).flat();
    return allEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0]?.timestamp;
  }, [trips]);

  const handleToggleExpand = (tripKey) => {
    setExpandedTrips(prev => ({
      ...prev,
      [tripKey]: !prev[tripKey]
    }));
  };

  const handlePlayToggle = () => {
    setIsSimulating(!isSimulating);
  };

  const handleReset = () => {
    resetSimulation();
    setIsSimulating(false);
    setLiveEvents({});
  };

  const handleSpeedChange = (speed) => {
    setSimulationSpeed(speed);
  };

  const handleSeek = (newProgress) => {
    if (seekToProgress) {
      seekToProgress(newProgress);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handlePlayToggle();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        handleReset();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isSimulating]);

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner" />
        <p>Loading fleet data...</p>
        <p className="loading-info">Processing trip events...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-error">
        <h1>Error Loading Dashboard</h1>
        <p>{error}</p>
        <p>Make sure all trip data files are in the public/data directory.</p>
        <button 
          onClick={() => window.location.reload()}
          className="retry-btn"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="App">
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

      {/* Simulation Controls */}
      {simulationStartTime && simulationEndTime && (
        <SimulationControls
          isPlaying={isSimulating}
          onPlayToggle={handlePlayToggle}
          onReset={handleReset}
          onSpeedChange={handleSpeedChange}
          currentSpeed={simulationSpeed}
          currentTime={currentTime}
          startTime={simulationStartTime}
          endTime={simulationEndTime}
          progress={progress}
          onSeek={handleSeek}
        />
      )}

      {/* Tabs */}
      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Fleet Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'trips' ? 'active' : ''}`}
          onClick={() => setActiveTab('trips')}
        >
          🗺️ Trip Details ({Object.keys(displayMetrics).length})
        </button>
      </div>

      {/* Main Content */}
      <main className="app-main">
        {activeTab === 'overview' && (
          <div className="tab-content">
            <FleetOverview 
              metrics={displayMetrics}
              isSimulating={isSimulating}
              fleetCompletion={fleetCompletion}
            />
          </div>
        )}

        {activeTab === 'trips' && (
          <div className="tab-content">
            <div className="trips-section">
              <h2 className="section-title">Individual Trip Metrics</h2>
              <TripsGrid
                tripsMetrics={displayMetrics}
                expandedTrips={expandedTrips}
                onToggleExpand={handleToggleExpand}
                isSimulating={isSimulating}
                liveEvents={liveEvents}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>Fleet Tracking Assessment • Real-time Simulation Engine</p>
        <p className="footer-info">
          {Object.values(displayMetrics).length} trips • 
          {' '}
          {Object.values(displayMetrics)
            .filter(m => m.status === 'completed').length} completed • 
          {' '}
          {Object.values(displayMetrics)
            .filter(m => m.status === 'active' || m.status === 'in_progress').length} active •
          {' '}
          {Object.values(displayMetrics)
            .filter(m => m.status === 'cancelled').length} cancelled
        </p>
        <p className="footer-kb">💡 Keyboard: Space to play/pause, R to reset</p>
      </footer>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

export default App;
