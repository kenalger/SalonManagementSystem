import { Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function ServicesPage() {
  return (
    <div>
      <h2 className="text-xl font-bold mb-0.5">Services</h2>
      <p className="text-sm text-muted-foreground mb-6">Manage the services your salon offers.</p>

      <Card className="shadow-sm border-border/60">
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <Sparkles className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-base font-semibold mb-1">No Services Yet</h3>
          <p className="text-sm text-muted-foreground">Add services to make them available for booking.</p>
        </CardContent>
      </Card>
    </div>
  );
}
