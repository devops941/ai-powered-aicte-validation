import React from 'react';
import { useApp, PageView } from '../../context/AppContext';
import {
  LayoutDashboard,
  FilePlus2,
  FolderGit2,
  ClipboardList,
  Sliders,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    user,
    logout,
    currentView,
    setCurrentView,
    isSidebarCollapsed,
    toggleSidebar,
    theme,
    toggleTheme,
    applications,
  } = useApp();

  const pendingAttentionCount = applications.filter(a => a.status !== 'Reviewed by Official').length;

  const navItems: { id: PageView; label: string; icon: React.ReactNode; adminOnly?: boolean; badge?: number }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'new-application',
      label: 'New Application',
      icon: <FilePlus2 className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'applications',
      label: 'Applications',
      icon: <FolderGit2 className="w-4 h-4 shrink-0" />,
      badge: pendingAttentionCount,
    },
    {
      id: 'audit-log',
      label: 'Audit Log',
      icon: <ClipboardList className="w-4 h-4 shrink-0" />,
      adminOnly: true,
    },
    {
      id: 'rules',
      label: 'Rules',
      icon: <Sliders className="w-4 h-4 shrink-0" />,
      adminOnly: true,
    },
  ];

  const visibleNavItems = navItems.filter((item) => {
    if (item.adminOnly && user?.role !== 'Admin') {
      return false;
    }
    return true;
  });

  return (
    <aside
      className={`relative z-30 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-[#1e3a8a] dark:bg-slate-900 text-white transition-colors duration-200 select-none ${
        isSidebarCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Sidebar Header / Brand */}
      <div
        className={`flex items-center border-b border-blue-900/60 dark:border-slate-800 transition-all ${
          isSidebarCollapsed ? 'flex-col gap-2 px-2 py-3' : 'justify-between px-4 py-5'
        }`}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-lg bg-white/10 dark:bg-slate-800 backdrop-blur-xs border border-white/20 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-inner">
            <div className="text-center font-bold leading-none">
              <span className="text-[11px] block leading-tight text-amber-400 tracking-wider">AICTE</span>
              <span className="text-[9px] block leading-tight tracking-wider text-slate-200 dark:text-slate-300">DOC</span>
            </div>
          </div>
          {!isSidebarCollapsed && (
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-white leading-tight">AICTE Verify</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-amber-500 text-slate-950 font-bold rounded">
                  APH
                </span>
              </div>
              <p className="text-[10px] text-blue-200 dark:text-slate-400 truncate">AI Document Verification</p>
            </div>
          )}
        </div>

        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-md bg-white/10 hover:bg-white/20 dark:bg-slate-800 dark:hover:bg-slate-700 text-blue-200 hover:text-white dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer shrink-0"
          title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>


      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <div className={`px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-blue-300 dark:text-slate-400 ${isSidebarCollapsed ? 'hidden' : 'block'}`}>
          Navigation
        </div>
        {visibleNavItems.map((item) => {
          const isActive =
            currentView === item.id ||
            (item.id === 'applications' && currentView === 'application-detail');

          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`relative w-full flex items-center gap-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-white text-[#1e3a8a] dark:bg-blue-600 dark:text-white shadow-sm dark:shadow-md dark:shadow-blue-950/50 font-semibold'
                  : 'text-blue-100 dark:text-slate-300 hover:bg-white/10 dark:hover:bg-slate-800 hover:text-white'
              } ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-between px-3'}`}
              title={isSidebarCollapsed ? item.label : undefined}
            >
              <div className={`flex items-center gap-3 min-w-0 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
                {item.icon}
                {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
              </div>

              {!isSidebarCollapsed && item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums ${
                    isActive
                      ? 'bg-rose-100 text-rose-700 dark:bg-white dark:text-rose-700'
                      : 'bg-rose-500 text-white'
                  }`}
                >
                  {item.badge}
                </span>
              )}

              {isSidebarCollapsed && item.badge !== undefined && item.badge > 0 && (
                <span className="absolute top-2 right-4 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#1e3a8a] dark:ring-slate-900" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Bottom Profile & Controls */}
      <div className="p-3 border-t border-blue-900/60 dark:border-slate-800 space-y-2">
        {/* Dark Mode & Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-blue-200 dark:text-slate-300 hover:text-white hover:bg-white/10 dark:hover:bg-slate-800 transition-colors ${
            isSidebarCollapsed ? 'justify-center' : ''
          }`}
          title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 shrink-0" />
          ) : (
            <Moon className="w-4 h-4 text-blue-300 shrink-0" />
          )}
          {!isSidebarCollapsed && (
            <span>{theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>
          )}
        </button>

        {/* User Card */}
        {user && (
          <div className="pt-2 border-t border-blue-900/40 dark:border-slate-800">
            <div
              className={`flex items-center gap-2.5 p-2 rounded-lg bg-black/20 dark:bg-slate-800/70 border border-transparent dark:border-slate-700/50 ${
                isSidebarCollapsed ? 'justify-center' : ''
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-blue-700 border border-blue-400 flex items-center justify-center font-bold text-xs text-white shrink-0">
                {user.name
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')}
              </div>

              {!isSidebarCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-white truncate">{user.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                        user.role === 'Admin'
                          ? 'bg-purple-900/70 text-purple-200 border border-purple-500/40'
                          : 'bg-blue-900/80 text-blue-200 border border-blue-400/40'
                      }`}
                    >
                      {user.role}
                    </span>
                    <span className="text-[10px] text-blue-300 dark:text-slate-400 truncate">
                      {user.role === 'Admin' ? 'Directorate' : 'Scrutiny'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Logout button */}
            <button
              onClick={logout}
              className={`w-full mt-2 flex items-center gap-2 px-3 py-1.5 rounded text-xs text-blue-200 dark:text-slate-400 hover:text-rose-200 dark:hover:text-rose-300 hover:bg-rose-950/40 transition-colors ${
                isSidebarCollapsed ? 'justify-center' : ''
              }`}
              title="Sign out of AICTE DocVerify"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span>Sign Out</span>}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
