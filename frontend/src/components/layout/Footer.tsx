import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-3 px-6 text-xs text-slate-500 dark:text-slate-400">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#1e3a8a] dark:text-blue-400 shrink-0" />
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Decision support only. Final decision rests with AICTE officials.
          </span>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-slate-400 dark:text-slate-500">
          <span>AICTE Approval Bureau · AI Document Verification Engine v2.4</span>
          <span>·</span>
          <span>Statutory Compliance AY 2026-27</span>
        </div>
      </div>
    </footer>
  );
};
