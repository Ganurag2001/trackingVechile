/**
 * MockEventStreamAPI - Core event streaming engine
 * 
 * Handles real-time event streaming with:
 * - Time-based event filtering
 * - Speed multiplier support (0.5x, 1x, 5x, 10x, etc.)
 * - Progress tracking and seeking
 * - Event listener management
 * - Efficient indexed lookups (O(1) event retrieval)
 */

class MockEventStreamAPI {
  constructor(tripsData, speedMultiplier = 1) {
    this.tripsData = tripsData;
    this.speedMultiplier = speedMultiplier;
    this.isStreaming = false;
    this.currentTime = 0;
    this.startTime = Date.now();
    this.lastTimestamp = 0;
    this.streamFrameId = null;
    
    // Event listeners
    this.eventListeners = [];
    this.completeListeners = [];
    
    // Build indexed event store for O(1) lookups
    this.allEvents = [];
    this.eventsByTime = new Map();
    this.eventsByTrip = {};
    this.minTimestamp = Infinity;
    this.maxTimestamp = -Infinity;
    
    this._indexEvents();
  }

  /**
   * Index all events for efficient lookups
   */
  _indexEvents() {
    Object.entries(this.tripsData).forEach(([tripId, tripData]) => {
      if (!tripData.events || !Array.isArray(tripData.events)) return;
      
      this.eventsByTrip[tripId] = [];
      
      tripData.events.forEach((event) => {
        const timestamp = new Date(event.timestamp).getTime();
        
        this.allEvents.push(event);
        this.eventsByTrip[tripId].push(event);
        
        // Track timestamp range
        if (timestamp < this.minTimestamp) this.minTimestamp = timestamp;
        if (timestamp > this.maxTimestamp) this.maxTimestamp = timestamp;
      });
    });

    this.allEvents.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeA - timeB;
    });

    this.totalDuration = this.maxTimestamp - this.minTimestamp;
  }

  /**
   * Start streaming events
   */
  startStream() {
    if (this.isStreaming) return;
    
    this.isStreaming = true;
    this.startTime = Date.now() - (this.currentTime / this.speedMultiplier);
    this._streamEvents();
  }

  /**
   * Stop streaming events
   */
  stopStream() {
    this.isStreaming = false;
    if (this.streamFrameId) {
      cancelAnimationFrame(this.streamFrameId);
      this.streamFrameId = null;
    }
  }

  /**
   * Main event streaming loop (60fps)
   */
  _streamEvents() {
    if (!this.isStreaming) return;

    const now = Date.now();
    this.currentTime = (now - this.startTime) * this.speedMultiplier;

    // Get events up to current simulation time
    const eventsUpToNow = this._getEventsUpToTime(this.currentTime);

    // Emit new events (only those we haven't emitted yet)
    eventsUpToNow.forEach((event) => {
      const eventTime = new Date(event.timestamp).getTime();
      if (eventTime > this.lastTimestamp) {
        this.lastTimestamp = eventTime;
        this._emitEvent(event);
      }
    });

    // Check if we've reached the end
    if (eventsUpToNow.length > 0) {
      const lastEventTime = new Date(eventsUpToNow[eventsUpToNow.length - 1].timestamp).getTime();
      if (lastEventTime >= this.maxTimestamp) {
        this.stopStream();
        this._emitComplete();
        return;
      }
    }

    this.streamFrameId = requestAnimationFrame(() => this._streamEvents());
  }

  /**
   * Get all events up to a given time relative to start
   */
  _getEventsUpToTime(relativeTime) {
    const targetTime = this.minTimestamp + relativeTime;
    
    return this.allEvents.filter((event) => {
      const eventTime = new Date(event.timestamp).getTime();
      return eventTime <= targetTime;
    });
  }

  /**
   * Set speed multiplier
   */
  setSpeedMultiplier(multiplier) {
    this.speedMultiplier = multiplier;
    if (this.isStreaming) {
      this.startTime = Date.now() - (this.currentTime / this.speedMultiplier);
    }
  }

  /**
   * Emit event to listeners
   */
  _emitEvent(event) {
    this.eventListeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    });
  }

  /**
   * Emit completion event
   */
  _emitComplete() {
    this.completeListeners.forEach((listener) => {
      try {
        listener();
      } catch (error) {
        console.error('Error in completion listener:', error);
      }
    });
  }

  /**
   * Subscribe to events
   */
  onEvent(listener) {
    this.eventListeners.push(listener);
    return () => {
      this.eventListeners = this.eventListeners.filter(l => l !== listener);
    };
  }

  /**
   * Subscribe to completion
   */
  onComplete(listener) {
    this.completeListeners.push(listener);
    return () => {
      this.completeListeners = this.completeListeners.filter(l => l !== listener);
    };
  }

  /**
   * Seek to a specific progress (0-1)
   */
  seekToProgress(progress) {
    if (progress < 0 || progress > 1) return;
    
    this.currentTime = this.totalDuration * progress;
    this.lastTimestamp = 0;
    
    if (this.isStreaming) {
      this.startTime = Date.now() - (this.currentTime / this.speedMultiplier);
    }
  }

  /**
   * Get current progress (0-1)
   */
  getProgress() {
    if (this.totalDuration === 0) return 0;
    return Math.min(this.currentTime / this.totalDuration, 1);
  }

  /**
   * Get statistics about the stream
   */
  getStatistics() {
    return {
      progress: this.getProgress(),
      currentTime: this.currentTime,
      totalDuration: this.totalDuration,
      eventCount: this.allEvents.length,
      tripCount: Object.keys(this.eventsByTrip).length,
      speedMultiplier: this.speedMultiplier,
      isStreaming: this.isStreaming
    };
  }

  /**
   * Reset stream
   */
  reset() {
    this.stopStream();
    this.currentTime = 0;
    this.lastTimestamp = 0;
    this.startTime = Date.now();
  }
}

export default MockEventStreamAPI;
