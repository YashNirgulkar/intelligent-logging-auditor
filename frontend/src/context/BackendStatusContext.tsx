import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { auditsApi } from '../api/client';

export type BackendConnectionStatus = 'connected' | 'disconnected' | 'checking';

interface BackendStatusContextType {
  status: BackendConnectionStatus;
  lastChecked: Date | null;
  latencyMs: number | null;
  checkNow: () => Promise<void>;
}

const BackendStatusContext = createContext<BackendStatusContextType | undefined>(undefined);

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
    checkConnection();
    const interval = setInterval(checkConnection, 20000); // Check every 20s
    return () => clearInterval(interval);
  }, [checkConnection]);

  return (
    <BackendStatusContext.Provider value={{ status, lastChecked, latencyMs, checkNow: checkConnection }}>
      {children}
    </BackendStatusContext.Provider>
  );
};

export function useBackendStatus(): BackendStatusContextType {
  const context = useContext(BackendStatusContext);
  if (!context) {
    throw new Error('useBackendStatus must be used within a BackendStatusProvider');
  }
  return context;
}
