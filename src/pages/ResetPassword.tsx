import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button, HoloCard, Input, Label } from '@/components/ui';

export default function ResetPassword() {
  const { session, clearRecovery } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('At least 8 characters.');
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return setError(error.message);
    clearRecovery();
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-4">
      <HoloCard glow="cyan" className="w-full max-w-md p-8">
        <h1 className="mb-6 text-center text-2xl font-heading font-bold text-glow-cyan">CHOOSE A NEW PASSWORD</h1>
        {!session ? (
          <p className="text-center text-sm text-muted-foreground">This link has expired. Request a new one from the sign-in page.</p>
        ) : (
          <form onSubmit={save} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">NEW PASSWORD</Label>
              <Input id="new-password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={busy} className="h-12 w-full">
              {busy ? <Loader2 className="animate-spin" /> : 'Save and continue'}
            </Button>
          </form>
        )}
      </HoloCard>
    </div>
  );
}
