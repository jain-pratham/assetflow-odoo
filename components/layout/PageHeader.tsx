'use client';

import { Breadcrumb } from './Breadcrumb';
import { useRouteMeta } from '@/hooks/useRouteMeta';

export function PageHeader() {
  const { title } = useRouteMeta();
  
  return (
    <div className="flex flex-col space-y-2 mb-6">
      <Breadcrumb />
      <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
      <hr className="border-border mt-4" />
    </div>
  );
}
