import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  TrendingUp, DollarSign, CalendarCheck, XCircle, RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { useAuth } from '../../context/AuthContext';
import { reportsApi } from '../../services/api';

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(n);

function startOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
function today() {
  return new Date().toISOString().slice(0, 10);
}

const PRESETS = [
  { label: 'Today', getRange: () => { const t = today(); return [t, t]; } },
  {
    label: 'This Week', getRange: () => {
      const now = new Date();
      const mon = new Date(now); mon.setDate(now.getDate() - ((now.getDay() + 6) % 7));
      return [mon.toISOString().slice(0, 10), today()];
    }
  },
  { label: 'This Month', getRange: () => [startOfMonth(), today()] },
  { label: 'Custom', getRange: null },
];

const CHART_COLORS = ['#7C5C3E', '#A07850', '#C49A6C', '#E8C89A', '#6B8E5E', '#4A7A8A'];

// ── Sub-components ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <Card className="shadow-sm border-border/60">
      <CardContent className="p-4 space-y-2 animate-pulse">
        <div className="h-3 w-24 bg-muted rounded" />
        <div className="h-7 w-32 bg-muted rounded" />
        <div className="h-2 w-16 bg-muted rounded" />
      </CardContent>
    </Card>
  );
}

function SkeletonChart() {
  return (
    <Card className="shadow-sm border-border/60">
      <CardContent className="p-4 animate-pulse">
        <div className="h-4 w-40 bg-muted rounded mb-4" />
        <div className="h-48 bg-muted rounded" />
      </CardContent>
    </Card>
  );
}

function StatCard({ label, value, sub, icon, color }) {
  const Icon = icon;
  return (
    <Card className="shadow-sm border-border/60">
      <CardContent className="p-4">
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center mb-3', color)}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

const CustomTooltip = ({ active, payload, label, currency }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: {currency ? fmt(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

// ── Main page ──────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const [preset, setPreset] = useState('This Month');
  const [startDate, setStartDate] = useState(startOfMonth());
  const [endDate, setEndDate] = useState(today());

  const [summary, setSummary] = useState(null);
  const [byService, setByService] = useState([]);
  const [byBranch, setByBranch] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadReports = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    setError('');

    const [sumRes, svcRes, brRes] = await Promise.allSettled([
      reportsApi.getSummary(orgId, startDate, endDate),
      reportsApi.getByService(orgId, startDate, endDate),
      reportsApi.getByBranch(orgId, startDate, endDate),
    ]);

    if (sumRes.status === 'fulfilled') setSummary(sumRes.value.data);
    else setError('Failed to load summary data.');

    if (svcRes.status === 'fulfilled') setByService(svcRes.value.data);
    if (brRes.status === 'fulfilled') setByBranch(brRes.value.data);

    setLoading(false);
  }, [orgId, startDate, endDate]);

  // Auto-load on mount and whenever date range changes
  useEffect(() => { loadReports(); }, [loadReports]);

  const handlePreset = (p) => {
    setPreset(p.label);
    if (p.getRange) {
      const [s, e] = p.getRange();
      setStartDate(s);
      setEndDate(e);
    }
  };

  if (!orgId) return (
    <div className="text-center py-20 text-muted-foreground text-sm">No organization selected.</div>
  );

  const hasData = summary && (summary.totalBookings > 0 || byService.length > 0 || byBranch.length > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold">Reports & Analytics</h2>
          <p className="text-sm text-muted-foreground">Track your salon's performance and revenue.</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadReports} disabled={loading} className="gap-1.5">
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} /> Refresh
        </Button>
      </div>

      {/* Date filter */}
      <Card className="shadow-sm border-border/60">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex gap-1.5">
              {PRESETS.map(p => (
                <button
                  key={p.label}
                  onClick={() => handlePreset(p)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                    preset === p.label
                      ? 'bg-brown text-cream dark:bg-beige dark:text-[#1A0F0A]'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {preset === 'Custom' && (
              <div className="flex items-end gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Start</Label>
                  <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                    className="h-8 text-sm w-36" max={endDate} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">End</Label>
                  <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                    className="h-8 text-sm w-36" min={startDate} max={today()} />
                </div>
              </div>
            )}
            {preset !== 'Custom' && (
              <p className="text-xs text-muted-foreground self-end pb-1">
                {startDate} → {endDate}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

      {/* ── Task 2: Summary Cards ── */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Total Appointments"
            value={summary?.totalBookings ?? 0}
            sub={`${summary?.completedBookings ?? 0} completed`}
            icon={CalendarCheck}
            color="bg-brown"
          />
          <StatCard
            label="Total Sales"
            value={fmt(summary?.totalSales ?? 0)}
            sub="From completed appointments"
            icon={DollarSign}
            color="bg-green-600"
          />
          <StatCard
            label="Completion Rate"
            value={`${summary?.completionRate ?? 0}%`}
            sub={`${summary?.cancelledCount ?? 0} cancelled / no-show`}
            icon={TrendingUp}
            color="bg-blue-600"
          />
          <StatCard
            label="Pending"
            value={summary?.pendingCount ?? 0}
            sub="Awaiting service"
            icon={XCircle}
            color="bg-yellow-500"
          />
        </div>
      )}

      {/* Empty state */}
      {!loading && !hasData && (
        <Card className="shadow-sm border-border/60">
          <CardContent className="py-16 text-center text-muted-foreground text-sm">
            No report data available for the selected date range.
          </CardContent>
        </Card>
      )}

      {/* ── Task 1 & 3: Charts ── */}
      {!loading && hasData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Task 1: Bookings per Service Type */}
          <Card className="shadow-sm border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Appointments by Service Type</CardTitle>
            </CardHeader>
            <CardContent>
              {byService.length === 0 ? (
                <p className="text-xs text-muted-foreground py-10 text-center">No data</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={byService} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
                    <XAxis dataKey="serviceName" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="totalBookings" name="Appointments" radius={[4, 4, 0, 0]}>
                      {byService.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Task 3: Bookings per Branch */}
          <Card className="shadow-sm border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Appointments by Branch</CardTitle>
            </CardHeader>
            <CardContent>
              {byBranch.length === 0 ? (
                <p className="text-xs text-muted-foreground py-10 text-center">No data</p>
              ) : byBranch.length === 1 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={byBranch} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
                    <XAxis dataKey="branchName" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="totalBookings" name="Appointments" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={byBranch} dataKey="totalBookings" nameKey="branchName"
                      cx="50%" cy="50%" outerRadius={80} label={({ branchName, percent }) =>
                        `${branchName} ${(percent * 100).toFixed(0)}%`}>
                      {byBranch.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [v, 'Appointments']} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Task 4: Sales per Branch */}
          <Card className="shadow-sm border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Sales by Branch</CardTitle>
            </CardHeader>
            <CardContent>
              {byBranch.length === 0 ? (
                <p className="text-xs text-muted-foreground py-10 text-center">No data</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={byBranch} margin={{ top: 4, right: 8, left: 16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
                    <XAxis dataKey="branchName" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false}
                      tickFormatter={v => `₱${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip currency />} />
                    <Bar dataKey="totalSales" name="Sales" radius={[4, 4, 0, 0]}>
                      {byBranch.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Task 1 detail: Service Type table */}
          <Card className="shadow-sm border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Service Type Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {byService.length === 0 ? (
                <p className="text-xs text-muted-foreground py-10 text-center px-4">No data</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="px-4 py-2.5 font-medium">Service</th>
                        <th className="px-4 py-2.5 font-medium text-right">Appointments</th>
                        <th className="px-4 py-2.5 font-medium text-right">Completed</th>
                        <th className="px-4 py-2.5 font-medium text-right">Sales</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {byService.map((row, i) => (
                        <tr key={i} className="hover:bg-secondary/40 transition-colors">
                          <td className="px-4 py-2.5 font-medium">{row.serviceName}</td>
                          <td className="px-4 py-2.5 text-right">{row.totalBookings}</td>
                          <td className="px-4 py-2.5 text-right text-green-600 dark:text-green-400">{row.completedBookings}</td>
                          <td className="px-4 py-2.5 text-right font-medium">{fmt(row.totalSales)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t bg-secondary/30">
                      <tr>
                        <td className="px-4 py-2.5 font-semibold">Total</td>
                        <td className="px-4 py-2.5 text-right font-semibold">
                          {byService.reduce((s, r) => s + r.totalBookings, 0)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold text-green-600 dark:text-green-400">
                          {byService.reduce((s, r) => s + r.completedBookings, 0)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold">
                          {fmt(byService.reduce((s, r) => s + r.totalSales, 0))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Skeleton charts while loading */}
      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <SkeletonChart key={i} />)}
        </div>
      )}
    </div>
  );
}
