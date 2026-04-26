import { Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function ClientsPage() {
  return (
    <div>
      <h2 className="text-xl font-bold mb-0.5">Clients</h2>
      <p className="text-sm text-muted-foreground mb-6">View and manage your client list.</p>

      <Card className="shadow-sm border-border/60">
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <Users className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-base font-semibold mb-1">No Clients Yet</h3>
          <p className="text-sm text-muted-foreground">Your client directory will appear here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
