import { useEffect, useMemo, useRef, useState } from 'react';
import { BOOSTERS } from '@/data/gameConstants';
import { haptic } from '@/lib/native';
import { cn } from '@/components/ui';
import { Chest, Coin, Ship, Stamp } from './art';
import { burstCoins, centreOf } from './fx';
import { play } from './sfx';
import { celebrate, flyTokens, useRewardStore, type RewardMoment } from './rewards';
import { unlockLevel, useUnlocked } from './unlocks';

/** The palette's confetti: brass, paper, a little Volt and verdigris. */
const CONFETTI = ['#D9A441', '#F2EAD8', '#3DE1F5', '#4FB58A'];

/** Confetti burst from the centre. Pure CSS, a few dozen spans. */
function Confetti({ count = 36, colors = CONFETTI }: { count?: number; colors?: string[] }) {
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

function RewardChips({ xp, credits, delay = 0.35 }: { xp?: number; credits?: number; delay?: number }) {
  return (
    <div className="flex justify-center gap-3">
      {!!xp && (
        <span className="animate-pop rounded-full border border-foreground/40 bg-foreground/10 px-4 py-2 font-heading text-xl font-bold text-foreground" style={{ animationDelay: `${delay}s` }}>
          +{xp} XP
        </span>
      )}
      {!!credits && (
        <span className="flex animate-pop items-center gap-2 rounded-full border border-warning/50 bg-warning/15 px-4 py-2 font-heading text-xl font-bold text-warning" style={{ animationDelay: `${delay + 0.15}s` }}>
          <Coin size={22} /> +{credits}
        </span>
      )}
    </div>
  );
}

/** The trunk: a wobble, then on the tap the lid goes, coins spill, and the contents stagger in. */
function ChestMoment({ m, onDone }: { m: Extract<RewardMoment, { kind: 'chest' }>; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const storeOpen = useUnlocked('store');
  const chestRef = useRef<HTMLDivElement>(null);
  const openIt = () => {
    if (open) return onDone();
    setOpen(true);
    play('chest');
    haptic('heavy');
    if (chestRef.current) {
      const c = centreOf(chestRef.current);
      burstCoins({ x: c.x, y: c.y - 20 }, m.tier === 'gold' ? 22 : m.tier === 'silver' ? 16 : 12);
    }
    setTimeout(() => play('spill'), 220);
  };
  return (
    <button type="button" onClick={openIt} className="relative flex w-full flex-col items-center gap-6 text-center">
      {open && <Confetti count={28} colors={['#D9A441', '#efc66e', '#F2EAD8']} />}
      <p className="kicker text-warning">{m.title}</p>
      <div ref={chestRef} className={cn(open ? 'animate-lid' : 'animate-wobble')}>
        <Chest size={190} open={open} tier={m.tier} />
      </div>
      {open ? (
        <div className="space-y-4">
          <RewardChips xp={m.xp} credits={m.credits} delay={0.45} />
          {m.booster && (
            <p className="animate-pop font-heading text-lg font-bold text-accent" style={{ animationDelay: '0.75s' }}>
              + {BOOSTERS[m.booster].name}
            </p>
          )}
          <p className="animate-pop text-base text-muted-foreground" style={{ animationDelay: '0.9s' }}>
            {m.booster ? 'Use it when you collect your next workout.' : storeOpen ? 'Coins buy boosters in the Store.' : `Save them: the Store opens at level ${unlockLevel('store')}.`}
          </p>
          <span className="btn-game btn-gold w-full animate-pop" style={{ animationDelay: '1s' }}>
            Collect
          </span>
        </div>
      ) : (
        <span className="btn-game btn-gold w-full animate-pulse-soft">Open it</span>
      )}
    </button>
  );
}

/** The level number flips in like a departure board, one digit at a time. */
function FlipNumber({ value }: { value: number }) {
  const digits = String(value).split('');
  useEffect(() => {
    digits.forEach((_, i) => setTimeout(() => play('flip'), 120 + i * 140));
  }, [value]);
  return (
    <div className="flex justify-center gap-1" aria-label={`Level ${value}`}>
      {digits.map((d, i) => (
        <span
          key={i}
          className="animate-flip-in inline-block rounded-xl border-2 border-accent/40 bg-card px-3 font-heading text-[112px] font-bold leading-none text-foreground shadow-[inset_0_-2px_0_rgb(0_0_0/0.5),0_10px_30px_-14px_rgb(0_0_0/0.9)]"
          style={{ animationDelay: `${0.1 + i * 0.14}s` }}
        >
          {d}
        </span>
      ))}
    </div>
  );
}

function Moment({ m, onDone }: { m: RewardMoment; onDone: () => void }) {
  switch (m.kind) {
    case 'levelUp':
      return (
        <div className="relative flex flex-col items-center gap-4 text-center">
          <Confetti />
          <p className="animate-pop kicker text-accent">Level up</p>
          <FlipNumber value={m.level} />
          <p className="animate-pop font-heading text-3xl font-bold" style={{ animationDelay: '0.45s' }}>{m.name}</p>
          {m.unlocks.length > 0 && (
            <div className="w-full space-y-2 pt-2">
              <p className="animate-pop kicker text-accent" style={{ animationDelay: '0.6s' }}>
                Unlocked
              </p>
              {m.unlocks.map((u, i) => (
                <div
                  key={u.label}
                  className="animate-pop rounded-2xl border-2 border-accent/60 bg-accent/15 px-4 py-3 text-left"
                  style={{ animationDelay: `${0.7 + i * 0.15}s` }}
                >
                  <p className="font-heading text-xl font-bold text-accent">{u.label}</p>
                  <p className="text-sm text-muted-foreground">{u.blurb}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    case 'liftOff':
      return (
        <div className="relative flex flex-col items-center gap-5 text-center">
          <Confetti />
          <div className="animate-sail-in">
            <Ship size={240} className="animate-sail" />
          </div>
          <p className="animate-pop font-heading text-5xl font-bold" style={{ animationDelay: '0.6s' }}>Lift Off</p>
          <p className="animate-pop text-lg text-muted-foreground" style={{ animationDelay: '0.75s' }}>The boiler's lit. Fogg has a place for you on the expedition.</p>
        </div>
      );
    case 'stamp':
      return (
        <div className="relative flex flex-col items-center gap-5 text-center">
          <p className="animate-pop kicker text-accent">Passport stamped</p>
          {/* The passport page: cream card, the stamp slams onto it and the ink spreads. */}
          <div className="relative -rotate-2 rounded-2xl bg-[#F2EAD8] px-10 py-8 shadow-[0_20px_50px_-20px_rgb(0_0_0/0.9)]">
            <div className="absolute inset-x-5 top-5 h-px bg-[#0E1526]/15" />
            <div className="absolute inset-x-5 bottom-5 h-px bg-[#0E1526]/15" />
            <span aria-hidden className="animate-ink absolute left-1/2 top-1/2 size-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/40" style={{ animationDelay: '0.3s' }} />
            <div className="animate-stamp relative" style={{ animationDelay: '0.25s' }}>
              <Stamp city={m.city} size={200} />
            </div>
          </div>
          <p className="animate-pop font-heading text-3xl font-bold" style={{ animationDelay: '0.8s' }}>Welcome to {m.city}</p>
          <RewardChips credits={m.credits} delay={0.95} />
        </div>
      );
    case 'journey':
      return (
        <div className="relative flex flex-col items-center gap-5 text-center">
          <Confetti count={60} />
          <div className="animate-stamp rounded-xl border-4 border-accent px-6 py-3 text-accent">
            <p className="font-heading text-5xl font-bold">£20,000</p>
          </div>
          <p className="animate-pop font-heading text-4xl font-bold" style={{ animationDelay: '0.4s' }}>Wager won</p>
          <p className="animate-pop text-lg text-muted-foreground" style={{ animationDelay: '0.55s' }}>Around the world. Fogg collects, and so do you.</p>
        </div>
      );
    case 'quest':
      return (
        <div className="relative flex flex-col items-center gap-5 text-center">
          <Confetti count={24} />
          <p className="animate-pop kicker text-success">Quest complete</p>
          <div className="animate-stamp rounded-xl border-4 border-success px-6 py-3 font-heading text-4xl font-bold tracking-[0.15em] text-success">DONE</div>
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
  liftOff: 'whistle',
  stamp: 'stamp',
  journey: 'levelUp',
  quest: 'stamp',
  chest: 'whoosh',
};

const HAPTIC: Record<RewardMoment['kind'], Parameters<typeof haptic>[0]> = {
  levelUp: 'success',
  liftOff: 'success',
  stamp: 'heavy',
  journey: 'success',
  quest: 'heavy',
  chest: 'tap',
};

const RAY_COLOR: Record<RewardMoment['kind'], string> = {
  // Brass sunbursts, like a poster; Volt only for Lift Off, the moment the engine starts.
  levelUp: 'hsl(39 66% 55% / 0.3)',
  liftOff: 'hsl(186 90% 60% / 0.3)',
  stamp: 'hsl(39 66% 55% / 0.3)',
  journey: 'hsl(39 66% 55% / 0.35)',
  quest: 'hsl(154 40% 51% / 0.25)',
  chest: 'hsl(39 66% 55% / 0.35)',
};

// The demo build exposes the bus so screenshots can trigger any moment.
if (import.meta.env.MODE === 'demo') (window as unknown as { __celebrate?: typeof celebrate }).__celebrate = celebrate;

/** Shows queued reward moments one at a time, plus the floating "+XP" numbers. Mounted once. */
export function RewardLayer() {
  const { queue, next: advance, floaters } = useRewardStore();
  const current = queue[0];
  // Dismissing a moment sends its coins and XP flying into the HUD.
  const next = () => {
    if (current && 'credits' in current && current.credits) void flyTokens('credits', current.credits, undefined, true);
    if (current && 'xp' in current && current.xp) void flyTokens('xp', current.xp, undefined, true);
    advance();
  };
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!current) return;
    setReady(false);
    const sound = SOUND[current.kind];
    // The stamp's sound lands with the stamp, not the fade-in.
    const delay = current.kind === 'stamp' ? 300 : 0;
    const s = setTimeout(() => {
      if (sound) play(sound);
      haptic(HAPTIC[current.kind]);
    }, delay);
    // A beat before it can be dismissed, so a stray tap doesn't skip the moment.
    const t = setTimeout(() => setReady(true), 900);
    return () => {
      clearTimeout(s);
      clearTimeout(t);
    };
  }, [current]);

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+4.5rem)] z-[95] flex flex-col items-center gap-1" aria-live="polite">
        {floaters.map((f) => (
          <span
            key={f.id}
            className={cn(
              'flex animate-rise items-center gap-1.5 rounded-full px-3 py-1 font-heading text-lg font-bold backdrop-blur-sm',
              f.tone === 'xp' && 'bg-foreground/15 text-foreground',
              f.tone === 'credits' && 'bg-warning/20 text-warning',
              f.tone === 'energy' && 'bg-primary/20 text-primary',
              f.tone === 'streak' && 'bg-accent/20 text-accent',
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
            <div className={cn('absolute inset-x-6 bottom-[max(2rem,env(safe-area-inset-bottom))] mx-auto max-w-sm transition-all duration-300', ready ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0')}>
              <button type="button" className={cn('btn-game w-full', 'credits' in current && current.credits ? 'btn-gold' : 'btn-primary')}>
                {'credits' in current && current.credits ? 'Collect' : current.kind === 'levelUp' ? 'Let’s go' : 'Continue'}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
