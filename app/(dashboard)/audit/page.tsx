'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { ContentCard } from '@/components/layout/ContentCard';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import {
  X, Plus, History, ClipboardCheck, AlertTriangle, PlayCircle, Search, FileText, CheckCircle2, ChevronDown, ListFilter,
} from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { ROLES } from '@/constants/roles';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const inputCls = 'w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary';
const labelCls = 'block text-sm font-medium mb-1';

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className={labelCls}>{label}{required && <span className="text-destructive ml-0.5">*</span>}</label>
      {children}
    </div>
  );
}

// ─── Start Audit Modal ───────────────────────────────────────────────────────
function StartAuditModal({ isOpen, onClose, onSaved }: { isOpen: boolean; onClose: () => void; onSaved: () => void }) {
  const { user } = useSelector((s: RootState) => s.auth);
  const isDeptHead = user?.role === ROLES.DEPARTMENT_HEAD;
  
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [auditors, setAuditors] = useState<any[]>([]);
  
  const [form, setForm] = useState({
    name: '', departmentId: isDeptHead ? user?.departmentId : '', categoryId: '', assignedAuditor: user?.id || '', startDate: new Date().toISOString().split('T')[0], endDate: '', remarks: '',
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!isOpen) return;
    setForm(f => ({ ...f, name: '', startDate: new Date().toISOString().split('T')[0], endDate: '', remarks: '', departmentId: isDeptHead ? user?.departmentId : '', categoryId: '', assignedAuditor: user?.id || '' }));
    Promise.all([
      api.get('/departments?limit=100&status=ACTIVE'),
      api.get('/categories?limit=200&status=ACTIVE'),
      api.get('/users?limit=500&status=ACTIVE'),
    ]).then(([dRes, cRes, uRes]) => {
      if (dRes.data.success) setDepartments(dRes.data.data);
      if (cRes.data.success) setCategories(cRes.data.data);
      if (uRes.data.success) setAuditors(uRes.data.data.users || []);
    });
  }, [isOpen, isDeptHead, user]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.post('/audit', form);
      toast.success('Audit started successfully');
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to start audit');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-background/80 backdrop-blur-sm">
      <div className="bg-card w-full max-w-md h-full shadow-xl overflow-y-auto border-l border-border animate-in slide-in-from-right">
        <div className="p-6 flex items-center justify-between border-b border-border sticky top-0 bg-card z-10">
          <div>
            <h2 className="text-xl font-semibold">Start Audit</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Initialize a new asset audit cycle</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <FormField label="Audit Name" required>
            <input required type="text" className={inputCls} placeholder="e.g. Q3 IT Assets Audit" value={form.name} onChange={e => set('name', e.target.value)} />
          </FormField>
          
          <FormField label="Department (Scope)">
            <select className={inputCls} value={form.departmentId} onChange={e => set('departmentId', e.target.value)} disabled={isDeptHead}>
              <option value="">All Departments</option>
              {departments.map((d: any) => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
            {isDeptHead && <p className="text-xs text-muted-foreground mt-1">Scoped to your department</p>}
          </FormField>

          <FormField label="Category (Scope)">
            <select className={inputCls} value={form.categoryId} onChange={e => set('categoryId', e.target.value)}>
              <option value="">All Categories</option>
              {categories.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </FormField>

          <FormField label="Assigned Auditor" required>
            <select required className={inputCls} value={form.assignedAuditor} onChange={e => set('assignedAuditor', e.target.value)}>
              <option value="">Select auditor</option>
              {auditors.map((u: any) => <option key={u._id} value={u._id}>{u.firstName} {u.lastName}</option>)}
            </select>
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Start Date" required>
              <input required type="date" className={inputCls} value={form.startDate} onChange={e => set('startDate', e.target.value)} />
            </FormField>
            <FormField label="End Date (Optional)">
              <input type="date" className={inputCls} value={form.endDate} onChange={e => set('endDate', e.target.value)} min={form.startDate} />
            </FormField>
          </div>

          <FormField label="Remarks">
            <textarea rows={3} maxLength={500} className={inputCls} placeholder="Audit notes..." value={form.remarks} onChange={e => set('remarks', e.target.value)} />
          </FormField>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-border sticky bottom-0 bg-card py-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Starting...' : 'Start Audit'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Verify Asset Modal ────────────────────────────────────────────────────────
function VerifyAssetModal({ isOpen, onClose, onSaved, auditId, asset }: { isOpen: boolean; onClose: () => void; onSaved: () => void; auditId: string; asset: any }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    assetId: '', verificationStatus: 'AVAILABLE', condition: 'GOOD', remarks: '',
  });

  useEffect(() => {
    if (isOpen && asset) {
      setForm({ assetId: asset._id, verificationStatus: 'AVAILABLE', condition: asset.condition || 'GOOD', remarks: '' });
    }
  }, [isOpen, asset]);

  if (!isOpen || !asset) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.put(`/audit/${auditId}/verify`, form);
      toast.success('Asset verified successfully');
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to verify asset');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-md rounded-xl shadow-xl overflow-hidden border border-border animate-in fade-in zoom-in-95">
        <div className="p-5 flex items-center justify-between border-b border-border bg-muted/30">
          <h2 className="text-xl font-semibold">Verify Asset</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-secondary/50 rounded-md border border-border">
            <p className="text-sm font-medium">{asset.name} ({asset.tag})</p>
            <p className="text-xs text-muted-foreground mt-1">
              {asset.category?.name} · {asset.department?.name}
            </p>
            {asset.assignedTo && (
              <p className="text-xs text-muted-foreground">Assigned: {asset.assignedTo.firstName} {asset.assignedTo.lastName}</p>
            )}
          </div>
          
          <FormField label="Verification Result" required>
            <select required className={inputCls} value={form.verificationStatus} onChange={e => setForm(f => ({ ...f, verificationStatus: e.target.value }))}>
              <option value="AVAILABLE">Available / Verified</option>
              <option value="MISSING">Missing</option>
              <option value="DAMAGED">Damaged</option>
              <option value="RETIRED">Retired</option>
            </select>
          </FormField>

          {['AVAILABLE', 'DAMAGED'].includes(form.verificationStatus) && (
            <FormField label="Condition" required>
              <select required className={inputCls} value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))}>
                <option value="EXCELLENT">Excellent</option>
                <option value="GOOD">Good</option>
                <option value="FAIR">Fair</option>
                <option value="POOR">Poor</option>
              </select>
            </FormField>
          )}

          <FormField label="Remarks">
            <textarea rows={3} maxLength={500} className={inputCls} value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} placeholder={form.verificationStatus !== 'AVAILABLE' ? 'Please provide details about the discrepancy...' : 'Optional notes...'} required={form.verificationStatus !== 'AVAILABLE'} />
          </FormField>
          
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Verifying...' : 'Verify Asset'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
type ViewMode = 'AUDIT' | 'DISCREPANCIES' | 'HISTORY';

export default function AuditPage() {
  const { user } = useSelector((s: RootState) => s.auth);
  const canManage = [ROLES.ADMIN, ROLES.ASSET_MANAGER, ROLES.DEPARTMENT_HEAD].includes(user?.role as any);
  const canComplete = [ROLES.ADMIN, ROLES.ASSET_MANAGER].includes(user?.role as any);

  const [viewMode, setViewMode] = useState<ViewMode>('AUDIT');
  const [data, setData] = useState<any[]>([]); // Audits, Discrepancies, or History
  const [activeAuditItems, setActiveAuditItems] = useState<any[]>([]); // Items of expanded audit
  const [activeAudit, setActiveAudit] = useState<any>(null); // the audit being viewed
  
  const [stats, setStats] = useState({ totalAssets: 0, auditedAssets: 0, pendingVerification: 0, missingAssets: 0, damagedAssets: 0, completedAudits: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [verifyModal, setVerifyModal] = useState<{ auditId: string; asset: any } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes] = await Promise.all([api.get('/audit/stats')]);
      if (statsRes.data.success) setStats(statsRes.data.data);

      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);

      let endpoint = '/audit';
      if (viewMode === 'HISTORY') endpoint = '/audit/history';
      else if (viewMode === 'DISCREPANCIES') endpoint = '/audit/discrepancies';

      const res = await api.get(`${endpoint}?${params}`);
      if (res.data.success) {
        setData(res.data.data);
        setTotalPages(res.data.pagination?.pages || 1);
      }
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [page, viewMode, search, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Load audit details (the items in the audit)
  const fetchAuditDetails = async (auditId: string) => {
    try {
      const res = await api.get(`/audit/${auditId}`);
      if (res.data.success) {
        setActiveAuditItems(res.data.data.items);
        setActiveAudit(res.data.data);
      }
    } catch {
      toast.error('Failed to fetch audit details');
    }
  };

  const handleStartActiveAudit = async (id: string) => {
    try {
      await api.put(`/audit/${id}/start`);
      toast.success('Audit started');
      fetchData();
      if (activeAudit?._id === id) fetchAuditDetails(id);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to start audit');
    }
  };

  const handleCompleteAudit = async (id: string) => {
    if (!confirm('Are you sure you want to complete this audit? This action cannot be undone.')) return;
    try {
      await api.put(`/audit/${id}/complete`, { remarks: 'Completed via UI' });
      toast.success('Audit completed');
      fetchData();
      setActiveAudit(null);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to complete audit');
    }
  };

  const resetFilters = () => { setSearch(''); setStatusFilter(''); setPage(1); };

  // ── Column Definitions ──────────────────────────────────────────────────────

  const auditListColumns: ColumnDef<any>[] = [
    { header: 'Audit No', cell: r => <span className="font-semibold">{r.auditNumber}</span> },
    { header: 'Name', cell: r => <span className="font-medium">{r.name}</span> },
    { header: 'Scope', cell: r => <span className="text-muted-foreground text-sm">{r.departmentId?.name || 'All Depts'} • {r.categoryId?.name || 'All Categories'}</span> },
    { header: 'Auditor', cell: r => <span className="text-sm">{r.assignedAuditor?.firstName} {r.assignedAuditor?.lastName}</span> },
    { header: 'Start Date', cell: r => <span className="text-sm">{new Date(r.startDate).toLocaleDateString()}</span> },
    { header: 'Status', cell: r => <StatusBadge status={r.status} /> },
    {
      header: 'Actions', className: 'text-right',
      cell: r => (
        <Button variant="outline" size="sm" onClick={() => fetchAuditDetails(r._id)}>
          View Assets
        </Button>
      ),
    },
  ];

  const auditItemColumns: ColumnDef<any>[] = [
    { header: 'Asset', cell: r => <span><span className="font-semibold">{r.assetId?.name}</span> <span className="text-xs font-mono text-muted-foreground">({r.assetId?.tag})</span></span> },
    { header: 'Category', cell: r => <span className="text-sm text-muted-foreground">{r.assetId?.category?.name}</span> },
    { header: 'Department', cell: r => <span className="text-sm text-muted-foreground">{r.assetId?.department?.name}</span> },
    { header: 'Assigned To', cell: r => <span className="text-sm">{r.assetId?.assignedTo ? `${r.assetId.assignedTo.firstName} ${r.assetId.assignedTo.lastName}` : '—'}</span> },
    { header: 'Verify Status', cell: r => <StatusBadge status={r.verificationStatus} /> },
    { header: 'Condition', cell: r => <span className="text-sm">{r.condition || '—'}</span> },
    {
      header: 'Actions', className: 'text-right',
      cell: r => {
        const canVerify = activeAudit?.status === 'IN_PROGRESS' && (canManage || r.assetId?.assignedTo?._id === user?.id);
        if (!canVerify) return null;
        return (
          <Button variant="outline" size="sm" onClick={() => setVerifyModal({ auditId: activeAudit._id, asset: r.assetId })} className={r.verificationStatus !== 'PENDING' ? 'text-primary border-primary/30' : ''}>
            {r.verificationStatus === 'PENDING' ? 'Verify' : 'Update'}
          </Button>
        );
      },
    },
  ];

  const discrepancyColumns: ColumnDef<any>[] = [
    { header: 'Audit No', cell: r => <span className="font-mono text-xs">{r.auditId?.auditNumber}</span> },
    { header: 'Asset', cell: r => <span><span className="font-semibold">{r.assetId?.name}</span> <span className="text-xs font-mono text-muted-foreground">({r.assetId?.tag})</span></span> },
    { header: 'Department', cell: r => <span className="text-sm text-muted-foreground">{r.assetId?.department?.name}</span> },
    { header: 'Assigned To', cell: r => <span className="text-sm">{r.assetId?.assignedTo ? `${r.assetId.assignedTo.firstName} ${r.assetId.assignedTo.lastName}` : '—'}</span> },
    { header: 'Issue', cell: r => <StatusBadge status={r.verificationStatus} /> },
    { header: 'Remarks', cell: r => <span className="text-sm text-muted-foreground">{r.remarks || '—'}</span> },
    { header: 'Verified By', cell: r => <span className="text-sm">{r.verifiedBy?.firstName} {r.verifiedBy?.lastName}</span> },
  ];

  const historyColumns: ColumnDef<any>[] = [
    { header: 'Date', cell: r => <span className="text-muted-foreground text-sm">{new Date(r.createdAt).toLocaleString()}</span> },
    { header: 'Audit No', cell: r => <span className="font-mono font-medium">{r.auditId?.auditNumber}</span> },
    { header: 'Asset', cell: r => <span className="text-sm">{r.assetId ? `${r.assetId.name} (${r.assetId.tag})` : '—'}</span> },
    {
      header: 'Action', cell: r => (
        <span className={`text-xs px-2 py-1 rounded-full border font-medium bg-muted text-muted-foreground border-border`}>
          {r.action}
        </span>
      )
    },
    { header: 'Performed By', cell: r => <span className="text-muted-foreground text-sm">{r.performedBy?.firstName} {r.performedBy?.lastName}</span> },
    { header: 'Remarks', cell: r => <span className="text-muted-foreground text-sm max-w-[250px] truncate block" title={r.remarks}>{r.remarks || '—'}</span> },
  ];

  const statCards = [
    { label: 'Total Assets', value: stats.totalAssets, accent: 'border-l-blue-500' },
    { label: 'Audited', value: stats.auditedAssets, accent: 'border-l-emerald-500' },
    { label: 'Pending', value: stats.pendingVerification, accent: 'border-l-amber-500' },
    { label: 'Missing', value: stats.missingAssets, accent: 'border-l-rose-500' },
    { label: 'Damaged', value: stats.damagedAssets, accent: 'border-l-orange-500' },
    { label: 'Completed', value: stats.completedAudits, accent: 'border-l-purple-500' },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Audit Management"
        description="Manage audit cycles, asset verification and discrepancy reports from one centralized dashboard."
        actions={
          <>
            {canManage && (
              <Button onClick={() => setIsStartOpen(true)} className="flex items-center gap-2">
                <PlayCircle className="w-4 h-4" /> Start Audit
              </Button>
            )}
            <Button
              variant={viewMode === 'AUDIT' ? 'default' : 'outline'}
              onClick={() => { setViewMode('AUDIT'); setActiveAudit(null); setPage(1); }}
              className="flex items-center gap-2"
            >
              <ClipboardCheck className="w-4 h-4" /> Current Audits
            </Button>
            <Button
              variant={viewMode === 'DISCREPANCIES' ? 'default' : 'outline'}
              onClick={() => { setViewMode('DISCREPANCIES'); setActiveAudit(null); setPage(1); }}
              className="flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" /> Discrepancies
              {stats.missingAssets + stats.damagedAssets > 0 && (
                <span className="ml-1 bg-rose-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                  {stats.missingAssets + stats.damagedAssets}
                </span>
              )}
            </Button>
            <Button
              variant={viewMode === 'HISTORY' ? 'default' : 'outline'}
              onClick={() => { setViewMode('HISTORY'); setActiveAudit(null); setPage(1); }}
              className="flex items-center gap-2"
            >
              <History className="w-4 h-4" /> History
            </Button>
          </>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {statCards.map(s => (
          <ContentCard key={s.label} className={`p-4 flex flex-col border-l-4 ${s.accent}`}>
            <span className="text-xs font-medium text-muted-foreground">{s.label}</span>
            <span className="text-2xl font-bold mt-1">{s.value}</span>
          </ContentCard>
        ))}
      </div>

      {/* Active Audit Item View (Drilldown) */}
      {activeAudit ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setActiveAudit(null)}>← Back to Audits</Button>
              <h2 className="text-lg font-semibold">{activeAudit.auditNumber} - {activeAudit.name}</h2>
              <StatusBadge status={activeAudit.status} />
            </div>
            <div className="flex items-center gap-2">
              {activeAudit.status === 'OPEN' && canManage && (
                <Button onClick={() => handleStartActiveAudit(activeAudit._id)}>Mark In Progress</Button>
              )}
              {activeAudit.status === 'IN_PROGRESS' && canComplete && (
                <Button variant="default" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleCompleteAudit(activeAudit._id)}>
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Complete Audit
                </Button>
              )}
            </div>
          </div>
          <ContentCard className="p-4">
            <DataTable
              data={activeAuditItems}
              columns={auditItemColumns}
              isLoading={false}
              emptyMessage="No assets found in this audit scope."
            />
          </ContentCard>
        </div>
      ) : (
        <>
          {/* Filters for main views */}
          <ContentCard className="mb-4 p-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs font-medium text-muted-foreground block mb-1">Search</label>
                <input className={inputCls} placeholder="Search..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
              </div>
              {viewMode === 'AUDIT' && (
                <div className="min-w-[150px]">
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Audit Status</label>
                  <select className={inputCls} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
                    <option value="">All</option>
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              )}
              <Button variant="outline" size="sm" onClick={resetFilters}>Reset</Button>
            </div>
          </ContentCard>

          <h2 className="text-base font-semibold mb-3">
            {viewMode === 'HISTORY' ? 'Audit History Log' : viewMode === 'DISCREPANCIES' ? 'Discrepancy Reports' : 'Audit Cycles'}
          </h2>

          <DataTable
            data={data}
            columns={viewMode === 'HISTORY' ? historyColumns : viewMode === 'DISCREPANCIES' ? discrepancyColumns : auditListColumns}
            isLoading={loading}
            emptyMessage={viewMode === 'DISCREPANCIES' ? 'No discrepancies found. Excellent!' : 'No records found.'}
            className="mb-4"
          />

          <div className="flex justify-end">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </>
      )}

      {/* Modals */}
      <StartAuditModal isOpen={isStartOpen} onClose={() => setIsStartOpen(false)} onSaved={fetchData} />
      {verifyModal && (
        <VerifyAssetModal
          isOpen={true}
          onClose={() => setVerifyModal(null)}
          onSaved={() => {
            fetchData();
            if (activeAudit) fetchAuditDetails(activeAudit._id);
          }}
          auditId={verifyModal.auditId}
          asset={verifyModal.asset}
        />
      )}
    </PageContainer>
  );
}
