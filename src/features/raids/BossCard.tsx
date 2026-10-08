import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Crown, Swords, Users } from 'lucide-react';
import { Button, cn, HoloCard } from '@/components/ui';
import { ENERGY_THEME } from '@/data/energyTheme';
import { bossPhase, formatTimeLeft, type ScheduledRaid } from '@/data/raids';
import type { RaidTotals } from '@/stores/raidStore';
import fixPortrait from '@/assets/fix-portrait.jpg';
import { artSrc, hasArt } from '@/game/art';

export interface Hit {
  id: number;
  amount: number;
  critical: boolean;
}

const PHASE_LABEL = ['CONFIDENT', 'RATTLED', 'DESPERATE', 'DEFEATED'] as const;
const PHASE_RING = [
  'ring-secondary/60 shadow-[0_0_30px_hsl(var(--secondary)/0.45)]',
  'ring-warning/70 shadow-[0_0_34px_hsl(var(--warning)/0.5)]',
  'ring-destructive/80 shadow-[0_0_40px_hsl(var(--destructive)/0.6)]',
  'ring-success/70 shadow-[0_0_30px_hsl(var(--success)/0.45)]',
];

/**
 * Detective Fix as a raid boss. His health is the raid goal, drained by every player's
 * contributions. Phases change his mood and line; your own hits land as floating damage.
 */
export function BossCard({
  raid,
  totals,
  canStrike,
  isMember,
  available,
  hits,
  onStrike,
}: {
  raid: ScheduledRaid;
  totals: RaidTotals | undefined;
  canStrike: boolean;
  isMember: boolean;
  available: boolean;
  hits: Hit[];
  onStrike: () => void;
}) {
  const total = totals?.total ?? 0;
  const hpLeft = Math.max(0, raid.goalKwh - total);
  const hpPct = (hpLeft / raid.goalKwh) * 100;
  const phase = bossPhase(total, raid.goalKwh);
  const defeated = phase === 3;
  const fuel = ENERGY_THEME[raid.type];

  // Shake whenever health drops: your hit, or someone else's arriving in a refresh.
  const [shaking, setShaking] = useState(false);
  const lastTotal = useRef(total);
  useEffect(() => {
    if (total > lastTotal.current) {
      setShaking(true);
      const t = setTimeout(() => setShaking(false), 450);
      lastTotal.current = total;
      return () => clearTimeout(t);
    }
    lastTotal.current = total;
  }, [total]);

  return (
    <HoloCard glow={defeated ? 'cyan' : 'magenta'} className="mb-8 border-2 border-destructive/30 p-5 md:p-8">
      <div className="mb-5 flex items-center justify-between gap-3">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest',
            defeated ? 'border-success/40 bg-success/15 text-success' : 'animate-pulse-soft border-destructive/40 bg-destructive/15 text-destructive',
          )}
        >
          <Swords className="size-3" /> {defeated ? 'Raid won' : 'Raid boss'}
        </span>
        <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
          <Clock className="size-3.5" /> {formatTimeLeft(raid.end)} left
        </span>
      </div>

      <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
        {/* Portrait */}
        <div className={cn('relative shrink-0', shaking && 'animate-shake')}>
          <div
            className={cn(
              'relative size-36 overflow-hidden rounded-full ring-4 transition-all duration-500 md:size-44',
              PHASE_RING[phase],
              phase === 2 && 'animate-glitch',
            )}
          >
            <img
              src={artSrc('fix', fixPortrait)}
              alt="Detective Fix"
              className={cn('size-full', hasArt('fix') ? 'scale-110 object-contain pt-2' : 'object-cover', 'transition-all duration-700', defeated && 'grayscale', phase === 2 && 'saturate-150 hue-rotate-[-15deg]')}
            />
            {shaking && <div className="animate-flash pointer-events-none absolute inset-0 bg-white mix-blend-overlay" />}
            {defeated && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/40">
                <span className="animate-stamp rounded border-4 border-success px-2 py-0.5 font-heading text-2xl font-bold tracking-widest text-success">
                  DEFEATED
                </span>
              </div>
            )}
          </div>
          {/* Floating damage */}
          <div className="pointer-events-none absolute inset-x-0 top-6 flex justify-center">
            {hits.map((h) => (
              <span
                key={h.id}
                className={cn(
                  'animate-damage absolute font-heading font-bold drop-shadow-[0_2px_6px_rgb(0_0_0/0.9)]',
                  h.critical ? 'text-3xl text-warning' : 'text-2xl text-foreground',
                )}
              >
                {h.critical && <span className="block text-center text-[10px] tracking-[0.3em] text-warning">CRITICAL</span>}-{h.amount.toFixed(1)}
              </span>
            ))}
          </div>
        </div>

        {/* Status */}
        <div className="w-full min-w-0 flex-1">
          <p className="font-mono text-[10px] tracking-widest text-muted-foreground">DETECTIVE FIX · {PHASE_LABEL[phase]}</p>
          <h2 className="mb-2 text-2xl font-heading font-bold text-glow-magenta md:text-3xl">{raid.name}</h2>
          <blockquote className="mb-4 border-l-2 border-secondary/50 pl-3 text-sm italic text-foreground/85">"{raid.taunts[phase]}"</blockquote>

          {/* Health bar */}
          <div className="mb-1 flex justify-between font-mono text-xs">
            <span className={defeated ? 'text-success' : 'text-destructive'}>HP {hpLeft.toFixed(1)} / {raid.goalKwh}</span>
            <span className="text-muted-foreground">{Math.round(hpPct)}%</span>
          </div>
          <div className="relative h-4 overflow-hidden rounded-sm border border-destructive/40 bg-muted/40" role="progressbar" aria-label="Boss health" aria-valuenow={Math.round(hpPct)} aria-valuemin={0} aria-valuemax={100}>
            <div
              className={cn(
                'h-full transition-[width] duration-700 ease-out',
                phase === 0 ? 'bg-secondary' : phase === 1 ? 'bg-warning' : 'bg-destructive',
              )}
              style={{ width: `${hpPct}%` }}
            />
            {/* Phase marks */}
            <span className="absolute inset-y-0 left-1/3 w-px bg-background/80" />
            <span className="absolute inset-y-0 left-2/3 w-px bg-background/80" />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-md border border-border bg-muted/20 p-2">
              <Users className="mx-auto mb-0.5 size-4 text-secondary" />
              <p className="font-mono text-sm">{totals?.participants ?? 0}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Crew</p>
            </div>
            <div className="rounded-md border border-border bg-muted/20 p-2">
              <fuel.icon className={cn('mx-auto mb-0.5 size-4', fuel.text)} />
              <p className={cn('truncate font-mono text-xs leading-5', fuel.text)}>{fuel.label}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Weakness</p>
            </div>
            <div className="rounded-md border border-border bg-muted/20 p-2">
              <Swords className="mx-auto mb-0.5 size-4 text-primary" />
              <p className="font-mono text-sm">{(totals?.yourContribution ?? 0).toFixed(1)}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Your damage</p>
            </div>
          </div>

          <div className="mt-5">
            {defeated ? (
              <p className="text-sm text-success">Fix is beaten. Everyone who struck a blow collects the reward when the raid closes.</p>
            ) : !isMember ? (
              <Link to="/membership" className="flex h-12 items-center justify-center gap-2 rounded-md bg-secondary px-6 font-medium text-secondary-foreground hover:bg-secondary/90">
                <Crown className="size-4" /> Get the Season Pass to join the raid
              </Link>
            ) : (
              <Button onClick={onStrike} disabled={!available || !canStrike} className="glow-magenta h-12 w-full bg-secondary text-base text-secondary-foreground hover:bg-secondary/90 md:w-auto md:px-10">
                <Swords /> {canStrike ? 'Strike' : 'Charge up to strike'}
              </Button>
            )}
          </div>
        </div>
      </div>
      <p className="mt-6 text-sm text-muted-foreground">{raid.narrative}</p>
    </HoloCard>
  );
}
