import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, FolderGit2, Calendar, FileArchive, Trash2 } from 'lucide-react';
import { StoredAuditMeta } from '../types/api';
import { formatDate } from '../lib/utils';
import { StatusBadge } from './StatusBadge';
import { EmptyState } from './EmptyState';
import { LoadingSkeleton } from './LoadingSkeleton';

interface Props {
  audits: StoredAuditMeta[];
  isLoading?: boolean;
  onDelete?: (auditId: string) => void;
}

export const AuditTable: React.FC<Props> = ({ audits, isLoading = false, onDelete }) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <LoadingSkeleton className="h-16 w-full" count={3} />
      </div>
    );
  }

  if (audits.length === 0) {
    return (
      <EmptyState
        title="No Audits Recorded"
        description="Run your first static code audit by uploading a Python repository archive or specifying a GitHub repository URL."
        actionText="Start New Audit"
        onAction={() => (window.location.href = '/audits/new')}
      />
    );
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255, 255, 255, 0.8)',
        border: '1px solid #e2e2df',
      }}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr
              style={{
                borderBottom: '1px solid #e2e2df',
                background: 'rgba(250, 250, 249, 0.6)',
                color: '#62625f',
              }}
            >
              <th className="py-3.5 px-4 font-semibold tracking-wider">Repository / Source</th>
              <th className="py-3.5 px-4 font-semibold tracking-wider font-mono">Audit ID</th>
              <th className="py-3.5 px-4 font-semibold tracking-wider">Findings</th>
              <th className="py-3.5 px-4 font-semibold tracking-wider">Status</th>
              <th className="py-3.5 px-4 font-semibold tracking-wider">Date</th>
              <th className="py-3.5 px-4 font-semibold tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {audits.map((item, idx) => {
              const isGithub = item.source.startsWith('http');
              const displaySource = isGithub
                ? item.source.replace('https://github.com/', '')
                : 'Uploaded ZIP Archive';

              return (
                <tr
                  key={item.audit_id}
                  className="group transition-colors"
                  style={{ borderTop: idx > 0 ? '1px solid #e7e7e5' : undefined }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(39, 39, 38, 0.04)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  {/* Source */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="p-2 rounded-lg flex-shrink-0"
                        style={{
                          background: 'rgba(39, 39, 38, 0.1)',
                          border: '1px solid rgba(39, 39, 38, 0.2)',
                          color: '#454543',
                        }}
                      >
                        {isGithub ? <FolderGit2 className="w-4 h-4" /> : <FileArchive className="w-4 h-4" />}
                      </div>
                      <div className="truncate max-w-[220px]">
                        <p className="font-semibold truncate" style={{ color: '#333331' }}>
                          {displaySource}
                        </p>
                        <p className="text-[11px] truncate" style={{ color: '#70706d' }}>
                          {item.source}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Audit ID */}
                  <td className="py-3.5 px-4 font-mono">
                    <span
                      className="px-2 py-0.5 rounded text-[11px]"
                      style={{
                        background: '#fafaf9',
                        border: '1px solid #e2e2df',
                        color: '#4f4f4c',
                      }}
                    >
                      {item.audit_id}
                    </span>
                  </td>

                  {/* Findings */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold" style={{ color: '#20201f' }}>
                        {item.totalFindings} total
                      </span>
                      {item.highCount > 0 && (
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                          style={{
                            background: 'rgba(197, 22, 50, 0.12)',
                            border: '1px solid rgba(197, 22, 50, 0.3)',
                            color: '#c51632',
                          }}
                        >
                          {item.highCount} high
                        </span>
                      )}
                      {item.mediumCount > 0 && (
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                          style={{
                            background: 'rgba(165, 104, 11, 0.12)',
                            border: '1px solid rgba(165, 104, 11, 0.3)',
                            color: '#a5680b',
                          }}
                        >
                          {item.mediumCount} med
                        </span>
                      )}
                      {item.lowCount > 0 && (
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                          style={{
                            background: 'rgba(119, 119, 115, 0.12)',
                            border: '1px solid rgba(119, 119, 115, 0.3)',
                            color: '#646460',
                          }}
                        >
                          {item.lowCount} low
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4">
                    <StatusBadge status={item.status} size="sm" />
                  </td>

                  {/* Date */}
                  <td className="py-3.5 px-4 font-mono text-[11px]" style={{ color: '#62625f' }}>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(item.createdAt)}</span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/audits/${item.audit_id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl font-medium text-xs transition-all cursor-pointer"
                        style={{
                          color: '#454543',
                          background: 'rgba(39, 39, 38, 0.1)',
                          border: '1px solid rgba(39, 39, 38, 0.25)',
                        }}
                        onMouseEnter={(e) => {
                          const el = e.currentTarget;
                          el.style.background = 'rgba(39, 39, 38, 0.25)';
                          el.style.color = '#20201f';
                        }}
                        onMouseLeave={(e) => {
                          const el = e.currentTarget;
                          el.style.background = 'rgba(39, 39, 38, 0.1)';
                          el.style.color = '#454543';
                        }}
                      >
                        <span>View</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>

                      {onDelete && (
                        <button
                          onClick={() => onDelete(item.audit_id)}
                          className="p-1.5 rounded-lg transition-colors cursor-pointer"
                          style={{ color: '#70706d' }}
                          title="Remove from history"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#c51632';
                            e.currentTarget.style.background = 'rgba(197, 22, 50, 0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = '#70706d';
                            e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
