import { configureStore } from '@reduxjs/toolkit';
import tripsReducer from './slices/tripsSlice';
import simulationReducer from './slices/simulationSlice';
import metricsReducer from './slices/metricsSlice';

export const store = configureStore({
  reducer: {
    trips: tripsReducer,
    simulation: simulationReducer,
    metrics: metricsReducer
  }
});

export default store;
