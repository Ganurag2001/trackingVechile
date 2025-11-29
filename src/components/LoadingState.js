import React from 'react';

export function LoadingState() {
  return (
    <div className="app-loading">
      <div className="loading-spinner" />
      <p>Loading fleet data...</p>
      <p className="loading-info">Processing trip events...</p>
    </div>
  );
}
