import React from 'react';
import {
  Settings,
  Server,
  ShieldCheck,
  HardDrive,
  Trash2,
  Zap,
} from 'lucide-react';
import { useBackendStatus } from '../context/useBackendStatus';
import { clearAuditHistory, getStoredAudits } from '../lib/auditStorage';
import { API_BASE_URL } from '../api/client';
import { toast } from 'sonner';

export const SettingsPage: React.FC = () => {
  const { status, latencyMs, checkNow } = useBackendStatus();
  const storedAudits = getStoredAudits();

  const handleClearCache = () => {
    if (window.confirm('Clear all local audit history cache stored in this browser?')) {
      clearAuditHistory();
      toast.success('Local audit cache cleared.');
      setTimeout(() => window.location.reload(), 500);
    }
  };

  const cardStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.8)',
    border: '1px solid #e2e2df',
    borderRadius: '1rem',
    padding: '1.5rem',
  };

  const infoTileStyle: React.CSSProperties = {
    background: '#fafaf9',
    border: '1px solid #e7e7e5',
    borderRadius: '0.75rem',
    padding: '0.75rem',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-slide">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#292928' }}>
          <Settings className="w-4 h-4" />
          <span>System &amp; Engine Preferences</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#20201f', fontFamily: "'Outfit', sans-serif" }}>
          Settings
        </h1>
        <p className="text-xs mt-1 max-w-2xl leading-relaxed" style={{ color: '#62625f' }}>
          Configure backend API connections, safety policies, and local cache options.
        </p>
      </div>

      <div className="space-y-5">
        {/* Backend Engine Status Card */}
        <div style={cardStyle}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="p-2.5 rounded-xl"
                style={{ background: 'rgba(39, 39, 38, 0.12)', border: '1px solid rgba(39, 39, 38, 0.25)', color: '#454543' }}
              >
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold" style={{ color: '#20201f' }}>FastAPI Backend Engine</h3>
                <p className="text-xs" style={{ color: '#62625f' }}>Target server connection and endpoint status</p>
              </div>
            </div>
            <button
              onClick={checkNow}
              className="px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer"
              style={{ color: '#4f4f4c', background: 'rgba(255, 255, 255, 0.8)', border: '1px solid #e2e2df' }}
            >
              Test Connection
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div style={infoTileStyle}>
              <span className="text-[11px] block mb-0.5" style={{ color: '#62625f' }}>API Target URL</span>
              <span className="font-mono truncate block" style={{ color: '#333331' }}>
                {API_BASE_URL || 'http://127.0.0.1:8000'}
              </span>
            </div>
            <div style={infoTileStyle}>
              <span className="text-[11px] block mb-0.5" style={{ color: '#62625f' }}>Connection State</span>
              <span
                className="font-semibold capitalize block"
                style={{ color: status === 'connected' ? '#17845f' : status === 'checking' ? '#a5680b' : '#c51632' }}
              >
                {status} {latencyMs !== null ? `(${latencyMs}ms)` : ''}
              </span>
            </div>
            <div style={infoTileStyle}>
              <span className="text-[11px] block mb-0.5" style={{ color: '#62625f' }}>Max Upload Limit</span>
              <span className="font-mono block" style={{ color: '#333331' }}>20 MB (Backend)</span>
            </div>
          </div>
        </div>

        {/* Safety Guarantees */}
        <div style={cardStyle}>
          <div className="flex items-center gap-2.5 mb-3">
            <ShieldCheck className="w-5 h-5" style={{ color: '#17845f' }} />
            <h3 className="text-sm font-semibold" style={{ color: '#20201f' }}>Execution Safety & Zero-Trust Policy</h3>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: '#4f4f4c' }}>
            Python files are analyzed with Python's native{' '}
            <code style={{ color: '#454543', fontFamily: 'JetBrains Mono, monospace' }}>ast.NodeVisitor</code>; JavaScript/TypeScript, Java, Go, C#, PHP, Ruby, and Rust use source heuristics. Code uploaded or
            downloaded from GitHub is inspected statically; it is{' '}
            <strong style={{ color: '#20201f' }}>never imported, executed, or run</strong> within the environment. Review marker patches do
            not introduce executable arbitrary code.
          </p>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {[
              { icon: Zap, label: 'Static source analysis', desc: 'Code never executed', color: '#454543' },
              { icon: ShieldCheck, label: 'Non-destructive', desc: 'Comment markers only', color: '#17845f' },
              { icon: Server, label: 'Isolated workspaces', desc: 'Per-audit sandboxing', color: '#646460' },
            ].map(({ icon: Icon, label, desc, color }) => (
              <div key={label} style={infoTileStyle} className="flex items-center gap-2.5">
                <Icon className="w-4 h-4 flex-shrink-0" style={{ color }} />
                <div>
                  <p className="font-semibold text-[11px]" style={{ color: '#333331' }}>{label}</p>
                  <p className="text-[10px]" style={{ color: '#62625f' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Client Storage & Cache */}
        <div style={cardStyle}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="p-2.5 rounded-xl"
                style={{ background: 'rgba(255, 255, 255, 0.8)', border: '1px solid #e2e2df', color: '#4f4f4c' }}
              >
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold" style={{ color: '#20201f' }}>Client-Side Cache</h3>
                <p className="text-xs" style={{ color: '#62625f' }}>
                  {storedAudits.length} cached audit reference{storedAudits.length !== 1 ? 's' : ''} in browser localStorage
                </p>
              </div>
            </div>
            <button
              onClick={handleClearCache}
              disabled={storedAudits.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer disabled:opacity-40"
              style={{
                color: '#c51632',
                border: '1px solid rgba(197, 22, 50, 0.25)',
                background: 'rgba(197, 22, 50, 0.06)',
              }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Local Cache</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
