import React, { useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
} from 'lucide-react';
import { SeverityBadge } from '../components/SeverityBadge';
import { CodeViewer } from '../components/CodeViewer';

interface RuleDoc {
  id: string;
  name: string;
  risk: 'high' | 'medium' | 'low';
  summary: string;
  explanation: string;
  badExample: string;
  goodExample: string;
}

const RULES: RuleDoc[] = [
  {
    id: 'exception_without_log_or_reraise',
    name: 'Exception Handler Swallowing Failure',
    risk: 'high',
    summary: 'Except blocks that neither log with logger.exception/error nor re-raise the exception.',
    explanation:
      'Catching exceptions without logging hides internal operational failures, data corruption, network dropouts, or downstream dependency timeouts. If this layer cannot safely heal the error, it must re-raise or emit structured logs with stack traces.',
    badExample: `try:
    process_payment(order_id)
except PaymentGatewayError:
    # Danger: failure is silently ignored!
    pass`,
    goodExample: `try:
    process_payment(order_id)
except PaymentGatewayError as exc:
    logger.exception("Payment processing failed for order %s", order_id)
    raise`,
  },
  {
    id: 'risky_operation_without_logging',
    name: 'Risky I/O Operation Lacking Observability',
    risk: 'medium',
    summary: 'Outbound HTTP requests, database transactions, or subprocess executions with zero contextual logs.',
    explanation:
      'Functions performing risky operations (such as requests.get, httpx.post, subprocess.run, db.execute) without entry/exit or audit logging make production latency spikes and failure cascades nearly impossible to diagnose.',
    badExample: `def sync_remote_inventory(warehouse_id):
    # Risky HTTP request without any logging
    res = requests.post(f"https://api.inventory.internal/sync/{warehouse_id}")
    return res.json()`,
    goodExample: `logger = logging.getLogger(__name__)

def sync_remote_inventory(warehouse_id):
    logger.info("Initiating inventory sync for warehouse %s", warehouse_id)
    res = requests.post(f"https://api.inventory.internal/sync/{warehouse_id}")
    logger.debug("Inventory sync completed with status %s", res.status_code)
    return res.json()`,
  },
  {
    id: 'parse_error',
    name: 'Python AST Syntax / Parsing Anomaly',
    risk: 'low',
    summary: 'Source files that failed Python AST compilation and were skipped by static heuristics.',
    explanation:
      'When Python syntax errors occur (or incompatible language feature versions), the static analyzer cannot construct the AST and skips the file. Resolving syntax errors allows the file to be audited.',
    badExample: `def broken_syntax(
    # Unclosed parentheses`,
    goodExample: `def valid_syntax():
    pass`,
  },
];

export const FindingsExplorerPage: React.FC = () => {
  const [selectedRule, setSelectedRule] = useState<RuleDoc>(RULES[0]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <BookOpen className="w-4 h-4" />
          <span>Observability Knowledgebase</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Findings & Heuristic Rules
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
          The auditor uses Python AST analysis and source heuristics for JavaScript/TypeScript, Java, Go, C#, PHP, Ruby, and Rust to flag risky operations without logging.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rules Sidebar */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
            Auditor Heuristic Rules ({RULES.length})
          </h2>
          <div className="space-y-2">
            {RULES.map((rule) => {
              const isSelected = selectedRule.id === rule.id;
              return (
                <div
                  key={rule.id}
                  onClick={() => setSelectedRule(rule)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-indigo-950/30 border-indigo-500/50 shadow-md'
                      : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <SeverityBadge risk={rule.risk} size="sm" />
                    <span className="text-[10px] font-mono text-slate-400">
                      {rule.id.split('_')[0]}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-white mb-1">{rule.name}</h3>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {rule.summary}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rule Detail View */}
        <div className="lg:col-span-2 p-6 md:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-6 shadow-xl">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <SeverityBadge risk={selectedRule.risk} />
              <code className="text-xs font-mono text-indigo-400 bg-slate-950 px-2.5 py-0.5 rounded border border-slate-800">
                {selectedRule.id}
              </code>
            </div>
            <h2 className="text-xl font-bold text-white">{selectedRule.name}</h2>
            <p className="text-xs text-slate-300 leading-relaxed">{selectedRule.explanation}</p>
          </div>

          {/* Bad vs Good comparison */}
          <div className="space-y-4 pt-2">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-rose-400 mb-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>Problematic Code Pattern (Triggers Finding)</span>
              </div>
              <CodeViewer code={selectedRule.badExample} language="python" />
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Recommended Observability Pattern</span>
              </div>
              <CodeViewer code={selectedRule.goodExample} language="python" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
