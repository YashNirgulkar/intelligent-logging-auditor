import React from 'react';
import { cn } from '../lib/utils';

interface Props {
  className?: string;
  count?: number;
}

export const LoadingSkeleton: React.FC<Props> = ({ className, count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'animate-pulse rounded-xl bg-slate-800/60 border border-slate-700/20',
            className
          )}
        />
      ))}
    </>
  );
};
