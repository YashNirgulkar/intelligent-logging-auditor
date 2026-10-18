import React, { useEffect, useState, useCallback } from 'react';
import { auditsApi } from '../api/client';
import { BackendStatusContext, type BackendConnectionStatus } from './BackendStatusContextValue';

export const BackendStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<BackendConnectionStatus>('checking');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  const checkConnection = useCallback(async () => {
    const start = performance.now();
    try {
      const res = await auditsApi.checkHealth();
      const end = performance.now();
      if (res.status === 'ok') {
        setStatus('connected');
        setLatencyMs(Math.round(end - start));
      } else {
        setStatus('disconnected');
        setLatencyMs(null);
      }
    } catch {
      setStatus('disconnected');
      setLatencyMs(null);
    } finally {
      setLastChecked(new Date());
    }
  }, []);

  useEffect(() => {
    const initialCheck = window.setTimeout(() => void checkConnection(), 0);
    const interval = window.setInterval(checkConnection, 20000);
    return () => {
      window.clearTimeout(initialCheck);
      window.clearInterval(interval);
    };
  }, [checkConnection]);

  return (
    <BackendStatusContext.Provider value={{ status, lastChecked, latencyMs, checkNow: checkConnection }}>
      {children}
    </BackendStatusContext.Provider>
  );
};
