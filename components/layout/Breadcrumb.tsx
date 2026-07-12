'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouteMeta } from '@/hooks/useRouteMeta';

export function Breadcrumb() {
  const { breadcrumbs } = useRouteMeta();

  return (
    <nav className="flex items-center space-x-1 text-sm font-medium text-muted-foreground">
      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1;
        
        return (
          <div key={`${item.label}-${index}`} className="flex items-center">
            {index > 0 && <ChevronRight className="w-4 h-4 mx-1 opacity-50" />}
            {item.href && !isLast ? (
              <Link href={item.href} className="hover:text-foreground transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className={cn(isLast ? 'text-foreground' : '')}>{item.label}</span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
