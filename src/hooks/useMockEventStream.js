import { useEffect, useRef, useCallback, useState } from 'react';
import MockEventStreamAPI from '../api/mockEventStream';

/**
 * Hook to use the mock event stream API
 * Manages real-time event streaming for fleet tracking
 */
export function useMockEventStream(trips, isPlaying, speedMultiplier = 1) {
  const [streamEvents, setStreamEvents] = useState([]);
  const [streamStats, setStreamStats] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const apiRef = useRef(null);
  const unsubscribeRef = useRef([]);

  /**
   * Initialize the mock API
   */
  useEffect(() => {
    if (!trips || Object.keys(trips).length === 0) return;

    apiRef.current = new MockEventStreamAPI(trips, speedMultiplier);
    
    return () => {
      if (apiRef.current) {
        apiRef.current.stopStream();
      }
    };
  }, [trips, speedMultiplier]);

  /**
   * Handle incoming events
   */
  const handleStreamEvent = useCallback((eventData) => {
    setStreamEvents(prev => [...prev, eventData]);
    
    // Update stats
    if (apiRef.current) {
      setStreamStats(apiRef.current.getStatistics());
    }
  }, []);

  /**
   * Handle stream completion
   */
  const handleStreamComplete = useCallback(() => {
    setIsComplete(true);
  }, []);

  /**
   * Start/Stop streaming based on isPlaying
   */
  useEffect(() => {
    if (!apiRef.current) return;

    if (isPlaying) {
      // Set speed multiplier
      apiRef.current.setSpeedMultiplier(speedMultiplier);
      
      // Subscribe to events
      const unsubEvent = apiRef.current.onEvent(handleStreamEvent);
      const unsubComplete = apiRef.current.onComplete(handleStreamComplete);
      
      unsubscribeRef.current = [unsubEvent, unsubComplete];

      // Start streaming
      apiRef.current.startStream();
    } else {
      // Stop streaming
      apiRef.current.stopStream();
      
      // Unsubscribe from events
      unsubscribeRef.current.forEach(unsub => unsub?.());
    }

    return () => {
      // Cleanup
      unsubscribeRef.current.forEach(unsub => unsub?.());
    };
  }, [isPlaying, speedMultiplier, handleStreamEvent, handleStreamComplete]);

  /**
   * Reset the stream
   */
  const resetStream = useCallback(() => {
    if (apiRef.current) {
      apiRef.current.reset();
      setStreamEvents([]);
      setStreamStats(null);
      setIsComplete(false);
    }
  }, []);

  /**
   * Seek to progress
   */
  const seekToProgress = useCallback((progress) => {
    if (apiRef.current) {
      apiRef.current.seekToProgress(progress);
      setStreamEvents([]);
      setStreamStats(apiRef.current.getStatistics());
    }
  }, []);

  /**
   * Get progress
   */
  const getProgress = useCallback(() => {
    if (apiRef.current) {
      return apiRef.current.getProgress();
    }
    return 0;
  }, []);

  return {
    streamEvents,
    streamStats,
    isComplete,
    resetStream,
    seekToProgress,
    getProgress
  };
}
