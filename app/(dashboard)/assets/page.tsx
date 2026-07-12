'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { PageContainer } from '@/components/layout/PageContainer';
import { ContentCard } from '@/components/layout/ContentCard';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { SearchBar } from '@/components/ui/SearchBar';
import { Pagination } from '@/components/ui/Pagination';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { MoreVertical, Search, X, Plus, Edit, Eye, Archive } from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { ROLES } from '@/constants/roles';

// Modal component for Asset Form
function AssetFormModal({ isOpen, onClose, onSaved, initialData }: any) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '', tag: '', serialNumber: '', category: '', department: '',
    assignedTo: '', purchaseDate: '', purchaseCost: '', vendor: '',
    warrantyMonths: 0, condition: 'GOOD', status: 'AVAILABLE', description: ''
  });
  
  const [categories, setCategories] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Fetch references
      const fetchRefs = async () => {
        try {
          const [catRes, depRes, empRes] = await Promise.all([
            api.get('/categories?limit=100&status=ACTIVE'),
            api.get('/departments?limit=100&status=ACTIVE'),
            api.get('/users?limit=500&status=ACTIVE') // Need all users to assign
          ]);
          if (catRes.data.success) setCategories(catRes.data.data);
          if (depRes.data.success) setDepartments(depRes.data.data);
          if (empRes.data.success) setEmployees(empRes.data.data.users || []);
        } catch (e) {
          console.error(e);
        }
      };
      fetchRefs();

      if (initialData) {
        setFormData({
          name: initialData.name || '',
          tag: initialData.tag || '',
          serialNumber: initialData.serialNumber || '',
          category: initialData.category?._id || '',
          department: initialData.department?._id || '',
          assignedTo: initialData.assignedTo?._id || '',
          purchaseDate: initialData.purchaseDate ? new Date(initialData.purchaseDate).toISOString().split('T')[0] : '',
          purchaseCost: initialData.purchaseCost || '',
          vendor: initialData.vendor || '',
          warrantyMonths: initialData.warrantyMonths || 0,
          condition: initialData.condition || 'GOOD',
          status: initialData.status || 'AVAILABLE',
          description: initialData.description || ''
        });
      } else {
        setFormData({
          name: '', tag: '', serialNumber: '', category: '', department: '',
          assignedTo: '', purchaseDate: '', purchaseCost: '', vendor: '',
          warrantyMonths: 0, condition: 'GOOD', status: 'AVAILABLE', description: ''
        });
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        ...formData,
        purchaseCost: formData.purchaseCost ? Number(formData.purchaseCost) : undefined,
        assignedTo: formData.assignedTo || null,
        purchaseDate: formData.purchaseDate || null
      };

      if (initialData) {
        await api.put(`/assets/${initialData._id}`, payload);
        toast.success('Asset updated successfully');
      } else {
        await api.post('/assets', payload);
        toast.success('Asset registered successfully');
      }
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save asset');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-background/80 backdrop-blur-sm">
      <div className="bg-card w-full max-w-2xl h-full shadow-xl overflow-y-auto border-l border-border animate-in slide-in-from-right">
        <div className="p-6 flex items-center justify-between border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-xl font-semibold">{initialData ? 'Edit Asset' : 'Register New Asset'}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Asset Name *</label>
              <input type="text" required maxLength={100} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Asset Tag *</label>
              <input type="text" required maxLength={50} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm uppercase" value={formData.tag} onChange={(e) => setFormData({...formData, tag: e.target.value.toUpperCase()})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Serial Number *</label>
              <input type="text" required maxLength={100} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" value={formData.serialNumber} onChange={(e) => setFormData({...formData, serialNumber: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Category *</label>
              <select required className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                <option value="">Select Category</option>
                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Department *</label>
              <select required className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})}>
                <option value="">Select Department</option>
                {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Assigned Employee</label>
              <select className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" value={formData.assignedTo} onChange={(e) => setFormData({...formData, assignedTo: e.target.value})}>
                <option value="">None</option>
                {employees.map(e => <option key={e._id} value={e._id}>{e.firstName} {e.lastName}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Purchase Date</label>
              <input type="date" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" value={formData.purchaseDate} onChange={(e) => setFormData({...formData, purchaseDate: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Purchase Cost</label>
              <input type="number" min="0" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" value={formData.purchaseCost} onChange={(e) => setFormData({...formData, purchaseCost: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Vendor</label>
              <input type="text" maxLength={100} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" value={formData.vendor} onChange={(e) => setFormData({...formData, vendor: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Warranty (Months)</label>
              <input type="number" min="0" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" value={formData.warrantyMonths} onChange={(e) => setFormData({...formData, warrantyMonths: Number(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Condition *</label>
              <select required className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" value={formData.condition} onChange={(e) => setFormData({...formData, condition: e.target.value})}>
                <option value="EXCELLENT">Excellent</option>
                <option value="GOOD">Good</option>
                <option value="FAIR">Fair</option>
                <option value="POOR">Poor</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status *</label>
              <select required className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                <option value="AVAILABLE">Available</option>
                <option value="ALLOCATED">Allocated</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="RETIRED">Retired</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <textarea rows={3} maxLength={500} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
          </div>
          
          <div className="flex justify-end gap-3 pt-6 border-t border-border sticky bottom-0 bg-card py-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Asset'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal component for View Asset
function AssetViewModal({ isOpen, onClose, asset }: any) {
  if (!isOpen || !asset) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-lg rounded-xl shadow-xl overflow-hidden border border-border animate-in fade-in zoom-in-95">
        <div className="p-5 flex items-center justify-between border-b border-border bg-muted/30">
          <h2 className="text-xl font-semibold">{asset.name}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase">Asset Tag</p>
              <p className="font-mono">{asset.tag}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase">Serial Number</p>
              <p>{asset.serialNumber}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase">Category</p>
              <p>{asset.category?.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase">Department</p>
              <p>{asset.department?.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase">Assigned To</p>
              <p>{asset.assignedTo ? `${asset.assignedTo.firstName} ${asset.assignedTo.lastName}` : 'Unassigned'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase">Condition</p>
              <p>{asset.condition}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase">Status</p>
              <StatusBadge status={asset.status} />
            </div>
          </div>
          {asset.description && (
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground uppercase">Description</p>
              <p className="text-sm mt-1">{asset.description}</p>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-border bg-muted/30 flex justify-end">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}

// Custom Action Menu
function ActionMenu({ row, onEdit, onView, onToggleStatus, canEdit }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsOpen(false);
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
          <div className="py-1">
            <button
              onClick={() => { onView(row); setIsOpen(false); }}
              className="w-full flex items-center px-4 py-2 text-sm text-foreground hover:bg-muted/50"
            >
              <Eye className="w-4 h-4 mr-2" /> View Details
            </button>
            {canEdit && (
              <>
                <button
                  onClick={() => { onEdit(row); setIsOpen(false); }}
                  className="w-full flex items-center px-4 py-2 text-sm text-foreground hover:bg-muted/50"
                >
                  <Edit className="w-4 h-4 mr-2" /> Edit Asset
                </button>
                <button
                  onClick={() => { onToggleStatus(row._id, row.status === 'RETIRED' ? 'AVAILABLE' : 'RETIRED'); setIsOpen(false); }}
                  className="w-full flex items-center px-4 py-2 text-sm text-rose-500 hover:bg-rose-500/10"
                >
                  <Archive className="w-4 h-4 mr-2" /> {row.status === 'RETIRED' ? 'Re-Activate' : 'Retire Asset'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AssetsPage() {
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ total: 0, available: 0, allocated: 0, maintenance: 0, retired: 0 });
  const [loading, setLoading] = useState(true);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);

  const { user } = useSelector((state: RootState) => state.auth);
  const canEdit = [ROLES.ADMIN, ROLES.ASSET_MANAGER].includes(user?.role || '');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch Stats
      const statRes = await api.get('/assets/stats');
      if (statRes.data.success) setStats(statRes.data.data);

      // Fetch Table
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '10');
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);

      const res = await api.get(`/assets?${params.toString()}`);
      if (res.data.success) {
        setData(res.data.data);
        setTotalPages(res.data.pagination?.pages || 1);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to load assets');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggleStatus = async (id: string, newStatus: string) => {
    try {
      const res = await api.patch(`/assets/${id}/status`, { status: newStatus });
      if (res.data.success) {
        toast.success(`Asset marked as ${newStatus}`);
        fetchData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update status');
    }
  };

  const columns: ColumnDef<any>[] = [
    { header: 'Asset Tag', cell: (row) => <span className="font-mono text-primary font-medium">{row.tag}</span> },
    { header: 'Asset Name', cell: (row) => <span className="font-semibold">{row.name}</span> },
    { header: 'Category', cell: (row) => <span className="text-muted-foreground">{row.category?.name}</span> },
    { header: 'Department', cell: (row) => <span className="text-muted-foreground">{row.department?.name}</span> },
    { header: 'Assigned To', cell: (row) => <span className="text-muted-foreground">{row.assignedTo ? `${row.assignedTo.firstName} ${row.assignedTo.lastName}` : '—'}</span> },
    { header: 'Condition', cell: (row) => <span className="text-xs px-2 py-1 bg-secondary rounded-full border border-border">{row.condition}</span> },
    { header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (row) => (
        <div className="flex justify-end pr-2">
          <ActionMenu 
            row={row} 
            canEdit={canEdit} 
            onEdit={(r: any) => { setSelectedAsset(r); setIsFormOpen(true); }}
            onView={(r: any) => { setSelectedAsset(r); setIsViewOpen(true); }}
            onToggleStatus={handleToggleStatus}
          />
        </div>
      )
    }
  ];

  return (
    <PageContainer>
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Assets</h1>
          <p className="text-muted-foreground mt-1">Manage all organization assets.</p>
        </div>
        {canEdit && (
          <Button onClick={() => { setSelectedAsset(null); setIsFormOpen(true); }} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Register Asset
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <ContentCard className="p-4 flex flex-col justify-center">
          <span className="text-sm font-medium text-muted-foreground">Total Assets</span>
          <span className="text-3xl font-bold mt-2">{stats.total}</span>
        </ContentCard>
        <ContentCard className="p-4 flex flex-col justify-center border-l-4 border-l-emerald-500">
          <span className="text-sm font-medium text-muted-foreground">Available</span>
          <span className="text-3xl font-bold mt-2">{stats.available}</span>
        </ContentCard>
        <ContentCard className="p-4 flex flex-col justify-center border-l-4 border-l-blue-500">
          <span className="text-sm font-medium text-muted-foreground">Allocated</span>
          <span className="text-3xl font-bold mt-2">{stats.allocated}</span>
        </ContentCard>
        <ContentCard className="p-4 flex flex-col justify-center border-l-4 border-l-amber-500">
          <span className="text-sm font-medium text-muted-foreground">Maintenance</span>
          <span className="text-3xl font-bold mt-2">{stats.maintenance}</span>
        </ContentCard>
        <ContentCard className="p-4 flex flex-col justify-center border-l-4 border-l-rose-500">
          <span className="text-sm font-medium text-muted-foreground">Retired</span>
          <span className="text-3xl font-bold mt-2">{stats.retired}</span>
        </ContentCard>
      </div>

      <ContentCard className="mb-6 p-5">
        <div className="flex flex-col md:flex-row items-center gap-4 w-full">
          <div className="flex-1 w-full md:w-auto">
            <SearchBar 
              placeholder="Search by Name, Tag, or Serial Number" 
              value={search}
              onSearch={(val) => { setSearch(val); setPage(1); }} 
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <select 
              className="bg-background border border-border text-sm rounded-md px-3 py-2 text-foreground focus:outline-none"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="ALLOCATED">Allocated</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="RETIRED">Retired</option>
            </select>

            <Button variant="outline" size="sm" onClick={() => { setSearch(''); setStatusFilter(''); setPage(1); }} className="h-9 px-3">
              <X className="w-4 h-4 mr-2" /> Reset
            </Button>
          </div>
        </div>
      </ContentCard>

      <DataTable 
        data={data} 
        columns={columns} 
        isLoading={loading} 
        emptyMessage="No assets found."
        className="mb-4"
      />

      <div className="flex justify-end">
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {/* Modals */}
      <AssetFormModal 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        initialData={selectedAsset}
        onSaved={fetchData} 
      />
      
      <AssetViewModal 
        isOpen={isViewOpen} 
        onClose={() => setIsViewOpen(false)} 
        asset={selectedAsset}
      />
    </PageContainer>
  );
}
