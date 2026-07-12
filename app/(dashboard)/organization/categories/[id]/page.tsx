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

export default function CategoryViewPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState<any>(null);

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const res = await api.get(`/categories/${id}`);
        if (res.data.success) {
          setCat(res.data.data);
        }
      } catch (err: any) {
        toast.error('Failed to load category details');
        router.push('/organization/categories');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchCategory();
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

  if (!cat) return null;

  return (
    <PageContainer>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/organization/categories')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{cat.name}</h1>
            <p className="text-muted-foreground mt-1 font-mono">{cat.code}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => router.push(`/organization/categories/${cat._id}/edit`)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Category
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ContentCard className="p-6">
            <h3 className="text-lg font-semibold mb-4">Category Information</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <span className="text-xs text-muted-foreground uppercase font-semibold">Category Name</span>
                <p className="mt-1 font-medium text-foreground">{cat.name}</p>
              </div>
              
              <div>
                <span className="text-xs text-muted-foreground uppercase font-semibold">Category Code</span>
                <p className="mt-1 font-medium font-mono text-foreground">{cat.code}</p>
              </div>

              <div className="sm:col-span-2">
                <span className="text-xs text-muted-foreground uppercase font-semibold">Description</span>
                <p className="mt-1 text-foreground">{cat.description || <span className="text-muted-foreground italic">No description provided</span>}</p>
              </div>
              
              <div>
                <span className="text-xs text-muted-foreground uppercase font-semibold">Default Warranty</span>
                <p className="mt-1 text-foreground">{cat.defaultWarrantyMonths} Months</p>
              </div>
            </div>
          </ContentCard>
          
          <ContentCard className="p-6">
            <h3 className="text-lg font-semibold mb-4">System Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <span className="text-xs text-muted-foreground uppercase font-semibold">Created Date</span>
                <p className="mt-1 text-foreground">{new Date(cat.createdAt).toLocaleString()}</p>
              </div>
              
              <div>
                <span className="text-xs text-muted-foreground uppercase font-semibold">Updated Date</span>
                <p className="mt-1 text-foreground">{new Date(cat.updatedAt).toLocaleString()}</p>
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
                  <StatusBadge status={cat.status} />
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <span className="text-xs text-muted-foreground uppercase font-semibold">Assets Count</span>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-3xl font-bold text-foreground">{cat.assetsCount}</span>
                  <span className="text-sm text-muted-foreground">Registered assets</span>
                </div>
              </div>
            </div>
          </ContentCard>
        </div>
      </div>
    </PageContainer>
  );
}
