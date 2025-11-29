/**
 * Simulation Engine for real-time fleet tracking
 * Processes events based on timestamps with configurable playback speed
 */

export class SimulationEngine {
  constructor(trips, speedMultiplier = 1) {
    this.trips = trips;
    this.speedMultiplier = speedMultiplier;
    this.isRunning = false;
    this.simulationTime = null; // null = not started, timestamp = current sim time
    this.processedEvents = new Map(); // tripId -> Set of processed event indices
    this.eventCallbacks = [];
    this.completionCallbacks = [];
    this.intervalId = null;
    this.lastUpdateTime = Date.now();
  }

  /**
   * Initialize simulation with all trips
   */
  initialize() {
    this.simulationTime = this.getEarliestTimestamp();
    this.processedEvents.clear();
    this.trips.forEach(trip => {
      this.processedEvents.set(trip.id, new Set());
    });
  }

  /**
   * Get the earliest timestamp across all trips
   */
  getEarliestTimestamp() {
    let earliest = Infinity;
    this.trips.forEach(trip => {
      if (trip.events && trip.events.length > 0) {
        const tripEarliest = Math.min(
          ...trip.events.map(e => new Date(e.timestamp).getTime())
        );
        earliest = Math.min(earliest, tripEarliest);
      }
    });
    return earliest === Infinity ? Date.now() : earliest;
  }

  /**
   * Get the latest timestamp across all trips
   */
  getLatestTimestamp() {
    let latest = 0;
    this.trips.forEach(trip => {
      if (trip.events && trip.events.length > 0) {
        const tripLatest = Math.max(
          ...trip.events.map(e => new Date(e.timestamp).getTime())
        );
        latest = Math.max(latest, tripLatest);
      }
    });
    return latest;
  }

  /**
   * Set playback speed multiplier (1x, 5x, 10x, etc.)
   */
  setSpeedMultiplier(multiplier) {
    this.speedMultiplier = Math.max(0.1, multiplier);
  }

  /**
   * Start the simulation
   */
  start(onEventCallback, onCompleteCallback) {
    if (this.isRunning) return;

    if (!this.simulationTime) {
      this.initialize();
    }

    this.isRunning = true;
    this.eventCallbacks = [onEventCallback].filter(Boolean);
    this.completionCallbacks = [onCompleteCallback].filter(Boolean);
    this.lastUpdateTime = Date.now();

    this.intervalId = setInterval(() => {
      this.update();
    }, 16); // ~60fps
  }

  /**
   * Update simulation, process new events
   */
  update() {
    const now = Date.now();
    const deltaTime = now - this.lastUpdateTime;
    this.lastUpdateTime = now;

    // Advance simulation time based on real time elapsed and speed multiplier
    // 1 real second = speedMultiplier simulation seconds
    const simulationDelta = deltaTime * this.speedMultiplier;
    this.simulationTime += simulationDelta;

    const latestTimestamp = this.getLatestTimestamp();

    // Check if simulation is complete
    if (this.simulationTime >= latestTimestamp) {
      this.simulationTime = latestTimestamp;
      this.processAllRemainingEvents();
      this.stop();
      this.completionCallbacks.forEach(cb => cb && cb());
      return;
    }

    // Process events that should occur at current simulation time
    this.processEventsAtCurrentTime();
  }

  /**
   * Process all events that should be visible at current simulation time
   */
  processEventsAtCurrentTime() {
    this.trips.forEach(trip => {
      if (!trip.events) return;

      const processedSet = this.processedEvents.get(trip.id);
      trip.events.forEach((event, index) => {
        if (!processedSet.has(index)) {
          const eventTime = new Date(event.timestamp).getTime();
          if (eventTime <= this.simulationTime) {
            processedSet.add(index);
            this.eventCallbacks.forEach(cb => {
              cb && cb({
                tripId: trip.id,
                tripName: trip.name || trip.id,
                event,
                eventIndex: index,
                totalEvents: trip.events.length
              });
            });
          }
        }
      });
    });
  }

  /**
   * Process all remaining events (for completion)
   */
  processAllRemainingEvents() {
    this.trips.forEach(trip => {
      if (!trip.events) return;

      const processedSet = this.processedEvents.get(trip.id);
      trip.events.forEach((event, index) => {
        if (!processedSet.has(index)) {
          processedSet.add(index);
          this.eventCallbacks.forEach(cb => {
            cb && cb({
              tripId: trip.id,
              tripName: trip.name || trip.id,
              event,
              eventIndex: index,
              totalEvents: trip.events.length
            });
          });
        }
      });
    });
  }

  /**
   * Pause the simulation
   */
  pause() {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Resume the simulation
   */
  resume() {
    if (this.isRunning) return;
    this.start(
      this.eventCallbacks[0],
      this.completionCallbacks[0]
    );
  }

  /**
   * Stop and reset the simulation
   */
  stop() {
    this.pause();
    this.simulationTime = null;
    this.processedEvents.clear();
  }

  /**
   * Reset to beginning without stopping
   */
  reset() {
    this.initialize();
  }

  /**
   * Seek to a specific time in the simulation
   */
  seekToTime(timestamp) {
    this.simulationTime = Math.max(
      this.getEarliestTimestamp(),
      Math.min(timestamp, this.getLatestTimestamp())
    );

    // Reset processed events for all events after this time
    this.trips.forEach(trip => {
      const processedSet = this.processedEvents.get(trip.id);
      if (trip.events) {
        trip.events.forEach((event, index) => {
          const eventTime = new Date(event.timestamp).getTime();
          if (eventTime > this.simulationTime) {
            processedSet.delete(index);
          }
        });
      }
    });
  }

  /**
   * Get simulation progress (0-1)
   */
  getProgress() {
    const earliest = this.getEarliestTimestamp();
    const latest = this.getLatestTimestamp();
    if (!this.simulationTime || latest === earliest) return 0;
    return Math.max(0, Math.min(1, (this.simulationTime - earliest) / (latest - earliest)));
  }

  /**
   * Get current simulation time as human-readable string
   */
  getCurrentTimeString() {
    if (!this.simulationTime) return 'Not started';
    return new Date(this.simulationTime).toLocaleTimeString();
  }

  /**
   * Get statistics about processed events
   */
  getStatistics() {
    const stats = {
      totalTrips: this.trips.length,
      trips: {}
    };

    this.trips.forEach(trip => {
      const processedSet = this.processedEvents.get(trip.id);
      const totalEvents = trip.events ? trip.events.length : 0;
      const processedCount = processedSet ? processedSet.size : 0;

      stats.trips[trip.id] = {
        name: trip.name || trip.id,
        totalEvents,
        processedEvents: processedCount,
        progress: totalEvents > 0 ? processedCount / totalEvents : 0
      };
    });

    return stats;
  }
}

/**
 * Convert raw trips data to structured format with metrics
 */
export function structureTripsForSimulation(rawTrips) {
  return rawTrips.map(trip => ({
    id: trip.trip_id || trip.id,
    name: trip.trip_name || trip.name || `Trip ${trip.trip_id}`,
    startLocation: trip.start_location || 'Unknown',
    endLocation: trip.end_location || 'Unknown',
    events: trip.events || [],
    status: 'active',
    completedAt: null
  }));
}
