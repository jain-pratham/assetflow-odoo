'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { PageContainer } from '@/components/layout/PageContainer';
import { ContentCard } from '@/components/layout/ContentCard';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ArrowLeft, Edit } from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';

export default function DepartmentViewPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [loading, setLoading] = useState(true);
  const [dept, setDept] = useState<any>(null);

  useEffect(() => {
    const fetchDepartment = async () => {
      try {
        const res = await api.get(`/departments/${id}`);
        if (res.data.success) {
          setDept(res.data.data);
        }
      } catch (err: any) {
        toast.error('Failed to load department details');
        router.push('/organization/departments');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchDepartment();
  }, [id, router]);

  if (loading) {
    return (
      <PageContainer>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded w-full max-w-4xl"></div>
        </div>
      </PageContainer>
    );
  }

  if (!dept) return null;

  return (
    <PageContainer>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/organization/departments')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{dept.name}</h1>
            <p className="text-muted-foreground mt-1 font-mono">{dept.code}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => router.push(`/organization/departments/${dept._id}/edit`)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Department
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ContentCard className="p-6">
            <h3 className="text-lg font-semibold mb-4">Department Details</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <span className="text-xs text-muted-foreground uppercase font-semibold">Department Name</span>
                <p className="mt-1 font-medium text-foreground">{dept.name}</p>
              </div>
              
              <div>
                <span className="text-xs text-muted-foreground uppercase font-semibold">Department Code</span>
                <p className="mt-1 font-medium font-mono text-foreground">{dept.code}</p>
              </div>

              <div className="sm:col-span-2">
                <span className="text-xs text-muted-foreground uppercase font-semibold">Description</span>
                <p className="mt-1 text-foreground">{dept.description || <span className="text-muted-foreground italic">No description provided</span>}</p>
              </div>
              
              <div>
                <span className="text-xs text-muted-foreground uppercase font-semibold">Created Date</span>
                <p className="mt-1 text-foreground">{new Date(dept.createdAt).toLocaleString()}</p>
              </div>
              
              <div>
                <span className="text-xs text-muted-foreground uppercase font-semibold">Last Updated</span>
                <p className="mt-1 text-foreground">{new Date(dept.updatedAt).toLocaleString()}</p>
              </div>
            </div>
          </ContentCard>
        </div>

        <div className="space-y-6">
          <ContentCard className="p-6">
            <h3 className="text-lg font-semibold mb-4">Summary</h3>
            
            <div className="space-y-4">
              <div>
                <span className="text-xs text-muted-foreground uppercase font-semibold">Status</span>
                <div className="mt-1">
                  <StatusBadge status={dept.status} />
                </div>
              </div>

              <div>
                <span className="text-xs text-muted-foreground uppercase font-semibold">Total Employees</span>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-2xl font-bold text-foreground">{dept.employeeCount}</span>
                  <span className="text-sm text-muted-foreground">Active members</span>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <span className="text-xs text-muted-foreground uppercase font-semibold">Department Head</span>
                <div className="mt-2">
                  {dept.headId ? (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0 uppercase">
                        {dept.headId.firstName?.[0]}{dept.headId.lastName?.[0]}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold">{dept.headId.firstName} {dept.headId.lastName}</span>
                        <span className="text-xs text-muted-foreground">{dept.headId.email}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-muted/30 border border-border text-center">
                      <span className="text-sm text-muted-foreground italic">No Department Head Assigned</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ContentCard>
        </div>
      </div>
    </PageContainer>
  );
}
