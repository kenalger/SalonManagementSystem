import { Settings } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function SettingsPage() {
  return (
    <div>
      <h2 className="text-xl font-bold mb-0.5">Settings</h2>
      <p className="text-sm text-muted-foreground mb-6">Configure your salon and account preferences.</p>

      <Card className="shadow-sm border-border/60">
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <Settings className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-base font-semibold mb-1">Settings Coming Soon</h3>
          <p className="text-sm text-muted-foreground">Organization and account settings will appear here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
