import React from 'react';
import { LucideIcon, FolderSearch } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<Props> = ({
  icon: Icon = FolderSearch,
  title,
  description,
  actionText,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-2xl',
        className
      )}
      style={{
        background: 'rgba(255, 255, 255, 0.5)',
        border: '1px solid #e2e2df',
      }}
    >
      <div
        className="p-4 rounded-2xl mb-5"
        style={{
          background: 'rgba(39, 39, 38, 0.1)',
          border: '1px solid rgba(39, 39, 38, 0.2)',
        }}
      >
        <Icon className="w-8 h-8" style={{ color: '#292928' }} />
      </div>
      <h3 className="text-base font-semibold" style={{ color: '#20201f' }}>{title}</h3>
      <p className="text-xs max-w-sm mt-1 mb-5 leading-relaxed" style={{ color: '#62625f' }}>
        {description}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-white btn-accent transition-all cursor-pointer"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
