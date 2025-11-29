import React from 'react';

export function ErrorState({ error }) {
  return (
    <div className="app-error">
      <h1>Error Loading Dashboard</h1>
      <p>{error}</p>
      <p>Make sure all trip data files are in the public/data directory.</p>
      <button 
        onClick={() => window.location.reload()}
        className="retry-btn"
      >
        Retry
      </button>
    </div>
  );
}
