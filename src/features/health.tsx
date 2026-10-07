import { useState } from 'react';
import { HeartPulse, Loader2, RefreshCw } from 'lucide-react';
import { Button, HoloCard } from '@/components/ui';
import { toast } from '@/components/toast';
import { haptic } from '@/lib/native';
import { play } from '@/game/sfx';
import { floatReward } from '@/game/rewards';
import { connectHealth, isHealthConnected, isHealthPlatform, syncHealth, type HealthSyncResult } from '@/services/healthService';

/** New workouts landed in the inbox: a little ping, the Home card does the rest. */
export function announceArrivals(n: number) {
  if (!n) return;
  haptic('success');
  play('chime');
  floatReward(n === 1 ? 'A workout arrived' : `${n} workouts arrived`, 'energy');
}

/** Ask for Health access and import the last week. Returns the result, or null if it failed. */
export function useConnectHealth(userId: string | undefined) {
  const [busy, setBusy] = useState(false);
  const [connected, setConnected] = useState(() => (userId ? isHealthConnected(userId) : false));

  const connect = async (): Promise<HealthSyncResult | null> => {
    if (!userId) return null;
    setBusy(true);
    try {
      const r = await connectHealth(userId);
      setConnected(true);
      return r;
    } catch (e) {
      toast({ title: 'Couldn’t connect Apple Health', description: e instanceof Error ? e.message : String(e), variant: 'destructive' });
      return null;
    } finally {
      setBusy(false);
    }
  };

  return { busy, connected, connect };
}

/** Dashboard nudge for players on the iPhone app who haven't connected yet. */
export function ConnectHealthCard({ userId }: { userId: string }) {
  const { busy, connected, connect } = useConnectHealth(userId);
  if (!isHealthPlatform() || connected) return null;

  const go = async () => {
    const r = await connect();
    if (!r) return;
    if (r.arrived) announceArrivals(r.arrived);
    else toast({ title: 'Apple Health connected', description: 'Your next workout will show up here, ready to collect.' });
  };

  return (
    <HoloCard glow="magenta" className="flex items-center gap-4 p-4">
      <HeartPulse className="size-8 shrink-0 text-secondary" />
      <div className="min-w-0 flex-1">
        <p className="font-heading font-bold">Connect Apple Health</p>
        <p className="text-xs text-muted-foreground">Workouts charge your reserves automatically. No logging.</p>
      </div>
      <Button size="sm" onClick={() => void go()} disabled={busy}>
        {busy ? <Loader2 className="animate-spin" /> : 'Connect'}
      </Button>
    </HoloCard>
  );
}

/** Profile row: status plus a manual "sync now". */
export function HealthSetting({ userId }: { userId: string }) {
  const { busy, connected, connect } = useConnectHealth(userId);
  const [syncing, setSyncing] = useState(false);
  if (!isHealthPlatform()) return null;

  const sync = async () => {
    setSyncing(true);
    const r = await (connected ? syncHealth(userId) : connect()).catch(() => null);
    setSyncing(false);
    if (r?.arrived) announceArrivals(r.arrived);
    else if (r) toast({ title: 'You’re up to date', description: 'No new workouts in Apple Health.' });
  };

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium">Apple Health</p>
        <p className="text-xs text-muted-foreground">
          {connected
            ? 'Connected. Workouts come in when you open the app. Missing some? Check Settings › Health › Data Access & Devices › 80 Ways.'
            : 'Bring your workouts in automatically.'}
        </p>
      </div>
      <Button size="sm" variant="outline" onClick={() => void sync()} disabled={busy || syncing}>
        {busy || syncing ? <Loader2 className="animate-spin" /> : connected ? <><RefreshCw /> Sync</> : 'Connect'}
      </Button>
    </div>
  );
}
