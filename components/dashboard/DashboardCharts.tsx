'use client';

import { ContentCard } from '@/components/layout/ContentCard';
import { useTheme } from 'next-themes';
import {
  ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line,
  AreaChart, Area
} from 'recharts';

const COLORS = ['#0D69B2', '#38BDF8', '#F4882E', '#EC2091', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'];

export function DashboardCharts({ charts, isLoading }: { charts: any, isLoading: boolean }) {
  const { theme } = useTheme();
  
  const isDark = theme === 'dark';
  const textColor = isDark ? '#94A3B8' : '#64748B';
  const gridColor = isDark ? '#1E293B' : '#E2E8F0';
  const tooltipStyle = {
    backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
    borderColor: isDark ? '#1E293B' : '#E2E8F0',
    color: isDark ? '#F8FAFC' : '#0F172A',
    borderRadius: '6px',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <ContentCard key={i} className="p-5 min-h-[300px] animate-pulse">
            <div className="h-4 bg-muted rounded w-1/3 mb-4"></div>
            <div className="h-[200px] bg-muted/50 rounded w-full"></div>
          </ContentCard>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {/* Assets By Category */}
      <ContentCard className="p-5 flex flex-col">
        <h3 className="text-sm font-semibold text-foreground mb-4">Assets By Category</h3>
        <div className="flex-1 min-h-[250px]">
          {charts?.assetsByCategory?.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.assetsByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {charts.assetsByCategory.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
             <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data available</div>
          )}
        </div>
      </ContentCard>

      {/* Assets By Department */}
      <ContentCard className="p-5 flex flex-col">
        <h3 className="text-sm font-semibold text-foreground mb-4">Assets By Department</h3>
        <div className="flex-1 min-h-[250px]">
          {charts?.assetsByDepartment?.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.assetsByDepartment}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="name" stroke={textColor} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={textColor} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: isDark ? '#1E293B' : '#F1F5F9' }} />
                <Bar dataKey="value" fill="#0D69B2" radius={[4, 4, 0, 0]} barSize={32}>
                  {charts.assetsByDepartment.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data available</div>
          )}
        </div>
      </ContentCard>

      {/* Monthly Allocations (Line) */}
      <ContentCard className="p-5 flex flex-col">
        <h3 className="text-sm font-semibold text-foreground mb-4">Monthly Allocation Trend</h3>
        <div className="flex-1 min-h-[250px]">
          {charts?.monthlyAllocations?.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.monthlyAllocations}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="name" stroke={textColor} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={textColor} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="allocations" stroke="#F4882E" strokeWidth={3} dot={{ r: 4, fill: '#F4882E' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data available</div>
          )}
        </div>
      </ContentCard>

      {/* Booking Trends (Area) */}
      <ContentCard className="p-5 flex flex-col">
        <h3 className="text-sm font-semibold text-foreground mb-4">Booking Trends</h3>
        <div className="flex-1 min-h-[250px]">
          {charts?.monthlyBookings?.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.monthlyBookings}>
                <defs>
                  <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="name" stroke={textColor} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={textColor} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="bookings" stroke="#10B981" fillOpacity={1} fill="url(#colorBookings)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data available</div>
          )}
        </div>
      </ContentCard>

      {/* Maintenance Status (Pie) */}
      <ContentCard className="p-5 flex flex-col">
        <h3 className="text-sm font-semibold text-foreground mb-4">Maintenance Status</h3>
        <div className="flex-1 min-h-[250px]">
          {charts?.maintenanceStatus?.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.maintenanceStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {charts.maintenanceStatus.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data available</div>
          )}
        </div>
      </ContentCard>

      {/* Audit Status (Bar) */}
      <ContentCard className="p-5 flex flex-col">
        <h3 className="text-sm font-semibold text-foreground mb-4">Audit Completion</h3>
        <div className="flex-1 min-h-[250px]">
          {charts?.auditStatus?.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.auditStatus} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                <XAxis type="number" stroke={textColor} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke={textColor} fontSize={12} tickLine={false} axisLine={false} width={80} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: isDark ? '#1E293B' : '#F1F5F9' }} />
                <Bar dataKey="value" fill="#8B5CF6" radius={[0, 4, 4, 0]} barSize={24}>
                  {charts.auditStatus.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 5) % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data available</div>
          )}
        </div>
      </ContentCard>
    </div>
  );
}
