import React from 'react';

export function TabNavigation({ activeTab, onTabChange, tripsCount }) {
  return (
    <div className="tab-navigation">
      <button
        className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
        onClick={() => onTabChange('overview')}
      >
        📊 Fleet Overview
      </button>
      <button
        className={`tab-btn ${activeTab === 'trips' ? 'active' : ''}`}
        onClick={() => onTabChange('trips')}
      >
        🗺️ Trip Details ({tripsCount})
      </button>
    </div>
  );
}
