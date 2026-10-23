import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  FolderGit2,
  FileArchive,
  CheckCircle2,
  RotateCw,
  Copy,
  Check,
  CheckSquare,
  Square,
  Info,
  Printer,
} from 'lucide-react';
import { auditsApi, formatApiError } from '../api/client';
import { AuditResponse, Finding } from '../types/api';
import { FindingCard } from '../components/FindingCard';
import { FindingDetailModal } from '../components/FindingDetailModal';
import { FindingsFilters } from '../components/FindingsFilters';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { EmptyState } from '../components/EmptyState';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { ErrorState } from '../components/ErrorState';
import { updateAuditStatusInHistory, saveAuditToHistory } from '../lib/auditStorage';
import { toast } from 'sonner';

export const AuditResultsPage: React.FC = () => {
  const { auditId } = useParams<{ auditId: string }>();
  const [audit, setAudit] = useState<AuditResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRisk, setSelectedRisk] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedFile, setSelectedFile] = useState('all');

  // Selected findings for batch operations
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeFinding, setActiveFinding] = useState<Finding | null>(null);

  // Apply confirmation state
  const [showApplyBatchDialog, setShowApplyBatchDialog] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [copiedAuditId, setCopiedAuditId] = useState(false);

  const fetchAuditData = useCallback(async () => {
    if (!auditId) return;
    setIsLoading(true);
    setError(null);

    try {
      const data = await auditsApi.getAudit(auditId);
      setAudit(data);
      // Synchronize in local history
      saveAuditToHistory(data);
    } catch (err) {
      const msg = formatApiError(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [auditId]);

  useEffect(() => {
    const request = window.setTimeout(() => void fetchAuditData(), 0);
    return () => window.clearTimeout(request);
  }, [fetchAuditData]);

  // Extract unique files
  const availableFiles = useMemo(() => {
    if (!audit) return [];
    return Array.from(new Set(audit.findings.map((f) => f.file_path))).sort();
  }, [audit]);

  // Filtered findings
  const filteredFindings = useMemo(() => {
    if (!audit) return [];
    return audit.findings.filter((item) => {
      // Risk filter
      if (selectedRisk !== 'all' && item.risk.toLowerCase() !== selectedRisk.toLowerCase()) {
        return false;
      }

      // Status filter
      if (selectedStatus === 'suggested' && item.status !== 'suggested') {
        return false;
      }
      if (selectedStatus === 'applied' && item.status !== 'approved_marker_applied') {
        return false;
      }

      // File filter
      if (selectedFile !== 'all' && item.file_path !== selectedFile) {
        return false;
      }

      // Text search
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesRationale = item.rationale.toLowerCase().includes(q);
        const matchesFunc = item.function_name.toLowerCase().includes(q);
        const matchesFile = item.file_path.toLowerCase().includes(q);
        const matchesRule = item.rule.toLowerCase().includes(q);
        return matchesTitle || matchesRationale || matchesFunc || matchesFile || matchesRule;
      }

      return true;
    });
  }, [audit, selectedRisk, selectedStatus, selectedFile, searchQuery]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredFindings.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredFindings.map((f) => f.id));
    }
  };

  const handleCopyAuditId = () => {
    if (!auditId) return;
    navigator.clipboard.writeText(auditId);
    setCopiedAuditId(true);
    setTimeout(() => setCopiedAuditId(false), 2000);
  };

  // Apply batch findings
  const handleApplyBatch = async () => {
    if (!auditId || selectedIds.length === 0) return;
    setIsApplying(true);
    try {
      const res = await auditsApi.applyPatches(auditId, selectedIds, true);
      toast.success(
        `Applied review markers to ${res.applied_finding_ids.length} findings across ${res.changed_files.length} files.`
      );
      updateAuditStatusInHistory(auditId, 'markers_applied');
      setShowApplyBatchDialog(false);
      setSelectedIds([]);
      // Refresh audit data
      await fetchAuditData();
    } catch (err) {
      const msg = formatApiError(err);
      toast.error(`Apply failed: ${msg}`);
    } finally {
      setIsApplying(false);
    }
  };

  // Apply single finding from modal
  const handleApplySingle = async (findingId: string) => {
    if (!auditId) return;
    setIsApplying(true);
    try {
      await auditsApi.applyPatches(auditId, [findingId], true);
      toast.success(`Review marker applied for finding: ${findingId}`);
      updateAuditStatusInHistory(auditId, 'markers_applied');
      setActiveFinding(null);
      await fetchAuditData();
    } catch (err) {
      const msg = formatApiError(err);
      toast.error(`Apply failed: ${msg}`);
    } finally {
      setIsApplying(false);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedRisk('all');
    setSelectedStatus('all');
    setSelectedFile('all');
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <LoadingSkeleton className="h-28 w-full" />
        <LoadingSkeleton className="h-16 w-full" />
        <div className="space-y-3">
          <LoadingSkeleton className="h-24 w-full" count={4} />
        </div>
      </div>
    );
  }

  if (error || !audit) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <ErrorState
          title="Could Not Load Audit"
          message={error || 'Audit data could not be retrieved from the server.'}
          onRetry={fetchAuditData}
        />
        <div className="text-center mt-6">
          <Link
            to="/history"
            className="inline-flex items-center gap-2 text-xs font-medium text-indigo-400 hover:text-indigo-300"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Audit History</span>
          </Link>
        </div>
      </div>
    );
  }

  const isGithub = audit.source.startsWith('http');
  const highCount = audit.summary?.high ?? audit.findings.filter((f) => f.risk === 'high').length;
  const medCount = audit.summary?.medium ?? audit.findings.filter((f) => f.risk === 'medium').length;
  const lowCount = audit.summary?.low ?? audit.findings.filter((f) => f.risk === 'low').length;
  const appliedCount = audit.findings.filter((f) => f.status === 'approved_marker_applied').length;

  return (
    <div className="audit-results-page max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      <section className="print-report-only" aria-label="Printable audit report">
        <header className="print-report-header">
          <p className="print-report-kicker">Intelligent Logging Auditor</p>
          <h1>Audit Report: {isGithub ? audit.source.replace('https://github.com/', '') : 'Uploaded ZIP Repository'}</h1>
          <p><strong>Source:</strong> {audit.source}</p>
          <p><strong>Audit ID:</strong> {audit.audit_id}</p>
          <p><strong>Printed:</strong> {new Date().toLocaleString()}</p>
        </header>

        <section className="print-report-summary" aria-label="Finding totals">
          <div><strong>{audit.findings.length}</strong><span>Total findings</span></div>
          <div><strong>{highCount}</strong><span>High</span></div>
          <div><strong>{medCount}</strong><span>Medium</span></div>
          <div><strong>{lowCount}</strong><span>Low</span></div>
          <div><strong>{appliedCount}</strong><span>Review markers applied</span></div>
        </section>

        <h2 className="print-findings-heading">Findings ({audit.findings.length})</h2>
        {audit.findings.length === 0 ? (
          <p>No findings were detected in the inspected supported source files.</p>
        ) : (
          <ol className="print-findings-list">
            {audit.findings.map((finding, index) => (
              <li className="print-finding" key={finding.id}>
                <div className="print-finding-heading">
                  <h3>{index + 1}. {finding.title}</h3>
                  <span className={`print-risk print-risk-${finding.risk.toLowerCase()}`}>
                    {finding.risk} priority
                  </span>
                </div>
                <dl className="print-finding-meta">
                  <div><dt>Rule</dt><dd>{finding.rule}</dd></div>
                  <div><dt>File</dt><dd>{finding.file_path}:{finding.line}</dd></div>
                  {finding.function_name && <div><dt>Function</dt><dd>{finding.function_name}()</dd></div>}
                  <div><dt>Status</dt><dd>{finding.status === 'approved_marker_applied' ? 'Review marker applied' : 'Suggested'}</dd></div>
                </dl>
                <p className="print-finding-rationale"><strong>Why it was flagged:</strong> {finding.rationale}</p>
                <div className="print-suggestion">
                  <strong>Suggested logging:</strong>
                  <pre>{finding.suggested_code || 'No code suggestion provided.'}</pre>
                </div>
              </li>
            ))}
          </ol>
        )}
        <footer className="print-report-footer">
          This report contains static-analysis suggestions. Review the code and adapt recommendations before applying them.
        </footer>
      </section>

      <div className="screen-report-only space-y-6">
      {/* Top back navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-800 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print report</span>
          </button>
          <button
            onClick={fetchAuditData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-800 transition-colors cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Refresh Audit</span>
          </button>
        </div>
      </div>

      {/* Audit Summary Header Card */}
      <div className="p-6 md:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Audit Result
              </span>
              <div className="flex items-center gap-1 font-mono text-xs text-slate-400 bg-slate-950 px-2.5 py-0.5 rounded border border-slate-800">
                <span>ID: {audit.audit_id}</span>
                <button
                  onClick={handleCopyAuditId}
                  className="hover:text-white transition-colors cursor-pointer ml-1"
                  title="Copy Audit ID"
                >
                  {copiedAuditId ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-slate-800 text-indigo-400 border border-slate-700/60">
                {isGithub ? <FolderGit2 className="w-5 h-5" /> : <FileArchive className="w-5 h-5" />}
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight break-all">
                {isGithub ? audit.source.replace('https://github.com/', '') : 'Uploaded ZIP Repository'}
              </h1>
            </div>

            <p className="text-xs text-slate-400 font-mono truncate max-w-xl">
              Source: {audit.source}
            </p>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex items-center gap-2 md:gap-3 flex-wrap">
            <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Total</span>
              <span className="text-lg font-bold text-white">{audit.findings.length}</span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
              <span className="text-[10px] uppercase font-semibold text-rose-400 block">High</span>
              <span className="text-lg font-bold text-rose-300">{highCount}</span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
              <span className="text-[10px] uppercase font-semibold text-amber-400 block">Med</span>
              <span className="text-lg font-bold text-amber-300">{medCount}</span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-center">
              <span className="text-[10px] uppercase font-semibold text-sky-400 block">Low</span>
              <span className="text-lg font-bold text-sky-300">{lowCount}</span>
            </div>
            {appliedCount > 0 && (
              <div className="px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <span className="text-[10px] uppercase font-semibold text-emerald-400 block">Applied</span>
                <span className="text-lg font-bold text-emerald-300">{appliedCount}</span>
              </div>
            )}
          </div>
        </div>

        {/* Critical Limitation Banner */}
        <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80 flex items-start gap-2.5 text-xs text-slate-300">
          <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-white">Workspace Review Workflow: </strong>
            Selecting and applying findings writes heuristic review markers (<code># Logging auditor review</code>) directly above flagged lines in the workspace. Verify each marker and commit manually.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <FindingsFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedRisk={selectedRisk}
        onRiskChange={setSelectedRisk}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        selectedFile={selectedFile}
        onFileChange={setSelectedFile}
        availableFiles={availableFiles}
        totalCount={audit.findings.length}
        filteredCount={filteredFindings.length}
        onReset={handleResetFilters}
      />

      {/* Batch Actions Header */}
      {filteredFindings.length > 0 && (
        <div className="flex items-center justify-between px-2 py-1 text-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              {selectedIds.length === filteredFindings.length ? (
                <CheckSquare className="w-4 h-4 text-indigo-400" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              <span>
                {selectedIds.length === filteredFindings.length ? 'Deselect all' : 'Select all shown'}
              </span>
            </button>
            {selectedIds.length > 0 && (
              <span className="text-indigo-400 font-medium">
                ({selectedIds.length} selected)
              </span>
            )}
          </div>

          {selectedIds.length > 0 && (
            <button
              onClick={() => setShowApplyBatchDialog(true)}
              disabled={isApplying}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Apply Selected Markers ({selectedIds.length})</span>
            </button>
          )}
        </div>
      )}

      {/* Findings List */}
      {filteredFindings.length === 0 ? (
        <EmptyState
          title="No Findings Match Filters"
          description={
            audit.findings.length === 0
              ? 'Great news! The static analyzer did not detect any missing logs or silent exception swallows in the inspected supported source files.'
              : 'No findings match your current search and filter criteria. Try adjusting the severity or search term.'
          }
          actionText={audit.findings.length > 0 ? 'Clear Filters' : undefined}
          onAction={audit.findings.length > 0 ? handleResetFilters : undefined}
        />
      ) : (
        <div className="space-y-3">
          {filteredFindings.map((finding) => (
            <FindingCard
              key={finding.id}
              finding={finding}
              isSelected={selectedIds.includes(finding.id)}
              onSelect={handleToggleSelect}
              onClick={setActiveFinding}
            />
          ))}
        </div>
      )}

      {/* Single Finding Detail Modal */}
      <FindingDetailModal
        finding={activeFinding}
        onClose={() => setActiveFinding(null)}
        onApplySingle={handleApplySingle}
        isApplying={isApplying}
      />

      {/* Batch Apply Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showApplyBatchDialog}
        title="Apply Review Markers to Selected Findings"
        count={selectedIds.length}
        onClose={() => setShowApplyBatchDialog(false)}
        onConfirm={handleApplyBatch}
        isApplying={isApplying}
      />
      </div>
    </div>
  );
};

