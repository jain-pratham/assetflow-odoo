'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { ContentCard } from '@/components/layout/ContentCard';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { SearchBar } from '@/components/ui/SearchBar';
import { Pagination } from '@/components/ui/Pagination';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { MoreVertical, Search, X, Plus } from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';

// Custom Action Menu Component for Departments
function ActionMenu({ row, onToggleStatus }: { row: any, onToggleStatus: (id: string, current: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setIsOpen(!isOpen)}>
        <MoreVertical className="w-4 h-4 text-muted-foreground" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-card border border-border z-50 overflow-hidden">
          <div className="py-1" role="menu" aria-orientation="vertical">
            <button
              onClick={() => router.push(`/organization/departments/${row._id}`)}
              className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted/50 transition-colors"
              role="menuitem"
            >
              View Details
            </button>
            <button
              onClick={() => router.push(`/organization/departments/${row._id}/edit`)}
              className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted/50 transition-colors"
              role="menuitem"
            >
              Edit Department
            </button>
            <button
              onClick={() => {
                onToggleStatus(row._id, row.status);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${row.status === 'ACTIVE' ? 'text-rose-500 hover:bg-rose-500/10' : 'text-emerald-500 hover:bg-emerald-500/10'}`}
              role="menuitem"
            >
              {row.status === 'ACTIVE' ? 'Deactivate Department' : 'Activate Department'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DepartmentsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchDepartments = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '10');
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);

      const res = await api.get(`/departments?${params.toString()}`);
      if (res.data.success) {
        setData(res.data.data);
        setTotalPages(res.data.pagination?.pages || 1);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to load departments');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const toggleStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const res = await api.patch(`/departments/${id}/status`, { status: newStatus });
      if (res.data.success) {
        toast.success(`Department marked as ${newStatus}`);
        fetchDepartments();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update status');
    }
  };

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPage(1);
  };

  const columns: ColumnDef<any>[] = [
    { 
      header: 'Name', 
      cell: (row) => <span className="font-semibold">{row.name}</span>
    },
    { 
      header: 'Code', 
      cell: (row) => <span className="text-muted-foreground font-mono">{row.code}</span> 
    },
    { 
      header: 'Department Head', 
      cell: (row) => row.head ? (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-[10px] shrink-0 uppercase">
            {row.head.firstName?.[0]}{row.head.lastName?.[0]}
          </div>
          <span className="font-medium text-sm">{row.head.firstName} {row.head.lastName}</span>
        </div>
      ) : <span className="text-muted-foreground italic text-sm">Not Assigned</span>
    },
    { 
      header: 'Description', 
      cell: (row) => <span className="text-muted-foreground text-sm line-clamp-1 max-w-[200px]" title={row.description}>{row.description || '—'}</span>
    },
    {
      header: 'Employees',
      cell: (row) => (
        <span className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-secondary/50 text-xs font-medium border border-border">
          {row.employeeCount}
        </span>
      )
    },
    { 
      header: 'Status', 
      cell: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Created Date',
      cell: (row) => <span className="text-muted-foreground text-sm">{new Date(row.createdAt).toLocaleDateString()}</span>
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (row) => (
        <div className="flex justify-end pr-2">
          <ActionMenu row={row} onToggleStatus={toggleStatus} />
        </div>
      )
    }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Departments"
        description="Manage company departments."
        actions={
          <Button onClick={() => router.push('/organization/departments/create')} className="flex items-center gap-2 w-full md:w-auto">
            <Plus className="w-4 h-4" /> Add Department
          </Button>
        }
      />

      <ContentCard className="mb-6 p-5">
        <div className="flex flex-col md:flex-row items-center gap-4 w-full">
          <div className="flex-1 w-full md:w-auto">
            <SearchBar 
              placeholder="Search by Name or Code" 
              value={search}
              onSearch={(val) => { setSearch(val); setPage(1); }} 
              className="max-w-full"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <select 
              className="bg-background border border-border text-sm rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            <Button variant="outline" size="sm" onClick={resetFilters} className="h-9 px-3 flex items-center gap-2">
              <X className="w-4 h-4" /> Reset Filters
            </Button>
          </div>
        </div>
      </ContentCard>

      <DataTable 
        data={data} 
        columns={columns} 
        isLoading={loading} 
        emptyMessage="No departments found matching your criteria."
        className="mb-4"
      />

      <div className="flex justify-end">
        <Pagination 
          currentPage={page} 
          totalPages={totalPages} 
          onPageChange={setPage} 
        />
      </div>
    </PageContainer>
  );
}