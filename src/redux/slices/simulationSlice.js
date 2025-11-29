import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isPlaying: false,
  currentTime: null,
  speed: 1,
  progress: 0,
  startTime: null,
  endTime: null
};

const simulationSlice = createSlice({
  name: 'simulation',
  initialState,
  reducers: {
    setIsPlaying: (state, action) => {
      state.isPlaying = action.payload;
    },
    setCurrentTime: (state, action) => {
      state.currentTime = action.payload;
    },
    setSpeed: (state, action) => {
      state.speed = action.payload;
    },
    setProgress: (state, action) => {
      state.progress = action.payload;
    },
    setTimeRange: (state, action) => {
      state.startTime = action.payload.startTime;
      state.endTime = action.payload.endTime;
    },
    reset: (state) => {
      state.isPlaying = false;
      state.currentTime = null;
      state.progress = 0;
    }
  }
});

export const {
  setIsPlaying,
  setCurrentTime,
  setSpeed,
  setProgress,
  setTimeRange,
  reset
} = simulationSlice.actions;

export default simulationSlice.reducer;
