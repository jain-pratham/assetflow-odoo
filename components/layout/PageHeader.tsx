'use client';

import { ReactNode } from 'react';
import { Breadcrumb } from './Breadcrumb';
import { useRouteMeta } from '@/hooks/useRouteMeta';

interface PageHeaderProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
  breadcrumbItems?: { label: string; href?: string }[];
}

export function PageHeader({ title, description, actions, breadcrumbItems }: PageHeaderProps) {
  const meta = useRouteMeta();
  const displayTitle = title || meta.title;

  return (
    <div className="flex flex-col space-y-4 mb-6">
      <Breadcrumb items={breadcrumbItems} />
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{displayTitle}</h1>
          {description && (
            <p className="text-muted-foreground mt-1 max-w-3xl">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {actions}
          </div>
        )}
      </div>
      <hr className="border-border mt-4" />
    </div>
  );
}
