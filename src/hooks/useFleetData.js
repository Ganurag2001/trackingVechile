import { useState, useEffect } from 'react';
import {
  loadAllTripData,
  calculateTripMetrics,
  TRIP_NAMES,
  TRIP_COLORS,
  TRIP_VEHICLE_IDS
} from '../utils/dataLoader';

export function useFleetData() {
  const [trips, setTrips] = useState({});
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fleetCompletion, setFleetCompletion] = useState({
    completed25: 0,
    completed50: 0,
    completed80: 0,
    allTripsCompleted: false
  });

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const allTrips = await loadAllTripData();
        setTrips(allTrips);

        // Calculate metrics for each trip
        const allMetrics = {};
        let completedCount25 = 0, completedCount50 = 0, completedCount80 = 0;
        
        Object.entries(allTrips).forEach(([key, events]) => {
          let tripMetrics = calculateTripMetrics(events);
          // Force status to 'idle' before simulation starts
          if (!tripMetrics.status || tripMetrics.status === 'completed' || tripMetrics.status === 'cancelled') {
            tripMetrics.status = 'idle';
          }
          allMetrics[key] = {
            ...tripMetrics,
            name: TRIP_NAMES[key],
            color: TRIP_COLORS[key],
            vehicleId: TRIP_VEHICLE_IDS[key]
          };

          // Track completion milestones
          if (tripMetrics.completionPercentage >= 80) completedCount80++;
          if (tripMetrics.completionPercentage >= 50) completedCount50++;
          if (tripMetrics.completionPercentage >= 25) completedCount25++;
        });

        setMetrics(allMetrics);
        setFleetCompletion({
          completed25: completedCount25,
          completed50: completedCount50,
          completed80: completedCount80,
          allTripsCompleted: completedCount80 === Object.keys(allTrips).length
        });
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return { trips, metrics, loading, error, fleetCompletion };
}
