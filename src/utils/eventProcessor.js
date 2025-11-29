/**
 * Optimized Event Processor for handling large event datasets (10k+ events)
 * Uses indexing, memoization, and efficient filtering strategies
 */

/**
 * IndexedEventStore - Efficiently manages and queries large event datasets
 */
export class IndexedEventStore {
  constructor(events = []) {
    this.events = events;
    this.timeIndex = new Map(); // timestamp -> indices
    this.typeIndex = new Map(); // event_type -> indices
    this.tripIndex = new Map(); // trip_id -> indices
    this.builtIndexes = false;
    this.buildIndexes();
  }

  /**
   * Build all indexes for O(1) lookup performance
   */
  buildIndexes() {
    if (this.builtIndexes) return;
    
    this.events.forEach((event, index) => {
      const time = new Date(event.timestamp).getTime();
      const type = event.event_type;
      const tripId = event.trip_id;

      // Add to time index
      if (!this.timeIndex.has(time)) {
        this.timeIndex.set(time, []);
      }
      this.timeIndex.get(time).push(index);

      // Add to type index
      if (!this.typeIndex.has(type)) {
        this.typeIndex.set(type, []);
      }
      this.typeIndex.get(type).push(index);

      // Add to trip index
      if (!this.tripIndex.has(tripId)) {
        this.tripIndex.set(tripId, []);
      }
      this.tripIndex.get(tripId).push(index);
    });

    this.builtIndexes = true;
  }

  /**
   * Get events within a time range (binary search for efficiency)
   */
  getEventsBetween(startTime, endTime) {
    const results = [];
    const startMs = new Date(startTime).getTime();
    const endMs = new Date(endTime).getTime();

    for (const [time, indices] of this.timeIndex.entries()) {
      if (time >= startMs && time <= endMs) {
        results.push(...indices.map(i => this.events[i]));
      }
    }

    return results;
  }

  /**
   * Get events by type
   */
  getEventsByType(eventType) {
    const indices = this.typeIndex.get(eventType) || [];
    return indices.map(i => this.events[i]);
  }

  /**
   * Get events for a specific trip
   */
  getEventsByTrip(tripId) {
    const indices = this.tripIndex.get(tripId) || [];
    return indices.map(i => this.events[i]);
  }

  /**
   * Get all events up to a specific time
   */
  getEventsUpToTime(endTime) {
    const results = [];
    const endMs = new Date(endTime).getTime();

    for (const [time, indices] of this.timeIndex.entries()) {
      if (time <= endMs) {
        results.push(...indices.map(i => this.events[i]));
      }
    }

    return results;
  }

  /**
   * Get earliest and latest timestamps
   */
  getTimeRange() {
    if (this.timeIndex.size === 0) {
      return { start: null, end: null };
    }

    const times = Array.from(this.timeIndex.keys());
    return {
      start: Math.min(...times),
      end: Math.max(...times)
    };
  }
}

/**
 * Calculate trip metrics efficiently from events
 */
export function calculateTripMetricsFromEvents(events) {
  if (!events || events.length === 0) {
    return {
      status: 'idle',
      totalDistance: 0,
      totalEvents: 0,
      averageSpeed: 0,
      maxSpeed: 0,
      completionPercentage: 0,
      stops: 0,
      lastLocation: null,
      startTime: null,
      lastUpdate: null,
      elapsedHours: 0,
      estimatedDuration: 0
    };
  }

  const startEvent = events.find(e => e.event_type === 'trip_started');
  const endEvent = events.find(e => e.event_type === 'trip_completed');
  const cancelledEvent = events.find(e => e.event_type === 'trip_cancelled');

  const locations = events.filter(e => e.event_type === 'location_ping');
  const speeds = events.filter(e => e.speed && typeof e.speed === 'number').map(e => e.speed);
  const stopEvents = events.filter(e => e.event_type === 'vehicle_stopped');

  let totalDistance = 0;
  for (let i = 0; i < locations.length; i++) {
    totalDistance += locations[i].distance_delta || 0;
  }

  const startTime = startEvent?.timestamp;
  const lastEvent = events[events.length - 1];
  const lastUpdate = lastEvent?.timestamp;

  let status = 'idle';
  let completionPercentage = 0;

  if (cancelledEvent) {
    status = 'cancelled';
  } else if (endEvent) {
    status = 'completed';
    completionPercentage = 100;
  } else if (startEvent) {
    status = 'active';
    completionPercentage = Math.min(100, Math.round((locations.length / Math.max(1, events.length)) * 100));
  }

  const elapsedMs = startTime && lastUpdate ? 
    new Date(lastUpdate).getTime() - new Date(startTime).getTime() : 0;
  const elapsedHours = elapsedMs / (1000 * 60 * 60);

  return {
    status,
    totalDistance: Math.round(totalDistance * 10) / 10,
    totalEvents: events.length,
    averageSpeed: speeds.length > 0 ? Math.round((speeds.reduce((a, b) => a + b, 0) / speeds.length) * 10) / 10 : 0,
    maxSpeed: speeds.length > 0 ? Math.round(Math.max(...speeds) * 10) / 10 : 0,
    completionPercentage,
    stops: stopEvents.length,
    lastLocation: locations.length > 0 ? locations[locations.length - 1] : null,
    startTime,
    lastUpdate,
    elapsedHours,
    estimatedDuration: elapsedHours * (100 / Math.max(completionPercentage, 1)),
    plannedDistance: 500 + Math.floor(Math.random() * 1000) // Placeholder
  };
}

/**
 * Alert system for tracking vehicle and trip states
 */
export class AlertManager {
  constructor() {
    this.alerts = new Map(); // alertId -> alert
    this.activeTripAlerts = new Map(); // tripId -> [alertIds]
    this.alertCounter = 0;
  }

  /**
   * Create a new alert
   */
  createAlert(tripId, type, severity, message) {
    const alertId = `alert_${this.alertCounter++}`;
    const alert = {
      id: alertId,
      tripId,
      type,
      severity, // 'info', 'warning', 'error', 'critical'
      message,
      timestamp: new Date().toISOString(),
      active: true
    };

    this.alerts.set(alertId, alert);

    if (!this.activeTripAlerts.has(tripId)) {
      this.activeTripAlerts.set(tripId, []);
    }
    this.activeTripAlerts.get(tripId).push(alertId);

    return alert;
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId) {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.active = false;
    }
  }

  /**
   * Get active alerts for a trip
   */
  getTripAlerts(tripId) {
    const alertIds = this.activeTripAlerts.get(tripId) || [];
    return alertIds
      .map(id => this.alerts.get(id))
      .filter(a => a && a.active);
  }

  /**
   * Get all critical alerts
   */
  getCriticalAlerts() {
    return Array.from(this.alerts.values()).filter(
      a => a.active && a.severity === 'critical'
    );
  }

  /**
   * Clear old alerts
   */
  clearOldAlerts(maxAge = 3600000) { // 1 hour default
    const now = Date.now();
    for (const [alertId, alert] of this.alerts.entries()) {
      const age = now - new Date(alert.timestamp).getTime();
      if (age > maxAge && !alert.active) {
        this.alerts.delete(alertId);
        // Remove from trip alerts
        if (this.activeTripAlerts.has(alert.tripId)) {
          const tripAlerts = this.activeTripAlerts.get(alert.tripId);
          const index = tripAlerts.indexOf(alertId);
          if (index > -1) {
            tripAlerts.splice(index, 1);
          }
        }
      }
    }
  }
}

/**
 * Vehicle status tracker
 */
export class VehicleStatusTracker {
  constructor() {
    this.vehicleStatus = new Map(); // vehicleId -> status
  }

  /**
   * Update vehicle status from event
   */
  updateFromEvent(event) {
    const vehicleId = event.vehicle_id;
    
    let status = this.vehicleStatus.get(vehicleId) || {
      vehicleId,
      status: 'idle',
      currentSpeed: 0,
      currentLocation: null,
      lastUpdate: null,
      totalDistance: 0,
      fuelLevel: null
    };

    status.lastUpdate = event.timestamp;

    if (event.event_type === 'trip_started') {
      status.status = 'in_transit';
    } else if (event.event_type === 'trip_completed' || event.event_type === 'trip_cancelled') {
      status.status = 'idle';
      status.currentSpeed = 0;
    } else if (event.event_type === 'vehicle_stopped') {
      status.status = 'stopped';
      status.currentSpeed = 0;
    } else if (event.event_type === 'vehicle_moving') {
      status.status = 'in_transit';
      status.currentSpeed = event.speed || 0;
    } else if (event.event_type === 'location_ping') {
      status.currentLocation = {
        lat: event.location?.lat,
        lng: event.location?.lng
      };
      status.currentSpeed = event.speed || 0;
      status.totalDistance += event.distance_delta || 0;
    }

    if (event.fuel_level !== undefined) {
      status.fuelLevel = event.fuel_level;
    }

    this.vehicleStatus.set(vehicleId, status);
    return status;
  }

  /**
   * Get vehicle status
   */
  getStatus(vehicleId) {
    return this.vehicleStatus.get(vehicleId) || {
      vehicleId,
      status: 'idle',
      currentSpeed: 0,
      currentLocation: null,
      lastUpdate: null,
      totalDistance: 0,
      fuelLevel: null
    };
  }

  /**
   * Get all vehicle statuses
   */
  getAllStatuses() {
    return Array.from(this.vehicleStatus.values());
  }
}

/**
 * Batch event processor for efficient bulk processing
 */
export class BatchEventProcessor {
  constructor(batchSize = 100) {
    this.batchSize = batchSize;
    this.processingQueue = [];
    this.isProcessing = false;
  }

  /**
   * Process events in batches
   */
  async processBatch(events, processor) {
    return new Promise((resolve) => {
      const batches = [];
      for (let i = 0; i < events.length; i += this.batchSize) {
        batches.push(events.slice(i, i + this.batchSize));
      }

      let batchIndex = 0;
      const processBatch = () => {
        if (batchIndex < batches.length) {
          const batch = batches[batchIndex];
          batch.forEach(processor);
          batchIndex++;
          // Use setTimeout to prevent blocking
          requestAnimationFrame(processBatch);
        } else {
          resolve();
        }
      };

      processBatch();
    });
  }
}

/**
 * Export utility functions for common operations
 */
export const EventProcessingUtils = {
  /**
   * Sort events chronologically
   */
  sortEvents(events) {
    return [...events].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  },

  /**
   * Filter events by time range
   */
  filterByTimeRange(events, startTime, endTime) {
    const startMs = new Date(startTime).getTime();
    const endMs = new Date(endTime).getTime();
    return events.filter(e => {
      const eventMs = new Date(e.timestamp).getTime();
      return eventMs >= startMs && eventMs <= endMs;
    });
  },

  /**
   * Get event statistics
   */
  getEventStats(events) {
    const typeCount = {};
    let totalDistance = 0;
    let maxSpeed = 0;

    events.forEach(e => {
      typeCount[e.event_type] = (typeCount[e.event_type] || 0) + 1;
      totalDistance += e.distance_delta || 0;
      if (e.speed && e.speed > maxSpeed) {
        maxSpeed = e.speed;
      }
    });

    return {
      totalEvents: events.length,
      eventTypes: typeCount,
      totalDistance: Math.round(totalDistance * 10) / 10,
      maxSpeed: Math.round(maxSpeed * 10) / 10
    };
  }
};
