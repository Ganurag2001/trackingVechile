/**
 * MockAPIServer - REST API simulation
 * 
 * Optional: If you want to use REST API endpoints instead of WebSocket streaming.
 * The main app uses MockEventStreamAPI for event streaming, but this provides
 * additional REST API endpoints for data access.
 */

class MockAPIServer {
  constructor(tripsData = {}) {
    this.tripsData = tripsData;
  }

  /**
   * Get events with optional filtering
   */
  getEvents(options = {}) {
    const { startTime, endTime, tripId, limit = 100, offset = 0 } = options;
    
    let events = [];
    
    if (tripId && this.tripsData[tripId]) {
      events = this.tripsData[tripId].events || [];
    } else {
      Object.values(this.tripsData).forEach((trip) => {
        events = events.concat(trip.events || []);
      });
    }

    // Filter by time range
    if (startTime || endTime) {
      const start = startTime ? new Date(startTime).getTime() : 0;
      const end = endTime ? new Date(endTime).getTime() : Infinity;
      
      events = events.filter((event) => {
        const time = new Date(event.timestamp).getTime();
        return time >= start && time <= end;
      });
    }

    // Sort by timestamp
    events.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeA - timeB;
    });

    // Paginate
    const total = events.length;
    events = events.slice(offset, offset + limit);

    return {
      events,
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    };
  }

  /**
   * Get all trips
   */
  getTrips() {
    return Object.entries(this.tripsData).map(([tripId, data]) => ({
      id: tripId,
      startLocation: data.startLocation,
      endLocation: data.endLocation,
      eventCount: (data.events || []).length,
      startTime: data.events?.[0]?.timestamp,
      endTime: data.events?.[data.events.length - 1]?.timestamp
    }));
  }

  /**
   * Get events for a specific trip
   */
  getTripEvents(tripId, options = {}) {
    if (!this.tripsData[tripId]) {
      return { error: 'Trip not found', events: [] };
    }

    const { limit = 100, offset = 0 } = options;
    const events = this.tripsData[tripId].events || [];
    
    return {
      tripId,
      events: events.slice(offset, offset + limit),
      total: events.length,
      limit,
      offset,
      hasMore: offset + limit < events.length
    };
  }

  /**
   * Get stream of events (paginated)
   */
  streamEvents(options = {}) {
    const { page = 1, pageSize = 50 } = options;
    const offset = (page - 1) * pageSize;
    
    return this.getEvents({ limit: pageSize, offset });
  }

  /**
   * Get fleet statistics
   */
  getStats() {
    let totalEvents = 0;
    let totalTrips = 0;
    let eventsByType = {};

    Object.values(this.tripsData).forEach((trip) => {
      totalTrips++;
      (trip.events || []).forEach((event) => {
        totalEvents++;
        eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      });
    });

    return {
      totalTrips,
      totalEvents,
      eventsByType,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Health check
   */
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      trips: Object.keys(this.tripsData).length
    };
  }
}

export default MockAPIServer;
