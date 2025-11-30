import React, { useState } from 'react';
import '../styles/SimulationControls.css';
import { formatTime } from '../utils/dataLoader';

export function SimulationControls({
  isPlaying,
  onPlayToggle,
  onReset,
  onSpeedChange,
  currentSpeed,
  currentTime,
  startTime,
  endTime,
  progress = 0,
  onSeek = null
}) {
  const [isDragging, setIsDragging] = useState(false);

  const calculateProgress = () => {
    if (!startTime || !endTime || !currentTime) return 0;
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const current = new Date(currentTime).getTime();
    return Math.min(Math.max(((current - start) / (end - start)) * 100, 0), 100);
  };

  const handleProgressBarClick = (e) => {
    if (!onSeek) return;
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const percentage = (e.clientX - rect.left) / rect.width;
    onSeek(Math.max(0, Math.min(1, percentage)));
  };

  const handleProgressMouseDown = () => {
    setIsDragging(true);
  };

  const handleProgressMouseUp = () => {
    setIsDragging(false);
  };

  const displayProgress = isDragging ? progress * 100 : calculateProgress();

  const elapsedTime = currentTime ? new Date(currentTime).getTime() - new Date(startTime).getTime() : 0;
  const totalTime = endTime && startTime ? new Date(endTime).getTime() - new Date(startTime).getTime() : 0;
  const elapsedSeconds = Math.floor(elapsedTime / 1000);
  const totalSeconds = Math.floor(totalTime / 1000);
  const remainingSeconds = totalSeconds - elapsedSeconds;

  const formatDuration = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const secs = seconds % 60;
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="simulation-controls">
      <div className="controls-container">
        <div className="playback-controls">
          <button
            className={`control-btn play-btn ${isPlaying ? 'playing' : ''}`}
            onClick={onPlayToggle}
            title={isPlaying ? 'Pause simulation' : 'Start simulation'}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>

          <button
            className="control-btn reset-btn"
            onClick={onReset}
            title="Reset simulation to beginning"
          >
            ⟲ Reset
          </button>

          <button
            className="control-btn step-btn"
            onClick={() => onSpeedChange(1)}
            title="Reset to normal speed"
          >
            ⟳ 1x
          </button>
        </div>

        <div className="speed-controls">
          <label>Playback Speed:</label>
          <div className="speed-buttons">
            {[0.5, 1, 2, 5, 10].map((speed) => (
              <button
                key={speed}
                className={`speed-btn ${currentSpeed === speed ? 'active' : ''}`}
                onClick={() => onSpeedChange(speed)}
                title={`Play at ${speed}x speed`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        <div className="time-display">
          <div className="time-info">
            <span className="time-label">Current Time:</span>
            <span className="time-value">{
              (function() {
                const formatted = formatTime(currentTime);
                if (formatted === 'N/A' || formatted === 'Invalid' || !formatted) {
                  // Fallback to startTime if available
                  const fallback = formatTime(startTime);
                  return fallback !== 'N/A' && fallback !== 'Invalid' ? fallback : '--:--:--';
                }
                return formatted;
              })()
            }</span>
          </div>
          <div className="time-stats">
            <span className="stat">
              <strong>Elapsed:</strong> {formatDuration(elapsedTime)}
            </span>
            <span className="stat">
              <strong>Remaining:</strong> {formatDuration(remainingSeconds * 1000)}
            </span>
            <span className="stat">
              <strong>Total:</strong> {formatDuration(totalTime)}
            </span>
          </div>
        </div>
      </div>

      <div className="progress-section">
        <div
          className="progress-bar-sim"
          onClick={handleProgressBarClick}
          onMouseDown={handleProgressMouseDown}
          onMouseUp={handleProgressMouseUp}
          onMouseLeave={handleProgressMouseUp}
        >
          <div
            className="progress-fill-sim"
            style={{ width: `${displayProgress}%` }}
          />
          <div className="progress-indicator" style={{ left: `${displayProgress}%` }} />
        </div>
        <div className="time-range">
          <span className="time-start">{formatTime(startTime)}</span>
          <span className="progress-percentage">{Math.round(displayProgress)}%</span>
          <span className="time-end">{formatTime(endTime)}</span>
        </div>
      </div>
    </div>
  );
}
