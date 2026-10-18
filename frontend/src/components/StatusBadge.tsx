import React from 'react';
import { CheckCircle2, Clock } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  status: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<Props> = ({ status, size = 'md', className }) => {
  const isApplied = status === 'approved_marker_applied';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-semibold rounded-md tracking-tight',
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs',
        className
      )}
      style={
        isApplied
          ? {
              background: 'rgba(23, 132, 95, 0.12)',
              border: '1px solid rgba(23, 132, 95, 0.3)',
              color: '#17845f',
            }
          : {
              background: 'rgba(39, 39, 38, 0.10)',
              border: '1px solid rgba(39, 39, 38, 0.25)',
              color: '#454543',
            }
      }
    >
      {isApplied ? (
        <>
          <CheckCircle2 className="w-3 h-3 shrink-0" />
          <span>Applied</span>
        </>
      ) : (
        <>
          <Clock className="w-3 h-3 shrink-0" />
          <span>Suggested</span>
        </>
      )}
    </span>
  );
};
