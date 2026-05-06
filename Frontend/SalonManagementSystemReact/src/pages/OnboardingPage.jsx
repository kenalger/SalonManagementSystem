import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scissors, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, setOrganization } = useAuth();

  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/api/organizations/join', { inviteCode: inviteCode.trim() });
      setOrganization(data);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid invite code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-beige via-[#C4A882] to-brown dark:from-[#1A0F0A] dark:via-[#2C1810] dark:to-[#4A2B1E]">
      <ThemeToggle className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/10" />

      <Card className="w-full max-w-md shadow-2xl border-0 dark:bg-card">
        <CardContent className="p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-brown/10 dark:bg-beige/10 mb-3">
              <Scissors className="w-7 h-7 text-brown dark:text-beige" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              Welcome, {user?.fullName?.split(' ')[0]}!
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Enter your invite code to join an organization.
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleJoin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="inviteCode">Invite Code</Label>
              <Input
                id="inviteCode"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                maxLength={8}
                placeholder="XXXXXXXX"
                required
                className="tracking-widest font-mono text-lg text-center h-12"
              />
              <p className="text-xs text-muted-foreground">
                Ask your organization admin for the invite code.
              </p>
            </div>
            <Button
              type="submit"
              disabled={loading || inviteCode.trim().length === 0}
              className="w-full h-11 text-base bg-brown text-cream hover:bg-brown/90 dark:bg-beige dark:text-[#1A0F0A] dark:hover:bg-beige/90"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Joining…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Join Organization <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
