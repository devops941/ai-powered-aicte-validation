/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { Footer } from './components/layout/Footer';
import { ToastContainer } from './components/common/ToastContainer';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { NewApplicationPage } from './pages/NewApplicationPage';
import { ApplicationsListPage } from './pages/ApplicationsListPage';
import { ApplicationDetailPage } from './pages/ApplicationDetailPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { RulesPage } from './pages/RulesPage';

const ADMIN_ONLY_VIEWS = ['audit-log', 'rules'];

const AppContent: React.FC = () => {
  const { user, currentView, setCurrentView, isLoading } = useApp();

  if (!user) {
    return (
      <>
        <LoginPage />
        <ToastContainer />
      </>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 gap-4">
        <div className="w-10 h-10 rounded-xl bg-[#1e3a8a] flex items-center justify-center">
          <span className="text-xs font-bold text-amber-400 tracking-wider">AICTE</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-block w-4 h-4 border-2 border-[#1e3a8a] border-t-transparent rounded-full animate-spin" />
          Loading applications...
        </div>
      </div>
    );
  }

  // Redirect non-admins away from admin-only views
  const isAdminOnly = ADMIN_ONLY_VIEWS.includes(currentView);
  if (isAdminOnly && user.role !== 'Admin') {
    setCurrentView('dashboard');
    return null;
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Collapsible Left Navigation Sidebar */}
      <Sidebar />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Top Header */}
        <TopBar />

        {/* Dynamic Page Viewport */}
        <main className="flex-1 overflow-y-auto pb-8">
          {currentView === 'dashboard' && <DashboardPage />}
          {currentView === 'new-application' && <NewApplicationPage />}
          {currentView === 'applications' && <ApplicationsListPage />}
          {currentView === 'application-detail' && <ApplicationDetailPage />}
          {currentView === 'audit-log' && user.role === 'Admin' && <AuditLogPage />}
          {currentView === 'rules' && user.role === 'Admin' && <RulesPage />}
        </main>

        {/* Mandatory Footer with Statutory Decision Support Clause */}
        <Footer />
      </div>

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}
