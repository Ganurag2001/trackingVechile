// Data loader utilities for fleet tracking dashboard

export const TRIP_FILES = {
  trip_1: 'trip_1_cross_country.json',
  trip_2: 'trip_2_urban_dense.json',
  trip_3: 'trip_3_mountain_cancelled.json',
  trip_4: 'trip_4_southern_technical.json',
  trip_5: 'trip_5_regional_logistics.json'
};

export const TRIP_NAMES = {
  trip_1: 'Cross Country Route',
  trip_2: 'Urban Delivery',
  trip_3: 'Mountain Route',
  trip_4: 'Southern Technical',
  trip_5: 'Regional Logistics'
};

export const TRIP_COLORS = {
  trip_1: '#FF6B6B',
  trip_2: '#4ECDC4',
  trip_3: '#45B7D1',
  trip_4: '#FFA07A',
  trip_5: '#98D8C8'
};

export const TRIP_VEHICLE_IDS = {
  trip_1: 'VH_001',
  trip_2: 'VH_002',
  trip_3: 'VH_003',
  trip_4: 'VH_004',
  trip_5: 'VH_005'
};

/**
 * Load trip data from public folder
 */
export async function loadTripData(tripKey) {
  try {
    const response = await fetch(`/data/${TRIP_FILES[tripKey]}`);
    if (!response.ok) {
      console.error(`Failed to load ${tripKey}: ${response.statusText}`);
      return [];
    }
    return await response.json();
  } catch (error) {
    console.error(`Error loading ${tripKey}:`, error);
    return [];
  }
}

/**
 * Load all trip data
 */
export async function loadAllTripData() {
  const trips = {};
  const keys = Object.keys(TRIP_FILES);
  
  for (const key of keys) {
    trips[key] = await loadTripData(key);
  }
  
  return trips;
}

/**
 * Calculate trip metrics from events
 */
export function calculateTripMetrics(events) {
  if (!events || events.length === 0) {
    return {
      totalDistance: 0,
      totalEvents: 0,
      startTime: null,
      endTime: null,
      plannedDistance: 0,
      estimatedDuration: 0,
      status: 'idle',
      maxSpeed: 0,
      averageSpeed: 0,
      stops: 0,
      lastLocation: null,
      lastUpdate: null,
      speedEvents: [],
      locations: [],
      completionPercentage: 0
    };
  }

  const startEvent = events.find(e => e.event_type === 'trip_started');
  const locationEvents = events.filter(e => e.event_type === 'location_ping');
  const lastLocationEvent = locationEvents[locationEvents.length - 1];
  const endEvent = events.find(e => e.event_type === 'trip_completed' || e.event_type === 'trip_cancelled');

  let maxSpeed = 0;
  let totalSpeedSum = 0;
  let speedCount = 0;
  let stops = 0;
  let lastMoving = true;

  locationEvents.forEach(event => {
    if (event.movement?.speed_kmh) {
      maxSpeed = Math.max(maxSpeed, event.movement.speed_kmh);
      totalSpeedSum += event.movement.speed_kmh;
      speedCount++;
    }
    
    // Count stops
    if (!event.movement?.moving && lastMoving) {
      stops++;
    }
    lastMoving = event.movement?.moving ?? true;
  });

  const plannedDistance = startEvent?.planned_distance_km || 0;
  const estimatedDuration = startEvent?.estimated_duration_hours || 0;
  const currentDistance = lastLocationEvent?.distance_travelled_km || 0;
  const completionPercentage = plannedDistance > 0 
    ? Math.round((currentDistance / plannedDistance) * 100)
    : 0;

  let status = 'in_progress';
  if (endEvent?.event_type === 'trip_completed') {
    status = 'completed';
  } else if (endEvent?.event_type === 'trip_cancelled') {
    status = 'cancelled';
  } else if (!locationEvents.length) {
    status = 'idle';
  }

  return {
    totalDistance: Math.round(currentDistance * 10) / 10,
    totalEvents: events.length,
    startTime: startEvent?.timestamp || null,
    endTime: endEvent?.timestamp || lastLocationEvent?.timestamp || null,
    plannedDistance: plannedDistance,
    estimatedDuration: estimatedDuration,
    status: status,
    maxSpeed: Math.round(maxSpeed * 10) / 10,
    averageSpeed: speedCount > 0 ? Math.round((totalSpeedSum / speedCount) * 10) / 10 : 0,
    stops: stops,
    lastLocation: lastLocationEvent?.location || null,
    lastUpdate: lastLocationEvent?.timestamp || null,
    speedEvents: locationEvents.map(e => ({
      timestamp: e.timestamp,
      speed: e.movement?.speed_kmh || 0
    })),
    locations: locationEvents.map(e => ({
      timestamp: e.timestamp,
      lat: e.location?.lat,
      lng: e.location?.lng,
      distance: e.distance_travelled_km
    })),
    completionPercentage: completionPercentage,
    elapsedHours: startEvent && lastLocationEvent 
      ? (new Date(lastLocationEvent.timestamp) - new Date(startEvent.timestamp)) / (1000 * 60 * 60)
      : 0
  };
}

/**
 * Get events between two timestamps
 */
export function getEventsBetween(events, startTime, endTime) {
  return events.filter(e => {
    const eventTime = new Date(e.timestamp).getTime();
    return eventTime >= new Date(startTime).getTime() && 
           eventTime <= new Date(endTime).getTime();
  });
}

/**
 * Get completion status for a percentage
 */
export function getCompletionStatus(percentage) {
  if (percentage >= 100) return 'completed';
  if (percentage >= 80) return 'almost-done';
  if (percentage >= 50) return 'halfway';
  if (percentage >= 20) return 'started';
  return 'not-started';
}

/**
 * Format time duration
 */
export function formatDuration(hours) {
  if (!hours) return '0h 0m';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
}

/**
 * Format timestamp
 */
export function formatTime(timestamp) {
  if (!timestamp) return 'N/A';
  try {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (e) {
    return 'Invalid';
  }
}
