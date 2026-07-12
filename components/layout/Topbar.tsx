'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useSelector, useDispatch } from 'react-redux';
import { Menu, Moon, Sun, Bell, ChevronDown, Search, User as UserIcon, Key, Shield, LogOut } from 'lucide-react';
import { RootState } from '@/store/store';
import { useRouteMeta } from '@/hooks/useRouteMeta';
import { logout } from '@/store/authSlice';
import Link from 'next/link';
import { NotificationBell } from './NotificationBell';
import { cn } from '@/lib/utils';

export function Topbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { theme, setTheme } = useTheme();
  const user = useSelector((state: RootState) => state.auth.user);
  const { title } = useRouteMeta();
  const dispatch = useDispatch();
  
  const [profileOpen, setProfileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <header className="h-[64px] shrink-0 flex items-center justify-between px-4 sm:px-8 bg-background/80 backdrop-blur-md border-b border-border z-40 sticky top-0 transition-colors">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 -ml-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold tracking-tighter text-foreground hidden sm:block">{title}</h1>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Search Placeholder */}
        <div className="hidden md:flex items-center bg-muted/50 border border-border rounded-full px-3 py-1.5 w-64 focus-within:ring-1 focus-within:ring-primary/50">
          <Search className="w-4 h-4 text-muted-foreground mr-2" />
          <input 
            type="text" 
            placeholder="Search anything..." 
            className="bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground w-full"
            disabled
          />
        </div>

        {/* Theme Toggle */}
        <div className="flex items-center gap-3 mr-2">
          <span className="text-sm font-semibold text-foreground hidden sm:block">
            {mounted ? (theme === 'dark' ? 'Dark' : 'Light') : 'Theme'}
          </span>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
              mounted && theme === 'dark' ? "bg-primary/20 border border-primary/30" : "bg-muted-foreground/30"
            )}
          >
            <span className="sr-only">Toggle theme</span>
            <span
              className={cn(
                "inline-flex h-4 w-4 transform items-center justify-center rounded-full bg-background shadow transition duration-200 ease-in-out",
                mounted && theme === 'dark' ? "translate-x-6 text-primary" : "translate-x-1 text-muted-foreground"
              )}
            >
              {mounted ? (
                theme === 'dark' ? (
                  <Moon className="h-[10px] w-[10px]" />
                ) : (
                  <Sun className="h-[10px] w-[10px]" />
                )
              ) : (
                <Moon className="h-[10px] w-[10px]" />
              )}
            </span>
          </button>
        </div>
        
        {/* Notification Bell */}
        <NotificationBell />
        
        {/* Profile Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full border border-border hover:bg-muted transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shadow-sm">
              {user?.firstName?.[0]?.toUpperCase() || 'U'}
              {user?.lastName?.[0]?.toUpperCase() || ''}
            </div>
            <div className="hidden sm:flex flex-col items-start min-w-0">
              <span className="text-[10px] font-bold text-foreground uppercase tracking-wider">
                {user?.role?.replace('_', ' ') || 'USER'}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground ml-1" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-md shadow-lg py-1 z-50">
              <Link href="/profile" className="flex items-center px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => setProfileOpen(false)}>
                <UserIcon className="w-4 h-4 mr-2" /> Profile
              </Link>
              <Link href="/password" className="flex items-center px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => setProfileOpen(false)}>
                <Key className="w-4 h-4 mr-2" /> Change Password
              </Link>
              <Link href="/2fa" className="flex items-center px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => setProfileOpen(false)}>
                <Shield className="w-4 h-4 mr-2" /> 2FA Settings
              </Link>
              <div className="border-t border-border my-1"></div>
              <button onClick={handleLogout} className="w-full flex items-center px-4 py-2 text-sm text-rose-500 hover:bg-muted">
                <LogOut className="w-4 h-4 mr-2" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
