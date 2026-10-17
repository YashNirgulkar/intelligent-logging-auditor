import React from 'react';
import { AlertTriangle, AlertCircle, Info, ShieldAlert } from 'lucide-react';
import { cn } from '../lib/utils';
import { RiskLevel } from '../types/api';

interface Props {
  risk: RiskLevel | string;
  size?: 'sm' | 'md';
  showIcon?: boolean;
  className?: string;
}

export const SeverityBadge: React.FC<Props> = ({
  risk,
  size = 'md',
  showIcon = true,
  className,
}) => {
  const normalized = (risk || '').toLowerCase();

  let bg = 'rgba(119, 119, 115, 0.12)';
  let border = 'rgba(119, 119, 115, 0.3)';
  let color = '#646460';
  let icon = <Info className="w-3 h-3 shrink-0" style={{ color: '#646460' }} />;
  let label = 'Low Priority';

  if (normalized === 'high') {
    bg = 'rgba(197, 22, 50, 0.12)';
    border = 'rgba(197, 22, 50, 0.35)';
    color = '#c51632';
    icon = <ShieldAlert className="w-3 h-3 shrink-0" style={{ color: '#c51632' }} />;
    label = 'High Priority';
  } else if (normalized === 'medium') {
    bg = 'rgba(165, 104, 11, 0.12)';
    border = 'rgba(165, 104, 11, 0.35)';
    color = '#a5680b';
    icon = <AlertTriangle className="w-3 h-3 shrink-0" style={{ color: '#a5680b' }} />;
    label = 'Medium Priority';
  } else if (normalized === 'low') {
    // keep defaults (cyan)
    label = 'Low Priority';
  } else {
    bg = 'rgba(39, 39, 38, 0.12)';
    border = 'rgba(39, 39, 38, 0.3)';
    color = '#454543';
    label = risk || 'Informational';
    icon = <AlertCircle className="w-3 h-3 shrink-0" style={{ color: '#454543' }} />;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-semibold rounded-md tracking-tight uppercase',
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs',
        className
      )}
      style={{ background: bg, border: `1px solid ${border}`, color }}
    >
      {showIcon && icon}
      <span>{label}</span>
    </span>
  );
};
