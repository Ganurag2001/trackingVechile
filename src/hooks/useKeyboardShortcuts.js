import { useEffect } from 'react';

/**
 * Hook to manage keyboard shortcuts
 */
export function useKeyboardShortcuts(onPlayToggle, onReset) {
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        onPlayToggle();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        onReset();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onPlayToggle, onReset]);
}
