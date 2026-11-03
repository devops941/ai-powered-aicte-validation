import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Search,
  Bell,
  Sun,
  Moon,
  Shield,
  ExternalLink,
  Flag,
  CheckCircle,
  X,
  ChevronDown,
} from 'lucide-react';
import { RiskBadge } from '../common/RiskBadge';

export const TopBar: React.FC = () => {
  const {
    currentView,
    user,
    theme,
    toggleTheme,
    applications,
    viewApplicationDetail,
    searchQuery,
    setSearchQuery,
    login,
  } = useApp();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPageTitle = () => {
    switch (currentView) {
      case 'dashboard':
        return 'Executive Scrutiny Dashboard';
      case 'new-application':
        return 'Initiate Pre-Validation Dossier';
      case 'applications':
        return 'Institutions EoA Registry';
      case 'application-detail':
        return 'Dossier Validation & Decision-Support Report';
      case 'audit-log':
        return 'Official System Audit & Compliance Trail';
      case 'rules':
        return 'AICTE Regulatory Rules & Heuristic Engine';
      default:
        return 'AICTE DocVerify';
    }
  };

  const flaggedApps = applications.filter((a) => a.status === 'Flagged' || a.status === 'Manual Review Required');

  const searchResults = searchQuery.trim()
    ? applications
        .filter(
          (app) =>
            app.institutionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.aicteId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.category.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 5)
    : [];

  return (
    <header className="sticky top-0 z-20 h-16 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs px-6 flex items-center justify-between gap-4">
      {/* Title Zone */}
      <div className="flex items-center gap-3 min-w-0">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
            {getPageTitle()}
          </h2>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span>Approval Process Handbook (APH) 2026-27</span>
            <span>·</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-medium">Pre-Validation Active</span>
          </div>
        </div>
      </div>

      {/* Middle Search Zone */}
      <div className="flex-1 max-w-md relative" ref={searchRef}>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search institution, AICTE ID, state, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-[#1e3a8a] dark:focus:border-blue-500 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-950 focus:outline-hidden transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Live Search Results Popup */}
        {isSearchFocused && searchResults.length > 0 && (
          <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl overflow-hidden z-50">
            <div className="px-3 py-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              Applications ({searchResults.length})
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {searchResults.map((app) => (
                <button
                  key={app.id}
                  onClick={() => {
                    viewApplicationDetail(app.id);
                    setIsSearchFocused(false);
                    setSearchQuery('');
                  }}
                  className="w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white truncate">
                      {app.institutionName}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      ID: {app.aicteId} · {app.state}
                    </p>
                  </div>
                  <RiskBadge level={app.riskLevel} score={app.riskScore} size="sm" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Action Icons Zone */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Dark Mode Quick Switch */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Toggle light/dark theme"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotificationsOpen((prev) => !prev)}
            className="relative p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Recent scrutiny alerts"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {flaggedApps.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flag className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Attention Alerts ({flaggedApps.length})
                  </span>
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {flaggedApps.slice(0, 4).map((app) => (
                  <div
                    key={app.id}
                    onClick={() => {
                      viewApplicationDetail(app.id);
                      setIsNotificationsOpen(false);
                    }}
                    className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer transition-colors text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-900 dark:text-white truncate">
                        {app.institutionName}
                      </span>
                      <RiskBadge level={app.riskLevel} size="sm" showIcon={false} />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      {app.flagsCount} flags require official examination
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Zone with Role Switcher */}
        {user && (
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-[#1e3a8a] text-white flex items-center justify-center font-bold text-xs shrink-0">
                {user.name[0]}
              </div>
              <div className="text-left hidden sm:block">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block leading-tight">
                  {user.name}
                </span>
                <span className="text-[10px] text-slate-500 font-mono block leading-tight">
                  {user.role}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden z-50 p-2">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">{user.name}</p>
                  <p className="text-[11px] text-slate-500">{user.email}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{user.department}</p>
                </div>

              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
