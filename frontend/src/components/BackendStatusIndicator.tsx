import React from 'react';
import { useBackendStatus } from '../context/useBackendStatus';
import { RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';
import { API_ORIGIN } from '../api/client';

interface Props {
  minimal?: boolean;
  className?: string;
}

export const BackendStatusIndicator: React.FC<Props> = ({ minimal = false, className }) => {
  const { status, latencyMs, checkNow } = useBackendStatus();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRefreshing(true);
    await checkNow();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const statusConfig = {
    connected: {
      dotColor: '#17845f',
      dotGlow: '0 0 8px rgba(23, 132, 95, 0.8)',
      bg: 'rgba(23, 132, 95, 0.08)',
      border: 'rgba(23, 132, 95, 0.2)',
      textColor: '#17845f',
      label: 'API Online',
      detail: `FastAPI ${new URL(API_ORIGIN).host}`,
    },
    checking: {
      dotColor: '#a5680b',
      dotGlow: 'none',
      bg: 'rgba(165, 104, 11, 0.08)',
      border: 'rgba(165, 104, 11, 0.2)',
      textColor: '#a5680b',
      label: 'Connecting…',
      detail: 'Probing /health…',
    },
    disconnected: {
      dotColor: '#c51632',
      dotGlow: '0 0 8px rgba(197, 22, 50, 0.8)',
      bg: 'rgba(197, 22, 50, 0.08)',
      border: 'rgba(197, 22, 50, 0.2)',
      textColor: '#c51632',
      label: 'API Offline',
      detail: 'Backend Disconnected',
    },
  }[status];

  if (minimal) {
    return (
      <div
        className={cn('inline-flex items-center gap-1.5 text-xs font-medium', className)}
        title={
          status === 'connected'
            ? `Backend online${latencyMs !== null ? ` (${latencyMs}ms)` : ''}`
            : status === 'checking'
            ? 'Checking backend connection...'
            : `Backend offline (${API_ORIGIN})`
        }
      >
        <span
          className="w-2 h-2 rounded-full"
          style={{
            background: statusConfig.dotColor,
            boxShadow: statusConfig.dotGlow,
            animation: status === 'checking' ? 'pulse 1.5s ease-in-out infinite' : undefined,
          }}
        />
        <span style={{ color: statusConfig.textColor }}>{statusConfig.label}</span>
      </div>
    );
  }

  return (
    <div
      className={cn('flex items-center justify-between px-3 py-2 rounded-xl text-xs', className)}
      style={{
        background: statusConfig.bg,
        border: `1px solid ${statusConfig.border}`,
        color: statusConfig.textColor,
      }}
    >
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          {status === 'connected' && (
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ background: statusConfig.dotColor }}
            />
          )}
          <span
            className="relative inline-flex rounded-full h-2 w-2"
            style={{ background: statusConfig.dotColor }}
          />
        </span>
        <div className="flex flex-col">
          <span className="font-semibold leading-tight text-[11px]">{statusConfig.detail}</span>
          {status === 'connected' && latencyMs !== null && (
            <span className="text-[10px] opacity-70">{latencyMs}ms</span>
          )}
        </div>
      </div>
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        title="Ping health check"
        className="p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50 ml-2"
      >
        <RefreshCw className={cn('w-3 h-3', isRefreshing && 'animate-spin')} />
      </button>
    </div>
  );
};
