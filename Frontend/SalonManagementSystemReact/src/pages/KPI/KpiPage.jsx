import { useState, useEffect, useCallback } from 'react';
import {
  Users, Trophy, TrendingUp, TrendingDown, Plus,
  MoreHorizontal, RefreshCw, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useAuth } from '../../context/AuthContext';
import { quotaApi, branchesApi, organizationsApi } from '../../services/api';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];


const KPI_TYPES = {
  Receptionist: ['Total Appointments Created', 'Walk-in Conversions', 'Membership Signups', 'Customer Retention'],
  Stylist:      ['Service Sales', 'Clients Served', 'Upsell Success', 'Rebooking Rate'],
  Barber:       ['Service Sales', 'Clients Served', 'Upsell Success', 'Rebooking Rate'],
  Therapist:    ['Sessions Completed', 'Package Sales', 'Repeat Customer Rate'],
  Cashier:      ['Transactions Handled', 'Add-on Product Sales', 'Checkout Speed'],
  Staff:        ['Attendance', 'Task Completion', 'Support Contribution'],
};

const ALL_KPI_TYPES = [...new Set(Object.values(KPI_TYPES).flat())];
const PERIOD_TYPES = ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly'];

function statusColor(status) {
  if (status === 'Achieved') return 'border-green-500 text-green-700 dark:text-green-400';
  if (status === 'On Track') return 'border-blue-400 text-blue-600 dark:text-blue-400';
  if (status === 'Behind')   return 'border-yellow-400 text-yellow-600 dark:text-yellow-400';
  if (status === 'Missed')   return 'border-red-400 text-red-600 dark:text-red-400';
  return '';
}

function ProgressBar({ pct }) {
  const color = pct >= 100 ? 'bg-green-500' : pct >= 50 ? 'bg-blue-500' : 'bg-yellow-500';
  return (
    <div className="w-full bg-secondary rounded-full h-1.5">
      <div className={cn('h-1.5 rounded-full transition-all', color)} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  );
}

// ── Assign KPI dialog ──────────────────────────────────────────────────────────
function AssignKpiDialog({ open, onClose, orgId, onAssigned }) {
  const BLANK = {
    userId: '', classification: '', quotaType: '', periodType: 'Monthly',
    startDate: '', endDate: '', targetValue: '', branchId: '', description: '',
  };
  const [form, setForm] = useState(BLANK);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [members, setMembers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [fetchLog, setFetchLog] = useState([]);
  const [fetchStatus, setFetchStatus] = useState('idle');

  useEffect(() => {
    if (!open) {
      setForm(BLANK);
      setError('');
      setFetchLog([]);
      setFetchStatus('idle');
      setMembers([]);
      setBranches([]);
      return;
    }

    setFetchStatus('loading');
    const ts = new Date().toLocaleTimeString();
    setFetchLog([`[${ts}] Dialog opened — orgId=${orgId}`, 'Fetching members and branches…']);

    Promise.allSettled([
      organizationsApi.getMembers(orgId),
      branchesApi.getByOrganization(orgId),
    ]).then(([mRes, bRes]) => {
      if (mRes.status === 'fulfilled') {
        const data = mRes.value.data ?? [];
        setMembers(data);
        setFetchLog(prev => [
          ...prev,
          `✓ Members: ${data.length} Staff member(s)`,
          ...data.map(m => `  userId=${m.userId}  "${m.userName}"  <${m.email}>`),
          ...(data.length === 0 ? ['⚠ No Staff members in this organization.'] : []),
        ]);
      } else {
        const msg = mRes.reason?.response?.data?.message || mRes.reason?.message || 'Unknown';
        setFetchLog(prev => [...prev, `✗ Members error: ${msg}`]);
      }

      if (bRes.status === 'fulfilled') {
        const data = bRes.value.data ?? [];
        setBranches(data);
        setFetchLog(prev => [...prev, `✓ Branches: ${data.length} branch(es)`]);
      } else {
        const msg = bRes.reason?.response?.data?.message || bRes.reason?.message || 'Unknown';
        setFetchLog(prev => [...prev, `✗ Branches error: ${msg}`]);
      }

      setFetchStatus('done');
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, orgId]);

  const kpiOptions = form.classification
    ? (KPI_TYPES[form.classification] ?? ALL_KPI_TYPES)
    : ALL_KPI_TYPES;

  const handleUserChange = (e) => {
    setForm(f => ({ ...f, userId: e.target.value, quotaType: '' }));
  };

  const handleClassificationChange = (e) => {
    setForm(f => ({ ...f, classification: e.target.value, quotaType: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await quotaApi.create({
        organizationId: orgId,
        userId: parseInt(form.userId),
        branchId: form.branchId ? parseInt(form.branchId) : null,
        classification: form.classification || null,
        quotaType: form.quotaType,
        periodType: form.periodType,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
        targetValue: parseFloat(form.targetValue),
        description: form.description || null,
      });
      onAssigned();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign KPI.');
    } finally { setLoading(false); }
  };

  const canSubmit = form.userId && form.quotaType && form.startDate && form.endDate && form.targetValue;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Assign KPI / Quota</DialogTitle></DialogHeader>
        {error && <Alert variant="destructive" className="mb-1"><AlertDescription>{error}</AlertDescription></Alert>}
        <form onSubmit={handleSubmit} className="space-y-3">

          <div className="space-y-1.5">
            <Label>Staff Member</Label>
            <select value={form.userId} onChange={handleUserChange} required
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <option value="">{fetchStatus === 'loading' ? 'Loading…' : '— Select staff —'}</option>
              {members.map(m => (
                <option key={m.userId} value={m.userId}>{m.userName}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Classification <span className="text-muted-foreground">(optional)</span></Label>
              <select value={form.classification} onChange={handleClassificationChange}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <option value="">— General —</option>
                {Object.keys(KPI_TYPES).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>KPI Type</Label>
              <select value={form.quotaType} onChange={e => setForm(f => ({ ...f, quotaType: e.target.value }))} required
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <option value="">— Select KPI —</option>
                {kpiOptions.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Period</Label>
              <select value={form.periodType} onChange={e => setForm(f => ({ ...f, periodType: e.target.value }))}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {PERIOD_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Target Value</Label>
              <Input type="number" min="0.01" step="0.01" value={form.targetValue}
                onChange={e => setForm(f => ({ ...f, targetValue: e.target.value }))} required placeholder="e.g. 50" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Start Date</Label>
              <Input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label>End Date</Label>
              <Input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Branch <span className="text-muted-foreground">(optional)</span></Label>
              <select value={form.branchId} onChange={e => setForm(f => ({ ...f, branchId: e.target.value }))}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <option value="">All Branches</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Notes <span className="text-muted-foreground">(optional)</span></Label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Additional context" />
            </div>
          </div>

          {/* Debug log */}
          {fetchLog.length > 0 && (
            <details open={fetchStatus === 'error' || members.length === 0}>
              <summary className="text-xs text-muted-foreground cursor-pointer select-none py-1">
                Member fetch log ({fetchStatus})
              </summary>
              <div className="mt-1 text-[11px] font-mono bg-muted/60 border border-border rounded p-2 max-h-36 overflow-y-auto space-y-0.5 leading-snug">
                {fetchLog.map((line, i) => (
                  <p key={i} className={
                    line.startsWith('✗') ? 'text-red-500' :
                    line.startsWith('⚠') ? 'text-yellow-600 dark:text-yellow-400' :
                    line.startsWith('✓') ? 'text-green-600 dark:text-green-400' :
                    'text-muted-foreground'
                  }>{line}</p>
                ))}
              </div>
            </details>
          )}

          <DialogFooter className="pt-1">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading || !canSubmit}
              className="bg-brown text-cream hover:bg-brown/90 dark:bg-beige dark:text-[#1A0F0A] dark:hover:bg-beige/90">
              {loading
                ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Assigning…</span>
                : 'Assign KPI'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Update Progress dialog ─────────────────────────────────────────────────────
function UpdateProgressDialog({ open, onClose, quota, onUpdated }) {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (quota) setValue(String(quota.currentValue));
  }, [quota]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await quotaApi.updateProgress(quota.id, { currentValue: parseFloat(value) });
      onUpdated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update progress.');
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader><DialogTitle>Update Progress</DialogTitle></DialogHeader>
        {error && <Alert variant="destructive" className="mb-1"><AlertDescription>{error}</AlertDescription></Alert>}
        {quota && (
          <p className="text-sm text-muted-foreground">
            {quota.userName} — {quota.quotaType}
            <span className="ml-2 font-medium">Target: {quota.targetValue}</span>
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Current Value</Label>
            <Input type="number" min="0" step="0.01" value={value} onChange={e => setValue(e.target.value)} required />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}
              className="bg-brown text-cream hover:bg-brown/90 dark:bg-beige dark:text-[#1A0F0A] dark:hover:bg-beige/90">
              {loading ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function StatCard({ label, value, icon, color }) {
  const Icon = icon;
  return (
    <Card className="shadow-sm border-border/60">
      <CardContent className="p-4">
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center mb-2', color)}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <p className="text-xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

// ── Main KPI Page ──────────────────────────────────────────────────────────────
export default function KpiPage() {
  const { user, organization } = useAuth();
  const orgId = organization?.id;
  // 'Admin' JWT role OR the org-level Owner can manage KPIs
  const canManageKpi = user?.role === 'Admin' || organization?.userRole === 'Owner';

  const [quotas, setQuotas]           = useState([]);
  const [dashboard, setDashboard]     = useState(null);
  const [topPerformers, setTopPerformers] = useState([]);
  const [branches, setBranches]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');

  const [filterBranch, setFilterBranch] = useState('');
  const [filterMonth, setFilterMonth]   = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear]     = useState(new Date().getFullYear());
  const [showAll, setShowAll]           = useState(false);

  const [page, setPage]           = useState(1);
  const [pageSize, setPageSize]   = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [assignKpiOpen, setAssignKpiOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [selectedQuota, setSelectedQuota] = useState(null);

  const loadAll = useCallback(async () => {
    if (!orgId) return;
    setLoading(true); setError('');

    const reportParams = { orgId, page, pageSize };
    if (!showAll) { reportParams.month = filterMonth; reportParams.year = filterYear; }
    if (filterBranch) reportParams.branchId = filterBranch;

    const dashMonth = showAll ? undefined : filterMonth;
    const dashYear  = showAll ? undefined : filterYear;

    const [qRes, dashRes, topRes, brRes] = await Promise.allSettled([
      quotaApi.getReport(reportParams),
      quotaApi.getDashboard(orgId, filterBranch || undefined, dashMonth, dashYear),
      quotaApi.getTopPerformers(orgId, filterBranch || undefined, 5),
      branchesApi.getByOrganization(orgId),
    ]);

    if (qRes.status === 'fulfilled') {
      const { items, totalCount: tc, totalPages: tp } = qRes.value.data;
      setQuotas(items ?? []);
      setTotalCount(tc ?? 0);
      setTotalPages(tp ?? 1);
    } else console.error('[KPI] getReport failed:', qRes.reason);

    if (dashRes.status === 'fulfilled') setDashboard(dashRes.value.data);
    else console.error('[KPI] getDashboard failed:', dashRes.reason);

    if (topRes.status === 'fulfilled') setTopPerformers(topRes.value.data);
    else console.error('[KPI] getTopPerformers failed:', topRes.reason);

    if (brRes.status === 'fulfilled') setBranches(brRes.value.data);
    else console.error('[KPI] getBranches failed:', brRes.reason);

    const failed = [qRes, dashRes, topRes, brRes]
      .map((r, i) => r.status === 'rejected'
        ? ['quotas', 'dashboard', 'top performers', 'branches'][i] : null)
      .filter(Boolean);
    if (failed.length) setError(`Failed to load: ${failed.join(', ')}.`);

    setLoading(false);
  }, [orgId, filterBranch, filterMonth, filterYear, showAll, page, pageSize]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleToggleQuota = async (id) => {
    try {
      await quotaApi.toggleActive(id);
      loadAll();
    } catch (err) { alert(err.response?.data?.message || 'Failed.'); }
  };

  const exportCsv = async () => {
    const exportParams = { orgId };
    if (!showAll) { exportParams.month = filterMonth; exportParams.year = filterYear; }
    if (filterBranch) exportParams.branchId = filterBranch;

    let rows;
    try {
      const res = await quotaApi.exportReport(exportParams);
      rows = res.data;
    } catch {
      rows = quotas; // fallback to current page
    }

    const headers = ['Rank', 'User', 'Classification', 'Branch', 'KPI Type', 'Period', 'Target', 'Current', 'Remaining', 'Completion%', 'Status'];
    const csvRows = rows.map(q => [
      q.rank, q.userName, q.classification ?? '', q.branchName, q.quotaType,
      q.periodType, q.targetValue, q.currentValue, q.remaining, q.completionPct, q.status,
    ]);
    const csv = [headers, ...csvRows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = showAll
      ? `kpi-report-all.csv`
      : `kpi-report-${filterYear}-${String(filterMonth).padStart(2, '0')}.csv`;
    a.click();
  };

  if (!orgId) return (
    <div className="text-center py-20 text-muted-foreground text-sm">No organization selected.</div>
  );

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const years = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">KPI & Quota</h2>
          <p className="text-sm text-muted-foreground">Staff performance targets and progress</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadAll} className="gap-1.5">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
          {canManageKpi && (
            <Button size="sm" onClick={() => setAssignKpiOpen(true)}
              className="gap-1.5 bg-brown text-cream hover:bg-brown/90 dark:bg-beige dark:text-[#1A0F0A] dark:hover:bg-beige/90">
              <Plus className="w-4 h-4" /> Assign KPI
            </Button>
          )}
        </div>
      </div>

      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="report">KPI Report</TabsTrigger>
        </TabsList>

        {/* ── OVERVIEW ── */}
        <TabsContent value="overview" className="space-y-5 mt-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="Quota Staff" value={dashboard?.totalQuotaStaff ?? '—'} icon={Users} color="bg-brown" />
            <StatCard label="Achieved" value={dashboard?.achieved ?? '—'} icon={Trophy} color="bg-green-600" />
            <StatCard label="On Track" value={dashboard?.onTrack ?? '—'} icon={TrendingUp} color="bg-blue-600" />
            <StatCard label="Behind" value={dashboard?.behind ?? '—'} icon={TrendingDown} color="bg-yellow-500" />
          </div>

          {dashboard && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="shadow-sm border-border/60">
                <CardHeader className="pb-2"><CardTitle className="text-sm">Overall Completion</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold mb-2">{dashboard.completionPct}%</p>
                  <ProgressBar pct={dashboard.completionPct} />
                  <div className="mt-4 space-y-1">
                    {dashboard.kpiByClassification?.map(k => (
                      <div key={k.classification} className="flex items-center gap-2 text-sm">
                        <span className="w-28 text-muted-foreground truncate">{k.classification}</span>
                        <ProgressBar pct={k.avgCompletion} />
                        <span className="w-10 text-right text-xs">{k.avgCompletion}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-border/60">
                <CardHeader className="pb-2"><CardTitle className="text-sm">Top Performers</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {loading ? (
                    <p className="text-xs text-muted-foreground">Loading…</p>
                  ) : topPerformers.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No data yet.</p>
                  ) : topPerformers.map(p => (
                    <div key={p.userId} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-muted-foreground w-4">#{p.rank}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.userName}</p>
                        <p className="text-xs text-muted-foreground">{p.classification ?? '—'}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold">{p.completionPct}%</p>
                        <ProgressBar pct={p.completionPct} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* ── KPI REPORT ── */}
        <TabsContent value="report" className="space-y-4 mt-4">
          <div className="flex flex-wrap gap-3 items-end">
            {/* All Time toggle */}
            <div className="space-y-1">
              <Label className="text-xs">Period</Label>
              <button
                type="button"
                onClick={() => { setShowAll(v => !v); setPage(1); }}
                className={cn(
                  'flex h-8 items-center gap-1.5 rounded-md border px-3 text-sm font-medium transition-colors',
                  showAll
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-input bg-background hover:bg-muted'
                )}
              >
                {showAll ? 'All Time' : 'By Month'}
              </button>
            </div>

            {/* Month / Year — disabled when showAll */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Month</Label>
              <select
                value={filterMonth}
                disabled={showAll}
                onChange={e => { setFilterMonth(Number(e.target.value)); setPage(1); }}
                className="flex h-8 rounded-md border border-input bg-background px-2 py-1 text-sm shadow-sm disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Year</Label>
              <select
                value={filterYear}
                disabled={showAll}
                onChange={e => { setFilterYear(Number(e.target.value)); setPage(1); }}
                className="flex h-8 rounded-md border border-input bg-background px-2 py-1 text-sm shadow-sm disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Branch</Label>
              <select
                value={filterBranch}
                onChange={e => { setFilterBranch(e.target.value); setPage(1); }}
                className="flex h-8 rounded-md border border-input bg-background px-2 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">All Branches</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <Button variant="outline" size="sm" onClick={exportCsv} className="h-8">Export CSV</Button>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Loading…</p>
          ) : quotas.length === 0 ? (
            <Card className="shadow-sm border-border/60">
              <CardContent className="py-16 text-center text-muted-foreground text-sm">
                No KPI records found for this period.{canManageKpi && ' Click "Assign KPI" to add one.'}
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-sm border-border/60">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="px-4 py-3 font-medium">#</th>
                      <th className="px-4 py-3 font-medium">Staff</th>
                      <th className="px-4 py-3 font-medium">Classification</th>
                      <th className="px-4 py-3 font-medium">KPI</th>
                      <th className="px-4 py-3 font-medium">Target</th>
                      <th className="px-4 py-3 font-medium">Current</th>
                      <th className="px-4 py-3 font-medium">Progress</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium w-10" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {quotas.map(q => (
                      <tr key={q.id} className="hover:bg-secondary/40 transition-colors">
                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{q.rank}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium">{q.userName}</p>
                          <p className="text-xs text-muted-foreground">{q.branchName}</p>
                        </td>
                        <td className="px-4 py-3">
                          {q.classification
                            ? <Badge variant="secondary" className="text-xs">{q.classification}</Badge>
                            : <span className="text-xs text-muted-foreground">—</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{q.quotaType}</td>
                        <td className="px-4 py-3 font-medium">{q.targetValue}</td>
                        <td className="px-4 py-3">{q.currentValue}</td>
                        <td className="px-4 py-3 min-w-[120px]">
                          <div className="flex items-center gap-2">
                            <ProgressBar pct={q.completionPct} />
                            <span className="text-xs w-10 text-right">{q.completionPct}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={cn('text-xs', statusColor(q.status))}>
                            {q.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="text-muted-foreground hover:text-foreground p-0.5 rounded">
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {canManageKpi && (
                                <DropdownMenuItem onClick={() => { setSelectedQuota(q); setProgressOpen(true); }} className="cursor-pointer">
                                  Update Progress
                                </DropdownMenuItem>
                              )}
                              {canManageKpi && (
                                <DropdownMenuItem onClick={() => handleToggleQuota(q.id)}
                                  className="text-red-500 focus:text-red-500 cursor-pointer">
                                  Disable KPI
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination bar */}
              {totalCount > 0 && (
                <div className="flex items-center justify-between gap-4 px-4 py-3 border-t border-border/60 text-sm">
                  <p className="text-xs text-muted-foreground whitespace-nowrap">
                    {totalCount === 0
                      ? 'No records'
                      : `Showing ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, totalCount)} of ${totalCount}`}
                  </p>
                  <div className="flex items-center gap-2">
                    <select
                      value={pageSize}
                      onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                      className="h-7 rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {PAGE_SIZE_OPTIONS.map(n => (
                        <option key={n} value={n}>{n} / page</option>
                      ))}
                    </select>
                    <Button
                      variant="outline" size="icon"
                      className="h-7 w-7"
                      disabled={page <= 1}
                      onClick={() => setPage(p => p - 1)}
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </Button>
                    <span className="text-xs text-muted-foreground min-w-[60px] text-center">
                      {page} / {totalPages}
                    </span>
                    <Button
                      variant="outline" size="icon"
                      className="h-7 w-7"
                      disabled={page >= totalPages}
                      onClick={() => setPage(p => p + 1)}
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <AssignKpiDialog
        open={assignKpiOpen}
        onClose={() => setAssignKpiOpen(false)}
        orgId={orgId}
        onAssigned={loadAll}
      />
      <UpdateProgressDialog
        open={progressOpen}
        onClose={() => setProgressOpen(false)}
        quota={selectedQuota}
        onUpdated={loadAll}
      />
    </div>
  );
}
