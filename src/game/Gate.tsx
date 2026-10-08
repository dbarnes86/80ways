import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { LEVEL_THRESHOLDS } from '@/data/gameConstants';
import { useProgressionStore } from '@/stores/progressionStore';
import { UNLOCKS, isUnlocked, unlockLevel, type Feature } from './unlocks';

/** A screen that isn't unlocked yet says when it will be, instead of showing too much too soon. */
export function Gate({ feature, children }: { feature: Feature; children: ReactNode }) {
  const level = useProgressionStore((s) => s.level);
  const xp = useProgressionStore((s) => s.xp);
  if (isUnlocked(feature, level)) return <>{children}</>;

  const needed = unlockLevel(feature);
  const info = UNLOCKS.find((u) => u.feature === feature)!;
  const target = LEVEL_THRESHOLDS[needed - 1] ?? 0;
  const pct = target > 0 ? Math.min(100, (xp / target) * 100) : 0;

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-5 px-6 pt-16 text-center">
      <div className="flex size-24 items-center justify-center rounded-full border-4 border-border bg-card">
        <Lock className="size-10 text-muted-foreground" />
      </div>
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">Level {needed}</p>
        <h1 className="font-heading text-4xl font-bold">{info.label}</h1>
        <p className="mt-1 text-lg text-muted-foreground">{info.blurb}</p>
      </div>
      <div className="w-full">
        <div className="h-4 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${Math.max(4, pct)}%` }} />
        </div>
        <p className="mt-2 font-heading text-lg font-bold">
          {xp} / {target} XP
        </p>
      </div>
      <Link to="/dashboard" className="btn-game btn-primary w-full">
        Earn XP on Home
      </Link>
    </div>
  );
}
