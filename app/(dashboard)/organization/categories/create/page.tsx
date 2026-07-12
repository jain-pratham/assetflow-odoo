'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageContainer } from '@/components/layout/PageContainer';
import { ContentCard } from '@/components/layout/ContentCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save } from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';

function generateCategoryCode(name: string): string {
  if (!name || name.trim() === '') return '';
  
  const words = name.trim().split(/\s+/);
  
  let code = '';
  if (words.length === 1) {
    // Single word: take first 3 letters
    code = words[0].substring(0, 3);
  } else {
    // Multiple words: take first letter of up to first 3 words
    code = words.slice(0, 3).map(w => w[0]).join('');
  }
  
  return code.toUpperCase();
}

export default function CreateCategoryPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    defaultWarrantyMonths: 0,
    status: 'ACTIVE'
  });

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const generatedCode = generateCategoryCode(name);
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
        defaultWarrantyMonths: Number(formData.defaultWarrantyMonths) || 0,
        status: formData.status
      };

      const res = await api.post('/categories', payload);
      if (res.data.success) {
        toast.success('Category created successfully');
        router.push('/organization/categories');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create category');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/organization/categories')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Create Category</h1>
            <p className="text-muted-foreground mt-1">Add a new asset category to the organization.</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl">
        <ContentCard className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Category Name <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  className="w-full bg-background border border-border text-sm rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                  placeholder="e.g. Laptop"
                  value={formData.name}
                  onChange={handleNameChange}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Category Code <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  maxLength={20}
                  className="w-full bg-background border border-border text-sm rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 uppercase"
                  placeholder="e.g. LAP"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Will be auto-uppercased.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Default Warranty (Months)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full bg-background border border-border text-sm rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                  placeholder="e.g. 12"
                  value={formData.defaultWarrantyMonths}
                  onChange={(e) => setFormData({ ...formData, defaultWarrantyMonths: parseInt(e.target.value) || 0 })}
                />
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
                placeholder="Brief description of the category..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="pt-4 border-t border-border flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => router.push('/organization/categories')}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Creating...' : 'Create Category'}
              </Button>
            </div>
          </form>
        </ContentCard>
      </div>
    </PageContainer>
  );
}
