import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  FileSearch,
  Code2,
  FolderGit2,
  PlusCircle,
  BarChart3,
  BookOpen,
  Sparkles,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import { StatCard } from '../components/StatCard';
import { AuditTable } from '../components/AuditTable';
import { getStoredAudits, removeAuditFromHistory } from '../lib/auditStorage';
import { StoredAuditMeta } from '../types/api';
import { useBackendStatus } from '../context/useBackendStatus';
import { API_ORIGIN } from '../api/client';

export const DashboardPage: React.FC = () => {
  const { status } = useBackendStatus();
  const [audits, setAudits] = useState<StoredAuditMeta[]>(getStoredAudits);

  const handleDeleteAudit = (id: string) => {
    removeAuditFromHistory(id);
    setAudits(getStoredAudits());
  };

  const totalAudits = audits.length;
  const totalFindings = audits.reduce((acc, curr) => acc + (curr.totalFindings || 0), 0);
  const highPriorityFindings = audits.reduce((acc, curr) => acc + (curr.highCount || 0), 0);
  const mediumPriorityFindings = audits.reduce((acc, curr) => acc + (curr.mediumCount || 0), 0);
  const lowPriorityFindings = audits.reduce((acc, curr) => acc + (curr.lowCount || 0), 0);
  const uniqueRepos = new Set(audits.map((a) => a.source)).size;

  const severityChartData = [
    { name: 'High', count: highPriorityFindings, color: '#c51632' },
    { name: 'Medium', count: mediumPriorityFindings, color: '#a5680b' },
    { name: 'Low', count: lowPriorityFindings, color: '#777773' },
  ].filter((d) => d.count > 0);

  const recentAuditsData = audits.slice(0, 5).map((a) => ({
    name: a.source.startsWith('http')
      ? a.source.replace('https://github.com/', '').slice(0, 15)
      : a.audit_id.slice(0, 8),
    findings: a.totalFindings,
    high: a.highCount,
  }));

  const customTooltipStyle = {
    backgroundColor: '#fafaf9',
    border: '1px solid #e2e2df',
    borderRadius: '12px',
    fontSize: '12px',
    color: '#20201f',
    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
  };

  return (
    <div className="space-y-8 animate-fade-slide">
      {/* Welcome Banner */}
      <div
        className="relative overflow-hidden rounded-3xl p-6 md:p-10"
        style={{
          background: 'linear-gradient(120deg, #ffffff 0%, #f8f8f7 100%)',
          border: '1px solid #e7e7e5',
          boxShadow: '0 3px 12px rgba(24,24,22,0.035)',
        }}
      >
        {/* Decorative orbs */}
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse, rgba(39, 39, 38, 0.035) 0%, transparent 70%)',
            transform: 'translate(30%, -30%)',
          }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse, rgba(119, 119, 115, 0.025) 0%, transparent 70%)',
            transform: 'translate(0, 50%)',
          }}
        />

        <div className="relative z-10 max-w-2xl space-y-4">
          <div
            className="chip"
            style={{
              background: 'rgba(39, 39, 38, 0.12)',
              border: '1px solid rgba(39, 39, 38, 0.3)',
              color: '#454543',
            }}
          >
            <Sparkles className="w-3 h-3" />
            <span>Automated Observability · Multi-language Static Analysis</span>
          </div>

          <h1
            className="text-2xl md:text-4xl font-extrabold tracking-tight leading-tight"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            <span className="gradient-text">Intelligent</span>
            <span style={{ color: '#20201f' }}> Logging Auditor</span>
          </h1>

          <p className="text-sm md:text-base leading-relaxed" style={{ color: '#4f4f4c' }}>
            Find missing logs. Understand failures. Improve observability across Python, JavaScript/TypeScript, Java, Go, C#, PHP, Ruby, and Rust codebases.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to="/audits/new"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white btn-accent transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Start New Audit</span>
            </Link>

            <Link
              to="/docs"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer"
              style={{
                color: '#4f4f4c',
                background: 'rgba(255, 255, 255, 0.8)',
                border: '1px solid #e2e2df',
              }}
            >
              <BookOpen className="w-3.5 h-3.5" style={{ color: '#292928' }} />
              <span>View Documentation</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Backend Disconnected Warning */}
      {status === 'disconnected' && (
        <div
          className="flex items-start gap-3 p-4 rounded-2xl text-xs"
          style={{
            background: 'rgba(197, 22, 50, 0.08)',
            border: '1px solid rgba(197, 22, 50, 0.25)',
            color: '#d72d45',
          }}
        >
          <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#c51632' }} />
          <div className="space-y-1">
            <p className="font-semibold" style={{ color: '#7f1021' }}>FastAPI Backend Unreachable</p>
            <p className="leading-relaxed" style={{ color: '#d72d45' }}>
              The application could not reach{' '}
              <code
                className="px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(197, 22, 50, 0.15)', fontFamily: 'JetBrains Mono, monospace' }}
              >
                {API_ORIGIN}/health
              </code>
              . Ensure the FastAPI server is running with{' '}
              <code
                className="px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(197, 22, 50, 0.15)', fontFamily: 'JetBrains Mono, monospace' }}
              >
                python -m uvicorn app.main:app --port 8000
              </code>
              .
            </p>
          </div>
        </div>
      )}

      {/* Overview Cards */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: '#62625f' }}
            >
              Overview Metrics
            </h2>
            <p className="text-[11px] mt-0.5" style={{ color: '#70706d' }}>
              Calculated from current session audit history
            </p>
          </div>
          {totalAudits > 0 && (
            <div
              className="chip"
              style={{
                background: 'rgba(39, 39, 38, 0.08)',
                border: '1px solid rgba(39, 39, 38, 0.2)',
                color: '#292928',
              }}
            >
              <TrendingUp className="w-3 h-3" />
              <span>{totalAudits} scans recorded</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Audits"
            value={totalAudits}
            subtitle={totalAudits === 0 ? 'No audits recorded yet' : 'Completed scans'}
            icon={FileSearch}
            variant="default"
          />
          <StatCard
            title="Findings Detected"
            value={totalFindings}
            subtitle="Missing logs & gaps"
            icon={Code2}
            variant="info"
          />
          <StatCard
            title="High Priority"
            value={highPriorityFindings}
            subtitle="Silent exception swallows"
            icon={ShieldAlert}
            variant={highPriorityFindings > 0 ? 'danger' : 'default'}
          />
          <StatCard
            title="Repositories"
            value={uniqueRepos}
            subtitle="Unique projects audited"
            icon={FolderGit2}
            variant="emerald"
          />
        </div>
      </div>

      {/* Charts Section */}
      {audits.length > 0 && severityChartData.length > 0 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: '#62625f' }}>
              Audit Insights & Risk Distribution
            </h2>
            <p className="text-[11px] mt-0.5" style={{ color: '#70706d' }}>
              Aggregated heuristic classifications across local audits
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Severity Breakdown */}
            <div
              className="p-5 rounded-2xl space-y-4"
              style={{
                background: 'rgba(255, 255, 255, 0.8)',
                border: '1px solid #e2e2df',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: '#333331' }}>
                  <BarChart3 className="w-4 h-4" style={{ color: '#292928' }} />
                  <span>Severity Distribution</span>
                </div>
                <span className="text-[11px]" style={{ color: '#70706d' }}>Heuristic breakdown</span>
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={severityChartData}>
                    <XAxis dataKey="name" stroke="#70706d" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#70706d" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={customTooltipStyle} cursor={{ fill: 'rgba(39, 39, 38, 0.05)' }} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {severityChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Findings per Recent Audit */}
            <div
              className="p-5 rounded-2xl space-y-4"
              style={{
                background: 'rgba(255, 255, 255, 0.8)',
                border: '1px solid #e2e2df',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: '#333331' }}>
                  <AlertTriangle className="w-4 h-4" style={{ color: '#777773' }} />
                  <span>Findings per Recent Scan</span>
                </div>
                <span className="text-[11px]" style={{ color: '#70706d' }}>Last 5 audits</span>
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={recentAuditsData}>
                    <XAxis dataKey="name" stroke="#70706d" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#70706d" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={customTooltipStyle} cursor={{ fill: 'rgba(119, 119, 115, 0.05)' }} />
                    <Bar dataKey="findings" fill="#292928" radius={[6, 6, 0, 0]} name="Total Findings" />
                    <Bar dataKey="high" fill="#c51632" radius={[6, 6, 0, 0]} name="High Priority" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Audits Table */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: '#62625f' }}>
              Recent Audits
            </h2>
            <p className="text-[11px] mt-0.5" style={{ color: '#70706d' }}>
              Repository scans stored in your client workspace
            </p>
          </div>
          {audits.length > 0 && (
            <Link
              to="/history"
              className="text-xs font-medium transition-colors"
              style={{ color: '#292928' }}
            >
              View all history →
            </Link>
          )}
        </div>

        <AuditTable
          audits={audits.slice(0, 10)}
          onDelete={handleDeleteAudit}
        />
      </div>
    </div>
  );
};
