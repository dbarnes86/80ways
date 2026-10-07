import { cn } from '@/components/ui';
import { Ship } from './art';

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
  return (
    <div className={cn('relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-b from-[#071631] via-[#0a0f2a] to-[#05050b]', className)}>
      {/* stars */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            'radial-gradient(1px 1px at 20% 20%, #fff, transparent), radial-gradient(1px 1px at 70% 15%, #fff, transparent), radial-gradient(1.5px 1.5px at 45% 35%, #9ff, transparent), radial-gradient(1px 1px at 85% 40%, #fff, transparent), radial-gradient(1px 1px at 10% 45%, #fcf, transparent)',
        }}
        aria-hidden
      />
      <div className="relative px-5 pt-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary/80">{sub}</p>
        <p className="font-heading text-3xl font-bold text-glow-cyan">{headline}</p>
      </div>

      <div className="relative mt-2 h-36">
        {/* the route */}
        <div className="absolute inset-x-6 bottom-12 h-1 rounded-full bg-muted/60" />
        <div
          className="absolute bottom-12 left-6 h-1 rounded-full bg-gradient-to-r from-primary to-secondary shadow-[0_0_10px_hsl(var(--primary))]"
          style={{ width: `calc((100% - 3rem) * ${p})`, transition: 'width 1.2s cubic-bezier(.2,.8,.2,1)' }}
        />
        <span className="absolute bottom-[2.6rem] left-5 size-3 rounded-full bg-primary ring-4 ring-primary/30" />
        <span className={cn('absolute bottom-[2.6rem] right-5 size-3 rounded-full ring-4', p >= 1 ? 'bg-secondary ring-secondary/30' : 'bg-muted ring-muted/40')} />

        {/* the ship */}
        <div
          className="absolute bottom-[3.1rem]"
          style={{ left: `calc(1.5rem + (100% - 3rem) * ${p})`, transform: 'translateX(-50%)', transition: 'left 1.2s cubic-bezier(.2,.8,.2,1)' }}
        >
          <Ship size={92} className={docked ? '' : 'animate-sail'} />
        </div>

        {/* waves */}
        <svg className="absolute inset-x-0 bottom-0 h-10 w-[200%] animate-[wave_6s_linear_infinite]" viewBox="0 0 800 40" preserveAspectRatio="none" aria-hidden>
          <path d="M0 20 Q50 8 100 20 T200 20 T300 20 T400 20 T500 20 T600 20 T700 20 T800 20 V40 H0 Z" fill="hsl(187 100% 50% / 0.12)" />
          <path d="M0 26 Q50 16 100 26 T200 26 T300 26 T400 26 T500 26 T600 26 T700 26 T800 26" fill="none" stroke="hsl(187 100% 50% / 0.5)" strokeWidth="1.5" />
        </svg>

        <div className="absolute inset-x-4 bottom-1 flex justify-between font-heading text-sm font-bold">
          <span>{from}</span>
          <span className={p >= 1 ? 'text-secondary' : 'text-muted-foreground'}>{to}</span>
        </div>
      </div>
    </div>
  );
}
