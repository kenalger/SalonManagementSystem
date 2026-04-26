import { UserCog } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function StaffPage() {
  return (
    <div>
      <h2 className="text-xl font-bold mb-0.5">Staff</h2>
      <p className="text-sm text-muted-foreground mb-6">Manage your salon's team members.</p>

      <Card className="shadow-sm border-border/60">
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <UserCog className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-base font-semibold mb-1">No Staff Members Yet</h3>
          <p className="text-sm text-muted-foreground">Invite team members to your organization to get started.</p>
        </CardContent>
      </Card>
    </div>
  );
}
