'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { logout } from '@/store/authSlice';
import api from '@/services/api';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { mutate } from 'swr';
import { PageLoader } from '@/components/ui/PageLoader';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const { isInitializing } = useAuth();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout failed on server', error);
    } finally {
      // 1. Clear Redux
      dispatch(logout());
      
      // 2. Clear SWR cache globally
      mutate(
        () => true, // match all keys
        undefined,  // clear data
        { revalidate: false }
      );
      // 3. Clear session flag
      if (typeof window !== 'undefined') {
        localStorage.removeItem('hasSession');
      }
      
      // 4. Hard redirect to purge memory
      window.location.href = '/login';
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground flex">
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={isSidebarOpen} onLogout={handleLogout} />

      <div 
        className={cn(
          "flex-1 flex flex-col min-h-screen w-full transition-all duration-300",
          isSidebarOpen ? "lg:ml-[260px]" : "lg:ml-[68px]"
        )}
      >
        <Topbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto relative z-0">
          {isInitializing ? (
            <PageLoader />
          ) : (
            <RoleGuard>
              {children}
            </RoleGuard>
          )}
        </main>
      </div>
    </div>
  );
}
