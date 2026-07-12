'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { ContentCard } from '@/components/layout/ContentCard';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import {
  BarChart3, Box, CalendarCheck, Wrench, ShieldCheck, Download, Printer, FileSpreadsheet, FileText,
} from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { exportToCSV, exportToExcel, exportToPDF, printReport } from '@/lib/utils/exportUtils';
import { useTheme } from 'next-themes';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

type Tab = 'DASHBOARD' | 'ASSETS' | 'BOOKINGS' | 'MAINTENANCE' | 'AUDIT';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

export default function ReportsPage() {
  const { user } = useSelector((s: RootState) => s.auth);
  const { theme, systemTheme } = useTheme();
  
  const currentTheme = theme === 'system' ? systemTheme : theme;
  const isDark = currentTheme === 'dark';
  const textColor = isDark ? '#e2e8f0' : '#334155';
  const gridColor = isDark ? '#334155' : '#e2e8f0';

  const [activeTab, setActiveTab] = useState<Tab>('DASHBOARD');
  
  // Data States
  const [stats, setStats] = useState<any>({});
  const [charts, setCharts] = useState<any>({});
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Dropdown data
  const [departments, setDepartments] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      api.get('/departments?limit=100'),
      api.get('/categories?limit=200'),
    ]).then(([dRes, cRes]) => {
      if (dRes.data.success) setDepartments(dRes.data.data);
      if (cRes.data.success) setCategories(cRes.data.data);
    });
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      if (activeTab === 'DASHBOARD') {
        const [statRes, chartRes] = await Promise.all([
          api.get('/reports/dashboard'),
          api.get('/reports/charts'),
        ]);
        if (statRes.data.success) setStats(statRes.data.data);
        if (chartRes.data.success) setCharts(chartRes.data.data);
      } else {
        const params = new URLSearchParams({ page: String(page), limit: '50' });
        if (search) params.set('search', search);
        if (departmentId) params.set('departmentId', departmentId);
        if (categoryId) params.set('categoryId', categoryId);
        if (statusFilter) params.set('status', statusFilter);

        const endpoint = `/reports/${activeTab.toLowerCase()}`;
        const res = await api.get(`${endpoint}?${params}`);
        if (res.data.success) {
          setReportData(res.data.data);
          setTotalPages(res.data.pagination?.pages || 1);
        }
      }
    } catch {
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, search, departmentId, categoryId, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const resetFilters = () => {
    setSearch(''); setDepartmentId(''); setCategoryId(''); setStatusFilter(''); setPage(1);
  };

  // ── Column Definitions ──────────────────────────────────────────────────────
  const assetCols = [
    { header: 'Asset Tag', accessor: 'tag' },
    { header: 'Name', accessor: 'name' },
    { header: 'Category', accessor: (r: any) => r.category?.name || '—' },
    { header: 'Department', accessor: (r: any) => r.department?.name || '—' },
    { header: 'Assigned To', accessor: (r: any) => r.assignedTo ? `${r.assignedTo.firstName} ${r.assignedTo.lastName}` : '—' },
    { header: 'Status', accessor: 'status' },
    { header: 'Purchase Date', accessor: (r: any) => new Date(r.purchaseDate).toLocaleDateString() },
  ];

  const bookingCols = [
    { header: 'Resource', accessor: (r: any) => `${r.resourceId?.name} (${r.resourceId?.tag})` },
    { header: 'Employee', accessor: (r: any) => `${r.employeeId?.firstName} ${r.employeeId?.lastName}` },
    { header: 'Department', accessor: (r: any) => r.departmentId?.name || '—' },
    { header: 'Booking Date', accessor: (r: any) => new Date(r.bookingDate).toLocaleDateString() },
    { header: 'Time', accessor: (r: any) => `${r.startTime} - ${r.endTime}` },
    { header: 'Status', accessor: 'status' },
  ];

  const maintenanceCols = [
    { header: 'Asset', accessor: (r: any) => `${r.assetId?.name} (${r.assetId?.tag})` },
    { header: 'Issue', accessor: 'issue' },
    { header: 'Priority', accessor: 'priority' },
    { header: 'Technician', accessor: (r: any) => r.technicianId ? `${r.technicianId.firstName} ${r.technicianId.lastName}` : '—' },
    { header: 'Status', accessor: 'status' },
    { header: 'Reported Date', accessor: (r: any) => new Date(r.createdAt).toLocaleDateString() },
  ];

  const auditCols = [
    { header: 'Audit No', accessor: 'auditNumber' },
    { header: 'Name', accessor: 'name' },
    { header: 'Department', accessor: (r: any) => r.departmentId?.name || 'All' },
    { header: 'Status', accessor: 'status' },
    { header: 'Verified', accessor: (r: any) => String(r.stats?.verified || 0) },
    { header: 'Missing', accessor: (r: any) => String(r.stats?.missing || 0) },
    { header: 'Damaged', accessor: (r: any) => String(r.stats?.damaged || 0) },
  ];

  const getActiveCols = () => {
    if (activeTab === 'ASSETS') return assetCols;
    if (activeTab === 'BOOKINGS') return bookingCols;
    if (activeTab === 'MAINTENANCE') return maintenanceCols;
    if (activeTab === 'AUDIT') return auditCols;
    return [];
  };

  const getExportTitle = () => `${activeTab.charAt(0) + activeTab.slice(1).toLowerCase()} Report`;
  const getExportFilename = () => `AssetFlow_${activeTab}_Report_${new Date().toISOString().split('T')[0]}`;

  const handleExportCSV = () => exportToCSV(reportData, getExportFilename(), getActiveCols());
  const handleExportExcel = () => exportToExcel(reportData, getExportFilename(), getActiveCols());
  const handleExportPDF = () => exportToPDF(reportData, getExportTitle(), getExportFilename(), getActiveCols());
  const handlePrint = () => printReport(reportData, getExportTitle(), getActiveCols());

  // Convert Columns for DataTable component
  const dataTableCols: ColumnDef<any>[] = getActiveCols().map(c => ({
    header: c.header,
    cell: (row) => {
      const val = typeof c.accessor === 'function' ? c.accessor(row) : row[c.accessor];
      if (c.header === 'Status') return <StatusBadge status={val} />;
      if (c.header === 'Priority') return <StatusBadge status={val} />;
      return <span className="text-sm">{val}</span>;
    }
  }));

  const inputCls = 'w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary';

  return (
    <PageContainer>
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Home &rsaquo; Reports</p>
          <h1 className="text-2xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1 text-sm max-w-xl">
            View complete business analytics, asset reports, booking reports, maintenance reports and export everything from one centralized dashboard.
          </p>
        </div>
        
        {/* Tabs / Top Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 bg-muted/50 p-1 rounded-lg">
          <Button variant={activeTab === 'DASHBOARD' ? 'default' : 'ghost'} size="sm" onClick={() => { setActiveTab('DASHBOARD'); setPage(1); }} className="flex gap-2">
            <BarChart3 className="w-4 h-4" /> Dashboard
          </Button>
          <Button variant={activeTab === 'ASSETS' ? 'default' : 'ghost'} size="sm" onClick={() => { setActiveTab('ASSETS'); setPage(1); }} className="flex gap-2">
            <Box className="w-4 h-4" /> Assets
          </Button>
          <Button variant={activeTab === 'BOOKINGS' ? 'default' : 'ghost'} size="sm" onClick={() => { setActiveTab('BOOKINGS'); setPage(1); }} className="flex gap-2">
            <CalendarCheck className="w-4 h-4" /> Bookings
          </Button>
          <Button variant={activeTab === 'MAINTENANCE' ? 'default' : 'ghost'} size="sm" onClick={() => { setActiveTab('MAINTENANCE'); setPage(1); }} className="flex gap-2">
            <Wrench className="w-4 h-4" /> Maintenance
          </Button>
          <Button variant={activeTab === 'AUDIT' ? 'default' : 'ghost'} size="sm" onClick={() => { setActiveTab('AUDIT'); setPage(1); }} className="flex gap-2">
            <ShieldCheck className="w-4 h-4" /> Audit
          </Button>
        </div>
      </div>

      {activeTab === 'DASHBOARD' ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
            <ContentCard className="p-4 border-l-4 border-l-blue-500"><span className="text-xs font-medium text-muted-foreground">Total Assets</span><span className="block text-2xl font-bold mt-1">{stats.totalAssets || 0}</span></ContentCard>
            <ContentCard className="p-4 border-l-4 border-l-emerald-500"><span className="text-xs font-medium text-muted-foreground">Available Assets</span><span className="block text-2xl font-bold mt-1">{stats.availableAssets || 0}</span></ContentCard>
            <ContentCard className="p-4 border-l-4 border-l-purple-500"><span className="text-xs font-medium text-muted-foreground">Allocated Assets</span><span className="block text-2xl font-bold mt-1">{stats.allocatedAssets || 0}</span></ContentCard>
            <ContentCard className="p-4 border-l-4 border-l-amber-500"><span className="text-xs font-medium text-muted-foreground">Maintenance Assets</span><span className="block text-2xl font-bold mt-1">{stats.maintenanceAssets || 0}</span></ContentCard>
            <ContentCard className="p-4 border-l-4 border-l-indigo-500"><span className="text-xs font-medium text-muted-foreground">Today's Bookings</span><span className="block text-2xl font-bold mt-1">{stats.todaysBookings || 0}</span></ContentCard>
            <ContentCard className="p-4 border-l-4 border-l-rose-500"><span className="text-xs font-medium text-muted-foreground">Pending Bookings</span><span className="block text-2xl font-bold mt-1">{stats.pendingBookings || 0}</span></ContentCard>
            <ContentCard className="p-4 border-l-4 border-l-teal-500"><span className="text-xs font-medium text-muted-foreground">Completed Audits</span><span className="block text-2xl font-bold mt-1">{stats.completedAudits || 0}</span></ContentCard>
            <ContentCard className="p-4 border-l-4 border-l-cyan-500"><span className="text-xs font-medium text-muted-foreground">Employees / Depts</span><span className="block text-2xl font-bold mt-1">{stats.totalEmployees || 0} / {stats.totalDepartments || 0}</span></ContentCard>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Assets by Category */}
            <ContentCard className="p-5">
              <h3 className="text-sm font-semibold mb-4">Assets by Category</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={charts.assetsByCategory || []} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                      {(charts.assetsByCategory || []).map((e: any, i: number) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: gridColor, color: textColor }} />
                    <Legend wrapperStyle={{ fontSize: '12px', color: textColor }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </ContentCard>

            {/* Assets by Department */}
            <ContentCard className="p-5">
              <h3 className="text-sm font-semibold mb-4">Assets by Department</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.assetsByDepartment || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                    <XAxis dataKey="name" stroke={textColor} fontSize={12} tickLine={false} />
                    <YAxis stroke={textColor} fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: gridColor, color: textColor }} cursor={{ fill: isDark ? '#334155' : '#f1f5f9' }} />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ContentCard>

            {/* Booking Trend */}
            <ContentCard className="p-5">
              <h3 className="text-sm font-semibold mb-4">Monthly Booking Trend</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={charts.bookingTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                    <XAxis dataKey="name" stroke={textColor} fontSize={12} tickLine={false} />
                    <YAxis stroke={textColor} fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: gridColor, color: textColor }} />
                    <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ContentCard>

            {/* Maintenance Trend */}
            <ContentCard className="p-5">
              <h3 className="text-sm font-semibold mb-4">Monthly Maintenance Trend</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={charts.maintenanceTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                    <XAxis dataKey="name" stroke={textColor} fontSize={12} tickLine={false} />
                    <YAxis stroke={textColor} fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: gridColor, color: textColor }} />
                    <Line type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: '#ef4444' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ContentCard>

          </div>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* Filters & Export Bar */}
          <ContentCard className="p-4">
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
              
              <div className="flex flex-wrap gap-3 items-end flex-1">
                <div className="min-w-[150px] flex-1">
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Search</label>
                  <input className={inputCls} placeholder="Search..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                </div>
                
                {['ASSETS', 'BOOKINGS', 'AUDIT'].includes(activeTab) && (
                  <div className="min-w-[140px]">
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Department</label>
                    <select className={inputCls} value={departmentId} onChange={e => { setDepartmentId(e.target.value); setPage(1); }}>
                      <option value="">All Depts</option>
                      {departments.map((d: any) => <option key={d._id} value={d._id}>{d.name}</option>)}
                    </select>
                  </div>
                )}
                
                {activeTab === 'ASSETS' && (
                  <div className="min-w-[140px]">
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Category</label>
                    <select className={inputCls} value={categoryId} onChange={e => { setCategoryId(e.target.value); setPage(1); }}>
                      <option value="">All Categories</option>
                      {categories.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>
                )}
                
                <div className="min-w-[140px]">
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Status</label>
                  <select className={inputCls} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
                    <option value="">All Statuses</option>
                    {activeTab === 'ASSETS' && ['AVAILABLE', 'ALLOCATED', 'UNDER_MAINTENANCE', 'RETIRED'].map(s => <option key={s} value={s}>{s}</option>)}
                    {activeTab === 'BOOKINGS' && ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map(s => <option key={s} value={s}>{s}</option>)}
                    {activeTab === 'MAINTENANCE' && ['PENDING', 'IN_PROGRESS', 'RESOLVED'].map(s => <option key={s} value={s}>{s}</option>)}
                    {activeTab === 'AUDIT' && ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                
                <Button variant="outline" size="sm" onClick={resetFilters}>Reset</Button>
              </div>

              {/* Exports */}
              <div className="flex flex-wrap items-center gap-2 shrink-0 border-t xl:border-t-0 pt-4 xl:pt-0">
                <Button variant="outline" size="sm" onClick={handleExportPDF} className="flex gap-2 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20">
                  <FileText className="w-4 h-4" /> PDF
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportExcel} className="flex gap-2 border-green-200 text-green-600 hover:bg-green-50 dark:border-green-900/50 dark:text-green-400 dark:hover:bg-green-900/20">
                  <FileSpreadsheet className="w-4 h-4" /> Excel
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportCSV} className="flex gap-2 border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-900/50 dark:text-blue-400 dark:hover:bg-blue-900/20">
                  <Download className="w-4 h-4" /> CSV
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrint} className="flex gap-2">
                  <Printer className="w-4 h-4" /> Print
                </Button>
              </div>

            </div>
          </ContentCard>

          {/* Data Table */}
          <DataTable
            data={reportData}
            columns={dataTableCols}
            isLoading={loading}
            emptyMessage={`No data found for the current ${activeTab.toLowerCase()} filters.`}
          />
          
          <div className="flex justify-end mt-4">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>

        </div>
      )}
    </PageContainer>
  );
}
