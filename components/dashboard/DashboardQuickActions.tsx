'use client';

import { ContentCard } from '@/components/layout/ContentCard';
import { useRouter } from 'next/navigation';
import { PlusCircle, ArrowRightLeft, CalendarPlus, PenTool, ClipboardCheck, Users, Building2, Tags, BarChart3, BellRing } from 'lucide-react';

export function DashboardQuickActions() {
  const router = useRouter();

  const actions = [
    { label: 'Register Asset', icon: PlusCircle, href: '/assets/create', color: 'text-indigo-500' },
    { label: 'Allocate Asset', icon: ArrowRightLeft, href: '/allocation/create', color: 'text-amber-500' },
    { label: 'Book Resource', icon: CalendarPlus, href: '/booking', color: 'text-emerald-500' },
    { label: 'Raise Maintenance', icon: PenTool, href: '/maintenance', color: 'text-rose-500' },
    { label: 'Create Audit', icon: ClipboardCheck, href: '/audit', color: 'text-blue-500' },
    { label: 'Manage Employees', icon: Users, href: '/organization/employees', color: 'text-cyan-500' },
    { label: 'Departments', icon: Building2, href: '/organization/departments', color: 'text-purple-500' },
    { label: 'Categories', icon: Tags, href: '/organization/categories', color: 'text-teal-500' },
    { label: 'Reports', icon: BarChart3, href: '/reports', color: 'text-orange-500' },
    { label: 'Notifications', icon: BellRing, href: '/notifications', color: 'text-rose-500' }
  ];

  return (
    <ContentCard className="p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => router.push(action.href)}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/50 transition-all group"
          >
            <action.icon className={`w-6 h-6 mb-2 ${action.color} group-hover:scale-110 transition-transform`} />
            <span className="text-xs font-medium text-foreground text-center line-clamp-1">{action.label}</span>
          </button>
        ))}
      </div>
    </ContentCard>
  );
}
