'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { toast } from 'sonner';

interface NotificationContextValue {
  socket: Socket | null;
  unreadCount: number;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id?: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const { accessToken, user } = useSelector((state: RootState) => state.auth);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setUnreadCount(data.data.count);
      }
    } catch (error) {
      console.error('Failed to fetch unread count', error);
    }
  };

  const markAsRead = async (id?: string) => {
    if (!accessToken) return;
    try {
      const url = id 
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/notifications/${id}/read`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/notifications/read-all`;
        
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      if (res.ok) {
        if (id) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        } else {
          setUnreadCount(0);
        }
      }
    } catch (error) {
      console.error('Failed to mark as read', error);
    }
  };

  useEffect(() => {
    if (accessToken && user) {
      fetchUnreadCount();

      // Initialize Socket.IO connection
      const socketUrl = process.env.NEXT_PUBLIC_API_URL 
        ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '')
        : 'http://localhost:5000';
        
      const newSocket = io(socketUrl, {
        auth: { token: accessToken }
      });

      newSocket.on('connect', () => {
        console.log('Connected to notification socket');
      });

      newSocket.on('newNotification', (notification: any) => {
        // Show Toast
        toast(notification.title, {
          description: notification.message,
          action: notification.actionUrl ? {
            label: 'View',
            onClick: () => window.location.href = notification.actionUrl
          } : undefined
        });

        // Increment unread count
        setUnreadCount(prev => prev + 1);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [accessToken, user]);

  return (
    <NotificationContext.Provider value={{ socket, unreadCount, setUnreadCount, fetchUnreadCount, markAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
};
