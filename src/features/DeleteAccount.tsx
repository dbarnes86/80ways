import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Trash2 } from 'lucide-react';
import { Button, Dialog, Input } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { resetLocalGame } from '@/lib/gameSync';
import { useMembershipStore } from '@/stores/membershipStore';

/** In-app account deletion, required by the App Store for any app with sign-up. */
export function DeleteAccount() {
  const navigate = useNavigate();
  const membership = useMembershipStore((s) => s.membership);
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = async () => {
    setBusy(true);
    setError(null);
    const { error } = await supabase.functions.invoke('delete-account', { body: {} });
    if (error) {
      setBusy(false);
      setError("We couldn't delete your account just now. Try again in a minute.");
      return;
    }
    await supabase.auth.signOut().catch(() => undefined);
    resetLocalGame();
    navigate('/', { replace: true });
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive">
        <Trash2 className="size-4" /> Delete account
      </button>
      <Dialog open={open} onClose={() => !busy && setOpen(false)} title="Delete your account?" description="This removes your progress, activity log, raid history and account for good. It can't be undone.">
        <div className="space-y-4">
          {membership?.tier === 'member' && (
            <p className="rounded-md border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
              Deleting your account doesn't cancel your subscription.{' '}
              {membership.source === 'app_store' ? 'Cancel it in Settings, your name, Subscriptions.' : 'Cancel it first from Membership, Manage billing.'}
            </p>
          )}
          <label className="block space-y-2 text-sm">
            <span>Type DELETE to confirm</span>
            <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} autoCapitalize="characters" />
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setOpen(false)} disabled={busy}>
              Keep my account
            </Button>
            <Button className="flex-1 bg-destructive text-white hover:bg-destructive/90" disabled={confirm.trim().toUpperCase() !== 'DELETE' || busy} onClick={() => void remove()}>
              {busy ? <Loader2 className="animate-spin" /> : 'Delete forever'}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
