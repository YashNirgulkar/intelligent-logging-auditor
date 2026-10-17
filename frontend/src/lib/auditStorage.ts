import { StoredAuditMeta, AuditResponse } from '../types/api';

const STORAGE_KEY = 'ila_audit_history_v1';

export function getStoredAudits(): StoredAuditMeta[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.sort((a, b) => b.createdAt - a.createdAt);
    }
  } catch (err) {
    console.warn('Failed to parse cached audit history from localStorage:', err);
  }
  return [];
}

export function saveAuditToHistory(audit: AuditResponse): void {
  try {
    const existing = getStoredAudits();
    const updated = existing.filter((item) => item.audit_id !== audit.audit_id);
    const newEntry: StoredAuditMeta = {
      audit_id: audit.audit_id,
      source: audit.source,
      createdAt: Date.now(),
      totalFindings: audit.summary?.total ?? audit.findings.length,
      highCount: audit.summary?.high ?? audit.findings.filter((f) => f.risk === 'high').length,
      mediumCount: audit.summary?.medium ?? audit.findings.filter((f) => f.risk === 'medium').length,
      lowCount: audit.summary?.low ?? audit.findings.filter((f) => f.risk === 'low').length,
      status: audit.findings.some((f) => f.status === 'approved_marker_applied')
        ? 'markers_applied'
        : 'completed',
    };
    updated.unshift(newEntry);
    // Keep up to 50 recent audits
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(0, 50)));
  } catch (err) {
    console.warn('Failed to save audit to history:', err);
  }
}

export function updateAuditStatusInHistory(auditId: string, status: 'markers_applied'): void {
  try {
    const existing = getStoredAudits();
    const target = existing.find((item) => item.audit_id === auditId);
    if (target) {
      target.status = status;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    }
  } catch (err) {
    console.warn('Failed to update audit status in history:', err);
  }
}

export function removeAuditFromHistory(auditId: string): void {
  try {
    const existing = getStoredAudits();
    const updated = existing.filter((item) => item.audit_id !== auditId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to remove audit from history:', err);
  }
}

export function clearAuditHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear audit history:', err);
  }
}
