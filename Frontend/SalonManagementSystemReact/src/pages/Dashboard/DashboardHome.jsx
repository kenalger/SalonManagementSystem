import { useState, useEffect, useCallback } from 'react';
import { CalendarDays, Clock, Sparkles, BarChart2, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { bookingsApi, serviceTypesApi } from '@/services/api';

const STATUS_COLORS = {
  Pending:     'bg-yellow-100 text-yellow-800',
  Confirmed:   'bg-blue-100 text-blue-800',
  CheckedIn:   'bg-indigo-100 text-indigo-800',
  Ongoing:     'bg-purple-100 text-purple-800',
  Completed:   'bg-green-100 text-green-800',
  Cancelled:   'bg-red-100 text-red-800',
  NoShow:      'bg-gray-100 text-gray-700',
  Rescheduled: 'bg-orange-100 text-orange-800',
};

export default function DashboardHome() {
  const { user, organization } = useAuth();
  const orgId = organization?.id;

  const [dashboard, setDashboard] = useState(null);
  const [metrics, setMetrics]     = useState(null);
  const [bookings, setBookings]   = useState([]);
  const [loading, setLoading]     = useState(true);

  const load = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const [dRes, mRes, bRes] = await Promise.all([
        bookingsApi.getDashboard({ orgId }),
        serviceTypesApi.getMetrics(orgId),
        bookingsApi.getBookings({ orgId, date: today }),
      ]);
      setDashboard(dRes.data);
      setMetrics(mRes.data);
      setBookings(bRes.data.items ?? bRes.data);
    } catch {
      // silent — empty state shown
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => { load(); }, [load]);

  const statCards = [
    {
      label: "Today's Appointments",
      value: loading ? '…' : (dashboard?.todayTotal ?? '—'),
      color: 'bg-brown',
      icon: CalendarDays,
    },
    {
      label: 'Ongoing Now',
      value: loading ? '…' : (dashboard?.ongoing ?? '—'),
      color: 'bg-[#7A5B47]',
      icon: Clock,
    },
    {
      label: 'Services Offered',
      value: loading ? '…' : (metrics?.totalActive ?? '—'),
      color: 'bg-[#A0856E]',
      icon: Sparkles,
    },
    {
      label: "Today's Revenue",
      value: loading
        ? '…'
        : dashboard
          ? `₱${dashboard.revenueToday.toFixed(2)}`
          : '—',
      color: 'bg-[#C4956A]',
      icon: BarChart2,
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-0.5">
        <h2 className="text-xl font-bold">
          Welcome back, {user?.fullName?.split(' ')[0]}
        </h2>
        <button
          onClick={load}
          disabled={loading}
          className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground disabled:opacity-50"
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
        </button>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Here&apos;s what&apos;s happening at {organization?.name || 'your salon'} today.
      </p>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map(({ label, value, color, icon: Icon }) => (
          <Card key={label} className="shadow-sm border-border/60">
            <CardContent className="p-5">
              <div className={cn('w-11 h-11 rounded-lg flex items-center justify-center mb-3', color)}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Booking status breakdown */}
      {(dashboard || loading) && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="shadow-sm border-border/60">
            <CardContent className="p-4 text-center">
              <p className="text-xl font-bold text-yellow-600">
                {loading ? '…' : dashboard?.pending ?? 0}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Pending / Confirmed</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-border/60">
            <CardContent className="p-4 text-center">
              <p className="text-xl font-bold text-purple-600">
                {loading ? '…' : dashboard?.ongoing ?? 0}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">In Progress</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-border/60">
            <CardContent className="p-4 text-center">
              <p className="text-xl font-bold text-green-600">
                {loading ? '…' : dashboard?.completed ?? 0}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Completed</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Today's Appointments table */}
      <Card className="shadow-sm border-border/60">
        <CardContent className="p-0">
          <div className="px-5 py-3 border-b flex items-center justify-between">
            <h3 className="text-sm font-semibold">Today&apos;s Appointments</h3>
            <Link to="/dashboard/appointments" className="text-xs text-primary hover:underline">
              View all →
            </Link>
          </div>

          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>
          ) : bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CalendarDays className="w-8 h-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No appointments scheduled for today.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground text-xs">
                      <th className="text-left px-4 py-3 font-medium">Client</th>
                      <th className="text-left px-4 py-3 font-medium">Service</th>
                      <th className="text-left px-4 py-3 font-medium">Staff</th>
                      <th className="text-left px-4 py-3 font-medium">Time</th>
                      <th className="text-left px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.slice(0, 8).map(b => (
                      <tr key={b.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium">{b.name ?? `Customer #${b.customerId}`}</div>
                          {b.contact && <div className="text-xs text-muted-foreground">{b.contact}</div>}
                        </td>
                        <td className="px-4 py-3">{b.serviceName ?? '—'}</td>
                        <td className="px-4 py-3">{b.staffName ?? '—'}</td>
                        <td className="px-4 py-3 text-xs whitespace-nowrap">
                          {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {b.endTime && ` – ${new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                            STATUS_COLORS[b.status] ?? 'bg-gray-100 text-gray-600'
                          )}>
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {bookings.length > 8 && (
                <div className="px-4 py-3 border-t text-center">
                  <Link to="/dashboard/appointments" className="text-xs text-primary hover:underline">
                    +{bookings.length - 8} more — View all appointments →
                  </Link>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
