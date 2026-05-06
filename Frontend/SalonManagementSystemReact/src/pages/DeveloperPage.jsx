import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Scissors, Users, Building2, GitBranch, LayoutDashboard,
  LogOut, Menu, Plus, RefreshCw,
  ShieldCheck, ChevronRight, MoreHorizontal, Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { cn } from '@/lib/utils';
import { useAuth } from '../context/AuthContext';
import { developerApi } from '../services/api';

const DRAWER_WIDTH = 240;

const navItems = [
  { label: 'Overview',      icon: LayoutDashboard },
  { label: 'Users',         icon: Users },
  { label: 'Organizations', icon: Building2 },
];

// ── Stat card ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }) {
  return (
    <Card className="shadow-sm border-border/60">
      <CardContent className="p-5">
        <div className={cn('w-11 h-11 rounded-lg flex items-center justify-center mb-3', color)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <p className="text-2xl font-bold">{value ?? '—'}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

// ── Create User dialog ─────────────────────────────────────────────────────────
function CreateUserDialog({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'User' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await developerApi.createUser(form);
      onCreated(data);
      setForm({ firstName: '', lastName: '', email: '', password: '', role: 'User' });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Create User Account</DialogTitle>
        </DialogHeader>
        {error && (
          <Alert variant="destructive" className="mb-1">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cu-first">First Name</Label>
              <Input id="cu-first" name="firstName" value={form.firstName}
                onChange={handleChange} required placeholder="Jane" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cu-last">Last Name</Label>
              <Input id="cu-last" name="lastName" value={form.lastName}
                onChange={handleChange} required placeholder="Doe" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cu-email">Email</Label>
            <Input id="cu-email" name="email" type="email" value={form.email}
              onChange={handleChange} required placeholder="jane@example.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cu-password">Password</Label>
            <Input id="cu-password" name="password" type="password" value={form.password}
              onChange={handleChange} required placeholder="Min. 6 characters" minLength={6} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cu-role">Role</Label>
            <select
              id="cu-role"
              name="role"
              value={form.role}
              onChange={handleChange}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="User">User</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          <DialogFooter className="pt-1">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}
              className="bg-brown text-cream hover:bg-brown/90 dark:bg-beige dark:text-[#1A0F0A] dark:hover:bg-beige/90">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating…
                </span>
              ) : 'Create Account'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Create Organization dialog ─────────────────────────────────────────────────
function CreateOrgDialog({ open, onClose, onCreated, users }) {
  const [form, setForm] = useState({
    name: '', description: '', location: '', email: '', branchName: '', ownerUserId: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...form,
        ownerUserId: form.ownerUserId ? parseInt(form.ownerUserId) : null,
      };
      const { data } = await developerApi.createOrganization(payload);
      onCreated(data);
      setForm({ name: '', description: '', location: '', email: '', branchName: '', ownerUserId: '' });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create organization.');
    } finally {
      setLoading(false);
    }
  };

  const eligibleOwners = users.filter((u) => u.isActive && u.role !== 'Developer');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Organization</DialogTitle>
        </DialogHeader>
        {error && (
          <Alert variant="destructive" className="mb-1">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="co-name">Organization Name</Label>
            <Input id="co-name" name="name" value={form.name}
              onChange={handleChange} required placeholder="My Salon" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="co-branch">Branch Name</Label>
            <Input id="co-branch" name="branchName" value={form.branchName}
              onChange={handleChange} required placeholder="Main Branch" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="co-location">Location</Label>
              <Input id="co-location" name="location" value={form.location}
                onChange={handleChange} placeholder="City, State" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="co-email">Business Email</Label>
              <Input id="co-email" name="email" type="email" value={form.email}
                onChange={handleChange} placeholder="salon@example.com" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="co-owner">Assign Owner <span className="text-muted-foreground">(optional)</span></Label>
            <select
              id="co-owner"
              name="ownerUserId"
              value={form.ownerUserId}
              onChange={handleChange}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">— No owner —</option>
              {eligibleOwners.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName} ({u.email})
                </option>
              ))}
            </select>
          </div>
          <DialogFooter className="pt-1">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}
              className="bg-brown text-cream hover:bg-brown/90 dark:bg-beige dark:text-[#1A0F0A] dark:hover:bg-beige/90">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating…
                </span>
              ) : 'Create Organization'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Edit Organization dialog ───────────────────────────────────────────────────
function EditOrgDialog({ open, onClose, org, onSaved }) {
  const [form, setForm] = useState({ name: '', description: '', location: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (org) setForm({ name: org.name ?? '', description: org.description ?? '', location: org.location ?? '', email: org.email ?? '' });
  }, [org]);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await developerApi.updateOrg(org.id, form);
      onSaved(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update organization.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Organization</DialogTitle>
        </DialogHeader>
        {error && (
          <Alert variant="destructive" className="mb-1">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="eo-name">Organization Name</Label>
            <Input id="eo-name" name="name" value={form.name} onChange={handleChange} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="eo-desc">Description</Label>
            <Input id="eo-desc" name="description" value={form.description} onChange={handleChange} placeholder="Optional" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="eo-location">Location</Label>
              <Input id="eo-location" name="location" value={form.location} onChange={handleChange} placeholder="City, State" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="eo-email">Business Email</Label>
              <Input id="eo-email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="salon@example.com" />
            </div>
          </div>
          <DialogFooter className="pt-1">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}
              className="bg-brown text-cream hover:bg-brown/90 dark:bg-beige dark:text-[#1A0F0A] dark:hover:bg-beige/90">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving…
                </span>
              ) : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Add Org Member dialog ──────────────────────────────────────────────────────
function AddOrgMemberDialog({ open, onClose, org, users, onAdded }) {
  const [form, setForm] = useState({ userId: '', role: 'Staff' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (!open) setForm({ userId: '', role: 'Staff' }); }, [open]);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await developerApi.addOrgMember(org.id, { userId: parseInt(form.userId), role: form.role });
      onAdded();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add member.');
    } finally {
      setLoading(false);
    }
  };

  const eligible = users.filter((u) => u.isActive && u.role !== 'Developer');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Member to {org?.name}</DialogTitle>
        </DialogHeader>
        {error && (
          <Alert variant="destructive" className="mb-1">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="am-user">User</Label>
            <select
              id="am-user" name="userId" value={form.userId} onChange={handleChange} required
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">— Select a user —</option>
              {eligible.map((u) => (
                <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="am-role">Role</Label>
            <select
              id="am-role" name="role" value={form.role} onChange={handleChange}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="Staff">Staff</option>
              <option value="Owner">Owner</option>
            </select>
          </div>
          <DialogFooter className="pt-1">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading || !form.userId}
              className="bg-brown text-cream hover:bg-brown/90 dark:bg-beige dark:text-[#1A0F0A] dark:hover:bg-beige/90">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Adding…
                </span>
              ) : 'Add Member'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Add Branch dialog ──────────────────────────────────────────────────────────
function AddBranchDialog({ open, onClose, org, onAdded }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (!open) setName(''); }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await developerApi.addOrgBranch(org.id, { name });
      onAdded();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add branch.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Branch to {org?.name}</DialogTitle>
        </DialogHeader>
        {error && (
          <Alert variant="destructive" className="mb-1">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="ab-name">Branch Name</Label>
            <Input id="ab-name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. North Branch" />
          </div>
          <DialogFooter className="pt-1">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}
              className="bg-brown text-cream hover:bg-brown/90 dark:bg-beige dark:text-[#1A0F0A] dark:hover:bg-beige/90">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Adding…
                </span>
              ) : 'Add Branch'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── View Members Modal ─────────────────────────────────────────────────────────
function ViewMembersDialog({ open, onClose, org }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !org) return;
    setLoading(true);
    developerApi.getOrgMembers(org.id)
      .then(res => setMembers(res.data))
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, [open, org]);

  const roleColor = {
    Owner: 'bg-brown/10 text-brown dark:bg-beige/10 dark:text-beige border-brown/20 dark:border-beige/20',
    Staff: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Members — {org?.name}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="min-h-[120px]">
          {loading ? (
            <div className="space-y-2 py-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-32 rounded bg-muted animate-pulse" />
                    <div className="h-3 w-40 rounded bg-muted animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : members.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No members in this organization.
            </div>
          ) : (
            <div className="divide-y divide-border -mx-6 px-6">
              {members.map(m => (
                <div key={m.memberId} className="flex items-center gap-3 py-3">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-brown/10 dark:bg-beige/10 text-brown dark:text-beige text-xs font-bold">
                      {m.fullName?.[0] ?? '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{m.fullName}</p>
                    <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant="outline"
                      className={cn('text-xs', roleColor[m.role] ?? 'border-border')}
                    >
                      {m.role}
                    </Badge>
                    <Badge
                      variant={m.isActive ? 'outline' : 'secondary'}
                      className={cn('text-xs', m.isActive && 'border-green-500 text-green-700 dark:text-green-400')}
                    >
                      {m.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <p className="text-xs text-muted-foreground mr-auto">
            {members.length} member{members.length !== 1 ? 's' : ''}
          </p>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── View Branches Modal ────────────────────────────────────────────────────────
function ViewBranchesDialog({ open, onClose, org }) {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !org) return;
    setLoading(true);
    developerApi.getOrgBranches(org.id)
      .then(res => setBranches(res.data))
      .catch(() => setBranches([]))
      .finally(() => setLoading(false));
  }, [open, org]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            <span className="flex items-center gap-2">
              <GitBranch className="w-4 h-4" />
              Branches — {org?.name}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="min-h-[100px]">
          {loading ? (
            <div className="space-y-2 py-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 rounded-md bg-muted animate-pulse" />
              ))}
            </div>
          ) : branches.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No branches found.
            </div>
          ) : (
            <div className="divide-y divide-border -mx-6 px-6">
              {branches.map(b => (
                <div key={b.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">{b.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Added {new Date(b.dateCreated).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge
                    variant={b.isActive ? 'outline' : 'secondary'}
                    className={cn('text-xs', b.isActive && 'border-green-500 text-green-700 dark:text-green-400')}
                  >
                    {b.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <p className="text-xs text-muted-foreground mr-auto">
            {branches.length} branch{branches.length !== 1 ? 'es' : ''}
          </p>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Sidebar ────────────────────────────────────────────────────────────────────
function SidebarContent({ activeNav, setActiveNav, setMobileOpen, user }) {
  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex h-16 items-center gap-3 px-4">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brown dark:bg-beige shrink-0">
          <Scissors className="w-4 h-4 text-cream dark:text-[#1A0F0A]" />
        </div>
        <div className="overflow-hidden">
          <p className="font-bold text-sm leading-tight truncate">SalonMS</p>
          <p className="text-xs text-muted-foreground truncate">Developer Panel</p>
        </div>
      </div>

      <Separator />

      <nav className="flex-1 px-2 py-2 space-y-0.5">
        {navItems.map(({ label, icon: Icon }) => (
          <button
            key={label}
            onClick={() => { setActiveNav(label); setMobileOpen?.(false); }}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              activeNav === label
                ? 'bg-brown text-cream dark:bg-beige dark:text-[#1A0F0A]'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </button>
        ))}
      </nav>

      <Separator />

      <div className="px-4 py-3">
        <Badge variant="outline" className="text-xs border-brown/40 text-brown dark:border-beige/40 dark:text-beige mb-1">
          <ShieldCheck className="w-3 h-3 mr-1" /> Developer
        </Badge>
        <p className="text-sm font-semibold truncate">{user?.fullName}</p>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function DeveloperPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('Overview');

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [createOrgOpen, setCreateOrgOpen] = useState(false);

  const [selectedOrg, setSelectedOrg] = useState(null);
  const [editOrgOpen, setEditOrgOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [addBranchOpen, setAddBranchOpen] = useState(false);
  const [viewMembersOpen, setViewMembersOpen] = useState(false);
  const [viewBranchesOpen, setViewBranchesOpen] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, usersRes, orgsRes] = await Promise.all([
        developerApi.getStats(),
        developerApi.getUsers(),
        developerApi.getOrganizations(),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setOrgs(orgsRes.data);
    } catch {
      setError('Failed to load data. Make sure the API is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleToggleActive = async (id) => {
    try {
      const { data } = await developerApi.toggleUserActive(id);
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, isActive: data.isActive } : u));
      setStats((prev) => prev ? {
        ...prev,
        activeUsers: data.isActive ? prev.activeUsers + 1 : prev.activeUsers - 1,
      } : prev);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle user status.');
    }
  };

  const handleChangeRole = async (id, role) => {
    try {
      const { data } = await developerApi.changeRole(id, role);
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, role: data.role } : u));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to change role.');
    }
  };

  const openOrgDialog = (org, dialog) => {
    setSelectedOrg(org);
    if (dialog === 'edit') setEditOrgOpen(true);
    else if (dialog === 'member') setAddMemberOpen(true);
    else if (dialog === 'branch') setAddBranchOpen(true);
    else if (dialog === 'viewMembers') setViewMembersOpen(true);
    else if (dialog === 'viewBranches') setViewBranchesOpen(true);
  };

  const handleToggleOrg = async (id) => {
    try {
      const { data } = await developerApi.toggleOrgActive(id);
      setOrgs((prev) => prev.map((o) => o.id === id ? { ...o, isActive: data.isActive } : o));
      setStats((prev) => prev ? {
        ...prev,
        totalOrgs: data.isActive ? prev.totalOrgs + 1 : prev.totalOrgs - 1,
      } : prev);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle organization status.');
    }
  };

  const handleOrgSaved = (updated) => {
    setOrgs((prev) => prev.map((o) => o.id === updated.id ? { ...o, ...updated } : o));
  };

  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

  const sidebarProps = { activeNav, setActiveNav, user };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col fixed inset-y-0 left-0 z-30 border-r bg-background"
        style={{ width: DRAWER_WIDTH }}
      >
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* Mobile drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-60">
          <SidebarContent {...sidebarProps} setMobileOpen={setMobileOpen} />
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col md:ml-[240px]">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 px-4 border-b bg-background">
          <button
            className="md:hidden p-2 rounded-md hover:bg-secondary transition-colors"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          <h1 className="flex-1 text-lg font-semibold">{activeNav}</h1>

          <Button variant="ghost" size="sm" onClick={fetchAll} className="gap-1.5 text-muted-foreground">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>

          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-brown text-cream dark:bg-beige dark:text-[#1A0F0A] text-xs font-bold">
                    {user?.fullName?.[0] ?? '?'}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="font-normal">
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => navigate('/dashboard')}
                className="gap-2 cursor-pointer"
              >
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:text-destructive gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 p-6">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* ── OVERVIEW ── */}
          {activeNav === 'Overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Users"   value={stats?.totalUsers}   icon={Users}      color="bg-brown" />
                <StatCard label="Active Users"  value={stats?.activeUsers}  icon={Users}      color="bg-[#7A5B47]" />
                <StatCard label="Organizations" value={stats?.totalOrgs}    icon={Building2}  color="bg-[#A0856E]" />
                <StatCard label="Branches"      value={stats?.totalBranches} icon={GitBranch} color="bg-[#C4956A]" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card
                  className="shadow-sm border-border/60 cursor-pointer hover:border-brown/40 transition-colors"
                  onClick={() => setActiveNav('Users')}
                >
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">Manage Users</p>
                      <p className="text-sm text-muted-foreground mt-0.5">Create accounts and toggle access</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </CardContent>
                </Card>
                <Card
                  className="shadow-sm border-border/60 cursor-pointer hover:border-brown/40 transition-colors"
                  onClick={() => setActiveNav('Organizations')}
                >
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">Manage Organizations</p>
                      <p className="text-sm text-muted-foreground mt-0.5">Create orgs and assign owners</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* ── USERS ── */}
          {activeNav === 'Users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{users.length} total accounts</p>
                <Button size="sm" onClick={() => setCreateUserOpen(true)}
                  className="gap-1.5 bg-brown text-cream hover:bg-brown/90 dark:bg-beige dark:text-[#1A0F0A] dark:hover:bg-beige/90">
                  <Plus className="w-4 h-4" /> New Account
                </Button>
              </div>

              <Card className="shadow-sm border-border/60">
                <div className="divide-y divide-border">
                  {loading ? (
                    <div className="p-6 text-center text-muted-foreground text-sm">Loading…</div>
                  ) : users.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground text-sm">No users found.</div>
                  ) : users.map((u) => (
                    <div key={u.id} className="flex items-center gap-3 px-4 py-3">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="bg-brown/10 dark:bg-beige/10 text-brown dark:text-beige text-xs font-bold">
                          {u.firstName?.[0]}{u.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{u.firstName} {u.lastName}</p>
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={u.role === 'Developer' ? 'default' : 'secondary'}
                          className={cn('text-xs', u.role === 'Developer'
                            ? 'bg-brown text-cream dark:bg-beige dark:text-[#1A0F0A]'
                            : u.role === 'Admin' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-0' : '')}>
                          {u.role}
                        </Badge>
                        <Badge variant={u.isActive ? 'outline' : 'destructive'}
                          className={cn('text-xs', u.isActive && 'border-green-500 text-green-700 dark:text-green-400')}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        {u.role !== 'Developer' && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                className="text-muted-foreground hover:text-foreground transition-colors ml-1 p-0.5 rounded"
                                title="Actions"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                                Change Role
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleChangeRole(u.id, 'Admin')}
                                disabled={u.role === 'Admin'}
                                className="cursor-pointer"
                              >
                                Set as Admin
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleChangeRole(u.id, 'User')}
                                disabled={u.role === 'User'}
                                className="cursor-pointer"
                              >
                                Set as User
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleToggleActive(u.id)}
                                className={cn('cursor-pointer', u.isActive ? 'text-red-500 focus:text-red-500 focus:bg-red-50' : '')}
                              >
                                {u.isActive ? 'Deactivate' : 'Activate'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* ── ORGANIZATIONS ── */}
          {activeNav === 'Organizations' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{orgs.length} organization{orgs.length !== 1 ? 's' : ''}</p>
                <Button size="sm" onClick={() => setCreateOrgOpen(true)}
                  className="gap-1.5 bg-brown text-cream hover:bg-brown/90 dark:bg-beige dark:text-[#1A0F0A] dark:hover:bg-beige/90">
                  <Plus className="w-4 h-4" /> New Organization
                </Button>
              </div>

              <div className="space-y-3">
                {loading ? (
                  <p className="text-center text-muted-foreground text-sm py-6">Loading…</p>
                ) : orgs.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-6">No organizations yet.</p>
                ) : orgs.map((o) => (
                  <Card key={o.id} className={cn('shadow-sm border-border/60', !o.isActive && 'opacity-70')}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold truncate">{o.name}</p>
                            <Badge
                              variant={o.isActive ? 'outline' : 'destructive'}
                              className={cn('text-xs shrink-0', o.isActive && 'border-green-500 text-green-700 dark:text-green-400')}
                            >
                              {o.isActive ? 'Active' : 'Held'}
                            </Badge>
                          </div>
                          {o.location && (
                            <p className="text-xs text-muted-foreground truncate">{o.location}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <p className="text-xs text-muted-foreground">
                            {new Date(o.dateCreated).toLocaleDateString()}
                          </p>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded" title="Actions">
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Organization Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => openOrgDialog(o, 'edit')} className="cursor-pointer">
                                Edit Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openOrgDialog(o, 'member')} className="cursor-pointer">
                                Add Member
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openOrgDialog(o, 'branch')} className="cursor-pointer">
                                Add Branch
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => openOrgDialog(o, 'viewMembers')} className="cursor-pointer">
                                <Eye className="w-3.5 h-3.5 mr-2" /> View Members
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openOrgDialog(o, 'viewBranches')} className="cursor-pointer">
                                <GitBranch className="w-3.5 h-3.5 mr-2" /> View Branches
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleToggleOrg(o.id)}
                                className={cn('cursor-pointer', o.isActive ? 'text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950' : 'text-green-600 focus:text-green-600')}
                              >
                                {o.isActive ? 'Hold (Disable)' : 'Re-enable'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2.5">
                        <Badge
                          variant="secondary"
                          className="text-xs gap-1 cursor-pointer hover:bg-secondary/70"
                          onClick={() => openOrgDialog(o, 'viewMembers')}
                        >
                          <Users className="w-3 h-3" /> {o.memberCount} member{o.memberCount !== 1 ? 's' : ''}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="text-xs gap-1 cursor-pointer hover:bg-secondary/70"
                          onClick={() => openOrgDialog(o, 'viewBranches')}
                        >
                          <GitBranch className="w-3 h-3" /> {o.branchCount} branch{o.branchCount !== 1 ? 'es' : ''}
                        </Badge>
                        {o.owner ? (
                          <Badge variant="outline" className="text-xs border-brown/30 text-brown dark:border-beige/30 dark:text-beige">
                            Owner: {o.owner.ownerName}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-muted-foreground">No owner</Badge>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">Invite:</span>
                        <code className="text-xs font-mono bg-secondary px-1.5 py-0.5 rounded">{o.inviteCode}</code>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      <CreateUserDialog
        open={createUserOpen}
        onClose={() => setCreateUserOpen(false)}
        onCreated={(newUser) => {
          setUsers((prev) => [newUser, ...prev]);
          setStats((prev) => prev ? { ...prev, totalUsers: prev.totalUsers + 1, activeUsers: prev.activeUsers + 1 } : prev);
        }}
      />

      <CreateOrgDialog
        open={createOrgOpen}
        onClose={() => setCreateOrgOpen(false)}
        users={users}
        onCreated={(newOrg) => {
          setOrgs((prev) => [newOrg, ...prev]);
          setStats((prev) => prev ? { ...prev, totalOrgs: prev.totalOrgs + 1, totalBranches: prev.totalBranches + 1 } : prev);
        }}
      />

      <EditOrgDialog
        open={editOrgOpen}
        onClose={() => setEditOrgOpen(false)}
        org={selectedOrg}
        onSaved={handleOrgSaved}
      />

      <AddOrgMemberDialog
        open={addMemberOpen}
        onClose={() => setAddMemberOpen(false)}
        org={selectedOrg}
        users={users}
        onAdded={fetchAll}
      />

      <AddBranchDialog
        open={addBranchOpen}
        onClose={() => setAddBranchOpen(false)}
        org={selectedOrg}
        onAdded={fetchAll}
      />

      <ViewMembersDialog
        open={viewMembersOpen}
        onClose={() => setViewMembersOpen(false)}
        org={selectedOrg}
      />

      <ViewBranchesDialog
        open={viewBranchesOpen}
        onClose={() => setViewBranchesOpen(false)}
        org={selectedOrg}
      />
    </div>
  );
}
