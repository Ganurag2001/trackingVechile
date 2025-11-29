import { useState, useEffect, useRef, useCallback } from 'react';
import {
  loadAllTripData,
  calculateTripMetrics,
  TRIP_NAMES,
  TRIP_COLORS,
  TRIP_VEHICLE_IDS,
  getEventsBetween
} from '../utils/dataLoader';

export function useFleetData() {
  const [trips, setTrips] = useState({});
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fleetCompletion, setFleetCompletion] = useState({
    completed25: 0,
    completed50: 0,
    completed80: 0,
    allTripsCompleted: false
  });

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const allTrips = await loadAllTripData();
        setTrips(allTrips);

        // Calculate metrics for each trip
        const allMetrics = {};
        let completedCount25 = 0, completedCount50 = 0, completedCount80 = 0;
        
        Object.entries(allTrips).forEach(([key, events]) => {
          const tripMetrics = calculateTripMetrics(events);
          allMetrics[key] = {
            ...tripMetrics,
            name: TRIP_NAMES[key],
            color: TRIP_COLORS[key],
            vehicleId: TRIP_VEHICLE_IDS[key]
          };

          // Track completion milestones
          if (tripMetrics.completionPercentage >= 80) completedCount80++;
          if (tripMetrics.completionPercentage >= 50) completedCount50++;
          if (tripMetrics.completionPercentage >= 25) completedCount25++;
        });

        setMetrics(allMetrics);
        setFleetCompletion({
          completed25: completedCount25,
          completed50: completedCount50,
          completed80: completedCount80,
          allTripsCompleted: completedCount80 === Object.keys(allTrips).length
        });
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return { trips, metrics, loading, error, fleetCompletion };
}

export function useSimulation(trips, isPlaying, speed = 1) {
  const [currentTime, setCurrentTime] = useState(null);
  const [simulationMetrics, setSimulationMetrics] = useState({});
  const [currentEvents, setCurrentEvents] = useState({});
  const [progress, setProgress] = useState(0);
  const animationFrameRef = useRef(null);
  const startTimeRef = useRef(null);
  const timeMultiplierRef = useRef(speed);
  const simStartTimeRef = useRef(null);
  const simEndTimeRef = useRef(null);

  useEffect(() => {
    timeMultiplierRef.current = speed;
  }, [speed]);

  // Calculate simulation start and end times
  useEffect(() => {
    if (!trips || Object.keys(trips).length === 0) return;

    const allEvents = Object.values(trips).flat();
    if (allEvents.length === 0) return;

    const timestamps = allEvents.map(e => new Date(e.timestamp).getTime());
    simStartTimeRef.current = Math.min(...timestamps);
    simEndTimeRef.current = Math.max(...timestamps);
  }, [trips]);

  const updateMetrics = useCallback(() => {
    const newMetrics = {};
    const newCurrentEvents = {};

    Object.entries(trips).forEach(([key, events]) => {
      if (currentTime && events.length > 0) {
        const filtered = getEventsBetween(
          events,
          events[0].timestamp,
          currentTime
        );
        newCurrentEvents[key] = filtered;
        
        // Calculate metrics up to current time
        const startEvent = events.find(e => e.event_type === 'trip_started');
        const locations = filtered.filter(e => e.event_type === 'location_ping');
        const lastLocation = locations[locations.length - 1];
        
        if (startEvent && lastLocation) {
          newMetrics[key] = {
            ...calculateTripMetrics(filtered),
            name: TRIP_NAMES[key],
            color: TRIP_COLORS[key],
            vehicleId: TRIP_VEHICLE_IDS[key]
          };
        }
      }
    });

    setSimulationMetrics(newMetrics);
    setCurrentEvents(newCurrentEvents);

    // Update progress
    if (simStartTimeRef.current && simEndTimeRef.current && currentTime) {
      const currentMs = new Date(currentTime).getTime();
      const progress = (currentMs - simStartTimeRef.current) / (simEndTimeRef.current - simStartTimeRef.current);
      setProgress(Math.max(0, Math.min(1, progress)));
    }
  }, [currentTime, trips]);

  useEffect(() => {
    updateMetrics();
  }, [currentTime, updateMetrics]);

  useEffect(() => {
    if (!isPlaying || !trips || Object.keys(trips).length === 0) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    if (!startTimeRef.current) {
      const firstEvent = Object.values(trips)
        .flat()
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))[0];
      
      if (firstEvent) {
        startTimeRef.current = {
          real: Date.now(),
          sim: new Date(firstEvent.timestamp).getTime()
        };
      }
    }

    const animate = () => {
      if (startTimeRef.current) {
        const elapsed = (Date.now() - startTimeRef.current.real) * timeMultiplierRef.current;
        const newTime = new Date(startTimeRef.current.sim + elapsed).toISOString();
        
        // Check if we've reached the end
        if (simEndTimeRef.current && new Date(newTime).getTime() >= simEndTimeRef.current) {
          setCurrentTime(new Date(simEndTimeRef.current).toISOString());
          return;
        }
        
        setCurrentTime(newTime);
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, trips]);

  const resetSimulation = useCallback(() => {
    setCurrentTime(null);
    startTimeRef.current = null;
    setProgress(0);
  }, []);

  const seekToProgress = useCallback((newProgress) => {
    if (simStartTimeRef.current && simEndTimeRef.current) {
      const range = simEndTimeRef.current - simStartTimeRef.current;
      const newMs = simStartTimeRef.current + range * newProgress;
      setCurrentTime(new Date(newMs).toISOString());
      
      // Reset animation timing
      startTimeRef.current = {
        real: Date.now(),
        sim: newMs
      };
      setProgress(newProgress);
    }
  }, []);

  return {
    currentTime,
    simulationMetrics,
    currentEvents,
    resetSimulation,
    progress,
    seekToProgress
  };
}
