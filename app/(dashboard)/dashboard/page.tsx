'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { PageContainer } from '@/components/layout/PageContainer';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardKPIs } from '@/components/dashboard/DashboardKPIs';
import { DashboardCharts } from '@/components/dashboard/DashboardCharts';
import { DashboardQuickActions } from '@/components/dashboard/DashboardQuickActions';
import { DashboardRecentTables } from '@/components/dashboard/DashboardRecentTables';
import { DashboardTimeline } from '@/components/dashboard/DashboardTimeline';
import api from '@/services/api';

const fetcher = (url: string) => api.get(url).then(res => res.data);

export default function DashboardPage() {
  const [filters, setFilters] = useState({ dateRange: '', departmentId: '' });

  // Convert filters to query string
  const queryParams = new URLSearchParams();
  if (filters.dateRange) queryParams.append('dateRange', filters.dateRange);
  if (filters.departmentId) queryParams.append('departmentId', filters.departmentId);
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

  // Use the API service prefix (assuming axios instance `api` prefixes `/api`)
  const { data: stats, isLoading: statsLoading } = useSWR(`/dashboard/stats${queryString}`, fetcher);
  const { data: charts, isLoading: chartsLoading } = useSWR(`/dashboard/charts${queryString}`, fetcher);
  const { data: recent, isLoading: recentLoading } = useSWR(`/dashboard/recent${queryString}`, fetcher);

  return (
    <PageContainer>
      <DashboardHeader filters={filters} setFilters={setFilters} />
      
      <div className="space-y-6">
        <DashboardKPIs stats={stats} isLoading={statsLoading} />
        
        <DashboardCharts charts={charts} isLoading={chartsLoading} />
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <DashboardQuickActions />
            <DashboardRecentTables data={recent} isLoading={recentLoading} />
          </div>
          <div className="xl:col-span-1">
            <DashboardTimeline activities={recent?.activity} isLoading={recentLoading} />
          </div>
        </div>
      </div>
    </PageContainer>
  );
}