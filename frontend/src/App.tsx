import React, { lazy, Suspense, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from './context/ThemeContext';
import { BackendStatusProvider } from './context/BackendStatusContext';
import { AppSidebar } from './components/AppSidebar';
import { TopNavbar } from './components/TopNavbar';

const DashboardPage = lazy(() => import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })));
const NewAuditPage = lazy(() => import('./pages/NewAuditPage').then((module) => ({ default: module.NewAuditPage })));
const AuditResultsPage = lazy(() => import('./pages/AuditResultsPage').then((module) => ({ default: module.AuditResultsPage })));
const AuditHistoryPage = lazy(() => import('./pages/AuditHistoryPage').then((module) => ({ default: module.AuditHistoryPage })));
const FindingsExplorerPage = lazy(() => import('./pages/FindingsExplorerPage').then((module) => ({ default: module.FindingsExplorerPage })));
const GitHubRepositoriesPage = lazy(() => import('./pages/GitHubRepositoriesPage').then((module) => ({ default: module.GitHubRepositoriesPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((module) => ({ default: module.SettingsPage })));
const DocumentationPage = lazy(() => import('./pages/DocumentationPage').then((module) => ({ default: module.DocumentationPage })));

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

const ApplicationRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<AppLayout><DashboardPage /></AppLayout>} />
      <Route path="/audits/new" element={<AppLayout><NewAuditPage /></AppLayout>} />
      <Route path="/audits/:auditId" element={<AppLayout><AuditResultsPage /></AppLayout>} />
      <Route path="/history" element={<AppLayout><AuditHistoryPage /></AppLayout>} />
      <Route path="/findings" element={<AppLayout><FindingsExplorerPage /></AppLayout>} />
      <Route path="/repositories" element={<AppLayout><GitHubRepositoriesPage /></AppLayout>} />
      <Route path="/settings" element={<AppLayout><SettingsPage /></AppLayout>} />
      <Route path="/docs" element={<AppLayout><DocumentationPage /></AppLayout>} />
      <Route path="/documentation" element={<Navigate to="/docs" replace />} />
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/register" element={<Navigate to="/" replace />} />
      <Route path="/admin/*" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export function App() {
  return (
    <ThemeProvider>
      <BackendStatusProvider>
        <BrowserRouter>
          <ApplicationRoutes />
          <Toaster theme="light" richColors position="top-right" closeButton toastOptions={{ style: { background: '#fff', border: '1px solid #e2e2df', color: '#20201f' } }} />
        </BrowserRouter>
      </BackendStatusProvider>
    </ThemeProvider>
  );
}

export default App;
