# Mock API Documentation

## Overview

The fleet tracking dashboard includes two types of mock APIs for serving events:

1. **Event Stream API** - Real-time event streaming with WebSocket-like behavior
2. **REST API Server** - Traditional REST endpoints for querying events

Both simulate what a real backend would provide for fleet tracking.

---

## Event Stream API (`mockEventStream.js`)

### Purpose
Simulates a real-time event streaming service that processes events based on simulation time and speed multipliers.

### Key Features
- Real-time event processing
- Speed multiplier support (0.5x, 1x, 5x, 10x)
- Progress tracking
- Event seeking
- Completion detection

### Usage

```javascript
import MockEventStreamAPI from './api/mockEventStream';

// Initialize
const api = new MockEventStreamAPI(trips, speedMultiplier = 1);

// Listen for events
api.onEvent((eventData) => {
  console.log('New event:', eventData);
});

// Listen for completion
api.onComplete(() => {
  console.log('Stream complete');
});

// Start streaming
api.startStream();

// Change speed
api.setSpeedMultiplier(5);

// Seek to progress
api.seekToProgress(0.5); // Jump to 50%

// Get progress
const progress = api.getProgress(); // 0-1

// Get statistics
const stats = api.getStatistics();

// Stop and reset
api.stopStream();
api.reset();
```

### Event Data Structure

Each event emitted contains:

```javascript
{
  tripId: 'trip_1',
  tripName: 'trip_20251103_080000',
  event: { /* original event data */ },
  eventIndex: 150,
  totalEvents: 21721,
  timestamp: '2025-11-03T08:05:30.000Z'
}
```

---

## REST API Server (`mockAPIServer.js`)

### Purpose
Simulates a RESTful backend API for querying fleet events and metadata.

### API Endpoints

#### 1. `getEvents(query)`
Get events with optional filtering.

**Query Parameters:**
- `startTime` (string): ISO timestamp for start filter
- `endTime` (string): ISO timestamp for end filter
- `tripId` (string): Filter by specific trip
- `eventType` (string): Filter by event type (e.g., 'location_ping')
- `limit` (number): Max events to return (default: 100)

**Example:**
```javascript
const api = new MockAPIServer(trips);

const result = await api.getEvents({
  startTime: '2025-11-03T08:00:00Z',
  endTime: '2025-11-03T09:00:00Z',
  tripId: 'trip_1',
  eventType: 'location_ping',
  limit: 50
});

// Result:
{
  success: true,
  count: 50,
  data: [ { /* events */ } ],
  timestamp: '2025-11-29T12:00:00Z'
}
```

#### 2. `getTrips()`
Get metadata about all trips.

**Returns:**
```javascript
{
  success: true,
  tripCount: 5,
  trips: [
    {
      tripId: 'trip_1',
      vehicleId: 'VH_001',
      eventCount: 21721,
      startTime: '2025-11-03T08:00:00Z',
      endTime: '2025-11-05T09:45:46Z',
      status: 'completed',
      plannedDistance: 3294,
      estimatedDuration: 541.4
    },
    // ... more trips
  ],
  timestamp: '2025-11-29T12:00:00Z'
}
```

#### 3. `streamEvents(query)`
Get paginated event stream.

**Query Parameters:**
- `page` (number): Page number starting from 1 (default: 1)
- `pageSize` (number): Events per page (default: 50)
- `tripId` (string): Optional trip filter

**Example:**
```javascript
const result = await api.streamEvents({
  page: 1,
  pageSize: 100,
  tripId: 'trip_1'
});

// Result:
{
  success: true,
  page: 1,
  pageSize: 100,
  totalPages: 217,
  total: 21721,
  count: 100,
  hasNextPage: true,
  hasPrevPage: false,
  data: [ { /* 100 events */ } ],
  timestamp: '2025-11-29T12:00:00Z'
}
```

#### 4. `getRealtimeEvents(query)`
Get events within a specific time window (simulates real-time polling).

**Query Parameters:**
- `fromTime` (string): ISO timestamp - start of window (required)
- `toTime` (string): ISO timestamp - end of window (required)
- `tripId` (string): Optional trip filter

**Example:**
```javascript
const result = await api.getRealtimeEvents({
  fromTime: '2025-11-03T08:00:00Z',
  toTime: '2025-11-03T08:05:00Z',
  tripId: 'trip_1'
});
```

#### 5. `getTripEvents(tripId)`
Get all events for a specific trip.

**Example:**
```javascript
const result = await api.getTripEvents('trip_1');

// Result:
{
  success: true,
  tripId: 'trip_1',
  count: 21721,
  data: [ { /* all events for trip_1 */ } ],
  timestamp: '2025-11-29T12:00:00Z'
}
```

#### 6. `getStats()`
Get statistics about the entire dataset.

**Returns:**
```javascript
{
  success: true,
  data: {
    totalTrips: 5,
    totalEvents: 25334,
    eventTypes: {
      location_ping: 21654,
      vehicle_telemetry: 50,
      device_error: 20,
      signal_lost: 16,
      // ... more types
    },
    trips: {
      trip_1: 21721,
      trip_2: 500,
      trip_3: 100,
      trip_4: 1000,
      trip_5: 2000
    }
  },
  timestamp: '2025-11-29T12:00:00Z'
}
```

#### 7. `getHealth()`
Health check endpoint.

**Returns:**
```javascript
{
  success: true,
  status: 'operational',
  tripsLoaded: 5,
  eventsLoaded: 25334,
  timestamp: '2025-11-29T12:00:00Z'
}
```

---

## React Hooks

### `useMockEventStream(trips, isPlaying, speedMultiplier)`

Hook for real-time event streaming.

**Example:**
```javascript
import { useMockEventStream } from './hooks/useMockEventStream';

function MyComponent() {
  const { 
    streamEvents, 
    streamStats, 
    isComplete,
    resetStream,
    seekToProgress,
    getProgress 
  } = useMockEventStream(trips, isPlaying, speedMultiplier);

  return (
    <div>
      <p>Events: {streamEvents.length}</p>
      <p>Progress: {getProgress() * 100}%</p>
      {isComplete && <p>Stream complete!</p>}
    </div>
  );
}
```

### `useMockAPI(trips)`

Hook for REST API interactions.

**Example:**
```javascript
import { useMockAPI } from './hooks/useMockAPI';

function MyComponent() {
  const { 
    getEvents, 
    getTrips, 
    streamEvents,
    getRealtimeEvents,
    getTripEvents,
    getStats,
    getHealth,
    loading,
    error 
  } = useMockAPI(trips);

  const handleGetTrips = async () => {
    const result = await getTrips();
    console.log(result.trips);
  };

  return (
    <div>
      <button onClick={handleGetTrips}>Get Trips</button>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
    </div>
  );
}
```

---

## Performance Characteristics

### Event Stream API
- **Frequency**: 60fps (requestAnimationFrame)
- **Event Processing**: O(n) per frame where n = events up to current time
- **Memory**: Keeps track of processed indices (efficient)
- **Scalability**: Handles 25k+ events without blocking

### REST API Server
- **Query Time**: O(n) where n = total events (could be optimized with indexing)
- **Memory**: Builds full event cache on initialization (~1-2MB for 25k events)
- **Pagination**: Efficient for large datasets

---

## Use Cases

### Real-time Monitoring
Use `useMockEventStream` for dashboard that updates continuously:
```javascript
<SimulationControls 
  isPlaying={isPlaying}
  speedMultiplier={speedMultiplier}
/>
```

### On-Demand Queries
Use `useMockAPI` for analytics/reports:
```javascript
// Get all device errors
const errors = await getEvents({
  eventType: 'device_error'
});

// Get events from specific time range
const morningEvents = await getEvents({
  startTime: '2025-11-03T08:00:00Z',
  endTime: '2025-11-03T12:00:00Z'
});
```

### Pagination/Scrolling
Use `streamEvents` for large datasets:
```javascript
const page1 = await streamEvents({ page: 1, pageSize: 100 });
const page2 = await streamEvents({ page: 2, pageSize: 100 });
```

---

## Migration to Real Backend

When migrating to a real backend API:

1. **Event Stream API** → WebSocket or Server-Sent Events (SSE)
2. **REST API Server** → Express/Node.js or similar backend
3. Replace imports and update endpoint URLs
4. All component logic remains unchanged!

The mock APIs are designed to be drop-in replacements for real APIs.
