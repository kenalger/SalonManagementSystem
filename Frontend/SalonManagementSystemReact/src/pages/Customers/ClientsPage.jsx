import { useState, useEffect, useCallback } from 'react';
import {
  Users, Plus, Search, Check, X, MoreHorizontal,
  UserCheck, Clock, BadgeCheck, ShieldAlert, Pencil,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/AuthContext';
import { clientsApi } from '@/services/api';
import { useDebounce } from '@/hooks/useDebounce';

const DISCOUNT_TYPES = ['Percent', 'Fixed'];
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

function statusBadge(status) {
  const map = {
    Regular:  { label: 'Regular',  variant: 'secondary' },
    Pending:  { label: 'Pending',  variant: 'warning'   },
    Active:   { label: 'Member',   variant: 'success'   },
    Approved: { label: 'Approved', variant: 'success'   },
    Rejected: { label: 'Rejected', variant: 'destructive' },
    None:     { label: 'None',     variant: 'secondary' },
  };
  const cfg = map[status] ?? { label: status, variant: 'outline' };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

function formatDiscount(type, value) {
  if (!value || value <= 0) return '—';
  if (type === 'Fixed') return `₱${Number(value).toLocaleString('en-PH')}`;
  return `${value}%`;
}

// ── Add Client Dialog ─────────────────────────────────────────────────────────
function AddClientDialog({ orgId, onCreated }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    fullName: '', contact: '', email: '',
    isMember: false, discountType: 'Percent', discountValue: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function reset() {
    setForm({ fullName: '', contact: '', email: '', isMember: false, discountType: 'Percent', discountValue: '' });
    setError('');
  }

  async function handleSave() {
    if (!form.fullName.trim()) { setError('Full name is required.'); return; }
    setSaving(true);
    setError('');
    try {
      await clientsApi.create({
        organizationId: orgId,
        fullName: form.fullName.trim(),
        contact: form.contact.trim() || null,
        email: form.email.trim() || null,
        isMember: form.isMember,
        discountType: form.isMember && form.discountValue ? form.discountType : null,
        discountValue: form.isMember && form.discountValue ? parseFloat(form.discountValue) : null,
      });
      setOpen(false);
      reset();
      onCreated();
    } catch (e) {
      setError(e.response?.data?.message ?? 'Failed to save client.');
    } finally {
      setSaving(false);
    }
  }

  const hasDiscount = form.isMember && form.discountValue && parseFloat(form.discountValue) > 0;

  return (
    <>
      <Button size="sm" onClick={() => { reset(); setOpen(true); }}>
        <Plus className="w-4 h-4 mr-1.5" /> Add Client
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Client</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label>Full Name *</Label>
              <Input
                placeholder="e.g. Maria Santos"
                value={form.fullName}
                onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Contact Number</Label>
              <Input
                placeholder="e.g. 09171234567"
                value={form.contact}
                onChange={e => setForm(f => ({ ...f, contact: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Email (optional)</Label>
              <Input
                type="email"
                placeholder="email@example.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                id="isMember"
                type="checkbox"
                className="w-4 h-4 accent-primary"
                checked={form.isMember}
                onChange={e => setForm(f => ({ ...f, isMember: e.target.checked, discountValue: '' }))}
              />
              <Label htmlFor="isMember" className="cursor-pointer">Register as Member</Label>
            </div>

            {form.isMember && (
              <div className="rounded-md border border-border/60 p-3 space-y-3 bg-muted/30">
                <p className="text-xs text-muted-foreground">Membership Discount (optional)</p>
                <div className="flex gap-2">
                  <div className="w-32">
                    <Label className="text-xs mb-1 block">Type</Label>
                    <select
                      className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
                      value={form.discountType}
                      onChange={e => setForm(f => ({ ...f, discountType: e.target.value }))}
                    >
                      {DISCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs mb-1 block">
                      {form.discountType === 'Fixed' ? 'Amount (₱)' : 'Percent (%)'}
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder={form.discountType === 'Fixed' ? '0.00' : '0'}
                      value={form.discountValue}
                      onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))}
                    />
                  </div>
                </div>

                {hasDiscount && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                    <Clock className="w-3.5 h-3.5" />
                    Discount requires owner approval before it can be applied.
                  </div>
                )}
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save Client'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Approve Discount Dialog ───────────────────────────────────────────────────
function ApproveDialog({ client, onDone }) {
  const [open, setOpen] = useState(false);
  const [discountType, setDiscountType] = useState('Percent');
  const [discountValue, setDiscountValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function onOpen() {
    setDiscountType(client.discountType ?? 'Percent');
    setDiscountValue(client.discountValue ?? '');
    setError('');
    setOpen(true);
  }

  async function handleAction(action) {
    if (action === 'Approve' && (!discountValue || parseFloat(discountValue) <= 0)) {
      setError('Enter a discount value to approve.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await clientsApi.approveDiscount(client.id, {
        action,
        discountType: action === 'Approve' ? discountType : null,
        discountValue: action === 'Approve' ? parseFloat(discountValue) : null,
      });
      setOpen(false);
      onDone();
    } catch (e) {
      setError(e.response?.data?.message ?? 'Failed.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={onOpen}>
        <BadgeCheck className="w-3.5 h-3.5 mr-1" /> Review
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Review Discount Request</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-1 text-sm">
            <div className="rounded-md border border-border/60 bg-muted/30 p-3 space-y-1">
              <p><span className="text-muted-foreground">Client:</span> <strong>{client.fullName}</strong></p>
              <p><span className="text-muted-foreground">Requested:</span> {formatDiscount(client.discountType, client.discountValue)}</p>
            </div>

            <p className="text-xs text-muted-foreground">You can modify the discount before approving.</p>

            <div className="flex gap-2">
              <div className="w-28">
                <Label className="text-xs mb-1 block">Type</Label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
                  value={discountType}
                  onChange={e => setDiscountType(e.target.value)}
                >
                  {DISCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <Label className="text-xs mb-1 block">
                  {discountType === 'Fixed' ? 'Amount (₱)' : 'Percent (%)'}
                </Label>
                <Input
                  type="number"
                  min="0"
                  value={discountValue}
                  onChange={e => setDiscountValue(e.target.value)}
                />
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="destructive" size="sm" onClick={() => handleAction('Reject')} disabled={saving}>
              <X className="w-3.5 h-3.5 mr-1" /> Reject
            </Button>
            <Button size="sm" onClick={() => handleAction('Approve')} disabled={saving}>
              <Check className="w-3.5 h-3.5 mr-1" /> Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Edit Client Dialog ────────────────────────────────────────────────────────
function EditClientDialog({ client, onSaved }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ fullName: '', contact: '', email: '', isMember: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function onOpen() {
    setForm({
      fullName: client.fullName,
      contact: client.contact ?? '',
      email: client.email ?? '',
      isMember: client.isMember,
    });
    setError('');
    setOpen(true);
  }

  async function handleSave() {
    if (!form.fullName.trim()) { setError('Full name is required.'); return; }
    setSaving(true);
    setError('');
    try {
      await clientsApi.update(client.id, {
        fullName: form.fullName.trim(),
        contact: form.contact.trim() || null,
        email: form.email.trim() || null,
        isMember: form.isMember,
      });
      setOpen(false);
      onSaved();
    } catch (e) {
      setError(e.response?.data?.message ?? 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <DropdownMenuItem onSelect={onOpen}>
        <Pencil className="w-3.5 h-3.5 mr-2" /> Edit Client
      </DropdownMenuItem>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label>Full Name *</Label>
              <Input
                value={form.fullName}
                onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Contact Number</Label>
              <Input
                value={form.contact}
                onChange={e => setForm(f => ({ ...f, contact: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email (optional)</Label>
              <Input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                id="editIsMember"
                type="checkbox"
                className="w-4 h-4 accent-primary"
                checked={form.isMember}
                onChange={e => setForm(f => ({ ...f, isMember: e.target.checked }))}
              />
              <Label htmlFor="editIsMember" className="cursor-pointer">Registered Member</Label>
            </div>
            {client.isMember && !form.isMember && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Removing membership will clear any approved discounts.
              </p>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Skeleton Row ──────────────────────────────────────────────────────────────
function SkeletonRows({ cols, rows = 5 }) {
  return Array.from({ length: rows }).map((_, i) => (
    <tr key={i} className="border-b border-border/40">
      {Array.from({ length: cols }).map((_, j) => (
        <td key={j} className="px-4 py-3">
          <div className="h-4 rounded bg-muted animate-pulse" style={{ width: j === 0 ? '70%' : '50%' }} />
        </td>
      ))}
    </tr>
  ));
}

// ── Pagination Bar ────────────────────────────────────────────────────────────
function PaginationBar({ page, totalPages, totalCount, pageSize, onPageChange, onPageSizeChange }) {
  const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, totalCount);
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border/40 text-sm text-muted-foreground">
      <span>Showing {from}–{to} of {totalCount}</span>
      <div className="flex items-center gap-2">
        <select
          className="h-7 rounded border border-input bg-background px-2 text-xs"
          value={pageSize}
          onChange={e => onPageSizeChange(Number(e.target.value))}
        >
          {PAGE_SIZE_OPTIONS.map(s => <option key={s} value={s}>{s} / page</option>)}
        </select>
        <button
          className="p-1 rounded hover:bg-muted disabled:opacity-40"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs">{page} / {totalPages || 1}</span>
        <button
          className="p-1 rounded hover:bg-muted disabled:opacity-40"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ClientsPage() {
  const { organization } = useAuth();
  const orgId = organization?.id;
  const isOwner = organization?.userRole === 'Owner';

  const [clients, setClients]       = useState([]);
  const [pending, setPending]       = useState([]);
  const [search, setSearch]         = useState('');
  const [loading, setLoading]       = useState(true);
  const [tab, setTab]               = useState('all');
  const [page, setPage]             = useState(1);
  const [pageSize, setPageSize]     = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const debouncedSearch = useDebounce(search, 350);

  const loadClients = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const [allRes, pendRes] = await Promise.allSettled([
        clientsApi.getAll(orgId, { search: debouncedSearch || undefined, page, pageSize }),
        isOwner ? clientsApi.getPending(orgId) : Promise.resolve({ data: [] }),
      ]);
      if (allRes.status === 'fulfilled') {
        const { items, totalCount: tc, totalPages: tp } = allRes.value.data;
        setClients(items);
        setTotalCount(tc);
        setTotalPages(tp);
      }
      if (pendRes.status === 'fulfilled') setPending(pendRes.value.data);
    } finally {
      setLoading(false);
    }
  }, [orgId, isOwner, debouncedSearch, page, pageSize]);

  useEffect(() => { loadClients(); }, [loadClients]);

  // Reset to page 1 when search changes
  useEffect(() => { setPage(1); }, [debouncedSearch]);

  async function handleToggle(id) {
    await clientsApi.toggleActive(id);
    loadClients();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div>
          <h2 className="text-xl font-bold">Clients</h2>
          <p className="text-sm text-muted-foreground">Manage your client directory and memberships.</p>
        </div>
        <AddClientDialog orgId={orgId} onCreated={loadClients} />
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mt-6">
        <TabsList>
          <TabsTrigger value="all">
            <Users className="w-4 h-4 mr-1.5" /> All Clients
            {totalCount > 0 && (
              <span className="ml-1.5 text-xs bg-muted rounded-full px-1.5 py-0.5">{totalCount}</span>
            )}
          </TabsTrigger>
          {isOwner && (
            <TabsTrigger value="pending">
              <ShieldAlert className="w-4 h-4 mr-1.5" /> Pending Approval
              {pending.length > 0 && (
                <span className="ml-1.5 text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 rounded-full px-1.5 py-0.5">{pending.length}</span>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        {/* All Clients Tab */}
        <TabsContent value="all" className="mt-4">
          <Card className="shadow-sm border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
                  <Input
                    className="pl-8"
                    placeholder="Search clients…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {!loading && clients.length === 0 ? (
                <div className="py-16 text-center">
                  <UserCheck className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {search ? 'No clients match your search.' : 'No clients yet. Add your first client.'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/60 text-muted-foreground text-xs">
                          <th className="text-left px-4 py-2.5 font-medium">Name</th>
                          <th className="text-left px-4 py-2.5 font-medium">Contact</th>
                          <th className="text-left px-4 py-2.5 font-medium">Membership</th>
                          <th className="text-left px-4 py-2.5 font-medium">Discount</th>
                          <th className="text-left px-4 py-2.5 font-medium">Status</th>
                          <th className="px-4 py-2.5" />
                        </tr>
                      </thead>
                      <tbody>
                        {loading
                          ? <SkeletonRows cols={6} rows={pageSize > 10 ? 8 : pageSize} />
                          : clients.map(c => (
                            <tr key={c.id} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
                              <td className="px-4 py-3">
                                <div className="font-medium">{c.fullName}</div>
                                {c.email && <div className="text-xs text-muted-foreground">{c.email}</div>}
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">{c.contact ?? '—'}</td>
                              <td className="px-4 py-3">{statusBadge(c.membershipStatus)}</td>
                              <td className="px-4 py-3">
                                {c.approvalStatus === 'Approved'
                                  ? <span className="font-medium text-green-600 dark:text-green-400">
                                      {formatDiscount(c.approvedDiscountType, c.approvedDiscountValue)}
                                    </span>
                                  : c.approvalStatus === 'Pending'
                                  ? <span className="text-amber-600 dark:text-amber-400 text-xs flex items-center gap-1">
                                      <Clock className="w-3 h-3" /> Pending
                                    </span>
                                  : '—'
                                }
                              </td>
                              <td className="px-4 py-3">
                                <Badge variant={c.isActive ? 'outline' : 'secondary'}>
                                  {c.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7">
                                      <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <EditClientDialog client={c} onSaved={loadClients} />
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleToggle(c.id)}>
                                      {c.isActive ? 'Deactivate' : 'Activate'}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          ))
                        }
                      </tbody>
                    </table>
                  </div>
                  {!loading && totalPages > 0 && (
                    <PaginationBar
                      page={page}
                      totalPages={totalPages}
                      totalCount={totalCount}
                      pageSize={pageSize}
                      onPageChange={setPage}
                      onPageSizeChange={s => { setPageSize(s); setPage(1); }}
                    />
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending Approvals Tab (Owner only) */}
        {isOwner && (
          <TabsContent value="pending" className="mt-4">
            <Card className="shadow-sm border-border/60">
              <CardHeader>
                <CardTitle className="text-base">Pending Membership Discount Requests</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {pending.length === 0 ? (
                  <div className="py-16 text-center">
                    <Check className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No pending requests. You're all caught up.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/60 text-muted-foreground text-xs">
                          <th className="text-left px-4 py-2.5 font-medium">Client</th>
                          <th className="text-left px-4 py-2.5 font-medium">Requested Discount</th>
                          <th className="text-left px-4 py-2.5 font-medium">Requested By</th>
                          <th className="text-left px-4 py-2.5 font-medium">Date</th>
                          <th className="px-4 py-2.5" />
                        </tr>
                      </thead>
                      <tbody>
                        {pending.map(c => (
                          <tr key={c.id} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3">
                              <div className="font-medium">{c.fullName}</div>
                              {c.contact && <div className="text-xs text-muted-foreground">{c.contact}</div>}
                            </td>
                            <td className="px-4 py-3 font-medium text-amber-600 dark:text-amber-400">
                              {formatDiscount(c.discountType, c.discountValue)}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">{c.requestedBy}</td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {new Date(c.dateCreated).toLocaleDateString('en-PH')}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <ApproveDialog client={c} onDone={loadClients} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
