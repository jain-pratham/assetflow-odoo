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
  X, Plus, History, CalendarRange, ClipboardList, CheckCircle2, XCircle,
  ChevronLeft, ChevronRight, Calendar, MoreVertical,
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

// ─── Book Resource Modal ───────────────────────────────────────────────────────
function BookResourceModal({ isOpen, onClose, onSaved }: { isOpen: boolean; onClose: () => void; onSaved: () => void }) {
  const { user } = useSelector((s: RootState) => s.auth);
  const [saving, setSaving] = useState(false);
  const [resources, setResources] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [form, setForm] = useState({
    resourceId: '', categoryId: '', departmentId: '', employeeId: '',
    bookingDate: '', startTime: '', endTime: '', purpose: '', remarks: '',
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!isOpen) return;
    setForm({ resourceId: '', categoryId: '', departmentId: '', employeeId: user?.id || '', bookingDate: '', startTime: '', endTime: '', purpose: '', remarks: '' });
    Promise.all([
      api.get('/assets?limit=500&status=AVAILABLE'),
      api.get('/categories?limit=200&status=ACTIVE'),
      api.get('/departments?limit=100&status=ACTIVE'),
      api.get('/users?limit=500&status=ACTIVE'),
    ]).then(([aRes, cRes, dRes, uRes]) => {
      if (aRes.data.success) setResources(aRes.data.data);
      if (cRes.data.success) setCategories(cRes.data.data);
      if (dRes.data.success) setDepartments(dRes.data.data);
      if (uRes.data.success) setEmployees(uRes.data.data.users || []);
    });
  }, [isOpen, user?.id]);

  if (!isOpen) return null;

  const handleResourceChange = (id: string) => {
    const res = resources.find((r: any) => r._id === id);
    set('resourceId', id);
    if (res?.category?._id) set('categoryId', res.category._id);
    else if (res?.category) set('categoryId', res.category);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.startTime >= form.endTime) {
      toast.error('End time must be after start time');
      return;
    }
    try {
      setSaving(true);
      await api.post('/bookings', form);
      toast.success('Booking request submitted successfully');
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to create booking');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-background/80 backdrop-blur-sm">
      <div className="bg-card w-full max-w-md h-full shadow-xl overflow-y-auto border-l border-border animate-in slide-in-from-right">
        <div className="p-6 flex items-center justify-between border-b border-border sticky top-0 bg-card z-10">
          <div>
            <h2 className="text-xl font-semibold">Book Resource</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Submit a resource booking request</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <FormField label="Resource" required>
            <select required className={inputCls} value={form.resourceId} onChange={e => handleResourceChange(e.target.value)}>
              <option value="">Select available resource</option>
              {resources.map((r: any) => <option key={r._id} value={r._id}>{r.name} ({r.tag})</option>)}
            </select>
          </FormField>
          <FormField label="Category" required>
            <select required className={inputCls} value={form.categoryId} onChange={e => set('categoryId', e.target.value)}>
              <option value="">Select category</option>
              {categories.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </FormField>
          <FormField label="Department" required>
            <select required className={inputCls} value={form.departmentId} onChange={e => set('departmentId', e.target.value)}>
              <option value="">Select department</option>
              {departments.map((d: any) => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </FormField>
          <FormField label="Booked By" required>
            <select required className={inputCls} value={form.employeeId} onChange={e => set('employeeId', e.target.value)}>
              <option value="">Select employee</option>
              {employees.map((e: any) => <option key={e._id} value={e._id}>{e.firstName} {e.lastName}</option>)}
            </select>
          </FormField>
          <FormField label="Booking Date" required>
            <input required type="date" className={inputCls} value={form.bookingDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => set('bookingDate', e.target.value)} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Start Time" required>
              <input required type="time" className={inputCls} value={form.startTime} onChange={e => set('startTime', e.target.value)} />
            </FormField>
            <FormField label="End Time" required>
              <input required type="time" className={inputCls} value={form.endTime} onChange={e => set('endTime', e.target.value)} />
            </FormField>
          </div>
          {form.startTime && form.endTime && form.startTime < form.endTime && (
            <p className="text-xs text-muted-foreground">
              Duration: {(() => {
                const [sh, sm] = form.startTime.split(':').map(Number);
                const [eh, em] = form.endTime.split(':').map(Number);
                const mins = (eh * 60 + em) - (sh * 60 + sm);
                return `${Math.floor(mins / 60)}h ${mins % 60}m`;
              })()}
            </p>
          )}
          <FormField label="Purpose" required>
            <textarea required rows={3} maxLength={500} className={inputCls} placeholder="Meeting, training, presentation..." value={form.purpose} onChange={e => set('purpose', e.target.value)} />
          </FormField>
          <FormField label="Remarks">
            <textarea rows={2} maxLength={500} className={inputCls} value={form.remarks} onChange={e => set('remarks', e.target.value)} />
          </FormField>
          <div className="flex justify-end gap-3 pt-4 border-t border-border sticky bottom-0 bg-card py-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Submitting...' : 'Book Resource'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Approve / Reject / Cancel Modal ──────────────────────────────────────────
function ActionModal({ isOpen, onClose, onSaved, booking, action }: {
  isOpen: boolean; onClose: () => void; onSaved: () => void; booking: any; action: 'approve' | 'reject' | 'cancel';
}) {
  const [saving, setSaving] = useState(false);
  const [remarks, setRemarks] = useState('');

  useEffect(() => { if (isOpen) setRemarks(''); }, [isOpen]);
  if (!isOpen || !booking) return null;

  const configs = {
    approve: { title: 'Approve Booking', btn: 'Approve', cls: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
    reject: { title: 'Reject Booking', btn: 'Reject', cls: 'bg-rose-600 hover:bg-rose-700 text-white' },
    cancel: { title: 'Cancel Booking', btn: 'Cancel Booking', cls: 'bg-amber-600 hover:bg-amber-700 text-white' },
  };
  const cfg = configs[action];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.put(`/bookings/${booking._id}/${action}`, { remarks });
      toast.success(`Booking ${action}d successfully`);
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || `Failed to ${action} booking`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-md rounded-xl shadow-xl overflow-hidden border border-border animate-in fade-in zoom-in-95">
        <div className="p-5 flex items-center justify-between border-b border-border bg-muted/30">
          <h2 className="text-xl font-semibold">{cfg.title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-secondary/50 rounded-md border border-border">
            <p className="text-sm font-medium">{booking.resourceId?.name} ({booking.resourceId?.tag})</p>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(booking.bookingDate).toLocaleDateString()} · {booking.startTime} – {booking.endTime}
            </p>
            <p className="text-xs text-muted-foreground">
              {booking.employeeId?.firstName} {booking.employeeId?.lastName} · {booking.departmentId?.name}
            </p>
          </div>
          <FormField label="Remarks">
            <textarea rows={3} maxLength={500} className={inputCls} value={remarks} onChange={e => setRemarks(e.target.value)} />
          </FormField>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Close</Button>
            <button type="submit" disabled={saving} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${cfg.cls} disabled:opacity-50`}>
              {saving ? 'Processing...' : cfg.btn}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Booking Detail Modal ──────────────────────────────────────────────────────
function BookingDetailModal({ isOpen, onClose, booking }: { isOpen: boolean; onClose: () => void; booking: any }) {
  if (!isOpen || !booking) return null;
  const rows = [
    ['Resource', `${booking.resourceId?.name} (${booking.resourceId?.tag})`],
    ['Category', booking.categoryId?.name || '—'],
    ['Employee', `${booking.employeeId?.firstName} ${booking.employeeId?.lastName}`],
    ['Department', booking.departmentId?.name || '—'],
    ['Booking Date', new Date(booking.bookingDate).toLocaleDateString()],
    ['Time Slot', `${booking.startTime} – ${booking.endTime}`],
    ['Duration', `${booking.duration} min`],
    ['Purpose', booking.purpose],
    ['Remarks', booking.remarks || '—'],
    ['Status', booking.status],
    ['Approved By', booking.approvedBy ? `${booking.approvedBy.firstName} ${booking.approvedBy.lastName}` : '—'],
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-lg rounded-xl shadow-xl overflow-hidden border border-border animate-in fade-in zoom-in-95">
        <div className="p-5 flex items-center justify-between border-b border-border bg-muted/30">
          <h2 className="text-xl font-semibold">Booking Details</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
        </div>
        <div className="p-6">
          <dl className="space-y-3">
            {rows.map(([k, v]) => (
              <div key={k} className="grid grid-cols-2 gap-2 text-sm">
                <dt className="text-muted-foreground font-medium">{k}</dt>
                <dd className="font-medium">
                  {k === 'Status' ? <StatusBadge status={v} /> : v}
                </dd>
              </div>
            ))}
          </dl>
          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Calendar View ─────────────────────────────────────────────────────────────
function CalendarView({ onClose }: { onClose: () => void }) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [view, setView] = useState<'day' | 'week' | 'month'>('month');

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const dateFrom = new Date(year, month, 1).toISOString().split('T')[0];
      const dateTo = new Date(year, month + 1, 0).toISOString().split('T')[0];
      const res = await api.get(`/bookings/calendar?dateFrom=${dateFrom}&dateTo=${dateTo}`);
      if (res.data.success) setEvents(res.data.data);
    } catch { /* noop */ } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const statusColor = (status: string) => {
    if (status === 'APPROVED') return 'bg-emerald-500/80 text-white';
    if (status === 'PENDING') return 'bg-amber-500/80 text-white';
    if (status === 'REJECTED') return 'bg-rose-500/80 text-white';
    return 'bg-muted text-muted-foreground';
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const prevMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const getEventsForDay = (day: number) => {
    const target = new Date(year, month, day);
    return events.filter(e => {
      const eDate = new Date(e.date);
      return eDate.getFullYear() === year && eDate.getMonth() === month && eDate.getDate() === day;
    });
  };

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-5xl rounded-xl shadow-xl overflow-hidden border border-border animate-in fade-in zoom-in-95" style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div className="p-5 flex items-center justify-between border-b border-border bg-muted/30 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">Booking Calendar</h2>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> Approved</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-500 inline-block" /> Pending</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-rose-500 inline-block" /> Rejected</span>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
        </div>
        {/* Calendar Nav */}
        <div className="px-5 pt-4 pb-2 flex items-center justify-between shrink-0">
          <Button variant="outline" size="sm" onClick={prevMonth}><ChevronLeft className="w-4 h-4" /></Button>
          <h3 className="text-lg font-semibold">{monthName}</h3>
          <Button variant="outline" size="sm" onClick={nextMonth}><ChevronRight className="w-4 h-4" /></Button>
        </div>
        {/* Calendar Grid */}
        <div className="flex-1 overflow-y-auto px-5 pb-5">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2" /> Loading...
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-px border border-border rounded-lg overflow-hidden">
              {days.map(d => (
                <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2 bg-muted/50">{d}</div>
              ))}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[80px] bg-muted/20" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dayEvents = getEventsForDay(day);
                const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
                return (
                  <div key={day} className={`min-h-[80px] bg-card border-border p-1 ${isToday ? 'ring-2 ring-primary ring-inset' : ''}`}>
                    <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>{day}</div>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 3).map((ev: any) => (
                        <button
                          key={ev.id}
                          onClick={() => setSelectedEvent(ev)}
                          className={`w-full text-left text-[10px] font-medium px-1.5 py-0.5 rounded truncate ${statusColor(ev.status)}`}
                        >
                          {ev.startTime} {ev.resource?.name || ev.title?.split('—')[0].trim()}
                        </button>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-[10px] text-muted-foreground pl-1">+{dayEvents.length - 3} more</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {/* Event detail popover */}
      {selectedEvent && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-sm rounded-xl shadow-xl border border-border p-5 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-semibold text-base">{selectedEvent.resource?.name}</h3>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedEvent(null)}><X className="w-4 h-4" /></Button>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Date</dt><dd className="font-medium">{new Date(selectedEvent.date).toLocaleDateString()}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Time</dt><dd className="font-medium">{selectedEvent.startTime} – {selectedEvent.endTime}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Employee</dt><dd className="font-medium">{selectedEvent.employee?.firstName} {selectedEvent.employee?.lastName}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Department</dt><dd className="font-medium">{selectedEvent.department?.name}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Purpose</dt><dd className="font-medium">{selectedEvent.purpose}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Status</dt><dd><StatusBadge status={selectedEvent.status} /></dd></div>
            </dl>
            <div className="mt-4 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setSelectedEvent(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Action Dropdown ───────────────────────────────────────────────────────────
function BookingActionMenu({ booking, canManage, onView, onApprove, onReject, onCancel, currentUser }: any) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const isOwner = booking.employeeId?._id === currentUser?.id;
  const canCancel = (canManage || isOwner) && (booking.status === 'PENDING' || (canManage && booking.status === 'APPROVED'));

  return (
    <div className="relative" ref={ref}>
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setOpen(o => !o)}>
        <MoreVertical className="w-4 h-4 text-muted-foreground" />
      </Button>
      {open && (
        <div className="absolute right-0 mt-1 w-44 rounded-md shadow-lg bg-card border border-border z-50 overflow-hidden">
          <div className="py-1">
            <button onClick={() => { onView(booking); setOpen(false); }} className="w-full flex items-center px-4 py-2 text-sm hover:bg-muted/50">
              <ClipboardList className="w-4 h-4 mr-2" /> View Details
            </button>
            {canManage && booking.status === 'PENDING' && (
              <>
                <button onClick={() => { onApprove(booking); setOpen(false); }} className="w-full flex items-center px-4 py-2 text-sm text-emerald-600 hover:bg-muted/50">
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
                </button>
                <button onClick={() => { onReject(booking); setOpen(false); }} className="w-full flex items-center px-4 py-2 text-sm text-rose-600 hover:bg-muted/50">
                  <XCircle className="w-4 h-4 mr-2" /> Reject
                </button>
              </>
            )}
            {canCancel && (
              <button onClick={() => { onCancel(booking); setOpen(false); }} className="w-full flex items-center px-4 py-2 text-sm text-amber-600 hover:bg-muted/50">
                <X className="w-4 h-4 mr-2" /> Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
type ViewMode = 'BOOKINGS' | 'REQUESTS' | 'HISTORY';

export default function BookingPage() {
  const { user } = useSelector((s: RootState) => s.auth);
  const canManage = [ROLES.ADMIN, ROLES.ASSET_MANAGER].includes(user?.role as any);
  const canCreate = [ROLES.ADMIN, ROLES.ASSET_MANAGER, ROLES.DEPARTMENT_HEAD, ROLES.EMPLOYEE].includes(user?.role as any);

  const [viewMode, setViewMode] = useState<ViewMode>('BOOKINGS');
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalResources: 0, availableResources: 0, todaysBookings: 0, pendingRequests: 0, approvedBookings: 0, rejectedBookings: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Modals
  const [isBookOpen, setIsBookOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [actionModal, setActionModal] = useState<{ booking: any; action: 'approve' | 'reject' | 'cancel' } | null>(null);
  const [detailBooking, setDetailBooking] = useState<any>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes] = await Promise.all([api.get('/bookings/stats')]);
      if (statsRes.data.success) setStats(statsRes.data.data);

      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);

      let endpoint = '/bookings';
      if (viewMode === 'HISTORY') endpoint = '/bookings/history';
      else if (viewMode === 'REQUESTS') { endpoint = '/bookings'; params.set('status', 'PENDING'); }

      const res = await api.get(`${endpoint}?${params}`);
      if (res.data.success) {
        setData(res.data.data);
        setTotalPages(res.data.pagination?.pages || 1);
      }
    } catch {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [page, viewMode, search, statusFilter, dateFrom, dateTo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const resetFilters = () => { setSearch(''); setStatusFilter(''); setDateFrom(''); setDateTo(''); setPage(1); };

  // ── Column Definitions ──────────────────────────────────────────────────────
  const bookingColumns: ColumnDef<any>[] = [
    { header: 'Resource', cell: r => <span className="font-semibold">{r.resourceId?.name}<span className="text-muted-foreground font-mono font-normal text-xs ml-1">({r.resourceId?.tag})</span></span> },
    { header: 'Category', cell: r => <span className="text-muted-foreground text-sm">{r.categoryId?.name || '—'}</span> },
    { header: 'Booked By', cell: r => <span className="text-sm">{r.employeeId?.firstName} {r.employeeId?.lastName}</span> },
    { header: 'Department', cell: r => <span className="text-muted-foreground text-sm">{r.departmentId?.name}</span> },
    { header: 'Date', cell: r => <span className="text-muted-foreground text-sm">{new Date(r.bookingDate).toLocaleDateString()}</span> },
    { header: 'Time Slot', cell: r => <span className="text-sm font-mono">{r.startTime} – {r.endTime}</span> },
    { header: 'Status', cell: r => <StatusBadge status={r.status} /> },
    {
      header: 'Actions', className: 'text-right',
      cell: r => (
        <div className="flex justify-end pr-1">
          <BookingActionMenu
            booking={r} canManage={canManage} currentUser={user}
            onView={setDetailBooking}
            onApprove={(b: any) => setActionModal({ booking: b, action: 'approve' })}
            onReject={(b: any) => setActionModal({ booking: b, action: 'reject' })}
            onCancel={(b: any) => setActionModal({ booking: b, action: 'cancel' })}
          />
        </div>
      ),
    },
  ];

  const historyColumns: ColumnDef<any>[] = [
    { header: 'Date', cell: r => <span className="text-muted-foreground text-sm">{new Date(r.createdAt).toLocaleDateString()}</span> },
    {
      header: 'Action', cell: r => (
        <span className={`text-xs px-2 py-1 rounded-full border font-medium ${r.action === 'CREATED' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
          : r.action === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
            : r.action === 'REJECTED' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
              : 'bg-muted text-muted-foreground border-border'}`}>
          {r.action}
        </span>
      )
    },
    { header: 'Resource', cell: r => <span>{r.resourceId?.name} <span className="text-muted-foreground font-mono text-xs">({r.resourceId?.tag})</span></span> },
    { header: 'Performed By', cell: r => <span className="text-muted-foreground text-sm">{r.performedBy?.firstName} {r.performedBy?.lastName}</span> },
    { header: 'Remarks', cell: r => <span className="text-muted-foreground text-sm">{r.remarks || '—'}</span> },
  ];

  const statCards = [
    { label: 'Total Resources', value: stats.totalResources, accent: 'border-l-blue-500' },
    { label: 'Available', value: stats.availableResources, accent: 'border-l-emerald-500' },
    { label: "Today's Bookings", value: stats.todaysBookings, accent: 'border-l-purple-500' },
    { label: 'Pending', value: stats.pendingRequests, accent: 'border-l-amber-500' },
    { label: 'Approved', value: stats.approvedBookings, accent: 'border-l-teal-500' },
    { label: 'Rejected', value: stats.rejectedBookings, accent: 'border-l-rose-500' },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Resource Booking"
        description="Book meeting rooms, projectors, laptops, conference rooms and other company resources from one centralized dashboard."
        actions={
          <>
            {canCreate && (
              <Button onClick={() => setIsBookOpen(true)} className="flex items-center gap-2">
                <Plus className="w-4 h-4" /> Book Resource
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsCalendarOpen(true)} className="flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Calendar View
            </Button>
            <Button
              variant={viewMode === 'REQUESTS' ? 'default' : 'outline'}
              onClick={() => { setViewMode('REQUESTS'); setPage(1); }}
              className="flex items-center gap-2"
            >
              <ClipboardList className="w-4 h-4" /> Requests
              {stats.pendingRequests > 0 && (
                <span className="ml-1 bg-amber-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                  {stats.pendingRequests}
                </span>
              )}
            </Button>
            <Button
              variant={viewMode === 'HISTORY' ? 'default' : 'outline'}
              onClick={() => { setViewMode(viewMode === 'HISTORY' ? 'BOOKINGS' : 'HISTORY'); setPage(1); }}
              className="flex items-center gap-2"
            >
              <History className="w-4 h-4" />
              {viewMode === 'HISTORY' ? 'Back to Bookings' : 'History'}
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

      {/* Filters */}
      <ContentCard className="mb-4 p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[160px]">
            <label className="text-xs font-medium text-muted-foreground block mb-1">Search</label>
            <input className={inputCls} placeholder="Search by purpose..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          {viewMode !== 'REQUESTS' && (
            <div className="min-w-[140px]">
              <label className="text-xs font-medium text-muted-foreground block mb-1">Status</label>
              <select className={inputCls} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">From</label>
            <input type="date" className={inputCls} value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">To</label>
            <input type="date" className={inputCls} value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} />
          </div>
          <Button variant="outline" size="sm" onClick={resetFilters}>Reset</Button>
        </div>
      </ContentCard>

      {/* Table title bar */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold">
          {viewMode === 'HISTORY' ? 'Booking History' : viewMode === 'REQUESTS' ? 'Pending Booking Requests' : 'Current Bookings'}
        </h2>
        {viewMode === 'REQUESTS' && (
          <Button variant="ghost" size="sm" onClick={() => { setViewMode('BOOKINGS'); setPage(1); }}>
            ← Back to All Bookings
          </Button>
        )}
      </div>

      <DataTable
        data={data}
        columns={viewMode === 'HISTORY' ? historyColumns : bookingColumns}
        isLoading={loading}
        emptyMessage={viewMode === 'REQUESTS' ? 'No pending booking requests.' : viewMode === 'HISTORY' ? 'No booking history found.' : 'No bookings found.'}
        className="mb-4"
      />

      <div className="flex justify-end">
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {/* Modals */}
      <BookResourceModal isOpen={isBookOpen} onClose={() => setIsBookOpen(false)} onSaved={fetchData} />
      {isCalendarOpen && <CalendarView onClose={() => setIsCalendarOpen(false)} />}
      {actionModal && (
        <ActionModal
          isOpen={true}
          onClose={() => setActionModal(null)}
          onSaved={fetchData}
          booking={actionModal.booking}
          action={actionModal.action}
        />
      )}
      {detailBooking && (
        <BookingDetailModal isOpen={true} onClose={() => setDetailBooking(null)} booking={detailBooking} />
      )}
    </PageContainer>
  );
}
