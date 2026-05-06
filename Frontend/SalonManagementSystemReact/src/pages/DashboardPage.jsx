import { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  Scissors, LayoutDashboard, CalendarDays, Users, Sparkles,
  BarChart2, Settings, LogOut, Menu, ShieldCheck, Target,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { cn } from '@/lib/utils';
import { useAuth } from '../context/AuthContext';

const DRAWER_WIDTH = 240;

const navItems = [
  { label: 'Dashboard',    icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Appointments', icon: CalendarDays,    path: '/dashboard/appointments' },
  { label: 'Clients',      icon: Users,           path: '/dashboard/clients' },
  { label: 'Services',     icon: Sparkles,        path: '/dashboard/services' },
  { label: 'Reports',      icon: BarChart2,       path: '/dashboard/reports' },
  { label: 'KPI',          icon: Target,          path: '/dashboard/kpi' },
];

function SidebarContent({ organization, activeLabel, navigate, setMobileOpen, user, isDeveloper, onDevPanel }) {
  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex h-16 items-center gap-3 px-4">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brown dark:bg-beige shrink-0">
          <Scissors className="w-4 h-4 text-cream dark:text-[#1A0F0A]" />
        </div>
        <div className="overflow-hidden">
          <p className="font-bold text-sm leading-tight truncate">
            {organization?.name || 'SalonMS'}
          </p>
          {organization?.location && (
            <p className="text-xs text-muted-foreground truncate">{organization.location}</p>
          )}
        </div>
      </div>

      <Separator />

      <nav className="flex-1 px-2 py-2 space-y-0.5">
        {navItems.map(({ label, icon: Icon, path }) => (
          <button
            key={label}
            onClick={() => { navigate(path); setMobileOpen?.(false); }}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              activeLabel === label
                ? 'bg-brown text-cream dark:bg-beige dark:text-[#1A0F0A]'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </button>
        ))}

        {isDeveloper && (
          <>
            <Separator className="my-1" />
            <button
              onClick={() => { onDevPanel(); setMobileOpen?.(false); }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-brown dark:text-beige hover:bg-brown/10 dark:hover:bg-beige/10"
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              Developer Panel
            </button>
          </>
        )}
      </nav>

      <Separator />

      <div className="px-4 py-3">
        <p className="text-xs text-muted-foreground">Signed in as</p>
        <p className="text-sm font-semibold truncate">{user?.fullName}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, organization, logout, isDeveloper } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);

  const activeItem = navItems.find(item =>
    item.path === '/dashboard'
      ? location.pathname === '/dashboard'
      : location.pathname.startsWith(item.path)
  ) ?? navItems[0];

  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

  const sidebarProps = {
    organization,
    activeLabel: activeItem.label,
    navigate,
    user,
    isDeveloper,
    onDevPanel: () => navigate('/developer'),
  };

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

          <h1 className="flex-1 text-lg font-semibold">{activeItem.label}</h1>

          <Badge variant="outline" className="hidden sm:inline-flex border-brown/30 text-brown dark:border-beige/30 dark:text-beige">
            {organization?.name || 'No Organization'}
          </Badge>

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
                onClick={() => navigate('/dashboard/settings')}
                className="gap-2 cursor-pointer"
              >
                <Settings className="w-4 h-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:text-destructive gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
