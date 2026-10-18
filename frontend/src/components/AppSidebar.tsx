import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  History,
  FileCode2,
  Settings,
  ShieldCheck,
  BookOpen,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { GithubIcon } from './GithubIcon';
import { cn } from '../lib/utils';
import { BackendStatusIndicator } from './BackendStatusIndicator';
import { API_ORIGIN } from '../api/client';

interface Props {
  isOpen?: boolean;
  onClose?: () => void;
}

export const AppSidebar: React.FC<Props> = ({ isOpen = false, onClose }) => {
  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'New Audit', path: '/audits/new', icon: PlusCircle },
    { label: 'Audit History', path: '/history', icon: History },
    { label: 'Findings', path: '/findings', icon: FileCode2 },
    { label: 'GitHub Repositories', path: '/repositories', icon: GithubIcon },
    { label: 'Documentation', path: '/docs', icon: BookOpen },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(20, 20, 19, 0.75)', backdropFilter: 'blur(6px)' }}
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 transition-transform duration-300 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{
          background: '#ffffff',
          borderRight: '1px solid #e7e7e5',
        }}
      >
        {/* Brand Header */}
        <div
          className="flex items-center gap-3 px-5 py-4"
          style={{ borderBottom: '1px solid #e7e7e5' }}
        >
          <div
            className="app-brand-mark flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0"
            style={{
              background: '#292928',
              boxShadow: '0 3px 8px rgba(39, 39, 38, 0.16)',
            }}
          >
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1
              className="text-sm font-bold tracking-tight leading-tight"
              style={{ fontFamily: "'Outfit', sans-serif", color: '#20201f' }}
            >
              Logging Auditor
            </h1>
            <p className="text-[11px] flex items-center gap-1" style={{ color: '#555552' }}>
              <Zap className="w-2.5 h-2.5" />
              AI-Powered Platform
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          <div
            className="px-3 pb-3 text-[10px] font-bold uppercase tracking-widest"
            style={{ color: '#70706d' }}
          >
            Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                end={item.path === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all group border',
                    isActive ? 'nav-active' : 'border-transparent'
                  )
                }
                style={({ isActive }) =>
                  isActive
                    ? {}
                    : {
                        color: '#4f4f4c',
                      }
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className="w-4 h-4 transition-colors flex-shrink-0"
                      style={{ color: isActive ? '#454543' : '#70706d' }}
                    />
                    <span
                      className="flex-1"
                      style={{ color: isActive ? '#252524' : '#4f4f4c' }}
                    >
                      {item.label}
                    </span>
                    {isActive && (
                      <div
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: '#292928', boxShadow: '0 0 6px #292928' }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}

          {/* Resources section */}
          <div
            className="pt-5 px-3 pb-3 text-[10px] font-bold uppercase tracking-widest"
            style={{ color: '#70706d' }}
          >
            Resources
          </div>
          <a
            href={`${API_ORIGIN}/docs`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group border border-transparent"
            style={{ color: '#4f4f4c' }}
          >
            <span className="flex items-center gap-3">
              <BookOpen className="w-4 h-4" style={{ color: '#70706d' }} />
              <span>FastAPI Swagger UI</span>
            </span>
            <ChevronRight
              className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform"
              style={{ color: '#70706d' }}
            />
          </a>
        </nav>

        {/* Bottom Section */}
        <div
          className="p-4 space-y-3"
          style={{
            borderTop: '1px solid #e7e7e5',
            background: 'rgba(250, 250, 249, 0.6)',
          }}
        >
          <BackendStatusIndicator />

          <div
            className="flex items-center justify-between text-[11px] px-1 pt-1"
            style={{ color: '#70706d' }}
          >
            <span className="font-mono">ILA Engine</span>
            <span
              className="px-2 py-0.5 rounded font-mono text-[10px]"
              style={{
                background: '#ffffff',
                border: '1px solid #e2e2df',
                color: '#555552',
              }}
            >
              v0.1.0
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};

