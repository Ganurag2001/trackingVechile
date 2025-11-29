/**
 * Performance Monitoring and Optimization Utilities
 */

/**
 * Performance Metrics Tracker
 */
// Import React for useRenderMetrics
import React from 'react';

export class PerformanceMetrics {
  constructor() {
    this.metrics = new Map();
    this.marks = new Map();
  }

  /**
   * Start measuring a metric
   */
  start(metricName) {
    this.marks.set(metricName, performance.now());
  }

  /**
   * End measuring and record the metric
   */
  end(metricName) {
    if (!this.marks.has(metricName)) {
      console.warn(`Metric ${metricName} was not started`);
      return 0;
    }

    const startTime = this.marks.get(metricName);
    const duration = performance.now() - startTime;

    if (!this.metrics.has(metricName)) {
      this.metrics.set(metricName, []);
    }

    this.metrics.get(metricName).push(duration);
    this.marks.delete(metricName);

    return duration;
  }

  /**
   * Get average time for a metric
   */
  getAverage(metricName) {
    const durations = this.metrics.get(metricName) || [];
    if (durations.length === 0) return 0;
    return durations.reduce((a, b) => a + b, 0) / durations.length;
  }

  /**
   * Get all metrics summary
   */
  getSummary() {
    const summary = {};
    for (const [metricName, durations] of this.metrics.entries()) {
      if (durations.length === 0) continue;
      summary[metricName] = {
        avg: Math.round(this.getAverage(metricName) * 100) / 100,
        min: Math.round(Math.min(...durations) * 100) / 100,
        max: Math.round(Math.max(...durations) * 100) / 100,
        count: durations.length
      };
    }
    return summary;
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics.clear();
    this.marks.clear();
  }

  /**
   * Log summary to console
   */
  logSummary() {
    const summary = this.getSummary();
    console.table(summary);
  }
}

/**
 * Memory Usage Monitor
 */
export class MemoryMonitor {
  constructor() {
    this.snapshots = [];
    this.enabled = typeof performance !== 'undefined' && 
                   typeof performance.memory !== 'undefined';
  }

  /**
   * Take a memory snapshot
   */
  snapshot(label = '') {
    if (!this.enabled) {
      console.warn('Performance.memory not available in this browser');
      return null;
    }

    const memory = performance.memory;
    const snapshot = {
      timestamp: Date.now(),
      label,
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usedPercent: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
    };

    this.snapshots.push(snapshot);
    return snapshot;
  }

  /**
   * Get memory change between snapshots
   */
  getChange(fromIndex, toIndex) {
    const from = this.snapshots[fromIndex];
    const to = this.snapshots[toIndex];

    if (!from || !to) return null;

    return {
      usedHeapChange: to.usedJSHeapSize - from.usedJSHeapSize,
      usedPercent: to.usedPercent,
      timeElapsed: to.timestamp - from.timestamp
    };
  }

  /**
   * Get latest memory usage
   */
  getLatest() {
    return this.snapshots[this.snapshots.length - 1] || null;
  }

  /**
   * Clear snapshots
   */
  clear() {
    this.snapshots = [];
  }
}

/**
 * Render Performance Monitor Hook
 */
export function useRenderMetrics(componentName) {
  const [renderCount, setRenderCount] = React.useState(0);
  const renderTimeRef = React.useRef(performance.now());

  React.useEffect(() => {
    setRenderCount(prev => prev + 1);
    const renderTime = performance.now() - renderTimeRef.current;

    if (process.env.NODE_ENV === 'development' && renderTime > 16) {
      console.warn(
        `Slow render in ${componentName}: ${Math.round(renderTime)}ms (threshold: 16ms)`
      );
    }

    renderTimeRef.current = performance.now();
  });

  return renderCount;
}

/**
 * Debounce function for optimization
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for optimization
 */
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Create memoized selector for Redux-like state
 */
export function createMemoSelector(...selectors) {
  let lastInputs = [];
  let lastOutput;

  return (state) => {
    const inputs = selectors.map(selector => selector(state));
    const inputsChanged = inputs.some((input, i) => input !== lastInputs[i]);

    if (inputsChanged) {
      lastOutput = inputs;
      lastInputs = inputs;
    }

    return lastOutput;
  };
}

/**
 * Virtual Scrolling optimization for large lists
 */
export class VirtualScroller {
  constructor(itemHeight, containerHeight, bufferSize = 5) {
    this.itemHeight = itemHeight;
    this.containerHeight = containerHeight;
    this.bufferSize = bufferSize;
  }

  /**
   * Calculate visible range based on scroll position
   */
  getVisibleRange(scrollTop, totalItems) {
    const visibleCount = Math.ceil(this.containerHeight / this.itemHeight);
    const startIndex = Math.max(0, Math.floor(scrollTop / this.itemHeight) - this.bufferSize);
    const endIndex = Math.min(totalItems - 1, startIndex + visibleCount + this.bufferSize * 2);

    return {
      startIndex,
      endIndex,
      visibleCount,
      offsetY: startIndex * this.itemHeight
    };
  }
}

/**
 * Global Performance Monitor
 */
export const performanceMonitor = new PerformanceMetrics();
export const memoryMonitor = new MemoryMonitor();

/**
 * Initialize performance monitoring
 */
export function initializePerformanceMonitoring() {
  if (process.env.NODE_ENV === 'development') {
    window.performanceMonitor = performanceMonitor;
    window.memoryMonitor = memoryMonitor;
    console.log('Performance monitoring enabled. Use window.performanceMonitor and window.memoryMonitor');
  }
}


