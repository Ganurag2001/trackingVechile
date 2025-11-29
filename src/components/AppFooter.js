import React from 'react';

export function AppFooter({ metrics }) {
  const totalTrips = Object.values(metrics).length;
  const completedTrips = Object.values(metrics).filter(m => m.status === 'completed').length;
  const activeTrips = Object.values(metrics).filter(m => m.status === 'active' || m.status === 'in_progress').length;
  const cancelledTrips = Object.values(metrics).filter(m => m.status === 'cancelled').length;

  return (
    <footer className="app-footer">
      <p>Fleet Tracking Assessment • Mock API Event Stream</p>
      <p className="footer-info">
        {totalTrips} trips • 
        {' '}
        {completedTrips} completed • 
        {' '}
        {activeTrips} active •
        {' '}
        {cancelledTrips} cancelled
      </p>
      <p className="footer-kb">💡 Keyboard: Space to play/pause, R to reset</p>
    </footer>
  );
}
