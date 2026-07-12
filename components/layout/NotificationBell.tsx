'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, ArrowRight } from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import Link from 'next/link';

export function NotificationBell() {
  const { unreadCount, markAsRead } = useNotification();
  const { accessToken } = useSelector((state: RootState) => state.auth);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && accessToken) {
      // Fetch latest 5 notifications
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/notifications?limit=5`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setNotifications(data.data);
          }
        })
        .catch(console.error);
    }
  }, [isOpen, accessToken]);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await markAsRead(id);
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
  };

  const handleMarkAllAsRead = async () => {
    await markAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-rose-500 rounded-full border-2 border-background">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-card border border-border rounded-lg shadow-xl z-50 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllAsRead}
                className="text-xs text-primary hover:underline flex items-center"
              >
                <Check className="w-3 h-3 mr-1" /> Mark all read
              </button>
            )}
          </div>
          
          <div className="max-h-[300px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No notifications to display
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {notifications.map(notification => (
                  <li 
                    key={notification._id}
                    className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${!notification.isRead ? 'bg-primary/5' : ''}`}
                    onClick={() => {
                      if (!notification.isRead) markAsRead(notification._id);
                      if (notification.actionUrl) window.location.href = notification.actionUrl;
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!notification.isRead ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-2 opacity-70">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <button 
                          onClick={(e) => handleMarkAsRead(notification._id, e)}
                          className="ml-2 text-muted-foreground hover:text-primary p-1 rounded hover:bg-muted"
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Link 
            href="/notifications" 
            className="p-3 text-center text-sm font-medium text-primary hover:bg-muted border-t border-border flex items-center justify-center transition-colors"
            onClick={() => setIsOpen(false)}
          >
            View All Notifications <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      )}
    </div>
  );
}
