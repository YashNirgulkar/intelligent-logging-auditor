import { createContext } from 'react';

export type BackendConnectionStatus = 'connected' | 'disconnected' | 'checking';

export interface BackendStatusContextType {
  status: BackendConnectionStatus;
  lastChecked: Date | null;
  latencyMs: number | null;
  checkNow: () => Promise<void>;
}

export const BackendStatusContext = createContext<BackendStatusContextType | undefined>(undefined);
