import { useRef, useState } from 'react';
import { ENERGY_THEME } from '@/data/energyTheme';
import { haptic } from '@/lib/native';
import { cn } from '@/components/ui';
import type { LogActivityResult } from '@/lib/gameActions';
import { useInboxStore, type InboxItem } from '@/stores/inboxStore';
import { useUserStore } from '@/stores/userStore';
import { BOOSTERS } from '@/data/gameConstants';
import { floatReward } from './rewards';
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
        'press flex-1 rounded-2xl border-2 px-3 py-2.5 font-heading text-lg font-bold',
        on ? 'border-accent bg-accent/20 text-accent shadow-[0_0_14px_hsl(var(--accent)/0.5)]' : 'border-border text-muted-foreground',
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
  // A booster armed earlier (from a chest, or on Home) is on by default: the reward gets used.
  const armed = useUserStore((s) => s.armedBooster);
  const [useAmp, setUseAmp] = useState(() => armed === 'energyAmplifier' && amplifiers > 0);
  const [useMulti, setUseMulti] = useState(() => armed === 'multiCharge' && multiCharges > 0);

  if (!items.length && !busy) return null;

  const collectOne = async (item: InboxItem, pitch: number, boosters: { amplifier?: boolean; multiCharge?: boolean } = {}): Promise<LogActivityResult | null> => {
    // Workouts folded into the "+N more" tile fly from that tile.
    const el = refs.current.get(item.id) ?? refs.current.get('more');
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
      const r = await collectOne(queue[i], Math.min(i * 2, 12), boost);
      if (r) results.push(r);
    }
    if (useAmp || useMulti) {
      const fired = useAmp ? 'energyAmplifier' : 'multiCharge';
      floatReward(`${BOOSTERS[fired].name} fired${useAmp ? ': ×2' : ''}`, 'streak');
      if (armed === fired) useUserStore.getState().armBooster(null);
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
  // Never a scrolling list: at most one row of tiles on Home, two in onboarding, and the rest
  // counted in the last tile, so Collect is always on screen however many workouts arrived.
  const cap = big ? 6 : 3;
  const overflow = items.length > cap ? items.length - (cap - 1) : 0;
  const shown = overflow ? items.slice(0, cap - 1) : items;

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <p className="font-heading text-2xl font-bold">
          {items.length === 1 ? 'A workout arrived' : `${items.length} workouts arrived`}
        </p>
        <p className="font-heading text-lg font-bold text-success">+{total.toFixed(1)} kWh</p>
      </div>

      <ul className="grid grid-cols-3 gap-2">
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
                'panel flex flex-col items-center gap-1 px-2 py-2.5 text-center transition-all duration-300',
                theme.border,
                gone.has(item.id) && 'scale-90 opacity-0',
              )}
            >
              <Orb type={item.targetType} size={34} />
              <span className={cn('font-heading text-lg font-bold leading-none', theme.text)}>+{previewEnergy(item).toFixed(1)}</span>
              <span className="w-full truncate text-xs text-muted-foreground" title={`${item.activityType} · ${day(item.performedAt)}`}>
                {item.activityType}
              </span>
            </li>
          );
        })}
        {overflow > 0 && (
          <li
            ref={(el) => {
              if (el) refs.current.set('more', el);
              else refs.current.delete('more');
            }}
            className={cn(
              'panel flex flex-col items-center justify-center px-2 py-2.5 text-center transition-all duration-300',
              busy && 'scale-90 opacity-0',
            )}
          >
            <span className="font-heading text-2xl font-bold leading-none">+{overflow}</span>
            <span className="text-xs text-muted-foreground">more</span>
          </li>
        )}
      </ul>

      {(amplifiers > 0 || multiCharges > 0) && !busy && (
        <div className="flex gap-2">
          {amplifiers > 0 && (
            <BoosterChip on={useAmp} onClick={() => setUseAmp((v) => !v)} label={useAmp ? 'Amplifier ×2 armed' : 'Amplifier ×2'} count={amplifiers} />
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
        className="btn-game btn-go shine w-full"
      >
        {busy ? 'Collecting…' : 'Collect'}
      </button>
    </div>
  );
}
