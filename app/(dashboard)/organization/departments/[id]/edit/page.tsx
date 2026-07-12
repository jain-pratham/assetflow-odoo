'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { ContentCard } from '@/components/layout/ContentCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save } from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';

export default function EditDepartmentPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [heads, setHeads] = useState<any[]>([]);
  const [loadingHeads, setLoadingHeads] = useState(true);
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    headId: '',
    description: '',
    status: 'ACTIVE'
  });

  useEffect(() => {
    const fetchHeads = async () => {
      try {
        const res = await api.get('/users?role=DEPARTMENT_HEAD&status=ACTIVE&limit=1000');
        if (res.data.success) {
          setHeads(res.data.data.users || []);
        }
      } catch (err) {
        toast.error('Failed to load department heads');
      } finally {
        setLoadingHeads(false);
      }
    };
    fetchHeads();
  }, []);

  useEffect(() => {
    const fetchDepartment = async () => {
      try {
        const res = await api.get(`/departments/${id}`);
        if (res.data.success) {
          const dept = res.data.data;
          setFormData({
            name: dept.name || '',
            code: dept.code || '',
            headId: dept.headId?._id || dept.headId || '',
            description: dept.description || '',
            status: dept.status || 'ACTIVE'
          });
          
          // If the department head is currently assigned but inactive/not in list, fetch them directly 
          // or just assume we preserve the value, but let's assume active constraint applies.
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim() || null,
        headId: formData.headId || null,
        status: formData.status
      };

      const res = await api.put(`/departments/${id}`, payload);
      if (res.data.success) {
        toast.success('Department updated successfully');
        router.push('/organization/departments');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update department');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded w-full max-w-2xl"></div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Edit Department"
        description="Update department details and structure."
        breadcrumbItems={[
          { label: 'Departments', href: '/organization/departments' },
          { label: 'Edit Department' }
        ]}
      />

      <div className="max-w-2xl">
        <ContentCard className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Department Name <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  className="w-full bg-background border border-border text-sm rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Department Code <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  maxLength={20}
                  className="w-full bg-background border border-border text-sm rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 uppercase"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Department Head</label>
                <select
                  className="w-full bg-background border border-border text-sm rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                  value={formData.headId}
                  onChange={(e) => setFormData({ ...formData, headId: e.target.value })}
                  disabled={loadingHeads || heads.length === 0}
                >
                  <option value="">-- No Department Head Assigned --</option>
                  {heads.map(head => (
                    <option key={head._id} value={head._id}>{head.firstName} {head.lastName}</option>
                  ))}
                  {/* Show current head if it was somehow deactivated but is currently assigned */}
                  {formData.headId && !heads.find(h => h._id === formData.headId) && (
                    <option value={formData.headId}>Current Assigned Head (Inactive/Changed)</option>
                  )}
                </select>
                {!loadingHeads && heads.length === 0 && !formData.headId && (
                  <p className="text-xs text-amber-500 mt-1">No active Department Heads available.</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Status <span className="text-rose-500">*</span></label>
                <select
                  required
                  className="w-full bg-background border border-border text-sm rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Description</label>
              <textarea
                maxLength={500}
                rows={4}
                className="w-full bg-background border border-border text-sm rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="pt-4 border-t border-border flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => router.push('/organization/departments')}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </ContentCard>
      </div>
    </PageContainer>
  );
}
