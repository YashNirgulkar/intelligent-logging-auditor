import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, ShieldAlert, Cpu, Sparkles, FileSearch } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  isOpen: boolean;
  sourceType: 'zip' | 'github';
  targetName?: string;
}

interface Step {
  id: number;
  title: string;
  desc: string;
  icon: React.ElementType;
}

const STEPS: Step[] = [
  { id: 1, title: 'Preparing repository', desc: 'Unpacking archive into isolated sandbox workspace and selecting supported source files', icon: FileSearch },
  { id: 2, title: 'Analyzing source files', desc: 'Using Python AST analysis and language-specific source heuristics', icon: Cpu },
  { id: 3, title: 'Detecting logging gaps', desc: 'Applying heuristic rules for risky operations and silent exception swallowing', icon: ShieldAlert },
  { id: 4, title: 'Preparing findings & suggestions', desc: 'Synthesizing contextual rationales and safe logging recommendations', icon: Sparkles },
];

export const ScanProgressModal: React.FC<Props> = ({ isOpen, sourceType, targetName }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) { setCurrentStepIndex(0); return; }
    const t1 = setTimeout(() => setCurrentStepIndex(1), 1800);
    const t2 = setTimeout(() => setCurrentStepIndex(2), 4200);
    const t3 = setTimeout(() => setCurrentStepIndex(3), 7500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(20, 20, 19, 0.9)', backdropFilter: 'blur(16px)' }}
    >
      <div
        className="w-full max-w-lg rounded-2xl p-6 md:p-8 space-y-6"
        style={{
          background: 'linear-gradient(180deg, #ffffff 0%, #ffffff 100%)',
          border: '1px solid #e2e2df',
          boxShadow: '0 20px 50px rgba(0,0,0,0.16), 0 0 0 1px rgba(39, 39, 38, 0.08)',
          color: '#20201f',
        }}
      >
        {/* Header */}
        <div className="text-center space-y-3">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-1"
            style={{
              background: 'linear-gradient(135deg, rgba(39, 39, 38, 0.2) 0%, rgba(119, 119, 115, 0.15) 100%)',
              border: '1px solid rgba(39, 39, 38, 0.3)',
            }}
          >
            <Loader2 className="w-7 h-7 animate-spin" style={{ color: '#292928' }} />
          </div>
          <h3
            className="text-xl font-bold tracking-tight"
            style={{ fontFamily: "'Outfit', sans-serif", color: '#20201f' }}
          >
            Auditing {sourceType === 'zip' ? 'Repository Archive' : 'GitHub Repository'}
          </h3>
          {targetName && (
            <p className="text-xs font-mono truncate max-w-sm mx-auto" style={{ color: '#62625f' }}>
              {targetName}
            </p>
          )}
        </div>

        {/* Step List */}
        <div className="space-y-3">
          {STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            const Icon = step.icon;

            return (
              <div
                key={step.id}
                className="flex items-start gap-3.5 p-3.5 rounded-xl border transition-all duration-300"
                style={
                  isCurrent
                    ? { background: 'rgba(39, 39, 38, 0.08)', border: '1px solid rgba(39, 39, 38, 0.3)', boxShadow: '0 0 20px rgba(39, 39, 38, 0.06)' }
                    : isCompleted
                    ? { background: 'rgba(250, 250, 249, 0.5)', border: '1px solid #e7e7e5', opacity: 0.85 }
                    : { background: 'rgba(250, 250, 249, 0.3)', border: '1px solid #e7e7e5', opacity: 0.55 }
                }
              >
                <div className="mt-0.5 flex-shrink-0">
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5" style={{ color: '#17845f' }} />
                  ) : isCurrent ? (
                    <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#292928' }} />
                  ) : (
                    <Icon className="w-5 h-5" style={{ color: '#70706d' }} />
                  )}
                </div>
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <p
                      className="text-xs font-semibold"
                      style={{ color: isCurrent ? '#252524' : isCompleted ? '#333331' : '#62625f' }}
                    >
                      {step.title}
                    </p>
                    {isCurrent && (
                      <span className="text-[10px] font-mono animate-pulse" style={{ color: '#292928' }}>
                        In progress…
                      </span>
                    )}
                    {isCompleted && (
                      <span className="text-[10px] font-mono" style={{ color: '#17845f' }}>
                        Done ✓
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] leading-relaxed" style={{ color: '#62625f' }}>{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div
          className="pt-2 text-center"
          style={{ borderTop: '1px solid #e7e7e5' }}
        >
          <p className="text-[10px] italic" style={{ color: '#70706d' }}>
            * These are simulated UI phase checkpoints reflecting the static analysis pipeline, awaiting synchronous FastAPI completion.
          </p>
        </div>
      </div>
    </div>
  );
};
