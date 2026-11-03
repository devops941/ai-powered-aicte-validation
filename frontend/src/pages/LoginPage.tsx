import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { Lock, User, ShieldCheck, ArrowRight, Building2, AlertCircle } from 'lucide-react';
import { loginBackend } from '../api';

export const LoginPage: React.FC = () => {
  const { login } = useApp();
  const [selectedRole, setSelectedRole] = useState<UserRole>('Official');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await loginBackend(username, password);
      if (res.success && res.user) {
        login(res.user);
      } else {
        setErrorMessage(res.error || 'Invalid official credentials. Please check your username and password.');
      }
    } catch {
      setErrorMessage('Unable to reach the authentication server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMessage(null);
    setUsername('');
    setPassword('');
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#0c1a40] via-[#1e3a8a] to-[#172554] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle decorative background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-white/20 dark:border-slate-800 overflow-hidden">
        {/* Card Header */}
        <div className="p-8 pb-6 text-center border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850">
          <div className="w-16 h-16 rounded-2xl bg-[#1e3a8a] text-white mx-auto flex items-center justify-center shadow-lg shadow-blue-900/30 mb-4 border border-blue-400/30">
            <div className="text-center font-bold">
              <span className="text-xs block text-amber-400 tracking-wider">AICTE</span>
              <span className="text-[10px] block text-blue-200 tracking-widest font-mono">GOVT</span>
            </div>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            AICTE Document Verification
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            AI Powered AICTE Document Verification & Decision-Support Portal
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>Authorized AICTE Personnel Only</span>
          </div>
        </div>

        {/* Card Body & Form */}
        <form onSubmit={handleSubmit} className="p-8 pt-6 space-y-4">
          {/* Role Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              Select Designation / Role
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <button
                type="button"
                onClick={() => handleRoleSelect('Official')}
                className={`py-2 px-3 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  selectedRole === 'Official'
                    ? 'bg-white dark:bg-slate-700 text-[#1e3a8a] dark:text-blue-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Official (Scrutiny)</span>
              </button>
              <button
                type="button"
                onClick={() => handleRoleSelect('Admin')}
                className={`py-2 px-3 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  selectedRole === 'Admin'
                    ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Admin (Director)</span>
              </button>
            </div>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Username Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Official Email / Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:border-[#1e3a8a] dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                placeholder="officer@aicte-india.gov.in"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Statutory Security Token / Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:border-[#1e3a8a] dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                placeholder="Enter password"
              />
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-lg bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 text-white text-xs font-semibold shadow-md shadow-blue-900/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 mt-2"
          >
            {isLoading ? (
              <span className="inline-block animate-spin mr-1">⏳</span>
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
            <span>Access Document Verification Dashboard</span>
          </button>
        </form>

        {/* Card Footer with Mandatory Text */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Decision support only. Final decision rests with AICTE officials.
          </p>
        </div>
      </div>
    </div>
  );
};

