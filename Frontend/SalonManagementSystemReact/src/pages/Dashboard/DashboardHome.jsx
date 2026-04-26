import { CalendarDays, Users, Sparkles, BarChart2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const statCards = [
  { label: "Today's Appointments", value: '—', color: 'bg-brown',     icon: CalendarDays },
  { label: 'Active Clients',       value: '—', color: 'bg-[#7A5B47]', icon: Users },
  { label: 'Services Offered',     value: '—', color: 'bg-[#A0856E]', icon: Sparkles },
  { label: "Today's Revenue",      value: '—', color: 'bg-[#C4956A]', icon: BarChart2 },
];

export default function DashboardHome() {
  const { user, organization } = useAuth();

  return (
    <div>
      <h2 className="text-xl font-bold mb-0.5">
        Welcome back, {user?.fullName?.split(' ')[0]}
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        Here&apos;s what&apos;s happening at {organization?.name || 'your salon'} today.
      </p>

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

      <Card className="shadow-sm border-border/60">
        <CardContent className="p-6">
          <h3 className="text-base font-semibold mb-1">Getting Started</h3>
          <p className="text-sm text-muted-foreground">
            Your salon management system is ready. Start by adding your services and
            inviting staff members to your organization.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
