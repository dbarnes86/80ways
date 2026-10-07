import { useEffect, useMemo, useState } from 'react';
import { BOOSTERS } from '@/data/gameConstants';
import { haptic } from '@/lib/native';
import { cn } from '@/components/ui';
import { Chest, Coin, Ship, Stamp } from './art';
import { play } from './sfx';
import { useRewardStore, type RewardMoment } from './rewards';

/** Confetti burst from the centre. Pure CSS, a few dozen spans. */
function Confetti({ count = 36, colors = ['#00e5ff', '#ff00ff', '#ffd24a', '#9be22d'] }: { count?: number; colors?: string[] }) {
  const bits = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
        const dist = 140 + Math.random() * 180;
        return {
          color: colors[i % colors.length],
          dx: `${Math.cos(angle) * dist}px`,
          dy: `${Math.sin(angle) * dist + 160}px`,
          rot: `${Math.random() * 720 - 360}deg`,
          delay: `${Math.random() * 0.15}s`,
          w: 6 + Math.random() * 6,
        };
      }),
    [count, colors],
  );
  return (
    <div className="pointer-events-none absolute left-1/2 top-[42%]" aria-hidden>
      {bits.map((b, i) => (
        <span
          key={i}
          className="absolute block rounded-sm"
          style={{
            width: b.w,
            height: b.w * 0.45,
            background: b.color,
            ['--dx' as string]: b.dx,
            ['--dy' as string]: b.dy,
            ['--rot' as string]: b.rot,
            opacity: 0,
            animation: `confetti 1.4s cubic-bezier(.15,.7,.3,1) ${b.delay} both`,
          }}
        />
      ))}
    </div>
  );
}

function Rays({ color }: { color: string }) {
  return (
    <div
      className="pointer-events-none absolute left-1/2 top-[38%] size-[640px] -translate-x-1/2 -translate-y-1/2 animate-rays opacity-40"
      style={{ background: `repeating-conic-gradient(${color} 0 8deg, transparent 8deg 24deg)`, maskImage: 'radial-gradient(circle, black 0%, transparent 65%)' }}
      aria-hidden
    />
  );
}

function RewardChips({ xp, credits }: { xp?: number; credits?: number }) {
  return (
    <div className="flex justify-center gap-3">
      {!!xp && (
        <span className="animate-pop rounded-full border border-primary/50 bg-primary/15 px-4 py-2 font-heading text-xl font-bold text-primary" style={{ animationDelay: '0.35s' }}>
          +{xp} XP
        </span>
      )}
      {!!credits && (
        <span className="flex animate-pop items-center gap-2 rounded-full border border-warning/50 bg-warning/15 px-4 py-2 font-heading text-xl font-bold text-warning" style={{ animationDelay: '0.5s' }}>
          <Coin size={22} /> +{credits}
        </span>
      )}
    </div>
  );
}

function ChestMoment({ m, onDone }: { m: Extract<RewardMoment, { kind: 'chest' }>; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const openIt = () => {
    if (open) return onDone();
    setOpen(true);
    play('chest');
    haptic('heavy');
  };
  return (
    <button type="button" onClick={openIt} className="relative flex w-full flex-col items-center gap-6 text-center">
      {open && <Confetti colors={['#ffd24a', '#ffe08a', '#ff00ff', '#00e5ff']} />}
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-warning">{m.title}</p>
      <div className={cn('transition-transform', open ? 'scale-110' : 'animate-wobble')}>
        <Chest size={180} open={open} tier={m.tier} />
      </div>
      {open ? (
        <div className="space-y-4">
          <RewardChips xp={m.xp} credits={m.credits} />
          {m.booster && (
            <p className="animate-pop font-heading text-lg font-bold text-secondary" style={{ animationDelay: '0.65s' }}>
              + {BOOSTERS[m.booster].name}
            </p>
          )}
          <p className="animate-pop text-sm text-muted-foreground" style={{ animationDelay: '0.8s' }}>
            {m.booster ? 'Use it when you collect your next workout.' : 'Coins buy boosters in the Store.'}
          </p>
        </div>
      ) : (
        <p className="animate-pulse-soft font-heading text-2xl font-bold">Tap to open</p>
      )}
    </button>
  );
}

function Moment({ m, onDone }: { m: RewardMoment; onDone: () => void }) {
  switch (m.kind) {
    case 'levelUp':
      return (
        <div className="relative flex flex-col items-center gap-4 text-center">
          <Confetti />
          <p className="animate-pop font-mono text-xs uppercase tracking-[0.3em] text-primary">Level up</p>
          <div className="animate-pop font-heading text-[120px] font-bold leading-none text-glow-cyan" style={{ animationDelay: '0.1s' }}>
            {m.level}
          </div>
          <p className="animate-pop font-heading text-3xl font-bold" style={{ animationDelay: '0.2s' }}>{m.name}</p>
          {m.unlock && (
            <p className="animate-pop rounded-full border border-secondary/50 bg-secondary/10 px-4 py-2 text-sm text-secondary" style={{ animationDelay: '0.4s' }}>
              Unlocked: {m.unlock}
            </p>
          )}
        </div>
      );
    case 'liftOff':
      return (
        <div className="relative flex flex-col items-center gap-5 text-center">
          <Confetti />
          <div className="animate-pop">
            <Ship size={220} className="animate-sail" />
          </div>
          <p className="animate-pop font-heading text-4xl font-bold text-glow-cyan" style={{ animationDelay: '0.15s' }}>Lift Off!</p>
          <p className="animate-pop text-lg text-muted-foreground" style={{ animationDelay: '0.3s' }}>Fogg has a place for you on the expedition.</p>
        </div>
      );
    case 'stamp':
      return (
        <div className="relative flex flex-col items-center gap-5 text-center">
          <p className="animate-pop font-mono text-xs uppercase tracking-[0.3em] text-secondary">Passport stamped</p>
          <div className="animate-stamp">
            <Stamp city={m.city} size={200} />
          </div>
          <p className="animate-pop font-heading text-3xl font-bold" style={{ animationDelay: '0.45s' }}>Welcome to {m.city}</p>
          <RewardChips credits={m.credits} />
        </div>
      );
    case 'journey':
      return (
        <div className="relative flex flex-col items-center gap-5 text-center">
          <Confetti count={60} />
          <p className="animate-pop font-heading text-5xl font-bold text-glow-magenta">Wager won!</p>
          <p className="animate-pop text-lg text-muted-foreground" style={{ animationDelay: '0.2s' }}>Around the world. Fogg collects his £20,000.</p>
        </div>
      );
    case 'quest':
      return (
        <div className="relative flex flex-col items-center gap-5 text-center">
          <Confetti count={24} />
          <p className="animate-pop font-mono text-xs uppercase tracking-[0.3em] text-success">Quest complete</p>
          <div className="animate-stamp rounded-xl border-4 border-success px-6 py-3 font-heading text-4xl font-bold text-success">DONE</div>
          <p className="animate-pop font-heading text-2xl font-bold" style={{ animationDelay: '0.3s' }}>{m.title}</p>
          <RewardChips xp={m.xp} credits={m.credits} />
        </div>
      );
    case 'chest':
      return <ChestMoment m={m} onDone={onDone} />;
  }
}

const SOUND: Record<RewardMoment['kind'], Parameters<typeof play>[0] | null> = {
  levelUp: 'levelUp',
  liftOff: 'levelUp',
  stamp: 'stamp',
  journey: 'levelUp',
  quest: 'chime',
  chest: 'whoosh',
};

const RAY_COLOR: Record<RewardMoment['kind'], string> = {
  levelUp: 'hsl(187 100% 50% / 0.35)',
  liftOff: 'hsl(187 100% 50% / 0.35)',
  stamp: 'hsl(300 100% 50% / 0.3)',
  journey: 'hsl(300 100% 50% / 0.35)',
  quest: 'hsl(84 81% 44% / 0.3)',
  chest: 'hsl(42 100% 60% / 0.3)',
};

/** Shows queued reward moments one at a time, plus the floating "+XP" numbers. Mounted once. */
export function RewardLayer() {
  const { queue, next, floaters } = useRewardStore();
  const current = queue[0];
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!current) return;
    setReady(false);
    const sound = SOUND[current.kind];
    if (sound) play(sound);
    haptic(current.kind === 'chest' ? 'tap' : 'success');
    // A beat before it can be dismissed, so a stray tap doesn't skip the moment.
    const t = setTimeout(() => setReady(true), 700);
    return () => clearTimeout(t);
  }, [current]);

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+4.5rem)] z-[95] flex flex-col items-center gap-1" aria-live="polite">
        {floaters.map((f) => (
          <span
            key={f.id}
            className={cn(
              'flex animate-rise items-center gap-1.5 rounded-full px-3 py-1 font-heading text-lg font-bold backdrop-blur-sm',
              f.tone === 'xp' && 'bg-primary/20 text-primary',
              f.tone === 'credits' && 'bg-warning/20 text-warning',
              f.tone === 'energy' && 'bg-success/20 text-success',
              f.tone === 'streak' && 'bg-secondary/20 text-secondary',
            )}
          >
            {f.tone === 'credits' && <Coin size={18} />}
            {f.text}
          </span>
        ))}
      </div>

      {current && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[96] flex animate-fade-in items-center justify-center overflow-hidden bg-background/90 px-6 backdrop-blur-md"
          onClick={() => current.kind !== 'chest' && ready && next()}
        >
          <Rays color={RAY_COLOR[current.kind]} />
          <div className="relative w-full max-w-sm" key={queue.length + current.kind}>
            <Moment m={current} onDone={next} />
          </div>
          {current.kind !== 'chest' && (
            <p className={cn('absolute bottom-[max(2.5rem,env(safe-area-inset-bottom))] text-sm text-muted-foreground transition-opacity', ready ? 'opacity-100' : 'opacity-0')}>
              Tap to continue
            </p>
          )}
        </div>
      )}
    </>
  );
}
