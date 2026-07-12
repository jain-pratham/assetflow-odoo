'use client';

import { ContentCard } from '@/components/layout/ContentCard';
import { formatDistanceToNow } from 'date-fns';
import { Activity, Plus, Edit, Trash, ArrowRightLeft, Shield, CheckCircle } from 'lucide-react';

const getActionIcon = (action: string) => {
  if (action.includes('CREATED') || action.includes('ADDED') || action.includes('REGISTERED')) return <Plus className="w-4 h-4 text-emerald-500" />;
  if (action.includes('UPDATED') || action.includes('EDITED')) return <Edit className="w-4 h-4 text-blue-500" />;
  if (action.includes('DELETED') || action.includes('REMOVED')) return <Trash className="w-4 h-4 text-rose-500" />;
  if (action.includes('ALLOCATED') || action.includes('TRANSFERRED')) return <ArrowRightLeft className="w-4 h-4 text-amber-500" />;
  if (action.includes('LOGIN') || action.includes('AUTH') || action.includes('PASSWORD')) return <Shield className="w-4 h-4 text-indigo-500" />;
  if (action.includes('COMPLETED') || action.includes('APPROVED')) return <CheckCircle className="w-4 h-4 text-emerald-500" />;
  return <Activity className="w-4 h-4 text-muted-foreground" />;
};

export function DashboardTimeline({ activities, isLoading }: { activities: any[], isLoading: boolean }) {
  if (isLoading) {
    return (
      <ContentCard className="p-5 flex-1 min-h-[400px]">
        <h3 className="text-sm font-semibold text-foreground mb-4">Recent Activity</h3>
        <div className="space-y-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-muted shrink-0"></div>
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      </ContentCard>
    );
  }

  return (
    <ContentCard className="p-5 flex-1 h-[600px] flex flex-col">
      <h3 className="text-sm font-semibold text-foreground mb-4">Recent Activity</h3>
      <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border">
        {activities?.length > 0 ? (
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-border before:via-border before:to-transparent">
            {activities.map((activity, index) => (
              <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-8 h-8 rounded-full border border-border bg-background shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                  {getActionIcon(activity.action)}
                </div>
                
                <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-3 rounded-lg border border-border bg-card shadow-sm group-hover:border-primary/30 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm text-foreground">
                      {activity.actor?.firstName} {activity.actor?.lastName}
                    </span>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                      {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{activity.action.replace(/_/g, ' ')}</span>
                    {activity.target && ` - ${activity.target}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            No recent activity
          </div>
        )}
      </div>
    </ContentCard>
  );
}
