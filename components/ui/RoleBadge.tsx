import React from 'react';
import { cn } from '@/lib/utils';

interface RoleBadgeProps {
  role: string;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  let colorClass = 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300 border-gray-200 dark:border-gray-700';
  
  if (role === 'ADMIN') {
    colorClass = 'bg-blue-100/50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
  } else if (role === 'ASSET_MANAGER') {
    colorClass = 'bg-purple-100/50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800';
  } else if (role === 'DEPARTMENT_HEAD') {
    colorClass = 'bg-orange-100/50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800';
  } else if (role === 'EMPLOYEE') {
    colorClass = 'bg-slate-100/50 text-slate-600 dark:bg-slate-900/30 dark:text-slate-400 border-slate-200 dark:border-slate-800';
  }

  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border", colorClass, className)}>
      {role.replace('_', ' ')}
    </span>
  );
}
