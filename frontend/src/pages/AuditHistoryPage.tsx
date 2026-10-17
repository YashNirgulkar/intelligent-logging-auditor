import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History,
  Info,
  Search,
  Trash2,
  PlusCircle,
} from 'lucide-react';
import { AuditTable } from '../components/AuditTable';
import {
  getStoredAudits,
  removeAuditFromHistory,
  clearAuditHistory,
} from '../lib/auditStorage';
import { StoredAuditMeta } from '../types/api';
import { toast } from 'sonner';

export const AuditHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [audits, setAudits] = useState<StoredAuditMeta[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [lookupId, setLookupId] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setAudits(getStoredAudits());
    setIsLoading(false);
  }, []);

  const handleDelete = (id: string) => {
    removeAuditFromHistory(id);
    setAudits(getStoredAudits());
    toast.success('Removed audit from local history.');
  };

  const handleClearAll = () => {
    if (window.confirm('Clear all local audit history records? Server files will remain intact.')) {
      clearAuditHistory();
      setAudits([]);
      toast.success('Local audit history cleared.');
    }
  };

  const handleDirectLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const id = lookupId.trim();
    if (!id) return;
    navigate(`/audits/${encodeURIComponent(id)}`);
  };

  const filteredAudits = audits.filter((a) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return a.source.toLowerCase().includes(q) || a.audit_id.toLowerCase().includes(q);
  });

  const inputStyle: React.CSSProperties = {
    background: '#fafaf9',
    border: '1px solid #e2e2df',
    color: '#20201f',
    borderRadius: '0.75rem',
    padding: '0.5rem 0.75rem',
    fontSize: '0.75rem',
    outline: 'none',
    width: '100%',
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-slide">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#292928' }}>
            <History className="w-4 h-4" />
            <span>Workspace Records</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#20201f', fontFamily: "'Outfit', sans-serif" }}>
            Audit History
          </h1>
          <p className="text-xs mt-1" style={{ color: '#62625f' }}>
            Inspect previously analyzed repository audits or load an existing audit manifest by ID.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {audits.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer"
              style={{
                color: '#c51632',
                border: '1px solid rgba(197, 22, 50, 0.25)',
                background: 'rgba(197, 22, 50, 0.06)',
              }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}
          <button
            onClick={() => navigate('/audits/new')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white btn-accent transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Audit</span>
          </button>
        </div>
      </div>

      {/* Direct Lookup */}
      <div
        className="p-4 md:p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4"
        style={{ background: 'rgba(255, 255, 255, 0.8)', border: '1px solid #e2e2df' }}
      >
        <div className="space-y-0.5 w-full md:w-auto">
          <h3 className="text-xs font-semibold" style={{ color: '#333331' }}>Load Existing Audit by ID</h3>
          <p className="text-[11px]" style={{ color: '#62625f' }}>
            Fetch directly from server storage (
            <code style={{ color: '#292928', fontFamily: 'JetBrains Mono, monospace' }}>/api/v1/audits/{'{'}audit_id{'}'}</code>)
          </p>
        </div>

        <form onSubmit={handleDirectLookup} className="flex items-center gap-2 w-full md:w-auto">
          <input
            type="text"
            value={lookupId}
            onChange={(e) => setLookupId(e.target.value)}
            placeholder="e.g. 523a7bb104f9810a"
            style={{ ...inputStyle, fontFamily: 'JetBrains Mono, monospace', maxWidth: '260px' }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(39, 39, 38, 0.5)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e2df'; }}
          />
          <button
            type="submit"
            disabled={!lookupId.trim()}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 flex-shrink-0"
            style={{ background: 'rgba(39, 39, 38, 0.15)', border: '1px solid rgba(39, 39, 38, 0.3)', color: '#252524' }}
          >
            Fetch
          </button>
        </form>
      </div>

      {/* Info Banner */}
      <div
        className="p-4 rounded-2xl text-xs flex items-start gap-3"
        style={{ background: 'rgba(255, 255, 255, 0.6)', border: '1px solid #e2e2df' }}
      >
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#292928' }} />
        <div className="space-y-1">
          <p className="font-semibold" style={{ color: '#20201f' }}>Client History Cache vs Backend Architecture</p>
          <p className="leading-relaxed text-[11px]" style={{ color: '#62625f' }}>
            The current FastAPI backend exposes single-audit lookups rather than a persistent global listing endpoint. This table maintains a secure, local client cache of scans conducted in this browser environment, strictly preserving architectural honesty.
          </p>
        </div>
      </div>

      {/* Search */}
      {audits.length > 0 && (
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none" style={{ color: '#70706d' }}>
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter past audits by repository name or audit ID..."
            style={{ ...inputStyle, paddingLeft: '2.5rem', fontFamily: 'Inter, sans-serif' }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(39, 39, 38, 0.5)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e2df'; }}
          />
        </div>
      )}

      <AuditTable audits={filteredAudits} isLoading={isLoading} onDelete={handleDelete} />
    </div>
  );
};
