import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ENERGY_TYPES, getLevelFromXP } from '@/data/gameConstants';
import { computeStreak } from '@/lib/gameEngine';
import { cn } from '@/components/ui';
import { useActivityStore } from '@/stores/activityStore';
import { useEnergyStore } from '@/stores/energyStore';
import { useProgressionStore } from '@/stores/progressionStore';
import { useUserStore } from '@/stores/userStore';
import { Coin, DISCIPLINE_ICON, Flame } from './art';
import { useRewardStore } from './rewards';

/** A number that counts towards its new value, and bumps when it goes up. */
export function useCountUp(value: number, ms = 700): [number, boolean] {
  const [shown, setShown] = useState(value);
  const [bump, setBump] = useState(false);
  const from = useRef(value);
  useEffect(() => {
    const start = from.current;
    if (start === value) return;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / ms);
      const eased = 1 - Math.pow(1 - k, 3);
      setShown(start + (value - start) * eased);
      if (k < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    if (value > start) {
      setBump(true);
      setTimeout(() => setBump(false), 350);
    }
    return () => {
      cancelAnimationFrame(raf);
      from.current = value;
    };
  }, [value, ms]);
  return [shown, bump];
}

export { DISCIPLINE_ICON };

function LevelRing({ size = 44 }: { size?: number }) {
  const heldXp = useRewardStore((s) => s.held.xp);
  const xp = useProgressionStore((s) => s.xp) - heldXp;
  const level = useProgressionStore((s) => s.level);
  const discipline = useUserStore((s) => s.discipline);
  const info = getLevelFromXP(xp);
  const r = size / 2 - 3;
  const c = 2 * Math.PI * r;
  const Icon = DISCIPLINE_ICON[discipline ?? 'runner'];
  return (
    <div id="hud-level" className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="hsl(var(--card))" stroke="hsl(var(--muted))" strokeWidth="4" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - info.progress)}
          style={{ transition: 'stroke-dashoffset 0.8s ease-out', filter: 'drop-shadow(0 0 4px hsl(var(--primary)/0.7))' }}
        />
      </svg>
      <Icon className="absolute inset-0 m-auto size-5 text-primary" />
      <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-primary font-heading text-xs font-bold text-primary-foreground ring-2 ring-background">
        {level}
      </span>
    </div>
  );
}

/** The always-on game header: who you are, how far to the next level, and your purse. */
export function Hud() {
  const xp = useProgressionStore((s) => s.xp) - useRewardStore((s) => s.held.xp);
  const levelName = useProgressionStore((s) => s.levelName);
  // Rewards still flying in aren't counted yet: the HUD fills up as they land.
  const held = useRewardStore((s) => s.held);
  const credits = useUserStore((s) => s.inventory.credits) - held.credits;
  const energy = useEnergyStore();
  const activities = useActivityStore((s) => s.activities);
  const info = getLevelFromXP(xp);
  const totalEnergy = ENERGY_TYPES.reduce((t, k) => t + energy[k].current, 0);
  const streak = computeStreak(activities.map((a) => a.timestamp));

  const [coins, coinBump] = useCountUp(credits);
  const [kwh, kwhBump] = useCountUp(totalEnergy);

  // A coin clink when the purse goes up.

  return (
    <div className="flex items-center gap-3">
      <Link to="/profile" aria-label={`Level ${info.level}, ${levelName}. Profile`} className="press flex min-w-0 flex-1 items-center gap-3">
        <LevelRing />
        <div className="min-w-0 flex-1">
          <p className="truncate font-heading text-base font-bold leading-tight">Level {info.level}</p>
          <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-muted ring-1 ring-black/40">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-[width] duration-700 ease-out"
              style={{ width: `${Math.max(4, info.progress * 100)}%`, boxShadow: '0 0 8px hsl(var(--primary)/0.6)' }}
            />
          </div>
        </div>
      </Link>

      <div className="flex shrink-0 items-center gap-1.5">
        <span id="hud-energy" className={cn('flex items-center gap-1 rounded-xl border-2 border-success/40 bg-success/15 px-2 py-1 font-heading text-lg font-bold leading-none text-success', kwhBump && 'animate-bump')}>
          ⚡{kwh.toFixed(1)}
        </span>
        <Link
          to="/store"
          id="hud-coins"
          aria-label={`${credits} credits. Store`}
          className={cn('press flex items-center gap-1 rounded-xl border-2 border-warning/40 bg-warning/15 px-2 py-1 font-heading text-lg font-bold leading-none text-warning', coinBump && 'animate-bump')}
        >
          <Coin size={20} />
          {Math.round(coins)}
        </Link>
        <span className="flex items-center gap-0.5 rounded-xl border-2 border-warning/25 bg-warning/10 px-2 py-1 font-heading text-lg font-bold leading-none" aria-label={`${streak}-day streak`}>
          <Flame size={20} lit={streak > 0} />
          <span className={streak > 0 ? 'text-warning' : 'text-muted-foreground'}>{streak}</span>
        </span>
      </div>
    </div>
  );
}
