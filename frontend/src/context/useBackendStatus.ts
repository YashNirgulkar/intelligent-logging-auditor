import { useContext } from 'react';
import { BackendStatusContext, type BackendStatusContextType } from './BackendStatusContextValue';

export function useBackendStatus(): BackendStatusContextType {
  const context = useContext(BackendStatusContext);
  if (!context) {
    throw new Error('useBackendStatus must be used within a BackendStatusProvider');
  }
  return context;
}
