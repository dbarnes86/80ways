import { useRef, useState } from 'react';
import { ENERGY_THEME } from '@/data/energyTheme';
import { haptic } from '@/lib/native';
import { cn } from '@/components/ui';
import type { LogActivityResult } from '@/lib/gameActions';
import { useInboxStore, type InboxItem } from '@/stores/inboxStore';
import { useUserStore } from '@/stores/userStore';
import { Orb } from './art';
import { announceMilestones, collectItem, previewEnergy } from './collect';
import { centreOf, flyOrbs } from './fx';
import { play } from './sfx';

const day = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const diff = Math.round((new Date(today.toDateString()).getTime() - new Date(d.toDateString()).getTime()) / 86_400_000);
  return diff === 0 ? 'Today' : diff === 1 ? 'Yesterday' : d.toLocaleDateString(undefined, { weekday: 'short' });
};

function BoosterChip({ on, onClick, label, count }: { on: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      type="button"
      onClick={() => {
        haptic('select');
        play('tick');
        onClick();
      }}
      className={cn(
        'press flex-1 rounded-xl border-2 px-3 py-2 font-heading text-base font-bold',
        on ? 'border-secondary bg-secondary/20 text-secondary shadow-[0_0_14px_hsl(var(--secondary)/0.5)]' : 'border-border text-muted-foreground',
      )}
    >
      {on ? '✓ ' : ''}
      {label} <span className="text-xs opacity-70">×{count}</span>
    </button>
  );
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Workouts waiting to be collected. Tapping Collect flies each one's energy into the HUD with a
 * rising tone per workout, then plays the milestones (Lift Off, level up) at the end.
 */
export function CollectPanel({ onCollected, big = false }: { onCollected?: () => void; big?: boolean }) {
  const items = useInboxStore((s) => s.items);
  const [busy, setBusy] = useState(false);
  const [gone, setGone] = useState<Set<string>>(new Set());
  const refs = useRef(new Map<string, HTMLElement>());
  const amplifiers = useUserStore((s) => s.inventory.energyAmplifier);
  const multiCharges = useUserStore((s) => s.inventory.multiCharge);
  const [useAmp, setUseAmp] = useState(false);
  const [useMulti, setUseMulti] = useState(false);

  if (!items.length && !busy) return null;

  const collectOne = async (item: InboxItem, pitch: number, boosters: { amplifier?: boolean; multiCharge?: boolean } = {}): Promise<LogActivityResult> => {
    const el = refs.current.get(item.id);
    if (el) void flyOrbs(centreOf(el), item.targetType, 6 + Math.min(10, Math.round(previewEnergy(item) * 6)));
    play('collect', pitch);
    haptic('tap');
    setGone((g) => new Set(g).add(item.id));
    await wait(260);
    return collectItem(item, boosters);
  };

  const collectAll = async () => {
    if (busy) return;
    setBusy(true);
    const results: LogActivityResult[] = [];
    // Boosters go on the biggest workout, where they're worth the most.
    const queue = [...useInboxStore.getState().items];
    const best = queue.reduce((b, i) => (previewEnergy(i) > previewEnergy(b) ? i : b), queue[0]);
    for (let i = 0; i < queue.length; i++) {
      const boost = queue[i] === best ? { amplifier: useAmp, multiCharge: useMulti } : {};
      results.push(await collectOne(queue[i], Math.min(i * 2, 12), boost));
    }
    setUseAmp(false);
    setUseMulti(false);
    await wait(500);
    play('coin');
    announceMilestones(results);
    setBusy(false);
    setGone(new Set());
    onCollected?.();
  };

  const total = items.reduce((t, i) => t + previewEnergy(i), 0);
  const shown = items.slice(0, big ? 6 : 3);

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <p className="font-heading text-xl font-bold">
          {items.length === 1 ? 'A workout arrived' : `${items.length} workouts arrived`}
        </p>
        <p className="font-heading text-lg font-bold text-success">+{total.toFixed(1)} kWh</p>
      </div>

      <ul className="space-y-2">
        {shown.map((item) => {
          const theme = ENERGY_THEME[item.targetType];
          return (
            <li
              key={item.id}
              ref={(el) => {
                if (el) refs.current.set(item.id, el);
                else refs.current.delete(item.id);
              }}
              className={cn(
                'flex items-center gap-3 rounded-2xl border bg-card/80 p-3 transition-all duration-300',
                theme.border,
                gone.has(item.id) && 'scale-95 opacity-0',
              )}
            >
              <div className={cn('flex size-12 shrink-0 items-center justify-center rounded-xl', theme.bgSoft)}>
                <Orb type={item.targetType} size={30} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-heading text-lg font-bold leading-tight">{item.activityType}</p>
                <p className="text-sm text-muted-foreground">
                  {item.durationMin} min{item.distanceKm ? ` · ${item.distanceKm.toFixed(1)} km` : ''} · {day(item.performedAt)}
                </p>
              </div>
              <span className={cn('font-heading text-lg font-bold', theme.text)}>+{previewEnergy(item).toFixed(1)}</span>
            </li>
          );
        })}
        {items.length > shown.length && <li className="text-center text-sm text-muted-foreground">and {items.length - shown.length} more</li>}
      </ul>

      {(amplifiers > 0 || multiCharges > 0) && !busy && (
        <div className="flex gap-2">
          {amplifiers > 0 && (
            <BoosterChip on={useAmp} onClick={() => setUseAmp((v) => !v)} label="Amplifier ×2" count={amplifiers} />
          )}
          {multiCharges > 0 && (
            <BoosterChip on={useMulti} onClick={() => setUseMulti((v) => !v)} label="Multi-Charge" count={multiCharges} />
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => void collectAll()}
        disabled={busy}
        className="press shine flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-success font-heading text-2xl font-bold tracking-wide text-background shadow-[0_0_30px_hsl(var(--success)/0.45)] disabled:opacity-70"
      >
        {busy ? 'Collecting…' : 'Collect'}
      </button>
    </div>
  );
}
