import React, { lazy, Suspense, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from './context/ThemeContext';
import { BackendStatusProvider } from './context/BackendStatusContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppSidebar } from './components/AppSidebar';
import { TopNavbar } from './components/TopNavbar';
import { LoginPage } from './pages/LoginPage';

const DashboardPage = lazy(() => import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })));
const NewAuditPage = lazy(() => import('./pages/NewAuditPage').then((module) => ({ default: module.NewAuditPage })));
const AuditResultsPage = lazy(() => import('./pages/AuditResultsPage').then((module) => ({ default: module.AuditResultsPage })));
const AuditHistoryPage = lazy(() => import('./pages/AuditHistoryPage').then((module) => ({ default: module.AuditHistoryPage })));
const FindingsExplorerPage = lazy(() => import('./pages/FindingsExplorerPage').then((module) => ({ default: module.FindingsExplorerPage })));
const GitHubRepositoriesPage = lazy(() => import('./pages/GitHubRepositoriesPage').then((module) => ({ default: module.GitHubRepositoriesPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((module) => ({ default: module.SettingsPage })));
const DocumentationPage = lazy(() => import('./pages/DocumentationPage').then((module) => ({ default: module.DocumentationPage })));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage').then((module) => ({ default: module.AdminUsersPage })));

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ background: 'var(--bg)', color: 'var(--text-primary)' }}>
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col lg:pl-64 transition-all duration-200">
        <TopNavbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <Suspense fallback={<div className="p-8 text-sm text-[#62625f]" role="status">Loading page…</div>}>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
};

const AppRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen grid place-items-center text-sm text-stone-600" role="status">Checking your session…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;
  return <AppLayout>{children}</AppLayout>;
};

const ApplicationRoutes: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen grid place-items-center text-sm text-stone-600" role="status">Checking your session…</div>;
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <LoginPage registerMode />} />
      <Route path="/" element={<AppRoute><DashboardPage /></AppRoute>} />
      <Route path="/audits/new" element={<AppRoute><NewAuditPage /></AppRoute>} />
      <Route path="/audits/:auditId" element={<AppRoute><AuditResultsPage /></AppRoute>} />
      <Route path="/history" element={<AppRoute><AuditHistoryPage /></AppRoute>} />
      <Route path="/findings" element={<AppRoute><FindingsExplorerPage /></AppRoute>} />
      <Route path="/repositories" element={<AppRoute><GitHubRepositoriesPage /></AppRoute>} />
      <Route path="/settings" element={<AppRoute><SettingsPage /></AppRoute>} />
      <Route path="/admin/users" element={<AppRoute adminOnly><AdminUsersPage /></AppRoute>} />
      <Route path="/docs" element={<AppRoute><DocumentationPage /></AppRoute>} />
      <Route path="/documentation" element={<Navigate to="/docs" replace />} />
      <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
    </Routes>
  );
};

export function App() {
  return (
    <ThemeProvider>
      <BackendStatusProvider>
        <AuthProvider>
          <BrowserRouter>
            <ApplicationRoutes />
            <Toaster theme="light" richColors position="top-right" closeButton toastOptions={{ style: { background: '#fff', border: '1px solid #e2e2df', color: '#20201f' } }} />
          </BrowserRouter>
        </AuthProvider>
      </BackendStatusProvider>
    </ThemeProvider>
  );
}

export default App;

