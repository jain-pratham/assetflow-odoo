import React from 'react';
import { cn } from '@/lib/utils';

export type StatusType = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'MAINTENANCE' | 'ALLOCATED';

interface StatusBadgeProps {
  status: StatusType | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  let colorClass = 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300 border-gray-200 dark:border-gray-700';
  
  if (status === 'ACTIVE' || status === 'ALLOCATED') {
    colorClass = 'bg-emerald-100/50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
  } else if (status === 'INACTIVE') {
    colorClass = 'bg-rose-100/50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800';
  } else if (status === 'PENDING' || status === 'MAINTENANCE') {
    colorClass = 'bg-amber-100/50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
  }

  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border", colorClass, className)}>
      {status}
    </span>
  );
}
