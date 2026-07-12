'use client';

import { usePathname } from 'next/navigation';

export function useRouteMeta() {
  const pathname = usePathname();

  if (pathname === '/dashboard') {
    return {
      title: 'Dashboard',
      breadcrumbs: [{ label: 'Home', href: '/dashboard' }, { label: 'Dashboard' }]
    };
  }

  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs = [{ label: 'Home', href: '/dashboard' }];
  let currentPath = '';

  segments.forEach((segment, i) => {
    currentPath += `/${segment}`;
    
    // Format segment: capitalize and replace dashes with spaces
    let label = segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
      
    if (segment === 'organization') {
      label = 'Organization Setup';
    }

    // Handle dynamic IDs roughly if it's a long hash or generic 'id'
    if (segment.length > 20) {
      if (segments[i - 1] === 'employees') {
        label = 'Employee Details';
      } else {
        label = 'Details';
      }
    }

    breadcrumbs.push({ 
      label, 
      href: i === segments.length - 1 ? undefined : currentPath 
    });
  });

  const title = breadcrumbs[breadcrumbs.length - 1]?.label || 'Dashboard';

  return { title, breadcrumbs };
}
