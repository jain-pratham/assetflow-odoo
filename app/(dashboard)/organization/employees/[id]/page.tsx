'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { PageContainer } from '@/components/layout/PageContainer';
import { ContentCard } from '@/components/layout/ContentCard';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import api from '@/services/api';
import { toast } from 'sonner';

export default function EmployeeDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();
  const [employee, setEmployee] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    departmentId: '',
    role: '',
    status: ''
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [empRes, deptRes] = await Promise.all([
        api.get(`/users/${id}`),
        api.get('/departments')
      ]);

      if (empRes.data.success) {
        const emp = empRes.data.data;
        setEmployee(emp);
        setFormData({
          departmentId: emp.departmentId?._id || '',
          role: emp.role || '',
          status: emp.status || ''
        });
      }
      
      if (deptRes.data.success) {
        setDepartments(deptRes.data.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to load employee details');
      // Do not redirect on error to preserve the route on refresh
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        departmentId: formData.departmentId || null,
        role: formData.role,
        status: formData.status
      };
      
      const res = await api.put(`/users/${id}`, payload);
      if (res.data.success) {
        toast.success('Employee updated successfully');
        router.push('/organization/employees');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update employee');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <ContentCard className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </ContentCard>
      </PageContainer>
    );
  }

  if (!employee) return null;

  return (
    <PageContainer>
      <PageHeader title="Employee Details" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Read-Only Info */}
        <ContentCard className="md:col-span-1 flex flex-col items-start p-6 min-h-0">
          <div className="flex items-center gap-4 mb-6 w-full pb-6 border-b border-border">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl uppercase">
              {employee.firstName?.[0]}{employee.lastName?.[0]}
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{employee.firstName} {employee.lastName}</h2>
              <StatusBadge status={employee.status} className="mt-1" />
            </div>
          </div>
          
          <div className="space-y-4 w-full">
            <div>
              <span className="text-xs text-muted-foreground uppercase font-semibold">Email</span>
              <p className="text-sm font-medium text-foreground">{employee.email}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground uppercase font-semibold">Phone</span>
              <p className="text-sm font-medium text-foreground">{employee.phone || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground uppercase font-semibold">Current Role</span>
              <p className="text-sm font-medium text-foreground uppercase">{employee.role.replace('_', ' ')}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground uppercase font-semibold">Department</span>
              <p className="text-sm font-medium text-foreground">{employee.departmentId?.name || 'Unassigned'}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground uppercase font-semibold">Created</span>
              <p className="text-sm font-medium text-foreground">{new Date(employee.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground uppercase font-semibold">Last Login</span>
              <p className="text-sm font-medium text-foreground">{employee.lastLogin ? new Date(employee.lastLogin).toLocaleString() : 'Never'}</p>
            </div>
          </div>
        </ContentCard>

        {/* Assignment Form */}
        <ContentCard className="md:col-span-2 p-6 flex flex-col justify-start min-h-0">
          <div className="mb-6 pb-6 border-b border-border">
            <h2 className="text-lg font-bold text-foreground">Role & Assignment</h2>
            <p className="text-sm text-muted-foreground">Manage this employee's access and department placement.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-md">
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Department</label>
              <select
                className="w-full bg-background border border-border text-sm rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
              >
                <option value="">-- Unassigned --</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>{dept.name} ({dept.code})</option>
                ))}
              </select>
              {departments.length === 0 && (
                <p className="text-xs text-amber-500 mt-1">No departments available. Please create a department first.</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Role</label>
              <select
                className="w-full bg-background border border-border text-sm rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="ASSET_MANAGER">Asset Manager</option>
                <option value="DEPARTMENT_HEAD">Department Head</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Status</label>
              <select
                className="w-full bg-background border border-border text-sm rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => router.push('/organization/employees')}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving || departments.length === 0}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </ContentCard>
      </div>
    </PageContainer>
  );
}
