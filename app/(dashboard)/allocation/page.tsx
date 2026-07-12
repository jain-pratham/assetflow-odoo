'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { ContentCard } from '@/components/layout/ContentCard';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { SearchBar } from '@/components/ui/SearchBar';
import { Pagination } from '@/components/ui/Pagination';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { MoreVertical, Search, X, Plus, ArrowRightLeft, CornerUpLeft, History } from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { ROLES } from '@/constants/roles';

function AllocateModal({ isOpen, onClose, onSaved }: any) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ assetId: '', employeeId: '', departmentId: '', expectedReturnDate: '', remarks: '' });
  const [assets, setAssets] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      Promise.all([
        api.get('/assets?limit=500&status=AVAILABLE'),
        api.get('/departments?limit=100&status=ACTIVE'),
        api.get('/users?limit=500&status=ACTIVE')
      ]).then(([assRes, depRes, empRes]) => {
        if (assRes.data.success) setAssets(assRes.data.data);
        if (depRes.data.success) setDepartments(depRes.data.data);
        if (empRes.data.success) setEmployees(empRes.data.data.users || []);
      });
      setFormData({ assetId: '', employeeId: '', departmentId: '', expectedReturnDate: '', remarks: '' });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.post('/allocations', formData);
      toast.success('Asset allocated successfully');
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to allocate asset');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-background/80 backdrop-blur-sm">
      <div className="bg-card w-full max-w-md h-full shadow-xl overflow-y-auto border-l border-border animate-in slide-in-from-right">
        <div className="p-6 flex items-center justify-between border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-xl font-semibold">Allocate Asset</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Asset *</label>
              <select required className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" value={formData.assetId} onChange={(e) => setFormData({...formData, assetId: e.target.value})}>
                <option value="">Select Available Asset</option>
                {assets.map(a => <option key={a._id} value={a._id}>{a.name} ({a.tag})</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Department *</label>
              <select required className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" value={formData.departmentId} onChange={(e) => setFormData({...formData, departmentId: e.target.value})}>
                <option value="">Select Department</option>
                {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Employee *</label>
              <select required className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" value={formData.employeeId} onChange={(e) => setFormData({...formData, employeeId: e.target.value})}>
                <option value="">Select Employee</option>
                {employees.map(e => <option key={e._id} value={e._id}>{e.firstName} {e.lastName}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Expected Return Date</label>
              <input type="date" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" value={formData.expectedReturnDate} onChange={(e) => setFormData({...formData, expectedReturnDate: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Remarks</label>
              <textarea rows={3} maxLength={500} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" value={formData.remarks} onChange={(e) => setFormData({...formData, remarks: e.target.value})} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-border sticky bottom-0 bg-card py-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Allocate'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TransferModal({ isOpen, onClose, onSaved, initialAllocation }: any) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ newEmployeeId: '', newDepartmentId: '', remarks: '' });
  const [departments, setDepartments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      Promise.all([
        api.get('/departments?limit=100&status=ACTIVE'),
        api.get('/users?limit=500&status=ACTIVE')
      ]).then(([depRes, empRes]) => {
        if (depRes.data.success) setDepartments(depRes.data.data);
        if (empRes.data.success) setEmployees(empRes.data.data.users || []);
      });
      setFormData({ newEmployeeId: '', newDepartmentId: '', remarks: '' });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.put(`/allocations/${initialAllocation._id}/transfer`, formData);
      toast.success('Asset transferred successfully');
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to transfer asset');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-md rounded-xl shadow-xl overflow-hidden border border-border animate-in fade-in zoom-in-95">
        <div className="p-5 flex items-center justify-between border-b border-border bg-muted/30">
          <h2 className="text-xl font-semibold">Transfer Asset</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-secondary/50 rounded-md mb-4 border border-border">
            <p className="text-sm font-medium">Asset: {initialAllocation?.assetId?.name} ({initialAllocation?.assetId?.tag})</p>
            <p className="text-xs text-muted-foreground mt-1">Currently assigned to: {initialAllocation?.employeeId?.firstName} {initialAllocation?.employeeId?.lastName}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">New Department *</label>
            <select required className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" value={formData.newDepartmentId} onChange={(e) => setFormData({...formData, newDepartmentId: e.target.value})}>
              <option value="">Select Department</option>
              {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">New Employee *</label>
            <select required className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" value={formData.newEmployeeId} onChange={(e) => setFormData({...formData, newEmployeeId: e.target.value})}>
              <option value="">Select Employee</option>
              {employees.map(e => <option key={e._id} value={e._id}>{e.firstName} {e.lastName}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Reason for Transfer</label>
            <textarea rows={3} maxLength={500} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" value={formData.remarks} onChange={(e) => setFormData({...formData, remarks: e.target.value})} />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Transfer'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ReturnModal({ isOpen, onClose, onSaved, initialAllocation }: any) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ condition: 'GOOD', remarks: '' });

  useEffect(() => {
    if (isOpen) {
      setFormData({ condition: initialAllocation?.assetId?.condition || 'GOOD', remarks: '' });
    }
  }, [isOpen, initialAllocation]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.put(`/allocations/${initialAllocation._id}/return`, formData);
      toast.success('Asset returned successfully');
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to return asset');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-md rounded-xl shadow-xl overflow-hidden border border-border animate-in fade-in zoom-in-95">
        <div className="p-5 flex items-center justify-between border-b border-border bg-muted/30">
          <h2 className="text-xl font-semibold">Return Asset</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-secondary/50 rounded-md mb-4 border border-border">
            <p className="text-sm font-medium">Asset: {initialAllocation?.assetId?.name} ({initialAllocation?.assetId?.tag})</p>
            <p className="text-xs text-muted-foreground mt-1">Assigned to: {initialAllocation?.employeeId?.firstName} {initialAllocation?.employeeId?.lastName}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Current Condition *</label>
            <select required className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" value={formData.condition} onChange={(e) => setFormData({...formData, condition: e.target.value})}>
              <option value="EXCELLENT">Excellent</option>
              <option value="GOOD">Good</option>
              <option value="FAIR">Fair</option>
              <option value="POOR">Poor</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Remarks</label>
            <textarea rows={3} maxLength={500} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" value={formData.remarks} onChange={(e) => setFormData({...formData, remarks: e.target.value})} />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Return'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Custom Action Menu
function ActionMenu({ row, onTransfer, onReturn, canEdit }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!canEdit || row.status !== 'ACTIVE') return null;

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setIsOpen(!isOpen)}>
        <MoreVertical className="w-4 h-4 text-muted-foreground" />
      </Button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-card border border-border z-50 overflow-hidden">
          <div className="py-1">
            <button onClick={() => { onTransfer(row); setIsOpen(false); }} className="w-full flex items-center px-4 py-2 text-sm text-foreground hover:bg-muted/50">
              <ArrowRightLeft className="w-4 h-4 mr-2" /> Transfer Asset
            </button>
            <button onClick={() => { onReturn(row); setIsOpen(false); }} className="w-full flex items-center px-4 py-2 text-sm text-foreground hover:bg-muted/50">
              <CornerUpLeft className="w-4 h-4 mr-2" /> Return Asset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AllocationPage() {
  const [viewMode, setViewMode] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE');
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ allocated: 0, returned: 0, transfers: 0, available: 0 });
  const [loading, setLoading] = useState(true);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [isAllocateOpen, setIsAllocateOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState<any>(null);

  const { user } = useSelector((state: RootState) => state.auth);
  const canEdit = [ROLES.ADMIN, ROLES.ASSET_MANAGER, ROLES.DEPARTMENT_HEAD].includes(user?.role as any);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch Stats
      const statRes = await api.get('/allocations/stats');
      if (statRes.data.success) setStats(statRes.data.data);

      // Fetch Table
      const endpoint = viewMode === 'HISTORY' ? '/allocations/history' : '/allocations';
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '10');

      const res = await api.get(`${endpoint}?${params.toString()}`);
      if (res.data.success) {
        setData(res.data.data);
        setTotalPages(res.data.pagination?.pages || 1);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to load allocations');
    } finally {
      setLoading(false);
    }
  }, [page, viewMode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activeColumns: ColumnDef<any>[] = [
    { header: 'Asset Tag', cell: (row) => <span className="font-mono text-primary font-medium">{row.assetId?.tag}</span> },
    { header: 'Asset Name', cell: (row) => <span className="font-semibold">{row.assetId?.name}</span> },
    { header: 'Assigned Employee', cell: (row) => <span className="text-muted-foreground">{row.employeeId?.firstName} {row.employeeId?.lastName}</span> },
    { header: 'Department', cell: (row) => <span className="text-muted-foreground">{row.departmentId?.name}</span> },
    { header: 'Allocated Date', cell: (row) => <span className="text-muted-foreground text-sm">{new Date(row.allocatedAt).toLocaleDateString()}</span> },
    { header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (row) => (
        <div className="flex justify-end pr-2">
          <ActionMenu 
            row={row} 
            canEdit={canEdit} 
            onTransfer={(r: any) => { setSelectedAllocation(r); setIsTransferOpen(true); }}
            onReturn={(r: any) => { setSelectedAllocation(r); setIsReturnOpen(true); }}
          />
        </div>
      )
    }
  ];

  const historyColumns: ColumnDef<any>[] = [
    { header: 'Date', cell: (row) => <span className="text-muted-foreground text-sm">{new Date(row.createdAt).toLocaleDateString()}</span> },
    { header: 'Action', cell: (row) => (
      <span className={`text-xs px-2 py-1 rounded-full border ${
        row.action === 'ALLOCATED' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 
        row.action === 'TRANSFERRED' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
        'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
      }`}>
        {row.action}
      </span>
    )},
    { header: 'Asset', cell: (row) => <span>{row.assetId?.name} <span className="text-muted-foreground font-mono">({row.assetId?.tag})</span></span> },
    { header: 'Employee', cell: (row) => <span className="text-muted-foreground">{row.newEmployeeId ? `${row.newEmployeeId.firstName} ${row.newEmployeeId.lastName}` : (row.oldEmployeeId ? `${row.oldEmployeeId.firstName} ${row.oldEmployeeId.lastName}` : '—')}</span> },
    { header: 'Performed By', cell: (row) => <span className="text-muted-foreground text-sm">{row.performedBy?.firstName} {row.performedBy?.lastName}</span> },
  ];

  return (
    <PageContainer>
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Allocation & Transfer</h1>
          <p className="text-muted-foreground mt-1">Manage asset allocation, transfers, returns and complete history.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {canEdit && (
            <Button onClick={() => setIsAllocateOpen(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> Allocate Asset
            </Button>
          )}
          <Button variant={viewMode === 'HISTORY' ? "default" : "outline"} onClick={() => { setViewMode(viewMode === 'ACTIVE' ? 'HISTORY' : 'ACTIVE'); setPage(1); }} className="flex items-center gap-2">
            <History className="w-4 h-4" /> {viewMode === 'ACTIVE' ? 'View History' : 'Back to Active'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <ContentCard className="p-4 flex flex-col justify-center border-l-4 border-l-blue-500">
          <span className="text-sm font-medium text-muted-foreground">Total Allocated</span>
          <span className="text-3xl font-bold mt-2">{stats.allocated}</span>
        </ContentCard>
        <ContentCard className="p-4 flex flex-col justify-center border-l-4 border-l-emerald-500">
          <span className="text-sm font-medium text-muted-foreground">Available Assets</span>
          <span className="text-3xl font-bold mt-2">{stats.available}</span>
        </ContentCard>
        <ContentCard className="p-4 flex flex-col justify-center border-l-4 border-l-purple-500">
          <span className="text-sm font-medium text-muted-foreground">Returned</span>
          <span className="text-3xl font-bold mt-2">{stats.returned}</span>
        </ContentCard>
        <ContentCard className="p-4 flex flex-col justify-center border-l-4 border-l-amber-500">
          <span className="text-sm font-medium text-muted-foreground">Total Transfers</span>
          <span className="text-3xl font-bold mt-2">{stats.transfers}</span>
        </ContentCard>
      </div>

      <DataTable 
        data={data} 
        columns={viewMode === 'ACTIVE' ? activeColumns : historyColumns} 
        isLoading={loading} 
        emptyMessage={viewMode === 'ACTIVE' ? 'No active allocations found.' : 'No allocation history found.'}
        className="mb-4"
      />

      <div className="flex justify-end">
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {/* Modals */}
      <AllocateModal isOpen={isAllocateOpen} onClose={() => setIsAllocateOpen(false)} onSaved={() => { setViewMode('ACTIVE'); fetchData(); }} />
      <TransferModal isOpen={isTransferOpen} onClose={() => setIsTransferOpen(false)} onSaved={fetchData} initialAllocation={selectedAllocation} />
      <ReturnModal isOpen={isReturnOpen} onClose={() => setIsReturnOpen(false)} onSaved={fetchData} initialAllocation={selectedAllocation} />
    </PageContainer>
  );
}
