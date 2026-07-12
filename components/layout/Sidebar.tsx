'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import { ChevronDown, ChevronRight, ChevronLeft, LogOut, Shield, Key, User as UserIcon } from 'lucide-react';
import { RootState } from '@/store/store';
import { cn } from '@/lib/utils';
import { sidebarConfig } from '@/lib/config/sidebarConfig';
import { UserRole } from '@/types/roles';

function SidebarGroup({ item, pathname, isOpen, userRole }: { item: any, pathname: string, isOpen: boolean, userRole: UserRole }) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    // Check local storage for saved state on mount
    const saved = localStorage.getItem(`sidebar_expanded_${item.id}`);
    if (saved !== null) {
      setExpanded(saved === 'true');
    } else {
      // Auto expand if current path is within this group
      const isActiveChild = item.children?.some((child: any) => pathname === child.href || pathname.startsWith(`${child.href}/`));
      if (isActiveChild) {
        setExpanded(true);
      }
    }
  }, [item.id, pathname, item.children]);

  const toggleExpand = (e: React.MouseEvent) => {
    e.preventDefault();
    const nextState = !expanded;
    setExpanded(nextState);
    localStorage.setItem(`sidebar_expanded_${item.id}`, String(nextState));
  };

  const hasChildren = item.children && item.children.length > 0;
  
  // Filter children by role
  const visibleChildren = hasChildren ? item.children.filter((c: any) => c.roles.includes(userRole)) : [];

  if (hasChildren && visibleChildren.length === 0) return null; // Role has no access to any children

  const isGroupActive = hasChildren 
    ? visibleChildren.some((c: any) => pathname === c.href || pathname.startsWith(`${c.href}/`))
    : pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <div className="flex flex-col space-y-1">
      {hasChildren ? (
        <button
          onClick={toggleExpand}
          className={cn(
            "flex items-center justify-between px-3 py-2.5 rounded-md text-[14px] font-medium transition-all group w-full",
            isGroupActive && !expanded ? "bg-white/10 text-white" : "text-white/80 hover:bg-white/10 hover:text-white",
            !isOpen && "justify-center px-0"
          )}
          title={!isOpen ? item.name : undefined}
        >
          <div className="flex items-center">
            <item.icon className={cn("w-5 h-5 shrink-0", isOpen ? "mr-3" : "")} />
            {isOpen && <span className="flex-1 text-left truncate">{item.name}</span>}
          </div>
          {isOpen && (
            expanded ? <ChevronDown className="w-4 h-4 text-white/50" /> : <ChevronRight className="w-4 h-4 text-white/50" />
          )}
        </button>
      ) : (
        <Link
          href={item.href || '#'}
          className={cn(
            "flex items-center px-3 py-2.5 rounded-md text-[14px] font-medium transition-all group",
            isGroupActive ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10 hover:text-white",
            !isOpen && "justify-center px-0"
          )}
          title={!isOpen ? item.name : undefined}
        >
          <item.icon className={cn("w-5 h-5 shrink-0", isOpen ? "mr-3" : "")} />
          {isOpen && <span className="flex-1 truncate">{item.name}</span>}
        </Link>
      )}

      {/* Submenu rendering */}
      <div 
        className={cn(
          "flex flex-col pl-9 pr-2 overflow-hidden transition-all duration-300 ease-in-out",
          hasChildren && expanded && isOpen ? "max-h-96 mt-1 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="flex flex-col space-y-1">
          {visibleChildren.map((child: any) => {
            const isChildActive = pathname === child.href || pathname.startsWith(`${child.href}/`);
            return (
              <Link
                key={child.id}
                href={child.href}
                className={cn(
                  "block px-3 py-2 rounded-md text-[13px] font-medium transition-colors",
                  isChildActive ? "text-white bg-white/10" : "text-white/60 hover:text-white hover:bg-white/5"
                )}
              >
                {child.name}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function Sidebar({ isOpen, onToggleSidebar, onLogout }: { isOpen: boolean; onToggleSidebar?: () => void; onLogout?: () => void }) {
  const pathname = usePathname();
  const user = useSelector((state: RootState) => state.auth.user);
  const userRole = (user?.role as UserRole) || 'EMPLOYEE';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Ensure server matches client on first render
  if (!mounted) {
    return (
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar dark:bg-sidebar-primary text-white transition-all duration-300 ease-in-out border-r border-sidebar-border shadow-lg",
          isOpen ? "w-[260px] translate-x-0" : "w-[68px] -translate-x-full lg:translate-x-0"
        )}
      >
        <div className={cn("h-[64px] flex items-center border-b border-white/10 shrink-0", isOpen ? "justify-between px-4" : "justify-center")}>
          {isOpen ? (
            <span className="text-xl font-bold tracking-tight text-white">CRM Admin</span>
          ) : (
            <ChevronRight className="w-5 h-5 text-white/70" />
          )}
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar dark:bg-sidebar-primary text-white transition-all duration-300 ease-in-out border-r border-sidebar-border shadow-lg",
        isOpen ? "w-[260px] translate-x-0" : "w-[68px] -translate-x-full lg:translate-x-0"
      )}
    >
      {/* Logo & Header */}
      <div className={cn("h-[64px] flex items-center border-b border-white/10 shrink-0", isOpen ? "justify-between px-4" : "justify-center")}>
        {isOpen ? (
          <>
            <span className="text-xl font-bold tracking-tight text-white">CRM Admin</span>
            {onToggleSidebar && (
              <button onClick={onToggleSidebar} className="p-1 rounded-md hover:bg-white/10 text-white/70 hover:text-white transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
          </>
        ) : (
          onToggleSidebar && (
            <button onClick={onToggleSidebar} className="p-1 rounded-md hover:bg-white/10 text-white/70 hover:text-white transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          )
        )}
      </div>

      {/* User Profile / Avatar (Top) */}
      <div className={cn("p-4 border-b border-white/10 flex items-center gap-3", !isOpen && "justify-center")}>
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center font-bold text-white shrink-0 shadow-sm">
            {user?.firstName?.[0]?.toUpperCase() || 'U'}
            {user?.lastName?.[0]?.toUpperCase() || ''}
          </div>
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-sidebar rounded-full"></span>
        </div>
        {isOpen && (
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-white truncate">{user?.firstName || 'User'} {user?.lastName || ''}</span>
            <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider truncate">{userRole.replace('_', ' ')}</span>
          </div>
        )}
      </div>

      {/* Navigation - Data Driven via sidebarConfig */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin scrollbar-thumb-white/20">
        {!user && isOpen ? (
          <div className="animate-pulse flex flex-col space-y-4 px-3 py-2 mt-2">
             <div className="h-4 bg-white/10 rounded w-3/4"></div>
             <div className="h-4 bg-white/10 rounded w-1/2"></div>
             <div className="h-4 bg-white/10 rounded w-5/6"></div>
          </div>
        ) : (
          sidebarConfig
            .filter(item => item.roles.includes(userRole))
            .map((item) => (
              <SidebarGroup
                key={item.id}
                item={item}
                pathname={pathname}
                isOpen={isOpen}
                userRole={userRole}
              />
            ))
        )}
      </nav>

      {/* Extra Buttons (Footer) */}
      <div className="p-3 border-t border-white/10 shrink-0">
        <div className={cn("flex items-center gap-1 mb-2", isOpen ? "justify-between px-2" : "flex-col justify-center")}>
          <Link href="/profile" className="flex items-center gap-1.5 p-1.5 rounded-md text-white/70 hover:bg-white/10 hover:text-white transition-colors" title="Profile">
            <UserIcon className="w-[14px] h-[14px]" />
            {isOpen && <span className="text-[12px] font-medium">Profile</span>}
          </Link>
          <Link href="/password" className="flex items-center gap-1.5 p-1.5 rounded-md text-white/70 hover:bg-white/10 hover:text-white transition-colors" title="Password">
            <Key className="w-[14px] h-[14px]" />
            {isOpen && <span className="text-[12px] font-medium">Password</span>}
          </Link>
          <Link href="/2fa" className="flex items-center gap-1.5 p-1.5 rounded-md text-white/70 hover:bg-white/10 hover:text-white transition-colors" title="2FA">
            <Shield className="w-[14px] h-[14px]" />
            {isOpen && <span className="text-[12px] font-medium">2FA</span>}
          </Link>
        </div>
        <button
          onClick={onLogout}
          className={cn(
            "w-full flex items-center p-2.5 rounded-md text-white hover:bg-white/10 transition-colors group",
            isOpen ? "justify-start px-2" : "justify-center px-0"
          )}
          title={!isOpen ? "Logout" : undefined}
        >
          <LogOut className={cn("w-[18px] h-[18px]", isOpen && "mr-3")} />
          {isOpen && <span className="text-[14px] font-medium text-white/80 group-hover:text-white transition-colors">Logout</span>}
        </button>
      </div>
    </aside>
  );
}

