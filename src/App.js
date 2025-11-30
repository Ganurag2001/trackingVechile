import React, { useMemo } from 'react';
import './App.css';
import { useFleetData } from './hooks/useFleetData';
import { useMockEventStream } from './hooks/useMockEventStream';
import { useSimulationControls } from './hooks/useSimulationControls';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { AppHeader } from './components/AppHeader';
import { TabNavigation } from './components/TabNavigation';
import { TabContent } from './components/TabContent';
import { AppFooter } from './components/AppFooter';
import { LoadingState } from './components/LoadingState';
import { ErrorState } from './components/ErrorState';
import { SimulationControls } from './components/SimulationControls';
import { ErrorBoundary } from './components/ErrorBoundary';
import { initializePerformanceMonitoring } from './utils/performanceOptimization';

// Initialize performance monitoring
initializePerformanceMonitoring();

function AppContent() {
  const { trips, metrics, loading, error, fleetCompletion } = useFleetData();
  
  // Simulation controls and state
  const simulation = useSimulationControls(trips);
  const {
    isSimulating,
    simulationSpeed,
    expandedTrips,
    activeTab,
    liveEvents,
    simulationStartTime,
    simulationEndTime,
    handlers
  } = simulation;

  // Mock event stream
  const { streamStats, resetStream, seekToProgress, getProgress } = useMockEventStream(
    trips,
    isSimulating,
    simulationSpeed
  );

  // Keyboard shortcuts
  useKeyboardShortcuts(
    handlers.handlePlayToggle,
    () => handlers.handleReset(resetStream)
  );

  // Gradual metrics calculation based on simulation time
  const currentSimTime = streamStats?.currentTime;
  const displayMetrics = useMemo(() => {
    if (!trips || !currentSimTime) return metrics;
    const filteredMetrics = {};
    Object.entries(trips).forEach(([key, events]) => {
      // Only include events up to the current simulation time
      const filteredEvents = events.filter(e => new Date(e.timestamp).getTime() <= new Date(currentSimTime).getTime());
      filteredMetrics[key] = {
        ...metrics[key],
        ...require('./utils/dataLoader').calculateTripMetrics(filteredEvents)
      };
    });
    return filteredMetrics;
  }, [trips, metrics, currentSimTime]);
  const progress = useMemo(() => getProgress(), [getProgress]);

  // Loading state
  if (loading) {
    return <LoadingState />;
  }

  // Error state
  if (error) {
    return <ErrorState error={error} />;
  }

  return (
    <div className="App">
      <AppHeader 
        isSimulating={isSimulating}
        simulationSpeed={simulationSpeed}
      />

      {simulationStartTime && simulationEndTime && (
        <SimulationControls
          isPlaying={isSimulating}
          onPlayToggle={handlers.handlePlayToggle}
          onReset={() => handlers.handleReset(resetStream)}
          onSpeedChange={handlers.handleSpeedChange}
          currentSpeed={simulationSpeed}
          currentTime={streamStats?.currentTime}
          startTime={simulationStartTime}
          endTime={simulationEndTime}
          progress={progress}
          onSeek={(newProgress) => handlers.handleSeek(seekToProgress, newProgress)}
        />
      )}

      <TabNavigation 
        activeTab={activeTab}
        onTabChange={handlers.handleTabChange}
        tripsCount={Object.keys(displayMetrics).length}
      />

      <main className="app-main">
        <TabContent
          activeTab={activeTab}
          metrics={displayMetrics}
          isSimulating={isSimulating}
          fleetCompletion={fleetCompletion}
          expandedTrips={expandedTrips}
          onToggleExpand={handlers.handleToggleExpand}
          liveEvents={liveEvents}
        />
      </main>

      <AppFooter metrics={displayMetrics} />
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
