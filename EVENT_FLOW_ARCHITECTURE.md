# Event Flow Architecture - Fleet Tracking Dashboard

## Overview
Events flow from JSON data files → MockEventStreamAPI → React hooks → Components → UI

---

## 1. DATA SOURCE
```
public/data/
├── trip_1_cross_country.json
├── trip_2_urban_dense.json
├── trip_3_mountain_cancelled.json
├── trip_4_southern_technical.json
└── trip_5_regional_logistics.json

Each file contains:
{
  "events": [
    {
      "timestamp": "2025-11-03T08:15:30Z",
      "event_type": "location_ping",
      "trip_id": "trip_1",
      "location": { "lat": 40.7128, "lng": -74.0060 },
      "movement": { "speed_kmh": 85, "moving": true },
      "distance_travelled_km": 125.5,
      ...
    },
    ...
  ]
}
```

---

## 2. DATA LOADING PHASE
```
useFleetData Hook (src/hooks/useFleetData.js)
        ↓
loadAllTripData() in dataLoader.js
        ↓
Fetch JSON files: /data/{tripId}.json
        ↓
Parse & Store: { trip_1: [...events], trip_2: [...events], ... }
        ↓
Calculate Initial Metrics
        ↓
Return to App.js: { trips, metrics, loading, error, fleetCompletion }
```

---

## 3. EVENT STREAMING PHASE
```
App.js starts useMockEventStream hook
        ↓
useMockEventStream (src/hooks/useMockEventStream.js)
        ↓
Create MockEventStreamAPI instance with trips data
        ↓
MockEventStreamAPI._indexEvents()
  - Indexes all events by trip
  - Sorts chronologically
  - Tracks min/max timestamps
        ↓
When isPlaying = true:
  - Subscribe to events: apiRef.current.onEvent(handleStreamEvent)
  - Start streaming: apiRef.current.startStream()
```

---

## 4. STREAMING ENGINE
```
MockEventStreamAPI._streamEvents() (runs in 60fps loop via requestAnimationFrame)
        ↓
Calculate current simulation time based on:
  - Real elapsed time
  - Speed multiplier (0.5x, 1x, 5x, 10x)
  - Formula: currentTime = (now - startTime) × speedMultiplier
        ↓
Get events up to simulation time:
  _getEventsUpToTime(currentTime)
  - Filters: allEvents where timestamp ≤ minTimestamp + currentTime
        ↓
For each new event (not yet emitted):
  - Check if eventTime > lastTimestamp
  - Call _emitEvent(event)
        ↓
_emitEvent(event)
  - Iterate through eventListeners array
  - Call each listener: listener(event)
```

---

## 5. EVENT CALLBACK TO REACT
```
handleStreamEvent callback (in useMockEventStream hook)
        ↓
When listener receives event from MockEventStreamAPI:
  
  const handleStreamEvent = useCallback((eventData) => {
    // Update React state with new event
    setStreamEvents(prev => [...prev, eventData]);
    
    // Update statistics
    if (apiRef.current) {
      setStreamStats(apiRef.current.getStatistics());
    }
  }, []);
        ↓
React state update triggers re-render
        ↓
return {
  streamEvents,      // Array of emitted events
  streamStats,       // { progress, currentTime, speedMultiplier, ... }
  isComplete,        // Boolean - stream finished?
  resetStream,       // Function to reset
  seekToProgress,    // Function to seek to time
  getProgress        // Function to get progress %
}
```

---

## 6. COMPONENT INTEGRATION
```
App.js receives hook data:

const { streamStats, resetStream, seekToProgress, getProgress } = useMockEventStream(
  trips,
  isSimulating,
  simulationSpeed
);
        ↓
Pass streamStats to SimulationControls component:
  <SimulationControls
    currentTime={streamStats?.currentTime}
    progress={progress}
    ...
  />
        ↓
SimulationControls displays current time & progress bar
        ↓
Metrics calculated from loaded trip data (useFleetData)
        ↓
Components re-render every 16ms (60fps) as events stream in
```

---

## 7. COMPLETE DATA FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│ DATA LOADING (Initial)                                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  useFleetData Hook                                           │
│  └─→ loadAllTripData()                                       │
│      └─→ fetch(/data/trip_*.json)                            │
│          └─→ Parse & index events                            │
│              └─→ Return { trips, metrics }                   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ EVENT STREAMING (Real-time simulation)                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  useMockEventStream Hook                                     │
│  └─→ MockEventStreamAPI constructor                         │
│      └─→ _indexEvents() - Sort & index events               │
│          └─→ requestAnimationFrame loop (60fps)             │
│              └─→ Calculate simulation time                  │
│                  └─→ _getEventsUpToTime()                   │
│                      └─→ _emitEvent(event)                  │
│                          └─→ listener callback              │
│                              └─→ handleStreamEvent()        │
│                                  └─→ setStreamEvents()      │
│                                      └─→ setState update    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ COMPONENT RENDER (UI Update)                                │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  React state update triggers re-render:                      │
│  ├─ streamStats (progress, currentTime)                      │
│  ├─ streamEvents (array of new events)                       │
│  ├─ metrics (from loaded data)                               │
│  └─ fleetCompletion (calculated stats)                       │
│                                                               │
│  Components update:                                          │
│  ├─ SimulationControls (shows progress bar, time)            │
│  ├─ FleetOverview (shows fleet metrics)                      │
│  ├─ TripsGrid (shows individual trip cards)                  │
│  └─ AppFooter (shows trip counts)                            │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. KEY FEATURES OF EVENT STREAMING

### Speed Multiplier
```javascript
// Simulation runs at controlled speed
// Real time: 1ms = 1ms
// 1x speed: event at 8:00 → displays when real time reaches event time
// 5x speed: events play 5x faster
// 10x speed: events play 10x faster

currentTime = (Date.now() - startTime) × speedMultiplier
```

### Time-based Filtering
```javascript
// Only events with timestamp ≤ simulation time are emitted
_getEventsUpToTime(relativeTime) {
  const targetTime = this.minTimestamp + relativeTime;
  return this.allEvents.filter(event => 
    new Date(event.timestamp).getTime() <= targetTime
  );
}
```

### Efficient Processing
```javascript
// Each event emitted only once
if (eventTime > this.lastTimestamp) {
  this._emitEvent(event);
  this.lastTimestamp = eventTime;
}
```

### 60 FPS Loop
```javascript
// requestAnimationFrame ensures smooth 60fps updates
_streamEvents() {
  // Process events
  // Update state
  
  this.streamFrameId = requestAnimationFrame(() => this._streamEvents());
}
```

---

## 9. SEQUENCE DIAGRAM

```
Time →

Load Data         Streaming Loop              Component Render
────────┬──────────────────┬──────────────────┬──────────────────
        │                  │                  │
App init→ useFleetData      │                  │
        ├─ fetch trips     │                  │
        ├─ return data  ───┼──────────────────┼───────────────→ Show Loading
        │                  │                  │
        │                  │ isPlaying=true   │
        │                  ├─ startStream()   │
        │                  │                  │
        │                  ├─ requestAnimFrame
        │                  │ (60fps loop)     │
        │                  │                  │
16ms────┼──────────────────┼──────────────────┤
        │                  ├─ Calculate time  │
        │                  ├─ Get events      │
        │                  ├─ Emit event ────┼──→ handleStreamEvent
        │                  │                  │    setStreamEvents
        │                  │                  ├──→ Re-render
        │                  │                  │    Show Event
        │                  │                  │
32ms────┼──────────────────┼──────────────────┤
        │                  ├─ Next event      │
        │                  ├─ Emit event ────┼──→ Update UI
        │                  │                  │
48ms────┼──────────────────┼──────────────────┤
        │                  ├─ Emit event ────┼──→ Update UI
        │                  │                  │
...
```

---

## 10. EXAMPLE EVENT JOURNEY

```
Scenario: Trip speed event at 2025-11-03T08:15:30Z with 5x speed

1. DATA LOADED
   Trip data: 10,000+ events loaded
   Sorted chronologically
   Indexed by trip

2. USER CLICKS PLAY
   isSimulating = true
   startStream() called
   speedMultiplier = 5

3. STREAMING BEGINS (requestAnimationFrame loop)
   
   Frame 1 (t=0ms):
   - Simulation time = 0
   - No events (time not reached yet)
   
   Frame 10 (t=160ms):
   - Real elapsed: 160ms
   - Simulation time: 160ms × 5 = 800ms
   - Event at 08:15:30 still not reached
   
   Frame 100 (t=1600ms):
   - Real elapsed: 1600ms
   - Simulation time: 1600ms × 5 = 8000ms (8 seconds later)
   - Now reaches event at ~08:15:30!
   - _getEventsUpToTime() returns event
   - _emitEvent() called
   - listener (handleStreamEvent) invoked
   
4. REACT STATE UPDATE
   setStreamEvents(prev => [...prev, speedEvent])
   setStreamStats({ progress: 5%, currentTime: 08:15:37, ... })
   
5. COMPONENT RE-RENDER
   SimulationControls shows:
   - Progress: ████░░░░ 5%
   - Time: 08:15:37
   - Speed: ⚡ 5x
   
   FleetOverview updates:
   - Trip 1: Speed 85 km/h
   - Distance: 125.5 km
   - Status: In Progress (5% complete)
```

---

## 11. PERFORMANCE CHARACTERISTICS

- **10,000+ events**: O(n) initial sort, O(1) per-event emission
- **60 FPS**: requestAnimationFrame ensures 16ms updates
- **Memory efficient**: Events indexed once, reused throughout session
- **Smooth playback**: Speed multipliers work seamlessly
- **Seek support**: Jump to any point in timeline instantly

---

## Summary

**Events reach frontend via:**

1. JSON files → DataLoader hook
2. MockEventStreamAPI indexes & schedules events
3. requestAnimationFrame (60fps) drives simulation time
4. Events emitted when simulation time ≥ event timestamp
5. Callbacks update React state
6. State changes trigger component re-renders
7. UI displays live metrics & trip progress

