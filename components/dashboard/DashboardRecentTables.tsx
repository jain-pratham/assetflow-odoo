'use client';

import { ContentCard } from '@/components/layout/ContentCard';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Eye } from 'lucide-react';

export function DashboardRecentTables({ data, isLoading }: { data: any, isLoading: boolean }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('assets');

  const tabs = [
    { id: 'assets', label: 'Assets' },
    { id: 'employees', label: 'Employees' },
    { id: 'bookings', label: 'Bookings' },
    { id: 'maintenance', label: 'Maintenance' },
    { id: 'audits', label: 'Audits' }
  ];

  if (isLoading) {
    return (
      <ContentCard className="p-5 min-h-[400px]">
        <div className="flex gap-2 border-b border-border pb-2 mb-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 w-24 bg-muted rounded animate-pulse"></div>
          ))}
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-muted rounded animate-pulse"></div>
          ))}
        </div>
      </ContentCard>
    );
  }

  return (
    <ContentCard className="flex flex-col overflow-hidden min-h-[400px]">
      <div className="p-5 pb-0 border-b border-border bg-muted/20">
        <div className="flex overflow-x-auto hide-scrollbar gap-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "pb-3 text-sm font-medium transition-colors whitespace-nowrap border-b-2",
                activeTab === tab.id 
                  ? "border-primary text-primary" 
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-0 overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
            {activeTab === 'assets' && (
              <tr>
                <th className="px-4 py-3 font-medium">Tag</th>
                <th className="px-4 py-3 font-medium">Asset Name</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            )}
            {activeTab === 'employees' && (
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            )}
            {activeTab === 'bookings' && (
              <tr>
                <th className="px-4 py-3 font-medium">Resource</th>
                <th className="px-4 py-3 font-medium">Employee</th>
                <th className="px-4 py-3 font-medium">Date & Time</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            )}
            {activeTab === 'maintenance' && (
              <tr>
                <th className="px-4 py-3 font-medium">Req ID</th>
                <th className="px-4 py-3 font-medium">Asset</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            )}
            {activeTab === 'audits' && (
              <tr>
                <th className="px-4 py-3 font-medium">Audit #</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Auditor</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            )}
          </thead>
          <tbody className="divide-y divide-border">
            {activeTab === 'assets' && data?.assets?.map((asset: any) => (
              <tr key={asset._id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium">{asset.tag}</td>
                <td className="px-4 py-3">{asset.name}</td>
                <td className="px-4 py-3">{asset.category?.name}</td>
                <td className="px-4 py-3"><StatusBadge status={asset.status} /></td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="sm" onClick={() => router.push(`/assets/${asset._id}`)}><Eye className="w-4 h-4" /></Button>
                </td>
              </tr>
            ))}
            
            {activeTab === 'employees' && data?.employees?.map((emp: any) => (
              <tr key={emp._id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium">{emp.firstName} {emp.lastName}</td>
                <td className="px-4 py-3 text-xs">{emp.role?.replace('_', ' ')}</td>
                <td className="px-4 py-3">{emp.departmentId?.name || '-'}</td>
                <td className="px-4 py-3"><StatusBadge status={emp.status} /></td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="sm" onClick={() => router.push(`/organization/employees/${emp._id}/edit`)}><Eye className="w-4 h-4" /></Button>
                </td>
              </tr>
            ))}

            {activeTab === 'bookings' && data?.bookings?.map((booking: any) => (
              <tr key={booking._id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium">{booking.resourceId?.name}</td>
                <td className="px-4 py-3">{booking.employeeId?.firstName} {booking.employeeId?.lastName}</td>
                <td className="px-4 py-3">
                  {format(new Date(booking.bookingDate), 'MMM d, yyyy')} <br/>
                  <span className="text-xs text-muted-foreground">{booking.startTime} - {booking.endTime}</span>
                </td>
                <td className="px-4 py-3"><StatusBadge status={booking.status} /></td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="sm" onClick={() => router.push(`/booking`)}><Eye className="w-4 h-4" /></Button>
                </td>
              </tr>
            ))}

            {activeTab === 'maintenance' && data?.maintenance?.map((maint: any) => (
              <tr key={maint._id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium">{maint.requestId}</td>
                <td className="px-4 py-3">{maint.assetId?.name}</td>
                <td className="px-4 py-3">
                  <span className={cn("px-2 py-1 rounded-full text-[10px] font-bold", 
                    maint.priority === 'CRITICAL' ? 'bg-rose-500/10 text-rose-500' :
                    maint.priority === 'HIGH' ? 'bg-orange-500/10 text-orange-500' :
                    maint.priority === 'MEDIUM' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'
                  )}>{maint.priority}</span>
                </td>
                <td className="px-4 py-3"><StatusBadge status={maint.status} /></td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="sm" onClick={() => router.push(`/maintenance`)}><Eye className="w-4 h-4" /></Button>
                </td>
              </tr>
            ))}

            {activeTab === 'audits' && data?.audits?.map((audit: any) => (
              <tr key={audit._id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium">{audit.auditNumber}</td>
                <td className="px-4 py-3">{audit.name}</td>
                <td className="px-4 py-3">{audit.assignedAuditor?.firstName} {audit.assignedAuditor?.lastName}</td>
                <td className="px-4 py-3"><StatusBadge status={audit.status} /></td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="sm" onClick={() => router.push(`/audit`)}><Eye className="w-4 h-4" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {(!data || data[activeTab]?.length === 0) && (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No recent records found.
          </div>
        )}
      </div>
    </ContentCard>
  );
}
