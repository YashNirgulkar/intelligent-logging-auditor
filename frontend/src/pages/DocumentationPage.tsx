import React, { useState } from 'react';
import {
  BookOpen,
  Terminal,
  Copy,
  Check,
  Play,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  Database,
  Cpu,
  RefreshCw,
} from 'lucide-react';
import { apiClient, API_ORIGIN } from '../api/client';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

interface EndpointSpec {
  id: string;
  method: 'GET' | 'POST';
  path: string;
  title: string;
  description: string;
  tag: string;
  headers?: Record<string, string>;
  contentType?: string;
  parameters?: Array<{ name: string; type: string; required: boolean; description: string; in: 'path' | 'body' | 'formData' }>;
  requestBodyExample?: string;
  responseStatus: number;
  responseExample: string;
  curlSnippet: string;
  pythonSnippet: string;
  jsSnippet: string;
}

const ENDPOINTS: EndpointSpec[] = [
  {
    id: 'health',
    method: 'GET',
    path: '/health',
    title: 'Health Check',
    tag: 'System',
    description: 'Verify system liveness, FastAPI runtime readiness, and storage mount accessibility.',
    responseStatus: 200,
    responseExample: `{\n  "status": "ok"\n}`,
    curlSnippet: `curl -X GET ${API_ORIGIN}/health`,
    pythonSnippet: `import httpx\n\nresponse = httpx.get("${API_ORIGIN}/health")\nprint(response.json()) # {"status": "ok"}`,
    jsSnippet: `const res = await fetch('${API_ORIGIN}/health');\nconst data = await res.json();\nconsole.log(data);`,
  },
  {
    id: 'upload-zip',
    method: 'POST',
    path: '/api/v1/audits/upload',
    title: 'Upload Repository Archive',
    tag: 'Audits',
    description: 'Upload a compressed .zip archive of a repository. The engine extracts supported source files into an isolated sandbox workspace and checks for risky operations without logging.',
    contentType: 'multipart/form-data',
    parameters: [
      { name: 'file', type: 'binary (.zip)', required: true, description: 'Compressed ZIP file of the codebase (max 20MB). Supports Python, JavaScript/TypeScript, Java, Go, C#, PHP, Ruby, and Rust source files.', in: 'formData' },
    ],
    responseStatus: 200,
    responseExample: `{\n  "audit_id": "03a4fcbb50474af9",\n  "source": "uploaded_zip",\n  "findings": [\n    {\n      "id": "1bbf49491e09",\n      "file_path": "services/orders.py",\n      "line": 42,\n      "function_name": "dispatch_order",\n      "risk": "medium",\n      "rule": "risky_operation_without_logging",\n      "title": "Potential missing logging in dispatch_order",\n      "rationale": "Function performs outbound HTTP request without entry/error logging.",\n      "suggested_code": "logger.info('Dispatching order %s', order_id)",\n      "status": "suggested"\n    }\n  ],\n  "summary": {\n    "total": 1,\n    "high": 0,\n    "medium": 1,\n    "low": 0\n  }\n}`,
    curlSnippet: `curl -X POST ${API_ORIGIN}/api/v1/audits/upload \\\n  -F "file=@repository.zip"`,
    pythonSnippet: `import httpx\n\nwith open("repository.zip", "rb") as f:\n    files = {"file": ("repository.zip", f, "application/zip")}\n    res = httpx.post("${API_ORIGIN}/api/v1/audits/upload", files=files)\nprint(res.json())`,
    jsSnippet: `const formData = new FormData();\nformData.append('file', fileInput.files[0]);\n\nconst res = await fetch('${API_ORIGIN}/api/v1/audits/upload', {\n  method: 'POST',\n  body: formData\n});\nconst data = await res.json();`,
  },
  {
    id: 'github-audit',
    method: 'POST',
    path: '/api/v1/audits/github',
    title: 'Audit Public GitHub Repository',
    tag: 'Audits',
    description: 'Fetch and analyze an open-source repository directly from GitHub via tarball/zipball stream. Evaluates the codebase and generates heuristic patches.',
    contentType: 'application/json',
    parameters: [
      { name: 'repo_url', type: 'string (HttpUrl)', required: true, description: 'HTTPS URL of the target GitHub repository (e.g., https://github.com/fastapi/fastapi).', in: 'body' },
    ],
    requestBodyExample: `{\n  "repo_url": "https://github.com/pallets/flask"\n}`,
    responseStatus: 200,
    responseExample: `{\n  "audit_id": "84c8a41df2a1",\n  "source": "https://github.com/pallets/flask",\n  "findings": [...],\n  "summary": {\n    "total": 12,\n    "high": 3,\n    "medium": 7,\n    "low": 2\n  }\n}`,
    curlSnippet: `curl -X POST ${API_ORIGIN}/api/v1/audits/github \\\n  -H "Content-Type: application/json" \\\n  -d '{"repo_url": "https://github.com/pallets/flask"}'`,
    pythonSnippet: `import httpx\n\npayload = {"repo_url": "https://github.com/pallets/flask"}\nres = httpx.post("${API_ORIGIN}/api/v1/audits/github", json=payload)\nprint(res.json())`,
    jsSnippet: `const res = await fetch('${API_ORIGIN}/api/v1/audits/github', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify({ repo_url: 'https://github.com/pallets/flask' })\n});\nconst data = await res.json();`,
  },
  {
    id: 'get-audit',
    method: 'GET',
    path: '/api/v1/audits/{audit_id}',
    title: 'Get Audit Results',
    tag: 'Audits',
    description: 'Retrieve stored audit findings, file paths, line numbers, and heuristic metrics for a completed audit manifest.',
    parameters: [
      { name: 'audit_id', type: 'string', required: true, description: '16-character hexadecimal audit identifier.', in: 'path' },
    ],
    responseStatus: 200,
    responseExample: `{\n  "audit_id": "03a4fcbb50474af9",\n  "source": "uploaded_zip",\n  "findings": [\n    {\n      "id": "994c0af9f570",\n      "file_path": "sample.py",\n      "line": 10,\n      "function_name": "process_order",\n      "risk": "high",\n      "rule": "exception_without_log_or_reraise",\n      "title": "Exception handler in process_order may hide a failure",\n      "rationale": "Handler swallows exceptions without logging or re-raising.",\n      "suggested_code": "logger.exception('Operation failed')\\\\nraise",\n      "status": "suggested"\n    }\n  ],\n  "summary": { "total": 1, "high": 1, "medium": 0, "low": 0 }\n}`,
    curlSnippet: `curl -X GET ${API_ORIGIN}/api/v1/audits/03a4fcbb50474af9`,
    pythonSnippet: `import httpx\n\nres = httpx.get("${API_ORIGIN}/api/v1/audits/03a4fcbb50474af9")\nprint(res.json())`,
    jsSnippet: `const res = await fetch('${API_ORIGIN}/api/v1/audits/03a4fcbb50474af9');\nconst data = await res.json();`,
  },
  {
    id: 'get-patches',
    method: 'GET',
    path: '/api/v1/audits/{audit_id}/patches',
    title: 'Get Review Patches',
    tag: 'Remediation',
    description: 'Retrieve lightweight patch candidate descriptors and suggested logging statements pending human approval.',
    parameters: [
      { name: 'audit_id', type: 'string', required: true, description: 'The audit identifier.', in: 'path' },
    ],
    responseStatus: 200,
    responseExample: `{\n  "audit_id": "03a4fcbb50474af9",\n  "approval_required": true,\n  "patches": [\n    {\n      "finding_id": "994c0af9f570",\n      "file_path": "sample.py",\n      "line": 10,\n      "title": "Exception handler in process_order may hide a failure",\n      "suggested_code": "logger.exception('Operation failed')",\n      "status": "suggested"\n    }\n  ]\n}`,
    curlSnippet: `curl -X GET ${API_ORIGIN}/api/v1/audits/03a4fcbb50474af9/patches`,
    pythonSnippet: `import httpx\n\nres = httpx.get("${API_ORIGIN}/api/v1/audits/03a4fcbb50474af9/patches")\nprint(res.json())`,
    jsSnippet: `const res = await fetch('${API_ORIGIN}/api/v1/audits/03a4fcbb50474af9/patches');\nconst data = await res.json();`,
  },
  {
    id: 'apply-patches',
    method: 'POST',
    path: '/api/v1/audits/{audit_id}/apply',
    title: 'Apply Review Markers',
    tag: 'Remediation',
    description: 'Explicitly apply approved review markers to workspace files. Inserts non-executable comment markers (# Logging auditor review) above flagged lines. Requires approved=true.',
    contentType: 'application/json',
    parameters: [
      { name: 'audit_id', type: 'string', required: true, description: 'Audit identifier.', in: 'path' },
      { name: 'finding_ids', type: 'string[]', required: true, description: 'List of finding IDs to apply markers for.', in: 'body' },
      { name: 'approved', type: 'boolean', required: true, description: 'Explicit human approval flag (must be true).', in: 'body' },
    ],
    requestBodyExample: `{\n  "finding_ids": ["994c0af9f570"],\n  "approved": true\n}`,
    responseStatus: 200,
    responseExample: `{\n  "audit_id": "03a4fcbb50474af9",\n  "applied_finding_ids": ["994c0af9f570"],\n  "changed_files": ["sample.py"],\n  "message": "Review markers applied to workspace. Inspect diff and run tests before merging."\n}`,
    curlSnippet: `curl -X POST ${API_ORIGIN}/api/v1/audits/03a4fcbb50474af9/apply \\\n  -H "Content-Type: application/json" \\\n  -d '{"finding_ids": ["994c0af9f570"], "approved": true}'`,
    pythonSnippet: `import httpx\n\npayload = {"finding_ids": ["994c0af9f570"], "approved": True}\nres = httpx.post("${API_ORIGIN}/api/v1/audits/03a4fcbb50474af9/apply", json=payload)\nprint(res.json())`,
    jsSnippet: `const res = await fetch('${API_ORIGIN}/api/v1/audits/03a4fcbb50474af9/apply', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify({ finding_ids: ['994c0af9f570'], approved: true })\n});\nconst data = await res.json();`,
  },
];

export const DocumentationPage: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointSpec>(ENDPOINTS[0]);
  const [activeSnippetTab, setActiveSnippetTab] = useState<'curl' | 'python' | 'javascript'>('curl');
  const [copied, setCopied] = useState(false);

  // Live test runner state
  const [isExecuting, setIsExecuting] = useState(false);
  const [liveTestResponse, setLiveTestResponse] = useState<string | null>(null);
  const [liveTestStatus, setLiveTestStatus] = useState<number | null>(null);
  const [liveLatency, setLiveLatency] = useState<number | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const executeLiveTest = async () => {
    setIsExecuting(true);
    setLiveTestResponse(null);
    setLiveTestStatus(null);
    const start = performance.now();

    try {
      let res;
      if (selectedEndpoint.id === 'health') {
        res = await apiClient.get('/health');
      } else if (selectedEndpoint.id === 'github-audit') {
        res = await apiClient.post('/api/v1/audits/github', { repo_url: 'https://github.com/fastapi/fastapi' });
      } else {
        toast.info('Use the New Audit or Results page for file uploads and specific IDs.');
        setIsExecuting(false);
        return;
      }

      const elapsed = Math.round(performance.now() - start);
      setLiveLatency(elapsed);
      setLiveTestStatus(res.status);
      setLiveTestResponse(JSON.stringify(res.data, null, 2));
      toast.success(`Executed with HTTP ${res.status}`);
    } catch (err: any) {
      const elapsed = Math.round(performance.now() - start);
      setLiveLatency(elapsed);
      setLiveTestStatus(err.response?.status || 500);
      setLiveTestResponse(JSON.stringify(err.response?.data || { error: err.message }, null, 2));
      toast.error('Test request returned an error.');
    } finally {
      setIsExecuting(false);
    }
  };

  const currentSnippet =
    activeSnippetTab === 'curl'
      ? selectedEndpoint.curlSnippet
      : activeSnippetTab === 'python'
      ? selectedEndpoint.pythonSnippet
      : selectedEndpoint.jsSnippet;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4" />
            <span>Developer Reference</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            API Documentation & Architecture
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Complete technical specification for the Intelligent Logging Auditor REST API, multi-language heuristics engine, and remediation pipeline.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={`${API_ORIGIN}/openapi.json`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-800 transition-colors"
          >
            <span>OpenAPI 3.1 Spec</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
          </a>
        </div>
      </div>

      {/* Architecture & Safety Guarantees Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
            <Cpu className="w-4 h-4" />
            <span>Multi-language Static Analysis</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Python files use Python’s native <code className="text-slate-200">ast.parse</code>. JavaScript/TypeScript, Java, Go, C#, PHP, Ruby, and Rust use conservative source heuristics. Code is <strong>never executed</strong>.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Review Markers Only</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            The apply endpoint inserts a non-executable review comment using the target language’s comment syntax, preventing unintended runtime side-effects.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
            <Database className="w-4 h-4" />
            <span>Isolated Workspaces</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Every audit generates a uniquely sandboxed directory in <code className="text-slate-200">data/audits/&#123;id&#125;</code>, keeping repository sources cleanly segregated.
          </p>
        </div>
      </div>

      {/* Main Content: Sidebar + Endpoint Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-4 space-y-4 sticky top-20">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 shadow-lg">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-1">
              API Endpoints ({ENDPOINTS.length})
            </div>

            <div className="space-y-1">
              {ENDPOINTS.map((endpoint) => {
                const isSelected = selectedEndpoint.id === endpoint.id;
                return (
                  <button
                    key={endpoint.id}
                    onClick={() => {
                      setSelectedEndpoint(endpoint);
                      setLiveTestResponse(null);
                      setLiveTestStatus(null);
                    }}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs transition-all cursor-pointer group',
                      isSelected
                        ? 'bg-indigo-600/15 border border-indigo-500/30 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                    )}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span
                        className={cn(
                          'px-1.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-tight',
                          endpoint.method === 'GET'
                            ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                            : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        )}
                      >
                        {endpoint.method}
                      </span>
                      <span className="truncate font-medium">{endpoint.title}</span>
                    </div>
                    <ChevronRight
                      className={cn(
                        'w-3.5 h-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform',
                        isSelected && 'text-indigo-400'
                      )}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Endpoint Detail & Code Console */}
        <div className="lg:col-span-8 space-y-6">
          <div className="p-6 md:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-6">
            {/* Title & Path */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'px-2.5 py-1 rounded-md text-xs font-mono font-bold uppercase tracking-wider',
                    selectedEndpoint.method === 'GET'
                      ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                      : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  )}
                >
                  {selectedEndpoint.method}
                </span>
                <span className="font-mono text-xs md:text-sm text-slate-200 bg-slate-950 px-3 py-1 rounded-xl border border-slate-800">
                  {selectedEndpoint.path}
                </span>
              </div>

              <h2 className="text-xl font-bold text-white tracking-tight">
                {selectedEndpoint.title}
              </h2>

              <p className="text-xs text-slate-300 leading-relaxed">
                {selectedEndpoint.description}
              </p>
            </div>

            {/* Parameters Table */}
            {selectedEndpoint.parameters && selectedEndpoint.parameters.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Parameters & Payload
                </h3>
                <div className="rounded-xl border border-slate-800 overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400">
                        <th className="py-2.5 px-3">Field</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">In</th>
                        <th className="py-2.5 px-3">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {selectedEndpoint.parameters.map((param) => (
                        <tr key={param.name} className="hover:bg-slate-800/20">
                          <td className="py-2.5 px-3 font-mono font-semibold text-indigo-300">
                            {param.name}
                            {param.required && <span className="text-rose-400 ml-1">*</span>}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-400">{param.type}</td>
                          <td className="py-2.5 px-3 text-slate-400">{param.in}</td>
                          <td className="py-2.5 px-3 text-slate-300">{param.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Request Body Example if present */}
            {selectedEndpoint.requestBodyExample && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Request JSON Body
                </h3>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200">
                  <pre>{selectedEndpoint.requestBodyExample}</pre>
                </div>
              </div>
            )}

            {/* Client Code Snippet */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Integration Code
                  </span>
                </div>

                {/* Snippet Language Selector */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                  {(['curl', 'python', 'javascript'] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setActiveSnippetTab(lang)}
                      className={cn(
                        'px-2.5 py-0.5 rounded-lg text-[11px] font-medium transition-all capitalize cursor-pointer',
                        activeSnippetTab === lang
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      )}
                    >
                      {lang === 'javascript' ? 'Fetch JS' : lang}
                    </button>
                  ))}
                </div>
              </div>

              {/* Code block */}
              <div className="relative rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-inner">
                <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/80 bg-slate-900/40 text-xs">
                  <span className="font-mono text-slate-500">{activeSnippetTab}</span>
                  <button
                    onClick={() => handleCopy(currentSnippet)}
                    className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 hover:text-white cursor-pointer transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy snippet</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-4 font-mono text-xs overflow-x-auto text-indigo-200/90 leading-relaxed">
                  <pre>{currentSnippet}</pre>
                </div>
              </div>
            </div>

            {/* Expected Response */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Response Schema (HTTP {selectedEndpoint.responseStatus})
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">
                  application/json
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto max-h-64">
                <pre>{selectedEndpoint.responseExample}</pre>
              </div>
            </div>

            {/* Interactive "Try It Out" Live Console for get/post */}
            {(selectedEndpoint.id === 'health' || selectedEndpoint.id === 'github-audit') && (
              <div className="pt-4 border-t border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-semibold text-white">Live Execution Console</h4>
                    <p className="text-[11px] text-slate-400">Send an actual live test request to the local backend</p>
                  </div>
                  <button
                    onClick={executeLiveTest}
                    disabled={isExecuting}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/25 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isExecuting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Dispatching...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Run Test Call</span>
                      </>
                    )}
                  </button>
                </div>

                {liveTestResponse && (
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-300">Live Response:</span>
                        <span
                          className={cn(
                            'px-1.5 py-0.2 rounded font-mono font-bold',
                            liveTestStatus === 200
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : 'bg-rose-500/15 text-rose-400'
                          )}
                        >
                          HTTP {liveTestStatus}
                        </span>
                      </div>
                      {liveLatency !== null && (
                        <span className="font-mono text-slate-400">{liveLatency}ms latency</span>
                      )}
                    </div>
                    <pre className="font-mono text-xs text-emerald-300 overflow-x-auto max-h-48 pt-1">
                      {liveTestResponse}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
