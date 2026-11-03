import React from 'react';
import { ApplicationStatus } from '../../types';
import { Flag, CheckCircle2, UserCheck, AlertCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: ApplicationStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
}) => {
  // CRITICAL RULE ENFORCEMENT: Only valid AICTE DocVerify statuses
  const getStatusConfig = () => {
    switch (status) {
      case 'Flagged':
        return {
          bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900',
          icon: <Flag className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />,
          label: 'Flagged',
        };
      case 'Manual Review Required':
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-900',
          icon: <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />,
          label: 'Manual Review Required',
        };
      case 'Reviewed by Official':
        return {
          bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-900',
          icon: <UserCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />,
          label: 'Reviewed by Official',
        };
      case 'No issues found':
      default:
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />,
          label: 'No issues found',
        };
    }
  };

  const { bg, icon, label } = getStatusConfig();

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3 py-1.5 gap-2 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border ${bg} ${sizeClasses[size]} tracking-tight whitespace-nowrap`}
    >
      {showIcon && icon}
      <span>{label}</span>
    </span>
  );
};
