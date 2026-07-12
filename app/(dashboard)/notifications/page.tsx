'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { ContentCard } from '@/components/layout/ContentCard';
import { DataTable } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { useNotification } from '@/context/NotificationContext';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { Check, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function NotificationsPage() {
  const { markAsRead } = useNotification();
  const { accessToken } = useSelector((state: RootState) => state.auth);
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;

  useEffect(() => {
    fetchNotifications();
  }, [page, accessToken]);

  const fetchNotifications = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/notifications?page=${page}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data || []);
        setTotalPages(data.pagination?.pages || 1);
        setTotalItems(data.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch notifications', error);
      toast.error('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
  };

  const handleMarkAllAsRead = async () => {
    await markAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    toast.success('All notifications marked as read');
  };

  const columns = [
    {
      header: 'Status',
      cell: (row: any) => (
        <StatusBadge 
          status={row.isRead ? 'READ' : 'UNREAD'} 
        />
      ),
    },
    {
      header: 'Title',
      cell: (row: any) => (
        <span className={!row.isRead ? 'font-semibold' : ''}>
          {row.title}
        </span>
      ),
    },
    {
      header: 'Message',
      cell: (row: any) => (
        <span className="text-sm text-muted-foreground line-clamp-1 max-w-[400px]" title={row.message}>
          {row.message}
        </span>
      ),
    },
    {
      header: 'Type',
      cell: (row: any) => (
        <span className="text-xs uppercase bg-muted px-2 py-1 rounded-md">
          {row.type}
        </span>
      ),
    },
    {
      header: 'Date',
      cell: (row: any) => new Date(row.createdAt).toLocaleString(),
    },
    {
      header: 'Actions',
      cell: (row: any) => (
        <div className="flex gap-2">
          {!row.isRead && (
            <button 
              onClick={() => handleMarkAsRead(row._id)}
              className="p-1.5 text-muted-foreground hover:text-primary rounded hover:bg-muted"
              title="Mark as read"
            >
              <Check className="w-4 h-4" />
            </button>
          )}
          {row.actionUrl && (
            <button 
              onClick={() => window.location.href = row.actionUrl}
              className="p-1.5 text-muted-foreground hover:text-primary rounded hover:bg-muted"
              title="View Details"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Notifications"
        description="View and manage all your notifications."
        breadcrumbItems={[
          { label: 'Home', href: '/' },
          { label: 'Notifications' }
        ]}
        actions={
          <Button onClick={handleMarkAllAsRead} className="flex items-center shadow-sm">
            <Check className="w-4 h-4 mr-2" /> Mark All as Read
          </Button>
        }
      />

      <ContentCard>
        <DataTable 
          columns={columns}
          data={notifications}
          isLoading={isLoading}
          emptyMessage="No notifications found."
        />
        
        {totalPages > 1 && (
          <div className="mt-4">
            <Pagination 
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </ContentCard>
    </PageContainer>
  );
}