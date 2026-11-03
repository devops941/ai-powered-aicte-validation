import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-12 right-6 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => {
        let borderClass = 'border-blue-200 dark:border-blue-800';
        let bgClass = 'bg-white dark:bg-slate-900';
        let icon = <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />;

        if (toast.type === 'success') {
          borderClass = 'border-emerald-200 dark:border-emerald-800';
          icon = <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />;
        } else if (toast.type === 'warning') {
          borderClass = 'border-amber-200 dark:border-amber-800';
          icon = <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />;
        } else if (toast.type === 'error') {
          borderClass = 'border-rose-200 dark:border-rose-800';
          icon = <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />;
        }

        return (
          <div
            key={toast.id}
            role="alert"
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border ${borderClass} ${bgClass} shadow-lg shadow-slate-900/10 text-slate-900 dark:text-slate-100 transition-all duration-200`}
          >
            {icon}
            <div className="flex-1 min-w-0 pr-1">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                {toast.title}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
