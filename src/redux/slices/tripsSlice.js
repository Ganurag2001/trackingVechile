import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { loadAllTripData } from '../../utils/dataLoader';

/**
 * Async thunk to load all trip data
 */
export const loadTripsData = createAsyncThunk(
  'trips/loadTripsData',
  async (_, { rejectWithValue }) => {
    try {
      const trips = await loadAllTripData();
      return trips;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  data: {}, // { trip_1: [...events], trip_2: [...events], ... }
  loading: false,
  error: null,
  loaded: false
};

const tripsSlice = createSlice({
  name: 'trips',
  initialState,
  extraReducers: (builder) => {
    builder
      .addCase(loadTripsData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadTripsData.fulfilled, (state, action) => {
        state.data = action.payload;
        state.loading = false;
        state.loaded = true;
        state.error = null;
      })
      .addCase(loadTripsData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export default tripsSlice.reducer;
