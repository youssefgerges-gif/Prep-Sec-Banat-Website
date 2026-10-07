import React, { createContext, useContext, useState, useCallback } from 'react';
import { getStudentBalance } from '../services/supabase';

const PointsContext = createContext();

export const PointsProvider = ({ children }) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [toast, setToast] = useState({
    show: false,
    title: '',
    message: '',
    points: 0,
    type: 'success'
  });

  // Force global re-render trigger across all views
  const triggerRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  // Display gamified popup toast with animation
  const showToast = useCallback((title, message, points = 0, type = 'success') => {
    setToast({
      show: true,
      title,
      message,
      points,
      type
    });

    // Play subtle celebratory chime if points added
    if (points > 0 && typeof window !== 'undefined') {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      } catch (e) {
        // Audio Context fallback silent
      }
    }
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, show: false }));
  }, []);

  return (
    <PointsContext.Provider
      value={{
        refreshKey,
        triggerRefresh,
        toast,
        showToast,
        hideToast
      }}
    >
      {children}
    </PointsContext.Provider>
  );
};

export const usePoints = () => useContext(PointsContext);
