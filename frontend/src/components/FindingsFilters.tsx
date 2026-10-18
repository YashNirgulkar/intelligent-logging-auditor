import React from 'react';
import { Search, Filter, X } from 'lucide-react';

interface Props {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedRisk: string;
  onRiskChange: (risk: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  selectedFile: string;
  onFileChange: (file: string) => void;
  availableFiles: string[];
  totalCount: number;
  filteredCount: number;
  onReset: () => void;
}

const selectStyle: React.CSSProperties = {
  background: '#fafaf9',
  border: '1px solid #e2e2df',
  color: '#4f4f4c',
  borderRadius: '0.625rem',
  padding: '0.25rem 0.625rem',
  fontSize: '0.75rem',
  outline: 'none',
};

export const FindingsFilters: React.FC<Props> = ({
  searchQuery,
  onSearchChange,
  selectedRisk,
  onRiskChange,
  selectedStatus,
  onStatusChange,
  selectedFile,
  onFileChange,
  availableFiles,
  totalCount,
  filteredCount,
  onReset,
}) => {
  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedRisk !== 'all' ||
    selectedStatus !== 'all' ||
    selectedFile !== 'all';

  const riskPillStyle = (id: string): React.CSSProperties =>
    selectedRisk === id
      ? {
          background: 'rgba(39, 39, 38, 0.2)',
          border: '1px solid rgba(39, 39, 38, 0.4)',
          color: '#252524',
        }
      : {
          background: '#fafaf9',
          border: '1px solid #e2e2df',
          color: '#62625f',
        };

  return (
    <div
      className="p-4 rounded-2xl space-y-3"
      style={{ background: 'rgba(255, 255, 255, 0.8)', border: '1px solid #e2e2df' }}
    >
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <div
            className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
            style={{ color: '#70706d' }}
          >
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search findings by function, message, or rule..."
            className="w-full pl-9 pr-8 py-2 rounded-xl text-xs transition-all font-sans"
            style={{
              background: '#fafaf9',
              border: '1px solid #e2e2df',
              color: '#20201f',
              outline: 'none',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(39, 39, 38, 0.5)'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(39, 39, 38, 0.1)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e2df'; e.currentTarget.style.boxShadow = 'none'; }}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center cursor-pointer"
              style={{ color: '#70706d' }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Severity Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-semibold flex items-center gap-1 mr-1" style={{ color: '#62625f' }}>
            <Filter className="w-3 h-3" />
            <span>Severity:</span>
          </span>
          {[
            { id: 'all', label: 'All' },
            { id: 'high', label: 'High' },
            { id: 'medium', label: 'Medium' },
            { id: 'low', label: 'Low' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => onRiskChange(item.id)}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer"
              style={riskPillStyle(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Row 2 */}
      <div
        className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 text-xs"
        style={{ borderTop: '1px solid #e7e7e5' }}
      >
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span style={{ color: '#62625f' }} className="text-[11px]">File:</span>
            <select
              value={selectedFile}
              onChange={(e) => onFileChange(e.target.value)}
              style={{ ...selectStyle, maxWidth: '200px' }}
            >
              <option value="all">All files ({availableFiles.length})</option>
              {availableFiles.map((file) => (
                <option key={file} value={file}>{file}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span style={{ color: '#62625f' }} className="text-[11px]">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              style={selectStyle}
            >
              <option value="all">All statuses</option>
              <option value="suggested">Suggested only</option>
              <option value="applied">Review marker applied</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 text-xs" style={{ color: '#62625f' }}>
          <span>
            Showing <strong style={{ color: '#20201f' }}>{filteredCount}</strong> of {totalCount} findings
          </span>
          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="text-[11px] hover:underline cursor-pointer transition-colors"
              style={{ color: '#292928' }}
            >
              Clear filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
