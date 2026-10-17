import React, { useState } from 'react';
import {
  X,
  FileCode,
  Lightbulb,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { Finding } from '../types/api';
import { SeverityBadge } from './SeverityBadge';
import { StatusBadge } from './StatusBadge';
import { CodeViewer } from './CodeViewer';
import { ConfirmationDialog } from './ConfirmationDialog';

interface Props {
  finding: Finding | null;
  onClose: () => void;
  onApplySingle: (findingId: string) => Promise<void>;
  isApplying?: boolean;
}

export const FindingDetailModal: React.FC<Props> = ({
  finding,
  onClose,
  onApplySingle,
  isApplying = false,
}) => {
  const [showConfirm, setShowConfirm] = useState(false);

  if (!finding) return null;

  const isApplied = finding.status === 'approved_marker_applied';

  const handleConfirmApply = async () => {
    setShowConfirm(false);
    await onApplySingle(finding.id);
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(20, 20, 19, 0.85)', backdropFilter: 'blur(12px)' }}
      >
        <div
          className="relative flex flex-col w-full max-w-3xl max-h-[90vh] rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, #ffffff 0%, #ffffff 100%)',
            border: '1px solid #e2e2df',
            boxShadow: '0 20px 50px rgba(0,0,0,0.16), 0 0 0 1px rgba(39, 39, 38, 0.08)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-start justify-between p-6"
            style={{ borderBottom: '1px solid #e7e7e5', background: 'rgba(250, 250, 249, 0.5)' }}
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <SeverityBadge risk={finding.risk} />
                <StatusBadge status={finding.status} />
                <span
                  className="text-xs font-mono px-2 py-0.5 rounded"
                  style={{
                    background: 'rgba(39, 39, 38, 0.08)',
                    border: '1px solid rgba(39, 39, 38, 0.15)',
                    color: '#62625f',
                  }}
                >
                  ID: {finding.id}
                </span>
              </div>
              <h3 className="text-lg font-bold leading-snug" style={{ color: '#20201f' }}>
                {finding.title}
              </h3>
              <div className="flex items-center gap-2 text-xs font-mono" style={{ color: '#62625f' }}>
                <FileCode className="w-3.5 h-3.5" style={{ color: '#292928' }} />
                <span style={{ color: '#4f4f4c' }}>{finding.file_path}</span>
                <span>:</span>
                <span style={{ color: '#454543' }}>line {finding.line}</span>
                {finding.function_name && (
                  <span>({finding.function_name})</span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg transition-colors cursor-pointer"
              style={{ color: '#62625f' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#20201f'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#62625f'; e.currentTarget.style.background = 'transparent'; }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 p-6 space-y-6 overflow-y-auto">
            {/* Rationale */}
            <div className="space-y-2">
              <h4
                className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                style={{ color: '#62625f' }}
              >
                <Lightbulb className="w-4 h-4" style={{ color: '#a5680b' }} />
                <span>Why This Issue Matters</span>
              </h4>
              <div
                className="p-4 rounded-xl text-xs leading-relaxed space-y-2"
                style={{
                  background: 'rgba(250, 250, 249, 0.6)',
                  border: '1px solid #e7e7e5',
                  color: '#4f4f4c',
                }}
              >
                <p>{finding.rationale}</p>
                <div
                  className="pt-2 flex items-center gap-2 text-[11px]"
                  style={{ borderTop: '1px solid #e7e7e5', color: '#62625f' }}
                >
                  <span className="font-semibold" style={{ color: '#4f4f4c' }}>Rule Trigger:</span>
                  <code
                    className="font-mono"
                    style={{ color: '#454543' }}
                  >
                    {finding.rule}
                  </code>
                </div>
              </div>
            </div>

            {/* Suggested Code */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4
                  className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                  style={{ color: '#62625f' }}
                >
                  <FileCode className="w-4 h-4" style={{ color: '#292928' }} />
                  <span>Suggested Logging Pattern</span>
                </h4>
                <span className="text-[11px]" style={{ color: '#70706d' }}>Heuristic recommendation</span>
              </div>
              <CodeViewer
                code={finding.suggested_code}
                filePath={finding.file_path}
                line={finding.line}
              />
            </div>

            {/* Note */}
            <div
              className="p-3.5 rounded-xl text-[11px] flex items-start gap-2.5"
              style={{
                background: 'rgba(250, 250, 249, 0.5)',
                border: '1px solid #e7e7e5',
                color: '#62625f',
              }}
            >
              <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#292928' }} />
              <div>
                <span className="font-semibold" style={{ color: '#4f4f4c' }}>Engine Behavior Note: </span>
                Applying will insert a review marker comment (
                <code className="font-mono" style={{ color: '#454543' }}>
                  # Logging auditor review ({finding.id})
                </code>
                ) above line {finding.line}. It will not inject unvalidated runtime logic.
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-between p-4 px-6"
            style={{ borderTop: '1px solid #e7e7e5', background: 'rgba(250, 250, 249, 0.5)' }}
          >
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer"
              style={{ color: '#62625f' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#20201f'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#62625f'; }}
            >
              Close
            </button>

            {isApplied ? (
              <div
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl"
                style={{
                  color: '#17845f',
                  background: 'rgba(23, 132, 95, 0.1)',
                  border: '1px solid rgba(23, 132, 95, 0.25)',
                }}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Review Marker Already Applied</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowConfirm(true)}
                disabled={isApplying}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-white btn-accent transition-all cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Apply Review Marker</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={showConfirm}
        title="Apply Review Marker to Workspace"
        count={1}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmApply}
        isApplying={isApplying}
      />
    </>
  );
};
