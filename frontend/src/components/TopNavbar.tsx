import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Menu,
  ChevronRight,
  RefreshCw,
  Terminal,
  Bell,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Props {
  onToggleSidebar: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const TopNavbar: React.FC<Props> = ({
  onToggleSidebar,
  onRefresh,
  isRefreshing = false,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const pathParts = location.pathname.split('/').filter(Boolean);

  let pageTitle = 'Dashboard';
  if (pathParts[0] === 'audits') {
    if (pathParts[1] === 'new') {
      pageTitle = 'New Audit';
    } else if (pathParts[1]) {
      pageTitle = `Audit ${pathParts[1].substring(0, 8)}…`;
    } else {
      pageTitle = 'Audits';
    }
  } else if (pathParts[0] === 'history') {
    pageTitle = 'Audit History';
  } else if (pathParts[0] === 'findings') {
    pageTitle = 'Findings Explorer';
  } else if (pathParts[0] === 'repositories') {
    pageTitle = 'GitHub Repositories';
  } else if (pathParts[0] === 'settings') {
    pageTitle = 'Settings & Engine Config';
  } else if (pathParts[0] === 'docs' || pathParts[0] === 'documentation') {
    pageTitle = 'API Documentation';
  } else if (pathParts[0] === 'admin') {
    pageTitle = 'User Access';
  }

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6"
      style={{
        background: 'rgba(255, 255, 255, 0.94)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid #e7e7e5',
        boxShadow: '0 1px 0 rgba(24, 24, 22, 0.025)',
      }}
    >
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl transition-all cursor-pointer lg:hidden"
          style={{
            color: '#4f4f4c',
            background: 'rgba(255, 255, 255, 0.8)',
            border: '1px solid #e2e2df',
          }}
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          {/* Breadcrumb nav */}
          <nav className="flex items-center gap-1.5 text-[11px]" style={{ color: '#70706d' }}>
            <Link to="/" className="hover:text-purple-400 transition-colors" style={{ color: '#70706d' }}>
              App
            </Link>
            {pathParts.map((part, index) => {
              const url = `/${pathParts.slice(0, index + 1).join('/')}`;
              const isLast = index === pathParts.length - 1;
              const display = part.length > 12 ? `${part.slice(0, 10)}…` : part;

              return (
                <React.Fragment key={url}>
                  <ChevronRight className="w-3 h-3" style={{ color: '#e2e2df' }} />
                  {isLast ? (
                    <span className="capitalize" style={{ color: '#4f4f4c' }}>{display}</span>
                  ) : (
                    <Link
                      to={url}
                      className="capitalize hover:text-purple-400 transition-colors"
                      style={{ color: '#62625f' }}
                    >
                      {display}
                    </Link>
                  )}
                </React.Fragment>
              );
            })}
          </nav>
          <h2
            className="text-base font-bold tracking-tight leading-tight"
            style={{ color: '#20201f', fontFamily: "'Outfit', sans-serif" }}
          >
            {pageTitle}
          </h2>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 md:gap-3">
        <span className="hidden md:inline max-w-52 truncate text-xs" style={{ color: '#62625f' }}>{user?.email}</span>
        <button
          onClick={async () => { try { await logout(); } finally { navigate('/login', { replace: true }); } }}
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium"
          style={{ color: '#4f4f4c', background: '#fff', border: '1px solid #e2e2df' }}
          title="Sign out"
        ><LogOut className="w-3.5 h-3.5" /><span className="hidden sm:inline">Sign out</span></button>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer disabled:opacity-50"
            style={{
              color: '#4f4f4c',
              background: 'rgba(255, 255, 255, 0.8)',
              border: '1px solid #e2e2df',
            }}
            title="Refresh current page data"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
              style={{ color: isRefreshing ? '#292928' : undefined }}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        )}

        {/* Notification bell */}
        <button
          className="p-2 rounded-xl transition-colors cursor-pointer relative"
          style={{
            color: '#4f4f4c',
            background: 'rgba(255, 255, 255, 0.8)',
            border: '1px solid #e2e2df',
          }}
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
        </button>

        {/* Product / Avatar icon */}
        <div
          className="flex items-center gap-2 pl-3"
          style={{ borderLeft: '1px solid #e2e2df' }}
        >
          <div
            className="flex items-center justify-center w-8 h-8 rounded-xl text-xs font-mono font-bold"
            style={{
              background: 'linear-gradient(135deg, rgba(39, 39, 38, 0.3) 0%, rgba(119, 119, 115, 0.2) 100%)',
              border: '1px solid rgba(39, 39, 38, 0.4)',
              color: '#454543',
            }}
          >
            <Terminal className="w-4 h-4" />
          </div>
        </div>
      </div>
    </header>
  );
};
