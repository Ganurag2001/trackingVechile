import { useState, useCallback, useMemo } from 'react';

/**
 * Hook to manage simulation control state and handlers
 */
export function useSimulationControls(trips) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [expandedTrips, setExpandedTrips] = useState({});
  const [activeTab, setActiveTab] = useState('overview');
  const [liveEvents, setLiveEvents] = useState({});

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

  const handleToggleExpand = useCallback((tripKey) => {
    setExpandedTrips(prev => ({
      ...prev,
      [tripKey]: !prev[tripKey]
    }));
  }, []);

  const handlePlayToggle = useCallback(() => {
    setIsSimulating(prev => !prev);
  }, []);

  const handleReset = useCallback((resetStream) => {
    setIsSimulating(false);
    resetStream();
    setLiveEvents({});
  }, []);

  const handleSpeedChange = useCallback((speed) => {
    setSimulationSpeed(speed);
  }, []);

  const handleSeek = useCallback((seekToProgress, newProgress) => {
    if (seekToProgress) {
      seekToProgress(newProgress);
    }
  }, []);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
  }, []);

  return {
    isSimulating,
    simulationSpeed,
    expandedTrips,
    activeTab,
    liveEvents,
    simulationStartTime,
    simulationEndTime,
    handlers: {
      handleToggleExpand,
      handlePlayToggle,
      handleReset,
      handleSpeedChange,
      handleSeek,
      handleTabChange
    }
  };
}
