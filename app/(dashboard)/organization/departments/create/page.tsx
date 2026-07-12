'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageContainer } from '@/components/layout/PageContainer';
import { ContentCard } from '@/components/layout/ContentCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save } from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';

export default function CreateDepartmentPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
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

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    // Auto-generate code from name (e.g. "Human Resources" -> "HUMANRESOURCES")
    // Let user overwrite it later if they want
    const generatedCode = name.replace(/\s+/g, '').toUpperCase().slice(0, 20);
    setFormData(prev => ({
      ...prev,
      name,
      code: generatedCode
    }));
  };

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

      const res = await api.post('/departments', payload);
      if (res.data.success) {
        toast.success('Department created successfully');
        router.push('/organization/departments');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create department');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/organization/departments')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Create Department</h1>
            <p className="text-muted-foreground mt-1">Add a new department to the organization.</p>
          </div>
        </div>
      </div>

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
                  placeholder="e.g. Human Resources"
                  value={formData.name}
                  onChange={handleNameChange}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Department Code <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  maxLength={20}
                  className="w-full bg-background border border-border text-sm rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 uppercase"
                  placeholder="e.g. HR"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Will be auto-uppercased.</p>
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
                </select>
                {!loadingHeads && heads.length === 0 && (
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
                placeholder="Brief description of the department's role..."
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
                {saving ? 'Creating...' : 'Create Department'}
              </Button>
            </div>
          </form>
        </ContentCard>
      </div>
    </PageContainer>
  );
}
