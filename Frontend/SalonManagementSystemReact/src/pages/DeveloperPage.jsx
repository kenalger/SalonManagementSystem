import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Scissors, Users, Building2, GitBranch, LayoutDashboard,
  LogOut, Menu, Plus, ToggleLeft, ToggleRight, RefreshCw,
  ShieldCheck, ChevronRight,
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
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
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
      setForm({ firstName: '', lastName: '', email: '', password: '' });
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
                          className={u.role === 'Developer'
                            ? 'bg-brown text-cream dark:bg-beige dark:text-[#1A0F0A] text-xs'
                            : 'text-xs'}>
                          {u.role}
                        </Badge>
                        <Badge variant={u.isActive ? 'outline' : 'destructive'}
                          className={cn('text-xs', u.isActive && 'border-green-500 text-green-700 dark:text-green-400')}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        {u.role !== 'Developer' && (
                          <button
                            onClick={() => handleToggleActive(u.id)}
                            className="text-muted-foreground hover:text-foreground transition-colors ml-1"
                            title={u.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {u.isActive
                              ? <ToggleRight className="w-5 h-5 text-green-600 dark:text-green-400" />
                              : <ToggleLeft className="w-5 h-5" />}
                          </button>
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
                <p className="text-sm text-muted-foreground">{orgs.length} active organizations</p>
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
                  <Card key={o.id} className="shadow-sm border-border/60">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{o.name}</p>
                          {o.location && (
                            <p className="text-xs text-muted-foreground truncate">{o.location}</p>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground shrink-0">
                          {new Date(o.dateCreated).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2.5">
                        <Badge variant="secondary" className="text-xs gap-1">
                          <Users className="w-3 h-3" /> {o.memberCount} member{o.memberCount !== 1 ? 's' : ''}
                        </Badge>
                        <Badge variant="secondary" className="text-xs gap-1">
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
    </div>
  );
}
