
import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  InstitutionApplication,
  ValidationRule,
  AuditTrailItem,
  User,
  UserRole,
} from '../types';
import {
  INITIAL_RULES,
  CURRENT_OFFICIAL,
  CURRENT_ADMIN,
} from '../data/mockData';
import { fetchBackendApplications, purgeBackendDatabase, markApplicationReviewed } from '../api';

export type PageView =
  | 'dashboard'
  | 'new-application'
  | 'applications'
  | 'application-detail'
  | 'audit-log'
  | 'rules';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info' | 'error';
}

interface AppContextType {
  user: User | null;
  setUser: (u: User | null) => void;
  login: (userOrRole: User | UserRole) => void;
  logout: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  currentView: PageView;
  setCurrentView: (view: PageView) => void;
  selectedApplicationId: string;
  setSelectedApplicationId: (id: string) => void;
  viewApplicationDetail: (id: string) => void;
  applications: InstitutionApplication[];
  selectedApplication: InstitutionApplication | undefined;
  rules: ValidationRule[];
  auditLogs: AuditTrailItem[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  markApplicationAsReviewed: (appId: string, comments: string) => Promise<void>;
  addNewApplication: (app: InstitutionApplication) => void;
  updateRule: (ruleId: string, updates: Partial<ValidationRule>) => void;
  addRule: (rule: ValidationRule) => void;
  toasts: ToastMessage[];
  showToast: (title: string, message: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
  removeToast: (id: string) => void;
  isLoading: boolean;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  purgeAllData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = sessionStorage.getItem('docverify_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });
  const [currentView, setCurrentView] = useState<PageView>('dashboard');
  const [selectedApplicationId, setSelectedApplicationId] = useState<string>('');
  const [applications, setApplications] = useState<InstitutionApplication[]>([]);
  const [rules, setRules] = useState<ValidationRule[]>(INITIAL_RULES);
  const [auditLogs, setAuditLogs] = useState<AuditTrailItem[]>(() => {
    try {
      const saved = localStorage.getItem('docverify_audit_logs');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem('docverify_audit_logs', JSON.stringify(auditLogs));
    } catch {}
  }, [auditLogs]);

  // Load live applications from Python backend on startup
  useEffect(() => {
    async function loadFromBackend() {
      try {
        const liveApps = await fetchBackendApplications();
        if (liveApps && liveApps.length > 0) {
          setApplications(liveApps);
          setSelectedApplicationId((prev) => prev || liveApps[0].id);
        } else {
          setApplications([]);
          setSelectedApplicationId('');
        }
      } catch (err) {
        console.warn('Backend sync error:', err);
        setApplications([]);
        const id = `toast-sync-err`;
        setToasts((prev) => [
          ...prev,
          {
            id,
            title: 'Connection Warning',
            message: 'Could not reach the backend server. Data may be unavailable.',
            type: 'warning',
          },
        ]);
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
      } finally {
        setIsLoading(false);
      }
    }
    loadFromBackend();
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', next);
      return next;
    });
  };

  const login = (userOrRole: User | UserRole) => {
    let selectedUser: User;
    if (typeof userOrRole === 'string') {
      selectedUser = userOrRole === 'Admin' ? CURRENT_ADMIN : CURRENT_OFFICIAL;
    } else {
      selectedUser = userOrRole;
    }
    setUser(selectedUser);
    try {
      sessionStorage.setItem('docverify_user', JSON.stringify(selectedUser));
    } catch {
      // ignore
    }
    setCurrentView('dashboard');
    showToast(
      'Session Established',
      `Logged in as ${selectedUser.name} (${selectedUser.role} - ${selectedUser.designation})`,
      'info'
    );
  };

  const logout = () => {
    setUser(null);
    try {
      sessionStorage.removeItem('docverify_user');
    } catch {
      // ignore
    }
    showToast('Logged Out', 'You have been securely signed out of AICTE DocVerify.', 'info');
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  const showToast = (
    title: string,
    message: string,
    type: 'success' | 'warning' | 'info' | 'error' = 'info'
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, title, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const viewApplicationDetail = (id: string) => {
    setSelectedApplicationId(id);
    setCurrentView('application-detail');
  };

  const selectedApplication = applications.find((a) => a.id === selectedApplicationId) || applications[0];

  const markApplicationAsReviewed = async (appId: string, comments: string) => {
    const currentOfficerName = user?.name || 'Authorized AICTE Official';
    const timestamp = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short',
    }) + ' IST';

    // Persist to backend first
    await markApplicationReviewed(appId, currentOfficerName, comments);

    setApplications((prev) =>
      prev.map((app) => {
        if (app.id === appId) {
          return {
            ...app,
            status: 'Reviewed by Official',
            reviewedBy: currentOfficerName,
            reviewedAt: timestamp,
            officialComments: comments,
          };
        }
        return app;
      })
    );

    const newLogItem: AuditTrailItem = {
      id: `LOG-${(Date.now() % 10000).toString().padStart(4, '0')}`,
      timestamp,
      rawTimestamp: new Date().toISOString(),
      user: currentOfficerName,
      role: user?.role || 'Official',
      action: 'Status Updated: Reviewed by Official',
      details: comments ? `Official comments: "${comments}"` : 'Pre-validation verification completed and endorsed.',
      applicationId: appId,
      ipAddress: '10.14.8.44',
    };

    setAuditLogs((prev) => [newLogItem, ...prev]);

    showToast(
      'Status Updated',
      `Application ${appId} successfully recorded as "Reviewed by Official".`,
      'success'
    );
  };

  const addNewApplication = (newApp: InstitutionApplication) => {
    setApplications((prev) => [newApp, ...prev.filter((a) => a.id !== newApp.id)]);
    setSelectedApplicationId(newApp.id);

    const timestamp = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short',
    }) + ' IST';

    const newLog: AuditTrailItem = {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      timestamp,
      rawTimestamp: new Date().toISOString(),
      user: user?.name || 'Official',
      role: user?.role || 'Official',
      action: 'New Dossier Validation Run',
      details: `Executed AI automated pre-validation for ${newApp.institutionName} (${newApp.id}).`,
      applicationId: newApp.id,
      ipAddress: '10.14.8.44',
    };
    setAuditLogs((prev) => [newLog, ...prev]);

    showToast(
      'Validation Pipeline Completed',
      `Generated decision-support analysis for ${newApp.institutionName}`,
      'success'
    );
  };

  const updateRule = (ruleId: string, updates: Partial<ValidationRule>) => {
    setRules((prev) =>
      prev.map((r) => {
        if (r.id === ruleId) {
          return {
            ...r,
            ...updates,
            lastUpdated: new Date().toLocaleString('en-IN', {
              timeZone: 'Asia/Kolkata',
              dateStyle: 'medium',
              timeStyle: 'short',
            }) + ' IST',
            updatedBy: user?.name || 'Admin',
          };
        }
        return r;
      })
    );

    const log: AuditTrailItem = {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'short',
      }) + ' IST',
      rawTimestamp: new Date().toISOString(),
      user: user?.name || 'Dr. Sunita Rao',
      role: user?.role || 'Admin',
      action: 'Rule Modified',
      details: `Updated validation parameters for Rule ${ruleId}.`,
      applicationId: 'RULES-ENGINE',
      ipAddress: '10.14.2.11',
    };
    setAuditLogs((prev) => [log, ...prev]);

    showToast('Rule Updated', `Rule ${ruleId} configuration saved successfully.`, 'success');
  };

  const addRule = (newRule: ValidationRule) => {
    setRules((prev) => [newRule, ...prev]);
    showToast('Rule Created', `Rule ${newRule.id} (${newRule.name}) added to active ruleset.`, 'success');
  };

  const purgeAllData = async () => {
    try {
      await purgeBackendDatabase();
      setApplications([]);
      setSelectedApplicationId('');
      setAuditLogs([]);
      showToast('Database Purged', 'All applications, uploaded documents, flags, and audit logs cleared successfully.', 'info');
    } catch (e) {
      showToast('Purge Failed', 'Could not clear backend database.', 'error');
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        login,
        logout,
        theme,
        toggleTheme,
        currentView,
        setCurrentView,
        selectedApplicationId,
        setSelectedApplicationId,
        viewApplicationDetail,
        applications,
        selectedApplication,
        rules,
        auditLogs,
        searchQuery,
        setSearchQuery,
        markApplicationAsReviewed,
        addNewApplication,
        updateRule,
        addRule,
        toasts,
        showToast,
        removeToast,
        isLoading,
        isSidebarCollapsed,
        toggleSidebar,
        purgeAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
