import { useEffect, useState, useCallback } from 'react';
import { Sparkles, Plus, Search, RefreshCw, Pencil, Copy, Trash2, MoreHorizontal, ToggleLeft, ToggleRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { serviceTypesApi } from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

function formatDuration(mins) {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function formatPrice(price) {
  return `₱${Number(price).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function StatCard({ label, value }) {
  return (
    <Card className="shadow-sm border-border/60">
      <CardContent className="pt-5 pb-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold mt-0.5">{value}</p>
      </CardContent>
    </Card>
  );
}

const EMPTY_FORM = { name: '', description: '', durationMinutes: 30, price: '' };

export default function ServicesPage() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const [services, setServices]     = useState([]);
  const [metrics, setMetrics]       = useState(null);
  const [search, setSearch]         = useState('');
  const [tab, setTab]               = useState('active');
  const [loading, setLoading]       = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing]       = useState(null); // ServiceType or null
  const [form, setForm]             = useState(EMPTY_FORM);
  const [formError, setFormError]   = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const [sRes, mRes] = await Promise.all([
        serviceTypesApi.getAll({ orgId }),
        serviceTypesApi.getMetrics(orgId),
      ]);
      setServices(sRes.data);
      setMetrics(mRes.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowDialog(true);
  }

  function openEdit(svc) {
    setEditing(svc);
    setForm({
      name: svc.name,
      description: svc.description ?? '',
      durationMinutes: svc.durationMinutes,
      price: svc.price,
    });
    setFormError('');
    setShowDialog(true);
  }

  function setField(key, val) {
    setForm(f => ({ ...f, [key]: val }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    if (!form.name.trim()) return setFormError('Service name is required.');
    if (Number(form.durationMinutes) < 1) return setFormError('Duration must be at least 1 minute.');
    if (Number(form.price) < 0) return setFormError('Price cannot be negative.');

    const payload = {
      organizationId: orgId,
      name: form.name.trim(),
      description: form.description.trim() || null,
      durationMinutes: Number(form.durationMinutes),
      price: Number(form.price),
    };

    setSubmitting(true);
    try {
      if (editing) {
        await serviceTypesApi.update(editing.id, payload);
      } else {
        await serviceTypesApi.create(payload);
      }
      setShowDialog(false);
      load();
    } catch (err) {
      setFormError(err.response?.data?.message ?? 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggle(svc) {
    try {
      await serviceTypesApi.toggleActive(svc.id);
      load();
    } catch (err) {
      alert(err.response?.data?.message ?? 'Failed to update status.');
    }
  }

  async function handleDuplicate(svc) {
    try {
      await serviceTypesApi.duplicate(svc.id);
      load();
    } catch (err) {
      alert(err.response?.data?.message ?? 'Failed to duplicate service.');
    }
  }

  async function handleDelete(svc) {
    if (!window.confirm(`Delete "${svc.name}"? This will deactivate it.`)) return;
    try {
      await serviceTypesApi.delete(svc.id);
      load();
    } catch (err) {
      alert(err.response?.data?.message ?? 'Failed to delete service.');
    }
  }

  const searchLower = search.toLowerCase();
  const active   = services.filter(s =>  s.isActive && s.name.toLowerCase().includes(searchLower));
  const inactive = services.filter(s => !s.isActive && s.name.toLowerCase().includes(searchLower));
  const displayed = tab === 'active' ? active : inactive;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold mb-0.5">Services</h2>
          <p className="text-sm text-muted-foreground">Manage the services your salon offers.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button size="sm" onClick={openCreate} disabled={!orgId}>
            <Plus className="w-4 h-4 mr-1" /> Add Service
          </Button>
        </div>
      </div>

      {/* Metric cards */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard label="Active Services"   value={metrics.totalActive} />
          <StatCard label="Inactive Services" value={metrics.totalInactive} />
          <StatCard label="Avg Duration"      value={formatDuration(metrics.avgDurationMinutes)} />
          <StatCard label="Avg Price"         value={formatPrice(metrics.avgPrice)} />
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search services…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="active">
            Active <span className="ml-1.5 text-xs opacity-60">{active.length}</span>
          </TabsTrigger>
          <TabsTrigger value="inactive">
            Inactive <span className="ml-1.5 text-xs opacity-60">{inactive.length}</span>
          </TabsTrigger>
        </TabsList>

        {['active', 'inactive'].map(t => (
          <TabsContent key={t} value={t}>
            <Card className="shadow-sm border-border/60">
              <CardContent className="p-0">
                {loading ? (
                  <div className="py-16 text-center text-sm text-muted-foreground">Loading…</div>
                ) : displayed.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Sparkles className="w-10 h-10 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">
                      {search ? 'No services match your search.' : `No ${t} services yet.`}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-muted-foreground text-xs">
                          <th className="text-left px-4 py-3 font-medium">Name</th>
                          <th className="text-left px-4 py-3 font-medium">Description</th>
                          <th className="text-left px-4 py-3 font-medium">Duration</th>
                          <th className="text-left px-4 py-3 font-medium">Price</th>
                          <th className="text-left px-4 py-3 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayed.map(svc => (
                          <tr key={svc.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3 font-medium">{svc.name}</td>
                            <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                              {svc.description || <span className="italic opacity-40">—</span>}
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant="secondary" className="font-normal">
                                {formatDuration(svc.durationMinutes)}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 font-semibold">{formatPrice(svc.price)}</td>
                            <td className="px-4 py-3">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44">
                                  <DropdownMenuItem onClick={() => openEdit(svc)} className="cursor-pointer gap-2">
                                    <Pencil className="w-3.5 h-3.5" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDuplicate(svc)} className="cursor-pointer gap-2">
                                    <Copy className="w-3.5 h-3.5" />
                                    Duplicate
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleToggle(svc)}
                                    className={`cursor-pointer gap-2 ${svc.isActive ? 'text-orange-600 focus:text-orange-600' : 'text-green-600 focus:text-green-600'}`}
                                  >
                                    {svc.isActive
                                      ? <ToggleLeft className="w-3.5 h-3.5" />
                                      : <ToggleRight className="w-3.5 h-3.5" />}
                                    {svc.isActive ? 'Deactivate' : 'Activate'}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDelete(svc)}
                                    className="cursor-pointer gap-2 text-red-500 focus:text-red-500"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
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
        ))}
      </Tabs>

      {/* Add / Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Service' : 'Add Service'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div>
              <Label htmlFor="svc-name" className="mb-1.5 block">Name *</Label>
              <Input
                id="svc-name"
                placeholder="e.g. Haircut, Rebond, Facial"
                value={form.name}
                onChange={e => setField('name', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="svc-desc" className="mb-1.5 block">Description</Label>
              <Input
                id="svc-desc"
                placeholder="Optional description"
                value={form.description}
                onChange={e => setField('description', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="svc-duration" className="mb-1.5 block">Duration (minutes) *</Label>
                <Input
                  id="svc-duration"
                  type="number"
                  min="1"
                  max="1440"
                  value={form.durationMinutes}
                  onChange={e => setField('durationMinutes', e.target.value)}
                />
                {form.durationMinutes > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDuration(Number(form.durationMinutes))}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="svc-price" className="mb-1.5 block">Price (₱) *</Label>
                <Input
                  id="svc-price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.price}
                  onChange={e => setField('price', e.target.value)}
                />
              </div>
            </div>

            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving…' : editing ? 'Save Changes' : 'Add Service'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
