import React, { useState } from 'react';
import { AlertCircle, ShieldAlert, CheckCircle2, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  isOpen: boolean;
  title: string;
  count: number;
  onClose: () => void;
  onConfirm: () => void;
  isApplying?: boolean;
}

export const ConfirmationDialog: React.FC<Props> = ({
  isOpen,
  title,
  count,
  onClose,
  onConfirm,
  isApplying = false,
}) => {
  const [acknowledged, setAcknowledged] = useState(false);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(20, 20, 19, 0.85)', backdropFilter: 'blur(12px)' }}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl p-6 space-y-5"
        style={{
          background: 'linear-gradient(180deg, #ffffff 0%, #ffffff 100%)',
          border: '1px solid #e2e2df',
          boxShadow: '0 20px 50px rgba(0,0,0,0.16), 0 0 0 1px rgba(39, 39, 38, 0.08)',
          color: '#20201f',
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-xl"
              style={{
                background: 'rgba(165, 104, 11, 0.1)',
                border: '1px solid rgba(165, 104, 11, 0.25)',
                color: '#a5680b',
              }}
            >
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold" style={{ color: '#20201f', fontFamily: "'Outfit', sans-serif" }}>
                {title}
              </h3>
              <p className="text-xs mt-0.5" style={{ color: '#62625f' }}>
                Targeting {count} {count === 1 ? 'finding' : 'findings'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isApplying}
            className="p-1.5 rounded-lg transition-colors cursor-pointer"
            style={{ color: '#62625f' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#20201f'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#62625f'; e.currentTarget.style.background = 'transparent'; }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Banner */}
        <div
          className="p-4 rounded-xl text-xs space-y-2"
          style={{
            background: 'rgba(165, 104, 11, 0.06)',
            border: '1px solid rgba(165, 104, 11, 0.2)',
            color: '#74500d',
          }}
        >
          <div className="flex items-center gap-2 font-semibold" style={{ color: '#a5680b' }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Important: Review Markers Only</span>
          </div>
          <p className="leading-relaxed" style={{ color: '#74500d' }}>
            The backend engine will insert <strong># Logging auditor review</strong> comment markers above the flagged lines in workspace files.
          </p>
          <p className="italic" style={{ color: '#9a5d08' }}>
            Note: This does <strong>NOT</strong> inject executable logging code or modify runtime logic. Inspect the workspace diff and run tests before committing.
          </p>
        </div>

        {/* Acknowledgment Checkbox */}
        <label
          className="flex items-start gap-3 p-3 rounded-xl cursor-pointer select-none transition-colors"
          style={{
            background: 'rgba(255, 255, 255, 0.8)',
            border: '1px solid #e2e2df',
          }}
        >
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            disabled={isApplying}
            className="mt-0.5 h-4 w-4 rounded cursor-pointer"
            style={{ accentColor: '#292928' }}
          />
          <span className="text-xs leading-normal" style={{ color: '#4f4f4c' }}>
            I understand that review markers will be written into the audited source files, and production code requires manual review.
          </span>
        </label>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isApplying}
            className="px-4 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer"
            style={{
              color: '#4f4f4c',
              border: '1px solid #e2e2df',
              background: 'rgba(255, 255, 255, 0.8)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#20201f'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#4f4f4c'; }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!acknowledged || isApplying}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all',
              acknowledged && !isApplying ? 'btn-accent cursor-pointer' : 'cursor-not-allowed opacity-40'
            )}
            style={
              !acknowledged || isApplying
                ? { background: '#e2e2df', border: '1px solid #d3d3d0', color: '#62625f' }
                : {}
            }
          >
            {isApplying ? (
              <>
                <span className="animate-spin h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full" />
                <span>Applying Markers…</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Apply Markers</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
