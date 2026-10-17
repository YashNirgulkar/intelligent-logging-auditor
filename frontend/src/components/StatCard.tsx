import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  variant?: 'default' | 'danger' | 'warning' | 'info' | 'emerald';
  className?: string;
}

const variantConfig = {
  default: {
    iconBg: 'rgba(39, 39, 38, 0.12)',
    iconBorder: 'rgba(39, 39, 38, 0.25)',
    iconColor: '#454543',
    hoverBorder: 'rgba(39, 39, 38, 0.3)',
    glowColor: 'rgba(39, 39, 38, 0.08)',
    trendColor: '#454543',
  },
  danger: {
    iconBg: 'rgba(197, 22, 50, 0.12)',
    iconBorder: 'rgba(197, 22, 50, 0.25)',
    iconColor: '#c51632',
    hoverBorder: 'rgba(197, 22, 50, 0.35)',
    glowColor: 'rgba(197, 22, 50, 0.06)',
    trendColor: '#c51632',
  },
  warning: {
    iconBg: 'rgba(165, 104, 11, 0.12)',
    iconBorder: 'rgba(165, 104, 11, 0.25)',
    iconColor: '#a5680b',
    hoverBorder: 'rgba(165, 104, 11, 0.35)',
    glowColor: 'rgba(165, 104, 11, 0.06)',
    trendColor: '#a5680b',
  },
  info: {
    iconBg: 'rgba(119, 119, 115, 0.12)',
    iconBorder: 'rgba(119, 119, 115, 0.25)',
    iconColor: '#646460',
    hoverBorder: 'rgba(119, 119, 115, 0.35)',
    glowColor: 'rgba(119, 119, 115, 0.06)',
    trendColor: '#646460',
  },
  emerald: {
    iconBg: 'rgba(23, 132, 95, 0.12)',
    iconBorder: 'rgba(23, 132, 95, 0.25)',
    iconColor: '#17845f',
    hoverBorder: 'rgba(23, 132, 95, 0.35)',
    glowColor: 'rgba(23, 132, 95, 0.06)',
    trendColor: '#17845f',
  },
};

export const StatCard: React.FC<Props> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  className,
}) => {
  const cfg = variantConfig[variant];

  return (
    <div
      className={cn(
        'group relative rounded-2xl p-5 transition-all duration-300 cursor-default',
        className
      )}
      style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%)',
        border: '1px solid #e2e2df',
        boxShadow: `0 2px 8px rgba(24,24,22,0.035), 0 12px 28px rgba(24,24,22,0.025)`,
        transition: 'all 0.25s ease',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = cfg.hoverBorder;
        el.style.boxShadow = `0 8px 22px rgba(24,24,22,0.075), 0 0 0 1px ${cfg.hoverBorder}`;
        el.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = '#e2e2df';
        el.style.boxShadow = `0 2px 8px rgba(24,24,22,0.035), 0 12px 28px rgba(24,24,22,0.025)`;
        el.style.transform = 'translateY(0)';
      }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p
            className="text-[11px] font-semibold tracking-widest uppercase"
            style={{ color: '#62625f' }}
          >
            {title}
          </p>
          <div
            className="text-3xl font-bold tracking-tight"
            style={{ color: '#20201f', fontFamily: "'Outfit', sans-serif" }}
          >
            {value}
          </div>
          {subtitle && (
            <p className="text-xs" style={{ color: '#62625f' }}>
              {subtitle}
            </p>
          )}
          {trend && (
            <span
              className="inline-block text-[11px] font-semibold pt-0.5"
              style={{ color: cfg.trendColor }}
            >
              {trend}
            </span>
          )}
        </div>
        <div
          className="p-2.5 rounded-xl border flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
          style={{
            background: cfg.iconBg,
            borderColor: cfg.iconBorder,
            color: cfg.iconColor,
          }}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
