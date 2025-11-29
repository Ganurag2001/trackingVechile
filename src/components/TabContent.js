import React from 'react';
import { FleetOverview } from './FleetOverview';
import { TripsGrid } from './TripCard';

export function TabContent({
  activeTab,
  metrics,
  isSimulating,
  fleetCompletion,
  expandedTrips,
  onToggleExpand,
  liveEvents
}) {
  if (activeTab === 'overview') {
    return (
      <div className="tab-content">
        <FleetOverview 
          metrics={metrics}
          isSimulating={isSimulating}
          fleetCompletion={fleetCompletion}
        />
      </div>
    );
  }

  if (activeTab === 'trips') {
    return (
      <div className="tab-content">
        <div className="trips-section">
          <h2 className="section-title">Individual Trip Metrics</h2>
          <TripsGrid
            tripsMetrics={metrics}
            expandedTrips={expandedTrips}
            onToggleExpand={onToggleExpand}
            isSimulating={isSimulating}
            liveEvents={liveEvents}
          />
        </div>
      </div>
    );
  }

  return null;
}
