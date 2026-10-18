import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderGit2, ExternalLink, GitBranch } from 'lucide-react';
import { GithubIcon } from '../components/GithubIcon';
import { GitHubRepositoryForm } from '../components/GitHubRepositoryForm';
import { ScanProgressModal } from '../components/ScanProgressModal';
import { auditsApi, formatApiError } from '../api/client';
import { getStoredAudits, saveAuditToHistory } from '../lib/auditStorage';
import { StoredAuditMeta } from '../types/api';
import { formatDate } from '../lib/utils';
import { toast } from 'sonner';

export const GitHubRepositoriesPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [scanTargetName, setScanTargetName] = useState<string | undefined>(undefined);
  const [githubAudits, setGithubAudits] = useState<StoredAuditMeta[]>([]);

  useEffect(() => {
    const stored = getStoredAudits();
    setGithubAudits(stored.filter((a) => a.source.startsWith('http')));
  }, []);

  const handleScan = async (url: string) => {
    setIsLoading(true);
    setScanTargetName(url);
    try {
      const response = await auditsApi.scanGitHub(url);
      saveAuditToHistory(response);
      toast.success(`GitHub repository audited: ${response.findings.length} findings.`);
      navigate(`/audits/${response.audit_id}`);
    } catch (err) {
      const msg = formatApiError(err);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 animate-fade-slide">
      <div className="space-y-1">
        <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#555552]">
          <GithubIcon className="h-4 w-4" />
          <span>Remote repositories</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#20201f]">
          GitHub Repository Audits
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#62625f]">
          Scan a public repository and review its observability findings across supported languages. Source code is analyzed without being run.
        </p>
      </div>

      {/* GitHub Scan Form */}
      <GitHubRepositoryForm onScan={handleScan} isLoading={isLoading} />

      {/* Past Audited GitHub Repositories */}
      <section className="space-y-4 pt-2">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-[#333331]">Previously audited repositories</h2>
          <span className="rounded-full border border-[#e7e7e5] bg-white px-2.5 py-1 text-[11px] font-medium text-[#62625f]">{githubAudits.length}</span>
        </div>

        {githubAudits.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#d9d9d6] bg-white px-6 py-10 text-center">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#f3f3f1] text-[#686865]">
              <GitBranch className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-[#333331]">No repository scans yet</p>
            <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-[#62625f]">
              Paste a public GitHub URL above to start a scan. Completed repositories will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {githubAudits.map((item) => {
              const repoName = item.source.replace('https://github.com/', '');
              return (
                <div
                  key={item.audit_id}
                  onClick={() => navigate(`/audits/${item.audit_id}`)}
                  role="link"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      navigate(`/audits/${item.audit_id}`);
                    }
                  }}
                  className="group cursor-pointer space-y-4 rounded-2xl border border-[#e7e7e5] bg-white p-5 shadow-[0_2px_8px_rgba(24,24,22,0.035)] transition hover:-translate-y-0.5 hover:border-[#d1d1cd] hover:shadow-[0_8px_20px_rgba(24,24,22,0.07)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#292928]/20"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="rounded-xl border border-[#e7e7e5] bg-[#f5f5f4] p-2.5 text-[#454543]">
                        <FolderGit2 className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-[#292928] transition-colors group-hover:text-[#555552]">
                          {repoName}
                        </h4>
                        <p className="mt-0.5 text-[10px] text-[#70706d] font-mono">
                          Audit ID: {item.audit_id}
                        </p>
                      </div>
                    </div>
                    <a
                      href={item.source}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Open ${repoName} on GitHub`}
                      className="rounded-lg p-2 text-[#62625f] transition hover:bg-[#f3f3f1] hover:text-[#292928]"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <div className="flex items-center justify-between border-t border-[#eeeeec] pt-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#333331]">{item.totalFindings} findings</span>
                      {item.highCount > 0 && (
                        <span className="rounded-md border border-[#f0c9cf] bg-[#fff4f5] px-1.5 py-0.5 text-[10px] font-medium text-[#a51b31]">
                          {item.highCount} high
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#70706d] font-mono">
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <ScanProgressModal
        isOpen={isLoading}
        sourceType="github"
        targetName={scanTargetName}
      />
    </div>
  );
};
