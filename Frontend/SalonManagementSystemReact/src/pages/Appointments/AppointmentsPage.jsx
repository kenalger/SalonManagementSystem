import { useEffect, useState, useCallback } from 'react';
import { CalendarDays, Plus, RefreshCw, MoreHorizontal, UserCheck, Clock, X, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { bookingsApi, branchesApi, clientsApi } from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

const STATUS_COLORS = {
  Pending:    'bg-yellow-100 text-yellow-800 border-yellow-200',
  Confirmed:  'bg-blue-100 text-blue-800 border-blue-200',
  CheckedIn:  'bg-indigo-100 text-indigo-800 border-indigo-200',
  Ongoing:    'bg-purple-100 text-purple-800 border-purple-200',
  Completed:  'bg-green-100 text-green-800 border-green-200',
  Cancelled:  'bg-red-100 text-red-800 border-red-200',
  NoShow:     'bg-gray-100 text-gray-700 border-gray-200',
  Rescheduled:'bg-orange-100 text-orange-800 border-orange-200',
};

// Each entry: { status, label, destructive }
const STATUS_ACTIONS = {
  Pending:     [
    { status: 'Confirmed',  label: 'Confirm Appointment'  },
    { status: 'NoShow',     label: 'Mark No Show',        destructive: true },
    { status: 'Cancelled',  label: 'Cancel Appointment',  destructive: true },
  ],
  Confirmed:   [
    { status: 'CheckedIn',  label: 'Check In Client'      },
    { status: 'NoShow',     label: 'Mark No Show',        destructive: true },
    { status: 'Cancelled',  label: 'Cancel Appointment',  destructive: true },
  ],
  CheckedIn:   [
    { status: 'Ongoing',    label: 'Start Service'        },
    { status: 'Cancelled',  label: 'Cancel Appointment',  destructive: true },
  ],
  Ongoing:     [
    { status: 'Completed',  label: 'Mark Completed'       },
  ],
  Rescheduled: [
    { status: 'Confirmed',  label: 'Re-Confirm'           },
    { status: 'Cancelled',  label: 'Cancel Appointment',  destructive: true },
  ],
  Completed:   [],
  Cancelled:   [],
  NoShow:      [],
};

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <Card className="shadow-sm border-border/60">
      <CardContent className="pt-5 pb-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold mt-0.5">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function matchesSearch(b, q) {
  const s = q.toLowerCase();
  return (
    b.bookingReference?.toLowerCase().includes(s) ||
    b.name?.toLowerCase().includes(s) ||
    b.contact?.toLowerCase().includes(s) ||
    b.serviceName?.toLowerCase().includes(s) ||
    b.staffName?.toLowerCase().includes(s)
  );
}

function filterByTab(bookings, tab) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (tab === 'today') {
    return bookings.filter(b => {
      const d = new Date(b.startTime);
      return d >= today && d < tomorrow;
    });
  }
  if (tab === 'upcoming') {
    return bookings.filter(b => new Date(b.startTime) >= tomorrow);
  }
  return bookings;
}

export default function AppointmentsPage() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const [bookings, setBookings]     = useState([]);
  const [dashboard, setDashboard]   = useState(null);
  const [services, setServices]     = useState([]);
  const [staff, setStaff]           = useState([]);
  const [branches, setBranches]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [tab, setTab]               = useState('today');
  const [search, setSearch]         = useState('');
  const [page, setPage]             = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId]   = useState(null);
  const [formError, setFormError]   = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    bookingType: 'Guest',
    branchId: '',
    serviceTypeId: '',
    staffUserId: '',
    name: '',
    contact: '',
    startDate: '',
    startTime: '',
    discount: '',
  });

  const [availableStaff, setAvailableStaff]     = useState([]);
  const [checkingStaff, setCheckingStaff]       = useState(false);
  const [selectedService, setSelectedService]   = useState(null);
  const [clients, setClients]                   = useState([]);
  const [selectedMemberClient, setSelectedMemberClient] = useState(null);
  const [clientSearch, setClientSearch]         = useState('');
  const [applyMemberDiscount, setApplyMemberDiscount] = useState(true);

  const load = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const [bRes, dRes, sRes, stRes, brRes] = await Promise.all([
        bookingsApi.getBookings({ orgId, page, pageSize: 50 }),
        bookingsApi.getDashboard({ orgId }),
        bookingsApi.getServices(orgId),
        bookingsApi.getOrgStaff(orgId),
        branchesApi.getByOrganization(orgId),
      ]);
      const { items, totalCount: tc, totalPages: tp } = bRes.data;
      setBookings(items);
      setTotalCount(tc);
      setTotalPages(tp);
      setDashboard(dRes.data);
      setServices(sRes.data);
      setStaff(stRes.data);
      const loadedBranches = brRes.data;
      setBranches(loadedBranches);
      // Auto-select if the org has exactly one branch
      if (loadedBranches.length === 1) {
        setForm(f => ({ ...f, branchId: String(loadedBranches[0].id) }));
      }
    } catch {
      // silent — table shows empty
    } finally {
      setLoading(false);
    }
  }, [orgId, page]);

  useEffect(() => { load(); }, [load]);

  // Load member clients for the org (large pageSize to get all members for the dropdown)
  useEffect(() => {
    if (!orgId) return;
    clientsApi.getAll(orgId, { memberOnly: true, pageSize: 500 })
      .then(res => setClients(res.data.items ?? []))
      .catch(() => {});
  }, [orgId]);

  // Reset member client and discount toggle when booking type changes away from Member
  useEffect(() => {
    if (form.bookingType !== 'Member') {
      setSelectedMemberClient(null);
      setClientSearch('');
      setApplyMemberDiscount(true);
    }
  }, [form.bookingType]);

  // Reset discount toggle when a different member client is selected
  useEffect(() => {
    setApplyMemberDiscount(true);
  }, [selectedMemberClient]);

  // Auto-check available staff when service + datetime is set
  useEffect(() => {
    const { serviceTypeId, branchId, startDate, startTime, bookingType } = form;
    if (bookingType === 'WalkIn') {
      setAvailableStaff(staff);
      return;
    }
    if (!serviceTypeId || !branchId || !startDate || !startTime) {
      setAvailableStaff([]);
      return;
    }
    const startDateTime = new Date(`${startDate}T${startTime}`).toISOString();
    setCheckingStaff(true);
    bookingsApi.getAvailableStaff({
      orgId,
      branchId: Number(branchId),
      startTime: startDateTime,
      serviceTypeId: Number(serviceTypeId),
    }).then(res => {
      setAvailableStaff(res.data);
    }).catch(() => setAvailableStaff([])).finally(() => setCheckingStaff(false));
  }, [form.serviceTypeId, form.branchId, form.startDate, form.startTime, form.bookingType, staff, orgId]);

  useEffect(() => {
    const svc = services.find(s => s.id === Number(form.serviceTypeId));
    setSelectedService(svc ?? null);
    setForm(f => ({ ...f, staffUserId: '' }));
  }, [form.serviceTypeId, services]);

  const approvedClient = selectedMemberClient?.approvalStatus === 'Approved' ? selectedMemberClient : null;
  const effectiveDiscount = approvedClient && applyMemberDiscount ? approvedClient : null;
  const price = selectedService
    ? (() => {
        const base = selectedService.price;
        if (effectiveDiscount) {
          if (effectiveDiscount.approvedDiscountType === 'Percent') {
            return Math.max(0, base * (1 - effectiveDiscount.approvedDiscountValue / 100));
          }
          return Math.max(0, base - effectiveDiscount.approvedDiscountValue);
        }
        return Math.max(0, base - (parseFloat(form.discount) || 0));
      })()
    : null;

  function setField(key, val) {
    setForm(f => ({ ...f, [key]: val }));
  }

  function openEditDialog(booking) {
    const sdt = new Date(booking.startTime);
    const dateStr = sdt.toLocaleDateString('en-CA');
    const timeStr = sdt.toTimeString().slice(0, 5);

    setForm({
      bookingType: booking.bookingType,
      branchId: String(booking.branchId),
      serviceTypeId: String(booking.serviceTypeId),
      staffUserId: String(booking.staffUserId),
      name: booking.name ?? '',
      contact: booking.contact ?? '',
      startDate: booking.bookingType === 'WalkIn' ? '' : dateStr,
      startTime: booking.bookingType === 'WalkIn' ? '' : timeStr,
      discount: String(booking.discount ?? ''),
    });

    if (booking.bookingType === 'Member' && booking.customerId) {
      const mc = clients.find(c => c.id === booking.customerId) ?? null;
      setSelectedMemberClient(mc);
    } else {
      setSelectedMemberClient(null);
    }

    setClientSearch('');
    setEditingId(booking.id);
    setFormError('');
    setShowCreate(true);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setFormError('');

    if (!form.branchId) return setFormError('Please select a branch.');
    if (!form.serviceTypeId) return setFormError('Please select a service.');
    if (!form.staffUserId) return setFormError('Please select a staff member.');
    if (form.bookingType !== 'WalkIn' && (!form.startDate || !form.startTime))
      return setFormError('Please set a date and time.');
    if (form.bookingType === 'Member' && !selectedMemberClient)
      return setFormError('Please select a member client.');
    if (form.bookingType !== 'Member' && !form.name.trim())
      return setFormError('Name is required.');

    const startDateTime = form.bookingType === 'WalkIn'
      ? new Date().toISOString()
      : new Date(`${form.startDate}T${form.startTime}`).toISOString();

    // Compute discount amount to send (always as flat amount)
    let discountAmount = parseFloat(form.discount) || 0;
    if (effectiveDiscount && selectedService) {
      if (effectiveDiscount.approvedDiscountType === 'Percent') {
        discountAmount = selectedService.price * (effectiveDiscount.approvedDiscountValue / 100);
      } else {
        discountAmount = effectiveDiscount.approvedDiscountValue;
      }
    }

    const payload = {
      organizationId: orgId,
      branchId: Number(form.branchId),
      serviceTypeId: Number(form.serviceTypeId),
      staffUserId: Number(form.staffUserId),
      bookingType: form.bookingType,
      customerId: selectedMemberClient?.id ?? null,
      name: form.bookingType === 'Member' ? (selectedMemberClient?.fullName ?? null) : (form.name || null),
      contact: form.bookingType === 'Member' ? (selectedMemberClient?.contact ?? null) : (form.contact || null),
      startTime: startDateTime,
      discount: discountAmount,
    };

    setSubmitting(true);
    try {
      if (editingId) {
        await bookingsApi.updateBooking(editingId, {
          branchId: payload.branchId,
          serviceTypeId: payload.serviceTypeId,
          staffUserId: payload.staffUserId,
          customerId: payload.customerId,
          name: payload.name,
          contact: payload.contact,
          startTime: form.bookingType === 'WalkIn' ? null : payload.startTime,
          discount: payload.discount,
        });
      } else {
        await bookingsApi.createBooking(payload);
      }
      setShowCreate(false);
      setEditingId(null);
      setSelectedMemberClient(null);
      setClientSearch('');
      setApplyMemberDiscount(true);
      setForm({ bookingType: 'Guest', branchId: '', serviceTypeId: '', staffUserId: '', name: '', contact: '', startDate: '', startTime: '', discount: '' });
      load();
    } catch (err) {
      setFormError(err.response?.data?.message ?? 'Failed to create appointment.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusUpdate(booking, action) {
    if (action.destructive) {
      const confirmed = window.confirm(
        `${action.label} — appointment ${booking.bookingReference}?\nThis cannot be undone.`
      );
      if (!confirmed) return;
    }
    try {
      await bookingsApi.updateStatus(booking.id, { status: action.status });
      load();
    } catch (err) {
      alert(err.response?.data?.message ?? 'Failed to update status.');
    }
  }

  // Reset to page 1 when tab changes
  function handleTabChange(t) { setTab(t); setPage(1); }

  const searched  = search.trim() ? bookings.filter(b => matchesSearch(b, search.trim())) : bookings;
  const displayed = filterByTab(searched, tab);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold mb-0.5">Appointments</h2>
          <p className="text-sm text-muted-foreground">Schedule and manage client appointments.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button size="sm" onClick={() => setShowCreate(true)} disabled={!orgId}>
            <Plus className="w-4 h-4 mr-1" /> New Appointment
          </Button>
        </div>
      </div>

      {/* Dashboard cards */}
      {dashboard && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard label="Today's Appointments" value={dashboard.todayTotal} />
          <StatCard label="Ongoing" value={dashboard.ongoing} />
          <StatCard label="Completed" value={dashboard.completed} />
          <StatCard label="Revenue Today" value={`₱${dashboard.revenueToday.toFixed(2)}`} />
        </div>
      )}

      {/* Tabs */}
      <Tabs value={tab} onValueChange={handleTabChange}>
        <div className="flex items-center gap-3 mb-4">
          <TabsList>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
          <div className="relative ml-auto max-w-xs w-full">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              className="pl-8 h-9"
              placeholder="Search by name, ref, service…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button
                className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                onClick={() => setSearch('')}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {['today', 'upcoming', 'all'].map(t => (
          <TabsContent key={t} value={t}>
            <Card className="shadow-sm border-border/60">
              <CardContent className="p-0">
                {!loading && displayed.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <CalendarDays className="w-10 h-10 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">
                      {search.trim() ? 'No appointments match your search.' : 'No appointments found.'}
                    </p>
                  </div>
                ) : (
                  <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-muted-foreground text-xs">
                          <th className="text-left px-4 py-3 font-medium">Reference</th>
                          <th className="text-left px-4 py-3 font-medium">Client</th>
                          <th className="text-left px-4 py-3 font-medium">Service</th>
                          <th className="text-left px-4 py-3 font-medium">Staff</th>
                          <th className="text-left px-4 py-3 font-medium">Time</th>
                          <th className="text-left px-4 py-3 font-medium">Price</th>
                          <th className="text-left px-4 py-3 font-medium">Status</th>
                          <th className="text-left px-4 py-3 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading
                          ? Array.from({ length: 5 }).map((_, i) => (
                              <tr key={i} className="border-b">
                                {Array.from({ length: 8 }).map((__, j) => (
                                  <td key={j} className="px-4 py-3">
                                    <div className="h-4 rounded bg-muted animate-pulse" style={{ width: j === 0 ? '80px' : '60%' }} />
                                  </td>
                                ))}
                              </tr>
                            ))
                          : displayed.map(b => (
                          <tr key={b.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3 font-mono text-xs">{b.bookingReference}</td>
                            <td className="px-4 py-3">
                              <div className="font-medium">{b.name ?? `Customer #${b.customerId}`}</div>
                              {b.contact && <div className="text-xs text-muted-foreground">{b.contact}</div>}
                            </td>
                            <td className="px-4 py-3">{b.serviceName ?? `#${b.serviceTypeId}`}</td>
                            <td className="px-4 py-3">{b.staffName ?? `Staff #${b.staffUserId}`}</td>
                            <td className="px-4 py-3 text-xs">
                              <div>{new Date(b.startTime).toLocaleDateString()}</div>
                              <div className="text-muted-foreground">
                                {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {b.endTime && ` – ${new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                              </div>
                            </td>
                            <td className="px-4 py-3">₱{b.finalPrice?.toFixed(2) ?? '—'}</td>
                            <td className="px-4 py-3">
                              <StatusBadge status={b.status} />
                            </td>
                            <td className="px-4 py-3">
                              {(() => {
                                const actions = STATUS_ACTIONS[b.status] ?? [];
                                const canEdit = !['Completed', 'Cancelled', 'NoShow'].includes(b.status);
                                const normal      = actions.filter(a => !a.destructive);
                                const destructive = actions.filter(a =>  a.destructive);
                                return (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                                        <MoreHorizontal className="w-4 h-4" />
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                      {canEdit && (
                                        <>
                                          <DropdownMenuItem
                                            onClick={() => openEditDialog(b)}
                                            className="cursor-pointer"
                                          >
                                            Edit Appointment
                                          </DropdownMenuItem>
                                          {actions.length > 0 && <DropdownMenuSeparator />}
                                        </>
                                      )}
                                      {actions.length > 0 && (
                                        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                                          Update Status
                                        </DropdownMenuLabel>
                                      )}
                                      {normal.map(action => (
                                        <DropdownMenuItem
                                          key={action.status}
                                          onClick={() => handleStatusUpdate(b, action)}
                                          className="cursor-pointer"
                                        >
                                          {action.label}
                                        </DropdownMenuItem>
                                      ))}
                                      {destructive.length > 0 && (
                                        <>
                                          {normal.length > 0 && <DropdownMenuSeparator />}
                                          {destructive.map(action => (
                                            <DropdownMenuItem
                                              key={action.status}
                                              onClick={() => handleStatusUpdate(b, action)}
                                              className="cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50"
                                            >
                                              {action.label}
                                            </DropdownMenuItem>
                                          ))}
                                        </>
                                      )}
                                      {!canEdit && actions.length === 0 && (
                                        <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                                          No actions available
                                        </DropdownMenuItem>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                );
                              })()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-border/40 text-sm text-muted-foreground">
                      <span>
                        Showing {totalCount === 0 ? 0 : (page - 1) * 50 + 1}–{Math.min(page * 50, totalCount)} of {totalCount}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          className="p-1 rounded hover:bg-muted disabled:opacity-40"
                          disabled={page <= 1}
                          onClick={() => setPage(p => p - 1)}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs">{page} / {totalPages}</span>
                        <button
                          className="p-1 rounded hover:bg-muted disabled:opacity-40"
                          disabled={page >= totalPages}
                          onClick={() => setPage(p => p + 1)}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Create / Edit Booking Dialog */}
      <Dialog open={showCreate} onOpenChange={(v) => { setShowCreate(v); if (!v) setEditingId(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Appointment' : 'New Appointment'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 mt-2">
            {/* Booking Type */}
            <div>
              <Label className="mb-1.5 block">Appointment Type</Label>
              <div className="flex gap-2">
                {['Guest', 'WalkIn', 'Member'].map(t => (
                  <button
                    type="button"
                    key={t}
                    onClick={() => setField('bookingType', t)}
                    className={`flex-1 py-1.5 rounded-md border text-sm font-medium transition-colors
                      ${form.bookingType === t
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border hover:bg-muted'}`}
                  >
                    {t === 'WalkIn' ? 'Walk-In' : t}
                  </button>
                ))}
              </div>
            </div>

            {/* Branch */}
            <div>
              <Label htmlFor="branch" className="mb-1.5 block">Branch *</Label>
              {branches.length === 1 ? (
                <div className="rounded-md border border-input bg-muted/40 px-3 py-2 text-sm">
                  {branches[0].name}
                </div>
              ) : (
                <select
                  id="branch"
                  value={form.branchId}
                  onChange={e => setField('branchId', e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select branch…</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Service */}
            <div>
              <Label htmlFor="service" className="mb-1.5 block">Service *</Label>
              <select
                id="service"
                value={form.serviceTypeId}
                onChange={e => setField('serviceTypeId', e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select service…</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} — ₱{s.price} ({s.durationMinutes} min)
                  </option>
                ))}
              </select>
            </div>

            {/* Date & Time (not for walk-in) */}
            {form.bookingType !== 'WalkIn' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="startDate" className="mb-1.5 block">Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={form.startDate}
                    onChange={e => setField('startDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <Label htmlFor="startTime" className="mb-1.5 block">Time *</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={form.startTime}
                    onChange={e => setField('startTime', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Staff */}
            <div>
              <Label htmlFor="staff" className="mb-1.5 block">
                Staff * {checkingStaff && <span className="text-xs text-muted-foreground">(checking…)</span>}
              </Label>
              <select
                id="staff"
                value={form.staffUserId}
                onChange={e => setField('staffUserId', e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select staff…</option>
                {(availableStaff.length > 0 ? availableStaff : staff).map(s => (
                  <option key={s.id} value={s.id} disabled={s.isAvailable === false}>
                    {s.fullName}{s.isAvailable === false ? ' (busy)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Member Client Selector */}
            {form.bookingType === 'Member' ? (
              <div className="space-y-2">
                <Label>Select Member Client *</Label>
                {!selectedMemberClient ? (
                  <div className="relative">
                    <Input
                      placeholder="Search by name or contact…"
                      value={clientSearch}
                      onChange={e => setClientSearch(e.target.value)}
                    />
                    {clientSearch && (
                      <div className="absolute z-10 w-full mt-1 rounded-md border border-border bg-popover shadow-md max-h-44 overflow-y-auto">
                        {clients
                          .filter(c => {
                            const s = clientSearch.toLowerCase();
                            return c.fullName.toLowerCase().includes(s) || (c.contact ?? '').includes(s);
                          })
                          .map(c => (
                            <div
                              key={c.id}
                              onClick={() => { setSelectedMemberClient(c); setClientSearch(''); }}
                              className="px-3 py-2 text-sm cursor-pointer hover:bg-muted flex items-center justify-between"
                            >
                              <div>
                                <span className="font-medium">{c.fullName}</span>
                                {c.contact && <span className="text-muted-foreground ml-2 text-xs">{c.contact}</span>}
                              </div>
                              <Badge variant="outline" className="text-xs">{c.membershipStatus}</Badge>
                            </div>
                          ))
                        }
                        {clients.filter(c => {
                          const s = clientSearch.toLowerCase();
                          return c.fullName.toLowerCase().includes(s) || (c.contact ?? '').includes(s);
                        }).length === 0 && (
                          <div className="px-3 py-3 text-sm text-muted-foreground text-center">No members found.</div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-md border border-border bg-muted/30 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-primary" />
                        <span className="font-medium text-sm">{selectedMemberClient.fullName}</span>
                        <Badge variant="secondary">Member</Badge>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedMemberClient(null)}
                        className="p-1 rounded hover:bg-muted text-muted-foreground"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {selectedMemberClient.contact && (
                      <p className="text-xs text-muted-foreground">{selectedMemberClient.contact}</p>
                    )}
                    {selectedMemberClient.approvalStatus === 'Approved' && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <input
                            id="applyDiscount"
                            type="checkbox"
                            className="w-4 h-4 accent-primary"
                            checked={applyMemberDiscount}
                            onChange={e => setApplyMemberDiscount(e.target.checked)}
                          />
                          <label htmlFor="applyDiscount" className="text-xs cursor-pointer select-none">
                            Apply member discount{' '}
                            <span className="font-semibold text-green-600 dark:text-green-400">
                              ({selectedMemberClient.approvedDiscountType === 'Percent'
                                ? `${selectedMemberClient.approvedDiscountValue}%`
                                : `₱${selectedMemberClient.approvedDiscountValue}`})
                            </span>
                          </label>
                        </div>
                        {selectedService && (
                          <p className="text-xs text-muted-foreground pl-6">
                            Final price: <span className="font-semibold text-foreground">₱{price?.toFixed(2)}</span>
                            {!applyMemberDiscount && (
                              <span className="ml-1 text-amber-600 dark:text-amber-400">(full price — discount not applied)</span>
                            )}
                          </p>
                        )}
                      </div>
                    )}
                    {selectedMemberClient.approvalStatus === 'Pending' && (
                      <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                        <Clock className="w-3 h-3" />
                        Membership discount pending owner approval — no discount applied.
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Name & Contact (Guest / Walk-In) */
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label htmlFor="name">Name *</Label>
                    <button
                      type="button"
                      onClick={() => setField('name', 'N/A')}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground hover:bg-muted/80 transition-colors leading-none"
                    >
                      N/A
                    </button>
                  </div>
                  <Input
                    id="name"
                    placeholder="Client name"
                    value={form.name}
                    onChange={e => setField('name', e.target.value)}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label htmlFor="contact">Contact</Label>
                    <button
                      type="button"
                      onClick={() => setField('contact', 'N/A')}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground hover:bg-muted/80 transition-colors leading-none"
                    >
                      N/A
                    </button>
                  </div>
                  <Input
                    id="contact"
                    placeholder="Phone / email"
                    value={form.contact}
                    onChange={e => setField('contact', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Discount & Price (only for non-member) */}
            {form.bookingType !== 'Member' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="discount" className="mb-1.5 block">Discount (₱)</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={form.discount}
                    onChange={e => setField('discount', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block">Final Price</Label>
                  <div className="rounded-md border border-input bg-muted/40 px-3 py-2 text-sm font-semibold">
                    {price !== null ? `₱${price.toFixed(2)}` : '—'}
                  </div>
                </div>
              </div>
            )}

            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (editingId ? 'Saving…' : 'Creating…') : (editingId ? 'Save Changes' : 'Create Appointment')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
