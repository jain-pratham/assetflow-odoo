'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageContainer } from '@/components/layout/PageContainer';
import { ContentCard } from '@/components/layout/ContentCard';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { SearchBar } from '@/components/ui/SearchBar';
import { Pagination } from '@/components/ui/Pagination';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { RoleBadge } from '@/components/ui/RoleBadge';
import { Button } from '@/components/ui/button';
import { MoreVertical, Search, X } from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';

// Custom Action Menu Component to handle individual row states cleanly
function ActionMenu({ row, onToggleStatus, onEdit }: { row: any, onToggleStatus: (id: string, current: string) => void, onEdit: (row: any) => void }) {
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

  const isAdmin = row.role === 'ADMIN';

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setIsOpen(!isOpen)}>
        <MoreVertical className="w-4 h-4 text-muted-foreground" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-card border border-border z-50 overflow-hidden">
          <div className="py-1" role="menu" aria-orientation="vertical">
            <button
              onClick={() => router.push(`/organization/employees/${row._id}`)}
              className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted/50 transition-colors"
              role="menuitem"
            >
              View Details
            </button>
            {!isAdmin && (
              <>
                <button
                  onClick={() => {
                    onEdit(row);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted/50 transition-colors"
                  role="menuitem"
                >
                  Edit Assignment
                </button>
                <button
                  onClick={() => {
                    onToggleStatus(row._id, row.status);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${row.status === 'ACTIVE' ? 'text-rose-500 hover:bg-rose-500/10' : 'text-emerald-500 hover:bg-emerald-500/10'}`}
                  role="menuitem"
                >
                  {row.status === 'ACTIVE' ? 'Deactivate User' : 'Activate User'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function RoleChangeModal({ employee, departments, onClose, onRefresh }: { employee: any, departments: any[], onClose: () => void, onRefresh: () => void }) {
  const [formData, setFormData] = useState({
    departmentId: employee.departmentId?._id || '',
    role: employee.role || '',
    status: employee.status || ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        departmentId: formData.departmentId || null,
        role: formData.role,
        status: formData.status
      };
      
      const res = await api.put(`/users/${employee._id}`, payload);
      if (res.data.success) {
        toast.success('Employee updated successfully');
        onRefresh();
        onClose();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update employee');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card w-full max-w-md rounded-lg shadow-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-bold">Edit Assignment</h3>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
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
          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving || departments.length === 0}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EmployeesPage() {
  const [data, setData] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  const [editingEmployee, setEditingEmployee] = useState<any>(null);

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await api.get('/departments');
      if (res.data.success) {
        setDepartments(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load departments");
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '10');
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (roleFilter) params.append('role', roleFilter);
      if (deptFilter) params.append('departmentId', deptFilter);

      const res = await api.get(`/users?${params.toString()}`);
      if (res.data.success) {
        setData(res.data.data.users);
        setTotalPages(res.data.data.pagination.pages);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, roleFilter, deptFilter]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const toggleStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const res = await api.patch(`/users/${id}/status`, { status: newStatus });
      if (res.data.success) {
        toast.success(`User marked as ${newStatus}`);
        fetchEmployees();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update status');
    }
  };

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setRoleFilter('');
    setDeptFilter('');
    setPage(1);
  };

  const columns: ColumnDef<any>[] = [
    {
      header: 'Employee',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0 uppercase">
            {row.firstName?.[0]}{row.lastName?.[0]}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold">{row.firstName} {row.lastName}</span>
            <span className="text-xs text-muted-foreground">{row.email}</span>
          </div>
        </div>
      )
    },
    { header: 'Phone', accessorKey: 'phone' },
    { 
      header: 'Department', 
      cell: (row) => row.departmentId ? <span className="font-medium">{row.departmentId.name}</span> : <span className="text-muted-foreground italic">No Department</span>
    },
    { 
      header: 'Role', 
      cell: (row) => <RoleBadge role={row.role} />
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
          <ActionMenu row={row} onToggleStatus={toggleStatus} onEdit={setEditingEmployee} />
        </div>
      )
    }
  ];

  return (
    <PageContainer>
      <div className="mb-6">
        <p className="text-muted-foreground mt-2">Manage employees, assign departments and roles.</p>
      </div>

      <ContentCard className="mb-6 p-5">
        <div className="flex flex-col md:flex-row items-center gap-4 w-full">
          <div className="flex-1 w-full md:w-auto">
            <SearchBar 
              placeholder="Search by Name, Email or Phone" 
              value={search}
              onSearch={(val) => { setSearch(val); setPage(1); }} 
              className="max-w-full"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <select 
              className="bg-background border border-border text-sm rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Roles</option>
              <option value="EMPLOYEE">Employee</option>
              <option value="ASSET_MANAGER">Asset Manager</option>
              <option value="DEPARTMENT_HEAD">Department Head</option>
              <option value="ADMIN">Admin</option>
            </select>

            <select 
              className="bg-background border border-border text-sm rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              value={deptFilter}
              onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>

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
        emptyMessage="No employees found matching your criteria."
        className="mb-4"
      />

      <div className="flex justify-end">
        <Pagination 
          currentPage={page} 
          totalPages={totalPages} 
          onPageChange={setPage} 
        />
      </div>

      {editingEmployee && (
        <RoleChangeModal 
          employee={editingEmployee} 
          departments={departments} 
          onClose={() => setEditingEmployee(null)} 
          onRefresh={fetchEmployees}
        />
      )}
    </PageContainer>
  );
}