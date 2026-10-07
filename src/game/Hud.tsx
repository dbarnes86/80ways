import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bike, Dumbbell, PersonStanding, Waves } from 'lucide-react';
import { ENERGY_TYPES, getLevelFromXP } from '@/data/gameConstants';
import { computeStreak } from '@/lib/gameEngine';
import { cn } from '@/components/ui';
import { useActivityStore } from '@/stores/activityStore';
import { useEnergyStore } from '@/stores/energyStore';
import { useProgressionStore } from '@/stores/progressionStore';
import { useUserStore, type Discipline } from '@/stores/userStore';
import { Coin, Flame } from './art';
import { play } from './sfx';

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

export const DISCIPLINE_ICON: Record<Discipline, typeof Waves> = {
  runner: PersonStanding,
  rider: Bike,
  swimmer: Waves,
  lifter: Dumbbell,
};

function LevelRing({ size = 44 }: { size?: number }) {
  const xp = useProgressionStore((s) => s.xp);
  const level = useProgressionStore((s) => s.level);
  const discipline = useUserStore((s) => s.discipline);
  const info = getLevelFromXP(xp);
  const r = size / 2 - 3;
  const c = 2 * Math.PI * r;
  const Icon = DISCIPLINE_ICON[discipline ?? 'runner'];
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
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
  const xp = useProgressionStore((s) => s.xp);
  const levelName = useProgressionStore((s) => s.levelName);
  const credits = useUserStore((s) => s.inventory.credits);
  const energy = useEnergyStore();
  const activities = useActivityStore((s) => s.activities);
  const info = getLevelFromXP(xp);
  const totalEnergy = ENERGY_TYPES.reduce((t, k) => t + energy[k].current, 0);
  const streak = computeStreak(activities.map((a) => a.timestamp));

  const [coins, coinBump] = useCountUp(credits);
  const [kwh, kwhBump] = useCountUp(totalEnergy);

  // A coin clink when the purse goes up.
  // Not for the first couple of seconds, while the saved game loads in.
  const lastCredits = useRef(credits);
  const mountedAt = useRef(Date.now());
  useEffect(() => {
    if (credits > lastCredits.current && Date.now() - mountedAt.current > 2500) play('coin');
    lastCredits.current = credits;
  }, [credits]);

  return (
    <div className="flex items-center gap-3">
      <Link to="/profile" aria-label={`Level ${info.level}, ${levelName}. Profile`} className="press flex min-w-0 flex-1 items-center gap-3">
        <LevelRing />
        <div className="min-w-0 flex-1">
          <p className="truncate font-heading text-sm font-bold leading-tight">{levelName}</p>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-[width] duration-700 ease-out"
              style={{ width: `${Math.max(4, info.progress * 100)}%`, boxShadow: '0 0 8px hsl(var(--primary)/0.6)' }}
            />
          </div>
        </div>
      </Link>

      <div className="flex shrink-0 items-center gap-1.5">
        <span id="hud-energy" className={cn('flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-1 font-heading text-base font-bold text-success', kwhBump && 'animate-bump')}>
          ⚡{kwh.toFixed(1)}
        </span>
        <Link
          to="/store"
          id="hud-coins"
          aria-label={`${credits} credits. Store`}
          className={cn('press flex items-center gap-1 rounded-full bg-warning/15 px-2.5 py-1 font-heading text-base font-bold text-warning', coinBump && 'animate-bump')}
        >
          <Coin size={16} />
          {Math.round(coins)}
        </Link>
        <span className="flex items-center gap-0.5 rounded-full bg-secondary/10 px-2 py-1 font-heading text-base font-bold" aria-label={`${streak}-day streak`}>
          <Flame size={16} lit={streak > 0} />
          <span className={streak > 0 ? 'text-warning' : 'text-muted-foreground'}>{streak}</span>
        </span>
      </div>
    </div>
  );
}
