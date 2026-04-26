import { CalendarDays } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function AppointmentsPage() {
  return (
    <div>
      <h2 className="text-xl font-bold mb-0.5">Appointments</h2>
      <p className="text-sm text-muted-foreground mb-6">Schedule and manage client appointments.</p>

      <Card className="shadow-sm border-border/60">
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <CalendarDays className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-base font-semibold mb-1">No Appointments Yet</h3>
          <p className="text-sm text-muted-foreground">Appointment scheduling will appear here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
