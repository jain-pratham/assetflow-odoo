'use client';

import { ContentCard } from '@/components/layout/ContentCard';
import { Users, UserCheck, UserX, Building2, Tags, Box, CheckCircle2, ArrowRightLeft, Wrench, CalendarClock, Clock, AlertTriangle, ClipboardList, ClipboardCheck, BellRing } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function DashboardKPIs({ stats, isLoading }: { stats: any, isLoading: boolean }) {
  const router = useRouter();

  const kpis = [
    { label: 'Total Employees', value: stats?.totalEmployees, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10', link: '/organization/employees' },
    { label: 'Active Employees', value: stats?.activeEmployees, icon: UserCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10', link: '/organization/employees' },
    { label: 'Inactive Employees', value: stats?.inactiveEmployees, icon: UserX, color: 'text-rose-500', bg: 'bg-rose-500/10', link: '/organization/employees' },
    
    { label: 'Total Assets', value: stats?.totalAssets, icon: Box, color: 'text-indigo-500', bg: 'bg-indigo-500/10', link: '/assets' },
    { label: 'Available Assets', value: stats?.availableAssets, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10', link: '/assets' },
    { label: 'Allocated Assets', value: stats?.allocatedAssets, icon: ArrowRightLeft, color: 'text-amber-500', bg: 'bg-amber-500/10', link: '/allocation' },
    
    { label: 'Under Maintenance', value: stats?.maintenanceAssets, icon: Wrench, color: 'text-rose-500', bg: 'bg-rose-500/10', link: '/maintenance' },
    { label: 'Pending Maintenance', value: stats?.pendingMaintenance, icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-500/10', link: '/maintenance' },
    
    { label: 'Today\'s Bookings', value: stats?.todayBookings, icon: CalendarClock, color: 'text-purple-500', bg: 'bg-purple-500/10', link: '/booking' },
    { label: 'Pending Bookings', value: stats?.pendingBookings, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10', link: '/booking' },
    
    { label: 'Open Audits', value: stats?.openAudits, icon: ClipboardList, color: 'text-blue-500', bg: 'bg-blue-500/10', link: '/audit' },
    { label: 'Completed Audits', value: stats?.completedAudits, icon: ClipboardCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10', link: '/audit' },
    
    { label: 'Departments', value: stats?.departments, icon: Building2, color: 'text-cyan-500', bg: 'bg-cyan-500/10', link: '/organization/departments' },
    { label: 'Categories', value: stats?.categories, icon: Tags, color: 'text-teal-500', bg: 'bg-teal-500/10', link: '/organization/categories' },
    { label: 'Unread Alerts', value: stats?.unreadNotifications, icon: BellRing, color: 'text-rose-500', bg: 'bg-rose-500/10', link: '/notifications' }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[...Array(15)].map((_, i) => (
          <ContentCard key={i} className="p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted"></div>
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-muted rounded w-2/3"></div>
                <div className="h-5 bg-muted rounded w-1/3"></div>
              </div>
            </div>
          </ContentCard>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {kpis.map((kpi, index) => (
        <ContentCard 
          key={index} 
          className="p-4 cursor-pointer hover:shadow-md transition-shadow hover:border-primary/50 group"
          onClick={() => router.push(kpi.link)}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${kpi.bg} ${kpi.color}`}>
              <kpi.icon className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
                {kpi.label}
              </span>
              <span className="text-xl font-bold text-foreground truncate group-hover:text-primary transition-colors">
                {kpi.value || 0}
              </span>
            </div>
          </div>
        </ContentCard>
      ))}
    </div>
  );
}
