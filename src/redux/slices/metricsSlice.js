import { createSlice } from '@reduxjs/toolkit';
import { loadTripsData } from './tripsSlice';
import { calculateTripMetrics, TRIP_NAMES, TRIP_COLORS, TRIP_VEHICLE_IDS } from '../../utils/dataLoader';

const initialState = {
  metrics: {}, // { trip_1: { ...metrics }, trip_2: { ...metrics }, ... }
  simulationMetrics: {}, // Live metrics during simulation
  fleetCompletion: {
    completed25: 0,
    completed50: 0,
    completed80: 0,
    allTripsCompleted: false
  }
};

const metricsSlice = createSlice({
  name: 'metrics',
  initialState,
  reducers: {
    updateSimulationMetrics: (state, action) => {
      state.simulationMetrics = action.payload;
    },
    resetSimulationMetrics: (state) => {
      state.simulationMetrics = {};
    }
  },
  extraReducers: (builder) => {
    builder.addCase(loadTripsData.fulfilled, (state, action) => {
      // Calculate initial metrics for all trips
      const allMetrics = {};
      let completedCount25 = 0, completedCount50 = 0, completedCount80 = 0;
      
      Object.entries(action.payload).forEach(([key, events]) => {
        const tripMetrics = calculateTripMetrics(events);
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

      state.metrics = allMetrics;
      state.fleetCompletion = {
        completed25: completedCount25,
        completed50: completedCount50,
        completed80: completedCount80,
        allTripsCompleted: completedCount80 === Object.keys(action.payload).length
      };
    });
  }
});

export const {
  updateSimulationMetrics,
  resetSimulationMetrics
} = metricsSlice.actions;

export default metricsSlice.reducer;
