import React from 'react';
import { ChevronRight, FileCode, CheckSquare, Square } from 'lucide-react';
import { Finding } from '../types/api';
import { SeverityBadge } from './SeverityBadge';
import { StatusBadge } from './StatusBadge';
import { cn } from '../lib/utils';

interface Props {
  finding: Finding;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onClick: (finding: Finding) => void;
}

export const FindingCard: React.FC<Props> = ({
  finding,
  isSelected,
  onSelect,
  onClick,
}) => {
  return (
    <div
      onClick={() => onClick(finding)}
      className={cn(
        'group relative flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-xl transition-all duration-200 cursor-pointer text-left'
      )}
      style={
        isSelected
          ? {
              background: 'rgba(39, 39, 38, 0.08)',
              border: '1px solid rgba(39, 39, 38, 0.35)',
              boxShadow: '0 0 0 1px rgba(39, 39, 38, 0.15)',
            }
          : {
              background: 'rgba(255, 255, 255, 0.6)',
              border: '1px solid #e2e2df',
            }
      }
      onMouseEnter={(e) => {
        if (!isSelected) {
          const el = e.currentTarget;
          el.style.background = 'rgba(255, 255, 255, 0.9)';
          el.style.borderColor = '#d3d3d0';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          const el = e.currentTarget;
          el.style.background = 'rgba(255, 255, 255, 0.6)';
          el.style.borderColor = '#e2e2df';
        }
      }}
    >
      <div className="flex items-start gap-3.5 flex-1 overflow-hidden">
        {/* Selection Checkbox */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(finding.id);
          }}
          className="mt-0.5 transition-colors cursor-pointer flex-shrink-0"
          style={{ color: isSelected ? '#454543' : '#70706d' }}
        >
          {isSelected ? (
            <CheckSquare className="w-4 h-4" style={{ color: '#454543' }} />
          ) : (
            <Square className="w-4 h-4" />
          )}
        </button>

        {/* Content */}
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <SeverityBadge risk={finding.risk} size="sm" />
            <StatusBadge status={finding.status} size="sm" />
            <span
              className="text-[11px] font-mono px-2 py-0.5 rounded"
              style={{
                background: 'rgba(39, 39, 38, 0.08)',
                border: '1px solid rgba(39, 39, 38, 0.15)',
                color: '#62625f',
              }}
            >
              rule: {finding.rule}
            </span>
          </div>

          <h4
            className="text-sm font-semibold transition-colors truncate"
            style={{ color: '#333331' }}
          >
            {finding.title}
          </h4>

          <div className="flex items-center gap-2 text-xs font-mono" style={{ color: '#62625f' }}>
            <FileCode className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#292928' }} />
            <span className="truncate" style={{ color: '#4f4f4c' }}>{finding.file_path}</span>
            <span>line {finding.line}</span>
            {finding.function_name && (
              <span className="hidden sm:inline">
                in <span style={{ color: '#252524' }}>{finding.function_name}()</span>
              </span>
            )}
          </div>

          <p className="text-xs line-clamp-1 pt-0.5" style={{ color: '#62625f' }}>
            {finding.rationale}
          </p>
        </div>
      </div>

      {/* Action Arrow */}
      <div className="flex items-center gap-2 mt-3 md:mt-0 md:ml-4 self-end md:self-center">
        <span
          className="text-xs font-medium flex items-center gap-1 transition-colors"
          style={{ color: '#62625f' }}
        >
          <span>Review</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </span>
      </div>
    </div>
  );
};
