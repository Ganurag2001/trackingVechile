import React from 'react';
import '../styles/FleetOverview.css';

export function FleetOverview({ metrics, isSimulating = false, fleetCompletion = {} }) {
  const calculateFleetStats = () => {
    if (!metrics || Object.keys(metrics).length === 0) {
      return {
        totalTrips: 0,
        activeTrips: 0,
        completedTrips: 0,
        cancelledTrips: 0,
        totalDistanceCovered: 0,
        averageCompletion: 0,
        highestCompletion: { trip: null, percentage: 0 },
        lowestCompletion: { trip: null, percentage: 100 },
        peakAverageSpeed: 0,
        totalStops: 0,
        fleetHealth: 'unknown',
        tripsAt25: 0,
        tripsAt50: 0,
        tripsAt80: 0
      };
    }

    const trips = Object.entries(metrics);
    const statuses = trips.map(([_, m]) => m.status);
    const completions = trips.map(([_, m]) => m.completionPercentage);
    const speeds = trips.map(([_, m]) => m.averageSpeed);
    const stops = trips.map(([_, m]) => m.stops);

    const active = statuses.filter(s => s === 'in_progress' || s === 'active').length;
    const completed = statuses.filter(s => s === 'completed').length;
    const cancelled = statuses.filter(s => s === 'cancelled').length;
    const avgCompletion = Math.round(completions.reduce((a, b) => a + b, 0) / completions.length);
    
    let highestTrip = null;
    let highestPercentage = 0;
    let lowestTrip = null;
    let lowestPercentage = 100;

    trips.forEach(([key, m]) => {
      if (m.completionPercentage > highestPercentage) {
        highestPercentage = m.completionPercentage;
        highestTrip = m.name;
      }
      if (m.completionPercentage < lowestPercentage) {
        lowestPercentage = m.completionPercentage;
        lowestTrip = m.name;
      }
    });

    const tripsAt25 = Object.values(metrics).filter(m => m.completionPercentage >= 25).length;
    const tripsAt50 = Object.values(metrics).filter(m => m.completionPercentage >= 50).length;
    const tripsAt80 = Object.values(metrics).filter(m => m.completionPercentage >= 80).length;

    const peakSpeed = Math.max(...speeds.filter(s => s > 0), 0);
    const totalStops = stops.reduce((a, b) => a + b, 0);
    const totalDistance = trips.reduce((sum, [_, m]) => sum + m.totalDistance, 0);

    let health = 'excellent';
    if (cancelled > 0) health = 'warning';
    if (cancelled > 1 || avgCompletion < 30) health = 'poor';
    if (completed === trips.length) health = 'excellent';

    return {
      totalTrips: trips.length,
      activeTrips: active,
      completedTrips: completed,
      cancelledTrips: cancelled,
      totalDistanceCovered: Math.round(totalDistance * 10) / 10,
      averageCompletion: avgCompletion,
      highestCompletion: { trip: highestTrip, percentage: highestPercentage },
      lowestCompletion: { trip: lowestTrip, percentage: lowestPercentage },
      peakAverageSpeed: Math.round(peakSpeed * 10) / 10,
      totalStops: totalStops,
      fleetHealth: health,
      tripsAt25,
      tripsAt50,
      tripsAt80
    };
  };

  const stats = calculateFleetStats();

  const getHealthColor = (health) => {
    const colors = {
      excellent: '#51CF66',
      good: '#69DB7C',
      warning: '#FFD43B',
      poor: '#FF6B6B'
    };
    return colors[health] || '#95A5A6';
  };

  const getHealthText = (health) => {
    const texts = {
      excellent: 'Excellent',
      good: 'Good',
      warning: 'Warning',
      poor: 'Poor'
    };
    return texts[health] || 'Unknown';
  };

  return (
    <div className={`fleet-overview ${isSimulating ? 'live-monitoring' : ''}`}>
      <div className="overview-header">
        <h2 className="overview-title">Fleet Overview</h2>
        {isSimulating && <span className="live-badge">🔴 LIVE MONITORING</span>}
      </div>
      
      <div className="overview-grid">
        <div className="overview-card">
          <div className="card-icon">📊</div>
          <div className="card-content">
            <span className="card-label">Total Trips</span>
            <span className="card-value">{stats.totalTrips}</span>
          </div>
        </div>

        <div className="overview-card">
          <div className="card-icon">🚗</div>
          <div className="card-content">
            <span className="card-label">Active Trips</span>
            <span className={`card-value ${isSimulating ? 'live-value' : ''}`}>{stats.activeTrips}</span>
          </div>
        </div>

        <div className="overview-card">
          <div className="card-icon">✅</div>
          <div className="card-content">
            <span className="card-label">Completed</span>
            <span className={`card-value ${isSimulating ? 'live-value' : ''}`}>{stats.completedTrips}</span>
          </div>
        </div>

        <div className="overview-card">
          <div className="card-icon">❌</div>
          <div className="card-content">
            <span className="card-label">Cancelled</span>
            <span className="card-value">{stats.cancelledTrips}</span>
          </div>
        </div>

        <div className="overview-card">
          <div className="card-icon">📍</div>
          <div className="card-content">
            <span className="card-label">Total Distance</span>
            <span className={`card-value ${isSimulating ? 'live-value' : ''}`}>{stats.totalDistanceCovered} km</span>
          </div>
        </div>

        <div className="overview-card">
          <div className="card-icon">⏱️</div>
          <div className="card-content">
            <span className="card-label">Total Stops</span>
            <span className={`card-value ${isSimulating ? 'live-value' : ''}`}>{stats.totalStops}</span>
          </div>
        </div>

        <div className="overview-card">
          <div className="card-icon">📈</div>
          <div className="card-content">
            <span className="card-label">Avg Completion</span>
            <span className={`card-value ${isSimulating ? 'live-value' : ''}`}>{stats.averageCompletion}%</span>
          </div>
        </div>

        <div className="overview-card">
          <div className="card-icon">⚡</div>
          <div className="card-content">
            <span className="card-label">Peak Speed</span>
            <span className="card-value">{stats.peakAverageSpeed} km/h</span>
          </div>
        </div>
      </div>

      <div className="overview-insights">
        <div className="insight-box">
          <h3>Fleet Health</h3>
          <div className="health-indicator" style={{ backgroundColor: getHealthColor(stats.fleetHealth) }}>
            <span className="health-badge">{getHealthText(stats.fleetHealth)}</span>
          </div>
        </div>

        <div className="insight-box">
          <h3>Completion Range</h3>
          <div className="completion-range">
            <div className="range-item highest">
              <span className="range-label">Highest</span>
              <span className="range-trip">{stats.highestCompletion.trip}</span>
              <span className="range-value">{stats.highestCompletion.percentage}%</span>
            </div>
            <div className="range-item lowest">
              <span className="range-label">Lowest</span>
              <span className="range-trip">{stats.lowestCompletion.trip}</span>
              <span className="range-value">{stats.lowestCompletion.percentage}%</span>
            </div>
          </div>
        </div>

        <div className="insight-box">
          <h3>Completion Milestones</h3>
          <div className="milestones">
            <div className="milestone-item">
              <span className="milestone-label">25% Complete</span>
              <div className="milestone-bar">
                <div className="milestone-fill" style={{ width: `${(stats.tripsAt25 / stats.totalTrips) * 100}%` }} />
              </div>
              <span className="milestone-count">{stats.tripsAt25}/{stats.totalTrips} trips</span>
            </div>
            <div className="milestone-item">
              <span className="milestone-label">50% Complete</span>
              <div className="milestone-bar">
                <div className="milestone-fill" style={{ width: `${(stats.tripsAt50 / stats.totalTrips) * 100}%` }} />
              </div>
              <span className="milestone-count">{stats.tripsAt50}/{stats.totalTrips} trips</span>
            </div>
            <div className="milestone-item">
              <span className="milestone-label">80% Complete</span>
              <div className="milestone-bar">
                <div className="milestone-fill" style={{ width: `${(stats.tripsAt80 / stats.totalTrips) * 100}%` }} />
              </div>
              <span className="milestone-count">{stats.tripsAt80}/{stats.totalTrips} trips</span>
            </div>
          </div>
        </div>

        <div className="insight-box">
          <h3>Completion Distribution</h3>
          <div className="distribution">
            {[
              { range: '80-100%', count: Object.values(metrics).filter(m => m.completionPercentage >= 80).length },
              { range: '50-80%', count: Object.values(metrics).filter(m => m.completionPercentage >= 50 && m.completionPercentage < 80).length },
              { range: '20-50%', count: Object.values(metrics).filter(m => m.completionPercentage >= 20 && m.completionPercentage < 50).length },
              { range: '0-20%', count: Object.values(metrics).filter(m => m.completionPercentage < 20).length }
            ].map((item, idx) => (
              <div key={idx} className="dist-item">
                <span className="dist-label">{item.range}</span>
                <div className="dist-bar">
                  <div className="dist-fill" style={{ width: `${(item.count / stats.totalTrips) * 100}%` }} />
                </div>
                <span className="dist-count">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
