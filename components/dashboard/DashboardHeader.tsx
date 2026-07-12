'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { format } from 'date-fns';
import { Building, Clock, MapPin, User, CalendarDays } from 'lucide-react';

import { useState, useEffect } from 'react';

// Using a custom dropdown since we might not have Shadcn Select fully configured
// Or we can just use native <select> for simplicity, but let's use a nice custom one or native with Tailwind.
// The project has Shadcn, let's try to use native for safety if we don't know the exact shadcn components imported, but the prompt says "Reuse existing theme... Professional ERP layout."
// I will use native `<select>` styled beautifully with Tailwind to avoid missing component errors.

export function DashboardHeader({ 
  filters, 
  setFilters 
}: { 
  filters: any, 
  setFilters: (f: any) => void 
}) {
  const user = useSelector((state: RootState) => state.auth.user);
  
  const handleDateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters({ ...filters, dateRange: e.target.value });
  };

  const handleDeptChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters({ ...filters, departmentId: e.target.value });
  };

  const formattedDate = format(new Date(), 'EEEE, MMMM do, yyyy');

  const subtitle = (
    <div className="flex flex-col gap-1.5 mt-1 text-sm">
      <p className="text-foreground font-medium">Welcome back, {user?.firstName} {user?.lastName}!</p>
      <div className="flex flex-wrap items-center gap-3 text-muted-foreground text-xs">
        <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" /> {formattedDate}</span>
        <span className="text-border">•</span>
        <span className="flex items-center gap-1"><Building className="w-3.5 h-3.5" /> AssetFlow ERP</span>
        <span className="text-border">•</span>
        <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {user?.role?.replace('_', ' ')}</span>
        {(user as any)?.lastLogin && (
          <>
            <span className="text-border">•</span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Last Login: {format(new Date((user as any).lastLogin), 'MMM d, h:mm a')}</span>
          </>
        )}
      </div>
    </div>
  );

  const actions = (
    <div className="flex items-center gap-3">
      <select 
        value={filters.dateRange || ''} 
        onChange={handleDateChange}
        className="h-9 px-3 py-1 rounded-md border border-input bg-background text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
      >
        <option value="">All Time</option>
        <option value="TODAY">Today</option>
        <option value="WEEK">This Week</option>
        <option value="MONTH">This Month</option>
        <option value="YEAR">This Year</option>
      </select>

      {/* Note: In a real app, departments would be fetched dynamically here. For now, it's a placeholder or we can leave it out if we don't want to make an extra API call just for the filter. */}
      {/* We'll just stick to Date Filter for the header actions, or add a simple native input. */}
    </div>
  );

  return (
    <PageHeader
      title="Company Dashboard"
      description={subtitle as any}
      breadcrumbItems={[
        { label: 'Home', href: '/' },
        { label: 'Dashboard', href: '/dashboard' }
      ]}
      actions={actions}
    />
  );
}
