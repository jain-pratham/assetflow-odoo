'use client';

import { usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { sidebarConfig } from '@/lib/config/sidebarConfig';
import { UserRole } from '@/types/roles';
import { ShieldAlert } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { ContentCard } from '@/components/layout/ContentCard';
import { EmptyState } from '@/components/layout/EmptyState';
import { useEffect, useState } from 'react';
import { PageLoader } from '@/components/ui/PageLoader';

export function RoleGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useSelector((state: RootState) => state.auth.user);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return <PageLoader />;

  const userRole = (user?.role as UserRole) || 'EMPLOYEE';

  // Check if current route is allowed
  let isAllowed = false;

  // Let dashboard pass for everyone as a fallback, or if defined in config
  if (pathname === '/dashboard') {
    isAllowed = true;
  } else {
    // Flatten config to check paths
    for (const group of sidebarConfig) {
      if (group.href === pathname && group.roles.includes(userRole)) {
        isAllowed = true;
        break;
      }
      if (group.children) {
        for (const child of group.children) {
          if (pathname.startsWith(child.href) && child.roles.includes(userRole)) {
            isAllowed = true;
            break;
          }
        }
      }
      if (isAllowed) break;
    }
  }

  // If path is not in config at all (like /profile), we should let it pass if it's a valid global route
  // We can add a fallback check: if it's not restricted by config, allow it (or deny it).
  // For strictness, if it's in config but role not matched = deny.
  const isPathInConfig = sidebarConfig.some(g => g.href === pathname || g.children?.some(c => pathname.startsWith(c.href)));
  
  if (isPathInConfig && !isAllowed) {
    return (
      <PageContainer>
        <ContentCard>
          <EmptyState 
            icon={ShieldAlert}
            title="403 - Access Denied"
            description="You do not have the required permissions to view this page."
          />
        </ContentCard>
      </PageContainer>
    );
  }

  return <>{children}</>;
}
