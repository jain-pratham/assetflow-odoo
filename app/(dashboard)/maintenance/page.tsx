'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { ContentCard } from '@/components/layout/ContentCard';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import api from '@/services/api';
import { RootState } from '@/store/store';
import { ROLES } from '@/constants/roles';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Eye,
  History,
  MoreVertical,
  Plus,
  UserCheck,
  Wrench,
  X,
} from 'lucide-react';

const inputCls = 'w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary';
const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const statuses = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

type ViewMode = 'REQUESTS' | 'HISTORY';

function nameOf(user: any) {
  if (!user) return '-';
  return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || '-';
}

function dateText(value?: string) {
  return value ? new Date(value).toLocaleDateString() : '-';
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function DrawerShell({ title, description, onClose, children }: { title: string; description?: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-background/80 backdrop-blur-sm">
      <div className="bg-card w-full max-w-xl h-full shadow-xl overflow-y-auto border-l border-border animate-in slide-in-from-right">
        <div className="p-6 flex items-center justify-between border-b border-border sticky top-0 bg-card z-10">
          <div>
            <h2 className="text-xl font-semibold">{title}</h2>
            {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
        </div>
        {children}
      </div>
    </div>
  );
}

function NewRequestModal({ isOpen, onClose, onSaved }: { isOpen: boolean; onClose: () => void; onSaved: () => void }) {
  const { user } = useSelector((s: RootState) => s.auth);
  const [saving, setSaving] = useState(false);
  const [assets, setAssets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [form, setForm] = useState({
    assetId: '',
    categoryId: '',
    departmentId: '',
    reportedBy: user?.id || '',
    priority: 'MEDIUM',
    title: '',
    description: '',
    scheduledDate: '',
    remarks: '',
  });

  const set = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    if (!isOpen) return;
    setForm({
      assetId: '',
      categoryId: '',
      departmentId: user?.departmentId || '',
      reportedBy: user?.id || '',
      priority: 'MEDIUM',
      title: '',
      description: '',
      scheduledDate: '',
      remarks: '',
    });
    Promise.all([
      api.get('/assets?limit=500'),
      api.get('/categories?limit=200&status=ACTIVE'),
      api.get('/departments?limit=100&status=ACTIVE'),
      api.get('/users?limit=500&status=ACTIVE'),
    ]).then(([assetRes, categoryRes, departmentRes, userRes]) => {
      if (assetRes.data.success) setAssets(assetRes.data.data);
      if (categoryRes.data.success) setCategories(categoryRes.data.data);
      if (departmentRes.data.success) setDepartments(departmentRes.data.data);
      if (userRes.data.success) setEmployees(userRes.data.data.users || []);
    }).catch(() => toast.error('Failed to load form data'));
  }, [isOpen, user?.departmentId, user?.id]);

  if (!isOpen) return null;

  const handleAssetChange = (assetId: string) => {
    const asset = assets.find((item) => item._id === assetId);
    setForm((current) => ({
      ...current,
      assetId,
      categoryId: asset?.category?._id || asset?.category || current.categoryId,
      departmentId: asset?.department?._id || asset?.department || current.departmentId,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setSaving(true);
      await api.post('/maintenance', form);
      toast.success('Maintenance request created');
      onSaved();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create maintenance request');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DrawerShell title="New Maintenance Request" description="Create a request against an existing asset." onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <FormField label="Asset" required>
          <select required className={inputCls} value={form.assetId} onChange={(e) => handleAssetChange(e.target.value)}>
            <option value="">Select asset</option>
            {assets.map((asset) => <option key={asset._id} value={asset._id}>{asset.name} ({asset.tag})</option>)}
          </select>
        </FormField>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Category" required>
            <select required className={inputCls} value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
              <option value="">Select category</option>
              {categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
            </select>
          </FormField>
          <FormField label="Department" required>
            <select required className={inputCls} value={form.departmentId} onChange={(e) => set('departmentId', e.target.value)}>
              <option value="">Select department</option>
              {departments.map((department) => <option key={department._id} value={department._id}>{department.name}</option>)}
            </select>
          </FormField>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Reported By" required>
            <select required className={inputCls} value={form.reportedBy} onChange={(e) => set('reportedBy', e.target.value)}>
              <option value="">Select employee</option>
              {employees.map((employee) => <option key={employee._id} value={employee._id}>{nameOf(employee)}</option>)}
            </select>
          </FormField>
          <FormField label="Priority" required>
            <select required className={inputCls} value={form.priority} onChange={(e) => set('priority', e.target.value)}>
              {priorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
            </select>
          </FormField>
        </div>
        <FormField label="Issue Title" required>
          <input required className={inputCls} maxLength={150} value={form.title} onChange={(e) => set('title', e.target.value)} />
        </FormField>
        <FormField label="Issue Description" required>
          <textarea required rows={4} maxLength={1000} className={inputCls} value={form.description} onChange={(e) => set('description', e.target.value)} />
        </FormField>
        <FormField label="Expected Completion Date">
          <input type="date" className={inputCls} value={form.scheduledDate} onChange={(e) => set('scheduledDate', e.target.value)} />
        </FormField>
        <FormField label="Remarks">
          <textarea rows={3} maxLength={500} className={inputCls} value={form.remarks} onChange={(e) => set('remarks', e.target.value)} />
        </FormField>
        <div className="flex justify-end gap-3 pt-4 border-t border-border sticky bottom-0 bg-card py-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Creating...' : 'Create Request'}</Button>
        </div>
      </form>
    </DrawerShell>
  );
}

function AssignTechnicianModal({ isOpen, onClose, onSaved, selectedRequest }: { isOpen: boolean; onClose: () => void; onSaved: () => void; selectedRequest?: any }) {
  const [saving, setSaving] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [form, setForm] = useState({ maintenanceId: '', assignedTechnicianId: '', assignmentDate: '', scheduledDate: '', remarks: '' });

  const set = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    if (!isOpen) return;
    setForm({
      maintenanceId: selectedRequest?._id || '',
      assignedTechnicianId: '',
      assignmentDate: new Date().toISOString().split('T')[0],
      scheduledDate: selectedRequest?.scheduledDate ? selectedRequest.scheduledDate.split('T')[0] : '',
      remarks: '',
    });
    Promise.all([
      api.get('/maintenance?limit=200&status=OPEN'),
      api.get('/users?limit=500&status=ACTIVE'),
    ]).then(([requestRes, userRes]) => {
      if (requestRes.data.success) setRequests(requestRes.data.data);
      if (userRes.data.success) {
        const users = userRes.data.data.users || [];
        setTechnicians(users.filter((item: any) => item.role === ROLES.TECHNICIAN || item.role === ROLES.ASSET_MANAGER || item.role === ROLES.ADMIN));
      }
    }).catch(() => toast.error('Failed to load assignment data'));
  }, [isOpen, selectedRequest]);

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setSaving(true);
      await api.put(`/maintenance/${form.maintenanceId}/assign`, {
        assignedTechnicianId: form.assignedTechnicianId,
        assignmentDate: form.assignmentDate,
        scheduledDate: form.scheduledDate,
        remarks: form.remarks,
      });
      toast.success('Technician assigned');
      onSaved();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to assign technician');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DrawerShell title="Assign Technician" description="Assign only open maintenance requests." onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <FormField label="Maintenance Request" required>
          <select required className={inputCls} value={form.maintenanceId} onChange={(e) => set('maintenanceId', e.target.value)} disabled={!!selectedRequest}>
            <option value="">Select open request</option>
            {(selectedRequest ? [selectedRequest] : requests).map((request) => (
              <option key={request._id} value={request._id}>{request.requestId} - {request.assetId?.name || request.title}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Technician" required>
          <select required className={inputCls} value={form.assignedTechnicianId} onChange={(e) => set('assignedTechnicianId', e.target.value)}>
            <option value="">Select technician</option>
            {technicians.map((technician) => <option key={technician._id} value={technician._id}>{nameOf(technician)} ({technician.role})</option>)}
          </select>
        </FormField>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Assignment Date">
            <input type="date" className={inputCls} value={form.assignmentDate} onChange={(e) => set('assignmentDate', e.target.value)} />
          </FormField>
          <FormField label="Expected Completion" required>
            <input required type="date" className={inputCls} value={form.scheduledDate} onChange={(e) => set('scheduledDate', e.target.value)} />
          </FormField>
        </div>
        <FormField label="Remarks">
          <textarea rows={3} maxLength={500} className={inputCls} value={form.remarks} onChange={(e) => set('remarks', e.target.value)} />
        </FormField>
        <div className="flex justify-end gap-3 pt-4 border-t border-border sticky bottom-0 bg-card py-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Assigning...' : 'Assign'}</Button>
        </div>
      </form>
    </DrawerShell>
  );
}

function StatusModal({ request, onClose, onSaved }: { request: any; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    if (request?.status === 'ASSIGNED') setStatus('IN_PROGRESS');
    else if (request?.status === 'IN_PROGRESS') setStatus('COMPLETED');
    else setStatus('CANCELLED');
    setRemarks('');
  }, [request]);

  if (!request) return null;

  const options = request.status === 'ASSIGNED'
    ? ['IN_PROGRESS', 'CANCELLED']
    : request.status === 'IN_PROGRESS'
      ? ['COMPLETED', 'CANCELLED']
      : request.status === 'OPEN'
        ? ['CANCELLED']
        : [];

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setSaving(true);
      await api.put(`/maintenance/${request._id}/status`, { status, remarks });
      toast.success('Maintenance status updated');
      onSaved();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-md rounded-xl shadow-xl overflow-hidden border border-border animate-in fade-in zoom-in-95">
        <div className="p-5 flex items-center justify-between border-b border-border bg-muted/30">
          <h2 className="text-xl font-semibold">Update Status</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-secondary/50 rounded-md border border-border">
            <p className="text-sm font-semibold">{request.requestId}</p>
            <p className="text-xs text-muted-foreground mt-1">{request.assetId?.name} ({request.assetId?.tag})</p>
            <div className="mt-2"><StatusBadge status={request.status} /></div>
          </div>
          <FormField label="New Status" required>
            <select required className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
              {options.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </FormField>
          <FormField label="Remarks">
            <textarea rows={3} maxLength={500} className={inputCls} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          </FormField>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving || options.length === 0}>{saving ? 'Updating...' : 'Update'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DetailModal({ request, onClose }: { request: any; onClose: () => void }) {
  if (!request) return null;
  const rows = [
    ['Request ID', request.requestId],
    ['Asset', `${request.assetId?.name || '-'} (${request.assetId?.tag || '-'})`],
    ['Category', request.categoryId?.name || '-'],
    ['Department', request.departmentId?.name || '-'],
    ['Reported By', nameOf(request.reportedBy)],
    ['Technician', nameOf(request.assignedTechnicianId)],
    ['Priority', request.priority],
    ['Status', request.status],
    ['Created Date', dateText(request.createdAt)],
    ['Expected Completion', dateText(request.scheduledDate)],
    ['Completed Date', dateText(request.completedDate)],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-lg rounded-xl shadow-xl overflow-hidden border border-border animate-in fade-in zoom-in-95">
        <div className="p-5 flex items-center justify-between border-b border-border bg-muted/30">
          <h2 className="text-xl font-semibold">Maintenance Details</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
        </div>
        <div className="p-6 space-y-4">
          <dl className="space-y-3">
            {rows.map(([label, value]) => (
              <div key={label} className="grid grid-cols-2 gap-3 text-sm">
                <dt className="text-muted-foreground font-medium">{label}</dt>
                <dd className="font-medium">{label === 'Status' ? <StatusBadge status={value} /> : value}</dd>
              </div>
            ))}
          </dl>
          <div className="pt-3 border-t border-border">
            <p className="text-xs uppercase text-muted-foreground font-medium">Issue</p>
            <p className="font-semibold mt-1">{request.title}</p>
            <p className="text-sm text-muted-foreground mt-1">{request.description}</p>
          </div>
          {request.remarks && (
            <div className="pt-3 border-t border-border">
              <p className="text-xs uppercase text-muted-foreground font-medium">Remarks</p>
              <p className="text-sm mt-1">{request.remarks}</p>
            </div>
          )}
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CalendarModal({ onClose }: { onClose: () => void }) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'day' | 'week' | 'month'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selected, setSelected] = useState<any>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const from = new Date(currentDate);
      const to = new Date(currentDate);
      if (view === 'day') {
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
      } else if (view === 'week') {
        from.setDate(currentDate.getDate() - currentDate.getDay());
        to.setDate(from.getDate() + 6);
      } else {
        from.setDate(1);
        to.setMonth(from.getMonth() + 1, 0);
      }
      const res = await api.get(`/maintenance/calendar?dateFrom=${from.toISOString().split('T')[0]}&dateTo=${to.toISOString().split('T')[0]}`);
      if (res.data.success) setEvents(res.data.data);
    } catch {
      toast.error('Failed to load maintenance calendar');
    } finally {
      setLoading(false);
    }
  }, [currentDate, view]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const periodLabel = useMemo(() => {
    if (view === 'day') return currentDate.toLocaleDateString();
    if (view === 'week') {
      const start = new Date(currentDate);
      start.setDate(currentDate.getDate() - currentDate.getDay());
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
    }
    return currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  }, [currentDate, view]);

  const shift = (direction: number) => {
    setCurrentDate((date) => {
      const next = new Date(date);
      if (view === 'day') next.setDate(date.getDate() + direction);
      else if (view === 'week') next.setDate(date.getDate() + direction * 7);
      else next.setMonth(date.getMonth() + direction);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-5xl rounded-xl shadow-xl overflow-hidden border border-border animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
        <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border bg-muted/30">
          <div>
            <h2 className="text-xl font-semibold">Maintenance Calendar</h2>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-2">
              <span>Scheduled Jobs</span>
              <span>Assigned Jobs</span>
              <span>Completed Jobs</span>
              <span>Overdue Jobs</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(['day', 'week', 'month'] as const).map((item) => (
              <Button key={item} size="sm" variant={view === item ? 'default' : 'outline'} onClick={() => setView(item)}>
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </Button>
            ))}
            <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
          </div>
        </div>
        <div className="px-5 py-4 flex items-center justify-between border-b border-border">
          <Button variant="outline" size="sm" onClick={() => shift(-1)}>Previous</Button>
          <h3 className="font-semibold">{periodLabel}</h3>
          <Button variant="outline" size="sm" onClick={() => shift(1)}>Next</Button>
        </div>
        <div className="p-5 overflow-y-auto">
          {loading ? (
            <div className="py-16 text-center text-muted-foreground">Loading calendar...</div>
          ) : events.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">No maintenance jobs scheduled.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {events.map((event) => (
                <button
                  key={event.id}
                  onClick={() => setSelected(event)}
                  className={`text-left rounded-md border p-4 hover:bg-muted/50 transition-colors ${event.isOverdue ? 'border-rose-500/40 bg-rose-500/5' : 'border-border bg-card'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{event.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{dateText(event.date)} - {event.asset?.tag}</p>
                    </div>
                    <StatusBadge status={event.isOverdue ? 'OVERDUE' : event.status} />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Technician: {nameOf(event.technician)}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {selected && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-sm rounded-xl shadow-xl border border-border p-5">
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-semibold">{selected.requestId}</h3>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelected(null)}><X className="w-4 h-4" /></Button>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Asset</dt><dd className="font-medium">{selected.asset?.name}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Date</dt><dd className="font-medium">{dateText(selected.date)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Technician</dt><dd className="font-medium">{nameOf(selected.technician)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Priority</dt><dd className="font-medium">{selected.priority}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Status</dt><dd><StatusBadge status={selected.status} /></dd></div>
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionMenu({ row, canAssign, canUpdate, onView, onAssign, onUpdate }: any) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setOpen((current) => !current)}>
        <MoreVertical className="w-4 h-4 text-muted-foreground" />
      </Button>
      {open && (
        <div className="absolute right-0 mt-1 w-48 rounded-md shadow-lg bg-card border border-border z-50 overflow-hidden">
          <div className="py-1">
            <button onClick={() => { onView(row); setOpen(false); }} className="w-full flex items-center px-4 py-2 text-sm hover:bg-muted/50">
              <Eye className="w-4 h-4 mr-2" /> View Details
            </button>
            {canAssign && row.status === 'OPEN' && (
              <button onClick={() => { onAssign(row); setOpen(false); }} className="w-full flex items-center px-4 py-2 text-sm hover:bg-muted/50">
                <UserCheck className="w-4 h-4 mr-2" /> Assign Technician
              </button>
            )}
            {canUpdate && ['OPEN', 'ASSIGNED', 'IN_PROGRESS'].includes(row.status) && (
              <button onClick={() => { onUpdate(row); setOpen(false); }} className="w-full flex items-center px-4 py-2 text-sm hover:bg-muted/50">
                <CheckCircle2 className="w-4 h-4 mr-2" /> Update Status
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MaintenancePage() {
  const { user } = useSelector((s: RootState) => s.auth);
  const canManage = [ROLES.ADMIN, ROLES.ASSET_MANAGER].includes(user?.role as any);
  const canCreate = [ROLES.ADMIN, ROLES.ASSET_MANAGER, ROLES.DEPARTMENT_HEAD, ROLES.EMPLOYEE].includes(user?.role as any);
  const canUpdate = canManage || user?.role === ROLES.TECHNICIAN;

  const [viewMode, setViewMode] = useState<ViewMode>('REQUESTS');
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState({ openRequests: 0, assigned: 0, inProgress: 0, completed: 0, overdue: 0, assetsUnderMaintenance: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [technicianId, setTechnicianId] = useState('');
  const [priority, setPriority] = useState('');
  const [status, setStatus] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [departments, setDepartments] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);

  const [newOpen, setNewOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [statusRequest, setStatusRequest] = useState<any>(null);
  const [detailRequest, setDetailRequest] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      api.get('/departments?limit=100&status=ACTIVE'),
      api.get('/categories?limit=200&status=ACTIVE'),
      api.get('/users?limit=500&status=ACTIVE'),
    ]).then(([departmentRes, categoryRes, userRes]) => {
      if (departmentRes.data.success) setDepartments(departmentRes.data.data);
      if (categoryRes.data.success) setCategories(categoryRes.data.data);
      if (userRes.data.success) {
        const users = userRes.data.data.users || [];
        setTechnicians(users.filter((item: any) => item.role === ROLES.TECHNICIAN || item.role === ROLES.ASSET_MANAGER || item.role === ROLES.ADMIN));
      }
    }).catch(() => {
      toast.error('Failed to load filter data');
    });
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const statsRes = await api.get('/maintenance/stats');
      if (statsRes.data.success) setStats(statsRes.data.data);

      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (search) params.set('search', search);
      if (departmentId) params.set('departmentId', departmentId);
      if (technicianId) params.set('technicianId', technicianId);
      if (priority) params.set('priority', priority);
      if (status) params.set('status', status);
      if (categoryId) params.set('categoryId', categoryId);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);

      const endpoint = viewMode === 'HISTORY' ? '/maintenance/history' : '/maintenance';
      const res = await api.get(`${endpoint}?${params.toString()}`);
      if (res.data.success) {
        setData(res.data.data);
        setTotalPages(res.data.pagination?.pages || 1);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load maintenance data');
    } finally {
      setLoading(false);
    }
  }, [categoryId, dateFrom, dateTo, departmentId, page, priority, search, status, technicianId, viewMode]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const resetFilters = () => {
    setSearch('');
    setDepartmentId('');
    setTechnicianId('');
    setPriority('');
    setStatus('');
    setCategoryId('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const statCards = [
    { label: 'Open Requests', value: stats.openRequests, accent: 'border-l-amber-500' },
    { label: 'Assigned', value: stats.assigned, accent: 'border-l-emerald-500' },
    { label: 'In Progress', value: stats.inProgress, accent: 'border-l-blue-500' },
    { label: 'Completed', value: stats.completed, accent: 'border-l-teal-500' },
    { label: 'Overdue', value: stats.overdue, accent: 'border-l-rose-500' },
    { label: 'Assets Under Maintenance', value: stats.assetsUnderMaintenance, accent: 'border-l-purple-500' },
  ];

  const requestColumns: ColumnDef<any>[] = [
    { header: 'Request ID', cell: (row) => <span className="font-mono text-primary font-medium">{row.requestId}</span> },
    { header: 'Asset Tag', cell: (row) => <span className="font-mono text-muted-foreground">{row.assetId?.tag || '-'}</span> },
    { header: 'Asset Name', cell: (row) => <span className="font-semibold">{row.assetId?.name || '-'}</span> },
    { header: 'Category', cell: (row) => <span className="text-muted-foreground">{row.categoryId?.name || '-'}</span> },
    { header: 'Reported By', cell: (row) => <span>{nameOf(row.reportedBy)}</span> },
    { header: 'Department', cell: (row) => <span className="text-muted-foreground">{row.departmentId?.name || '-'}</span> },
    { header: 'Priority', cell: (row) => <span className="text-xs px-2 py-1 rounded-full border border-border bg-secondary">{row.priority}</span> },
    { header: 'Assigned Technician', cell: (row) => <span className="text-muted-foreground">{nameOf(row.assignedTechnicianId)}</span> },
    { header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
    { header: 'Created Date', cell: (row) => <span className="text-muted-foreground text-sm">{dateText(row.createdAt)}</span> },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (row) => (
        <div className="flex justify-end pr-1">
          <ActionMenu
            row={row}
            canAssign={canManage}
            canUpdate={canUpdate}
            onView={setDetailRequest}
            onAssign={(request: any) => { setSelectedRequest(request); setAssignOpen(true); }}
            onUpdate={setStatusRequest}
          />
        </div>
      ),
    },
  ];

  const historyColumns: ColumnDef<any>[] = [
    { header: 'Request ID', cell: (row) => <span className="font-mono text-primary font-medium">{row.maintenanceId?.requestId || '-'}</span> },
    { header: 'Asset', cell: (row) => <span>{row.assetId?.name || '-'} <span className="font-mono text-muted-foreground text-xs">({row.assetId?.tag || '-'})</span></span> },
    { header: 'Action', cell: (row) => <span className="text-xs px-2 py-1 rounded-full border border-border bg-secondary">{row.action}</span> },
    { header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
    { header: 'Performed By', cell: (row) => <span>{nameOf(row.performedBy)}</span> },
    { header: 'Technician', cell: (row) => <span className="text-muted-foreground">{nameOf(row.assignedTechnicianId)}</span> },
    { header: 'Remarks', cell: (row) => <span className="text-muted-foreground">{row.remarks || '-'}</span> },
    { header: 'Date', cell: (row) => <span className="text-muted-foreground text-sm">{dateText(row.createdAt)}</span> },
  ];

  return (
    <PageContainer>
      <div className="mb-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <p className="text-muted-foreground mt-1 text-sm max-w-3xl">
            Manage maintenance requests, technician assignments, repairs, and maintenance history from one centralized dashboard.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {canCreate && (
            <Button onClick={() => setNewOpen(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Maintenance Request
            </Button>
          )}
          {canManage && (
            <Button variant="outline" onClick={() => { setSelectedRequest(null); setAssignOpen(true); }} className="flex items-center gap-2">
              <UserCheck className="w-4 h-4" /> Assign Technician
            </Button>
          )}
          <Button
            variant={viewMode === 'HISTORY' ? 'default' : 'outline'}
            onClick={() => { setViewMode(viewMode === 'HISTORY' ? 'REQUESTS' : 'HISTORY'); setPage(1); }}
            className="flex items-center gap-2"
          >
            <History className="w-4 h-4" /> {viewMode === 'HISTORY' ? 'Maintenance Requests' : 'Maintenance History'}
          </Button>
          <Button variant="outline" onClick={() => setCalendarOpen(true)} className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4" /> Maintenance Calendar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {statCards.map((card) => (
          <ContentCard key={card.label} className={`p-4 flex flex-col border-l-4 ${card.accent}`}>
            <span className="text-xs font-medium text-muted-foreground">{card.label}</span>
            <span className="text-2xl font-bold mt-1">{card.value}</span>
          </ContentCard>
        ))}
      </div>

      <ContentCard className="mb-4 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Search</label>
            <input className={inputCls} placeholder="Search requests..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Department</label>
            <select className={inputCls} value={departmentId} onChange={(e) => { setDepartmentId(e.target.value); setPage(1); }}>
              <option value="">All Departments</option>
              {departments.map((department) => <option key={department._id} value={department._id}>{department.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Technician</label>
            <select className={inputCls} value={technicianId} onChange={(e) => { setTechnicianId(e.target.value); setPage(1); }}>
              <option value="">All Technicians</option>
              {technicians.map((technician) => <option key={technician._id} value={technician._id}>{nameOf(technician)}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Priority</label>
            <select className={inputCls} value={priority} onChange={(e) => { setPriority(e.target.value); setPage(1); }}>
              <option value="">All Priorities</option>
              {priorities.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Status</label>
            <select className={inputCls} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
              <option value="">All Statuses</option>
              {statuses.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Category</label>
            <select className={inputCls} value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}>
              <option value="">All Categories</option>
              {categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">From</label>
            <input type="date" className={inputCls} value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">To</label>
            <div className="flex gap-2">
              <input type="date" className={inputCls} value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
              <Button variant="outline" size="sm" onClick={resetFilters} className="h-9 shrink-0">Reset</Button>
            </div>
          </div>
        </div>
      </ContentCard>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold flex items-center gap-2">
          {viewMode === 'HISTORY' ? <History className="w-4 h-4" /> : <ClipboardList className="w-4 h-4" />}
          {viewMode === 'HISTORY' ? 'Maintenance History' : 'Maintenance Requests'}
        </h2>
        {viewMode === 'HISTORY' && (
          <Button variant="ghost" size="sm" onClick={() => { setViewMode('REQUESTS'); setPage(1); }}>
            <Wrench className="w-4 h-4 mr-2" /> Back to Requests
          </Button>
        )}
      </div>

      <DataTable
        data={data}
        columns={viewMode === 'HISTORY' ? historyColumns : requestColumns}
        isLoading={loading}
        emptyMessage={viewMode === 'HISTORY' ? 'No maintenance history found.' : 'No maintenance requests found.'}
        className="mb-4"
      />

      <div className="flex justify-end">
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <NewRequestModal isOpen={newOpen} onClose={() => setNewOpen(false)} onSaved={fetchData} />
      <AssignTechnicianModal isOpen={assignOpen} onClose={() => setAssignOpen(false)} onSaved={fetchData} selectedRequest={selectedRequest} />
      {statusRequest && <StatusModal request={statusRequest} onClose={() => setStatusRequest(null)} onSaved={fetchData} />}
      {detailRequest && <DetailModal request={detailRequest} onClose={() => setDetailRequest(null)} />}
      {calendarOpen && <CalendarModal onClose={() => setCalendarOpen(false)} />}
    </PageContainer>
  );
}
