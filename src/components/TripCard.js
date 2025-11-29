import React from 'react';
import { formatDuration, formatTime } from '../utils/dataLoader';
import '../styles/TripCard.css';

export function ProgressBar({ percentage, status, isLive = false }) {
  return (
    <div className="progress-bar-container">
      <div className={`progress-bar ${isLive ? 'live' : ''}`}>
        <div
          className={`progress-fill status-${status} ${isLive ? 'live-fill' : ''}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <span className="progress-text">{percentage}%</span>
    </div>
  );
}

export function TripCard({ tripKey, metrics, isExpanded, onToggle, isSimulating = false, liveEvent = null }) {
  if (!metrics) return null;

  const getStatusBadge = (status) => {
    const badges = {
      completed: { text: 'Completed ✓', class: 'badge-completed' },
      cancelled: { text: 'Cancelled ✗', class: 'badge-cancelled' },
      in_progress: { text: 'In Progress', class: 'badge-in-progress' },
      active: { text: 'Active', class: 'badge-in-progress' },
      idle: { text: 'Idle', class: 'badge-idle' }
    };
    return badges[status] || badges.idle;
  };

  const statusBadge = getStatusBadge(metrics.status);
  const isLiveUpdateHappening = isSimulating && liveEvent;

  return (
    <div
      className={`trip-card ${isExpanded ? 'expanded' : ''} ${isLiveUpdateHappening ? 'live-update' : ''}`}
      onClick={onToggle}
      style={{ borderLeft: `4px solid ${metrics.color}` }}
    >
      <div className="trip-card-header">
        <div className="trip-header-left">
          <h3 className="trip-title">{metrics.name}</h3>
          <p className="trip-vehicle">
            <span className="badge-vehicle">{metrics.vehicleId}</span>
            {isSimulating && <span className="live-indicator">● LIVE</span>}
          </p>
        </div>
        <div className="trip-header-right">
          <span className={`status-badge ${statusBadge.class}`}>
            {statusBadge.text}
          </span>
          <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
        </div>
      </div>

      <div className="trip-card-progress">
        <ProgressBar
          percentage={metrics.completionPercentage}
          status={metrics.completionPercentage >= 80 ? 'high' : 
                   metrics.completionPercentage >= 50 ? 'medium' : 'low'}
          isLive={isLiveUpdateHappening}
        />
      </div>

      <div className="trip-card-metrics">
        <div className="metric">
          <span className="metric-label">Distance</span>
          <span className="metric-value">
            {metrics.totalDistance} / {metrics.plannedDistance} km
          </span>
        </div>
        <div className="metric">
          <span className="metric-label">Avg Speed</span>
          <span className="metric-value">{metrics.averageSpeed} km/h</span>
        </div>
        <div className="metric">
          <span className="metric-label">Max Speed</span>
          <span className="metric-value">{metrics.maxSpeed} km/h</span>
        </div>
      </div>

      {liveEvent && (
        <div className="live-event-indicator">
          <span className="event-pulse">🔴</span>
          <span className="event-type">{liveEvent.event_type}</span>
          <span className="event-time">{formatTime(liveEvent.timestamp)}</span>
        </div>
      )}

      {isExpanded && (
        <div className="trip-card-details">
          <div className="details-grid">
            <div className="detail-item">
              <span className="detail-label">Start Time</span>
              <span className="detail-value">{formatTime(metrics.startTime)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Last Update</span>
              <span className="detail-value">{formatTime(metrics.lastUpdate)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Elapsed Time</span>
              <span className="detail-value">{formatDuration(metrics.elapsedHours)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Estimated Total</span>
              <span className="detail-value">{formatDuration(metrics.estimatedDuration)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Stops</span>
              <span className="detail-value">{metrics.stops}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Total Events</span>
              <span className="detail-value">{metrics.totalEvents.toLocaleString()}</span>
            </div>
          </div>

          {metrics.lastLocation && (
            <div className="location-info">
              <h4>Current Location</h4>
              <div className="coord-pair">
                <span className="coord-label">Latitude:</span>
                <span className="coord-value">{metrics.lastLocation.lat.toFixed(6)}</span>
              </div>
              <div className="coord-pair">
                <span className="coord-label">Longitude:</span>
                <span className="coord-value">{metrics.lastLocation.lng.toFixed(6)}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function TripsGrid({ tripsMetrics, expandedTrips, onToggleExpand, isSimulating = false, liveEvents = {} }) {
  return (
    <div className="trips-grid">
      {Object.entries(tripsMetrics).map(([tripKey, metrics]) => (
        <TripCard
          key={tripKey}
          tripKey={tripKey}
          metrics={metrics}
          isExpanded={expandedTrips[tripKey] || false}
          onToggle={() => onToggleExpand(tripKey)}
          isSimulating={isSimulating}
          liveEvent={liveEvents[tripKey]}
        />
      ))}
    </div>
  );
}
