import React from 'react';
import { RiskLevel } from '../../types';
import { ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';

interface RiskBadgeProps {
  level: RiskLevel;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  score,
  size = 'md',
  showIcon = true,
}) => {
  const getColors = () => {
    switch (level) {
      case 'High':
        return {
          bg: 'bg-red-50 dark:bg-red-950/40',
          text: 'text-red-700 dark:text-red-400',
          border: 'border-red-200 dark:border-red-800/60',
          icon: <ShieldAlert className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" />,
        };
      case 'Medium':
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/40',
          text: 'text-amber-800 dark:text-amber-400',
          border: 'border-amber-200 dark:border-amber-800/60',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />,
        };
      case 'Low':
      default:
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-950/40',
          text: 'text-emerald-700 dark:text-emerald-400',
          border: 'border-emerald-200 dark:border-emerald-800/60',
          icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />,
        };
    }
  };

  const { bg, text, border, icon } = getColors();

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold',
  };

  const ariaLabel = score !== undefined
    ? `${level} Risk, score ${score} out of 100`
    : `${level} Risk`;

  return (
    <span
      role="img"
      aria-label={ariaLabel}
      className={`inline-flex items-center rounded-md border ${bg} ${text} ${border} ${sizeClasses[size]} tracking-tight`}
    >
      {showIcon && <span aria-hidden="true">{icon}</span>}
      <span aria-hidden="true">{level} Risk</span>
      {score !== undefined && (
        <span aria-hidden="true" className="font-mono tabular-nums opacity-85 ml-0.5">({score}/100)</span>
      )}
    </span>
  );
};
