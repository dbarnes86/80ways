import { useRef, useState } from 'react';
import { cn } from '@/components/ui';
import { haptic } from '@/lib/native';
import { Ship } from './art';
import { centreOf, puff } from './fx';
import { play } from './sfx';

interface VoyageSceneProps {
  from: string;
  to: string;
  /** 0..1 along this leg. */
  progress: number;
  /** Big line over the scene, e.g. "Day 12 of 80". */
  headline: string;
  sub?: string;
  docked?: boolean;
  className?: string;
}

/** A little moving picture of the voyage: the ship bobs along the leg as energy is spent on it. */
export function VoyageScene({ from, to, progress, headline, sub, docked = false, className }: VoyageSceneProps) {
  const p = Math.min(1, Math.max(0, progress));
  const shipRef = useRef<HTMLButtonElement>(null);
  const [tooting, setTooting] = useState(false);
  const toot = () => {
    play('whistle');
    haptic('tap');
    if (shipRef.current) {
      const c = centreOf(shipRef.current);
      puff({ x: c.x - 6, y: c.y - 44 });
    }
    setTooting(true);
    setTimeout(() => setTooting(false), 400);
  };
  return (
    <div className={cn('relative overflow-hidden rounded-3xl border border-accent/40 bg-gradient-to-b from-[#162243] via-[#101a33] to-[#0E1526]', className)}>
      {/* stars */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            'radial-gradient(1px 1px at 20% 20%, #fff, transparent), radial-gradient(1px 1px at 70% 15%, #fff, transparent), radial-gradient(1.5px 1.5px at 45% 35%, #F2EAD8, transparent), radial-gradient(1px 1px at 85% 40%, #fff, transparent), radial-gradient(1px 1px at 10% 45%, #D9A441, transparent)',
        }}
        aria-hidden
      />
      <div className="relative px-5 pt-5">
        <p className="kicker text-accent">{sub}</p>
        <p className="font-heading text-3xl font-bold">{headline}</p>
      </div>

      <div className="relative mt-2 h-28 [@media(min-height:740px)]:h-36">
        {/* the route */}
        <div className="absolute inset-x-6 bottom-12 h-1 rounded-full bg-muted/60" />
        <div
          className="absolute bottom-12 left-6 h-1 rounded-full bg-gradient-to-r from-primary to-accent shadow-[0_0_10px_hsl(var(--primary))]"
          style={{ width: `calc((100% - 3rem) * ${p})`, transition: 'width 1.2s cubic-bezier(.2,.8,.2,1)' }}
        />
        <span className="absolute bottom-[2.6rem] left-5 size-3 rounded-full bg-primary ring-4 ring-primary/30" />
        <span className={cn('absolute bottom-[2.6rem] right-5 size-3 rounded-full ring-4', p >= 1 ? 'bg-accent ring-accent/30' : 'bg-muted ring-muted/40')} />

        {/* the ship */}
        <div
          className="absolute bottom-[3.1rem]"
          style={{ left: `clamp(3rem, calc(1.5rem + (100% - 3rem) * ${p}), calc(100% - 3rem))`, transform: 'translateX(-50%)', transition: 'left 1.2s cubic-bezier(.2,.8,.2,1)' }}
        >
          {/* Tap the ship and it toots. No reason, which is the point. */}
          <button
            type="button"
            ref={shipRef}
            onClick={toot}
            className={cn('block', tooting && 'animate-bump')}
            aria-label="The ship"
          >
            <Ship size={128} className={docked ? '' : 'animate-sail'} />
          </button>
        </div>

        {/* waves */}
        <svg className="absolute inset-x-0 bottom-0 h-10 w-[200%] animate-[wave_6s_linear_infinite]" viewBox="0 0 800 40" preserveAspectRatio="none" aria-hidden>
          <path d="M0 20 Q50 8 100 20 T200 20 T300 20 T400 20 T500 20 T600 20 T700 20 T800 20 V40 H0 Z" fill="hsl(186 90% 60% / 0.10)" />
          <path d="M0 26 Q50 16 100 26 T200 26 T300 26 T400 26 T500 26 T600 26 T700 26 T800 26" fill="none" stroke="hsl(186 90% 60% / 0.4)" strokeWidth="1.5" />
        </svg>

        <div className="absolute inset-x-4 bottom-1 flex justify-between font-heading text-sm font-bold">
          <span>{from}</span>
          <span className={p >= 1 ? 'text-accent' : 'text-muted-foreground'}>{to}</span>
        </div>
      </div>
    </div>
  );
}
