import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, ShieldAlert, Sparkles, AlertCircle, Zap } from 'lucide-react';
import { GithubIcon } from '../components/GithubIcon';
import { RepositoryUpload } from '../components/RepositoryUpload';
import { GitHubRepositoryForm } from '../components/GitHubRepositoryForm';
import { ScanProgressModal } from '../components/ScanProgressModal';
import { auditsApi, formatApiError } from '../api/client';
import { saveAuditToHistory } from '../lib/auditStorage';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

export const NewAuditPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'zip' | 'github'>('zip');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [scanTargetName, setScanTargetName] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const handleZipScan = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setUploadProgress(0);
    setScanTargetName(file.name);
    try {
      const response = await auditsApi.uploadZip(file, (percent) => {
        setUploadProgress(percent);
      });
      saveAuditToHistory(response);
      toast.success(`Audit completed with ${response.findings.length} findings detected.`);
      navigate(`/audits/${response.audit_id}`);
    } catch (err) {
      const message = formatApiError(err);
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
      setUploadProgress(null);
    }
  };

  const handleGitHubScan = async (url: string) => {
    setIsLoading(true);
    setError(null);
    setScanTargetName(url);
    try {
      const response = await auditsApi.scanGitHub(url);
      saveAuditToHistory(response);
      toast.success(`GitHub repository audited: ${response.findings.length} findings.`);
      navigate(`/audits/${response.audit_id}`);
    } catch (err) {
      const message = formatApiError(err);
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-slide">
      {/* Page Header */}
      <div className="space-y-3">
        <div
          className="chip"
          style={{
            background: 'rgba(39, 39, 38, 0.12)',
            border: '1px solid rgba(39, 39, 38, 0.3)',
            color: '#454543',
          }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>New AST Analysis Session</span>
        </div>
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: '#20201f', fontFamily: "'Outfit', sans-serif" }}
        >
          Start New Audit
        </h1>
        <p className="text-sm leading-relaxed" style={{ color: '#4f4f4c' }}>
          Provide a Python project via a local ZIP archive or a public GitHub repository. The engine parses AST trees to identify unlogged risky calls, uncaught failures, and silent exception swallows.
        </p>
      </div>

      {/* Safety Notice */}
      <div
        className="flex items-start gap-3 p-4 rounded-2xl text-xs"
        style={{
          background: 'rgba(39, 39, 38, 0.06)',
          border: '1px solid rgba(39, 39, 38, 0.2)',
          color: '#252524',
        }}
      >
        <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#292928' }} />
        <div className="space-y-1">
          <p className="font-semibold" style={{ color: '#20201f' }}>Non-Executing Static Heuristics</p>
          <p className="leading-relaxed" style={{ color: '#4f4f4c' }}>
            Submitted code is strictly analyzed via static AST parsing and heuristic patterns. Code is{' '}
            <strong style={{ color: '#20201f' }}>never executed</strong>. Heuristic suggestions should be carefully reviewed before applying.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid #e2e2df' }}>
        <div className="flex">
          {[
            { id: 'zip' as const, label: 'Upload ZIP Archive', icon: UploadCloud },
            { id: 'github' as const, label: 'Analyze GitHub Repository', icon: GithubIcon },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setError(null); }}
                disabled={isLoading}
                className="flex items-center gap-2.5 px-6 py-3.5 text-xs font-semibold border-b-2 transition-all cursor-pointer disabled:opacity-50"
                style={{
                  borderBottomColor: isActive ? '#292928' : 'transparent',
                  color: isActive ? '#252524' : '#62625f',
                  background: isActive ? 'rgba(39, 39, 38, 0.05)' : 'transparent',
                }}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div
          className="flex items-start gap-3 p-4 rounded-2xl text-xs"
          style={{
            background: 'rgba(197, 22, 50, 0.08)',
            border: '1px solid rgba(197, 22, 50, 0.25)',
            color: '#d72d45',
          }}
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#c51632' }} />
          <div className="space-y-1">
            <p className="font-semibold" style={{ color: '#7f1021' }}>Audit Request Failed</p>
            <p className="leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {/* Tab Panels */}
      <div>
        {activeTab === 'zip' ? (
          <RepositoryUpload
            onScan={handleZipScan}
            isLoading={isLoading}
            uploadProgress={uploadProgress}
          />
        ) : (
          <GitHubRepositoryForm
            onScan={handleGitHubScan}
            isLoading={isLoading}
          />
        )}
      </div>

      {/* Progress Dialog */}
      <ScanProgressModal
        isOpen={isLoading}
        sourceType={activeTab}
        targetName={scanTargetName}
      />
    </div>
  );
};
