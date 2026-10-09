/**
 * Game art as inline SVG: neon line work on dark, so it matches the UI at any size and ships no
 * images. Swap any of these for generated art later without touching the callers.
 */
import type { SVGProps } from 'react';
import type { EnergyType } from '@/data/gameConstants';
import manifest from './artManifest.json';
import { Bike, Dumbbell, PersonStanding, Waves } from 'lucide-react';
import type { Discipline } from '@/stores/userStore';
import { cn } from '@/components/ui';

type ArtProps = SVGProps<SVGSVGElement> & { size?: number };

/** Generated art (scripts/art/generate.mjs) wins over the hand-drawn SVG when it exists. */
const GENERATED = new Set<string>(manifest as string[]);
export const hasArt = (name: string) => GENERATED.has(name);
/** The generated image's URL, or the fallback when there isn't one. */
export const artSrc = (name: string, fallback: string) => (hasArt(name) ? `/art/${name}.webp` : fallback);

/** A generated image, background already cut away (scripts/art/optimize.mjs). */
export function ArtImage({ name, size, width, height, className, style }: { name: string; size?: number; width?: number; height?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <img
      src={`/art/${name}.webp`}
      alt=""
      aria-hidden
      draggable={false}
      width={width ?? size}
      height={height ?? size}
      className={className}
      style={{ width: width ?? size, height: height ?? size, objectFit: 'contain', ...style }}
    />
  );
}

const glow = (color: string) => ({ filter: `drop-shadow(0 0 6px ${color})` });

export function Coin({ size = 20, ...props }: ArtProps) {
  if (hasArt('coin')) return <ArtImage name="coin" size={size} className={props.className} />;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden {...props}>
      <circle cx="12" cy="12" r="10" fill="#f5b83d" stroke="#ffe08a" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="6.5" fill="none" stroke="#b9791b" strokeWidth="1.5" />
      <path d="M12 8.5v7M10 10.5h3a1.5 1.5 0 0 1 0 3h-2" stroke="#7a4b0c" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </svg>
  );
}

// The style guide's colours, matching ENERGY_THEME: Volt, Verdigris, Brass, Plum.
const ORB: Record<EnergyType, [string, string]> = {
  nautical: ['#3DE1F5', '#C2F6FC'],
  terrestrial: ['#4FB58A', '#C4EBD9'],
  transport: ['#D9A441', '#F2DDB0'],
  strength: ['#9A6CC4', '#DCC8EE'],
};

export const orbColor = (type: EnergyType) => ORB[type][0];

export function Orb({ type, size = 18, ...props }: ArtProps & { type: EnergyType }) {
  if (hasArt(`orb-${type}`)) return <ArtImage name={`orb-${type}`} size={size} className={props.className} />;
  const [c, hi] = ORB[type];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden style={glow(c)} {...props}>
      <defs>
        <radialGradient id={`orb-${type}`} cx="35%" cy="35%" r="70%">
          <stop offset="0%" stopColor={hi} />
          <stop offset="60%" stopColor={c} />
          <stop offset="100%" stopColor={c} stopOpacity="0.6" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="9" fill={`url(#orb-${type})`} />
      <path d="M13 5l-5 8h4l-1 6 5-8h-4z" fill="#05050b" opacity="0.55" />
    </svg>
  );
}

export function Chest({ size = 96, open = false, tier = 'bronze', ...props }: ArtProps & { open?: boolean; tier?: 'bronze' | 'silver' | 'gold' }) {
  const art = `chest-${tier}${open ? '-open' : ''}`;
  if (hasArt(art)) return <ArtImage name={art} size={size} className={props.className} />;
  const trim = { bronze: '#e08a3c', silver: '#cfe3f5', gold: '#ffd24a' }[tier];
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden style={glow(trim)} {...props}>
      {open && (
        <g>
          <path d="M50 52 L20 10 L80 10 Z" fill={trim} opacity="0.18" />
          <circle cx="50" cy="48" r="16" fill={trim} opacity="0.35" />
        </g>
      )}
      <rect x="14" y="50" width="72" height="38" rx="4" fill="#2a1a10" stroke={trim} strokeWidth="3" />
      <rect x="14" y="62" width="72" height="6" fill={trim} opacity="0.8" />
      <rect x="44" y="58" width="12" height="16" rx="2" fill={trim} />
      <circle cx="50" cy="65" r="2.5" fill="#2a1a10" />
      <g style={{ transformOrigin: '14px 50px', transform: open ? 'rotate(-28deg)' : 'none', transition: 'transform 0.35s cubic-bezier(.34,1.56,.64,1)' }}>
        <path d="M14 50 V36 Q50 18 86 36 V50 Z" fill="#3a2414" stroke={trim} strokeWidth="3" strokeLinejoin="round" />
        <path d="M30 28 Q50 22 70 28" stroke={trim} strokeWidth="2" fill="none" opacity="0.6" />
      </g>
    </svg>
  );
}

export function Ship({ size = 120, ...props }: ArtProps) {
  if (hasArt('ship')) return <ArtImage name="ship" width={size} height={Math.round(size * 0.78)} className={props.className} />;
  return (
    <svg width={size} height={size * 0.6} viewBox="0 0 200 120" aria-hidden style={glow('#00e5ff')} {...props}>
      <rect x="88" y="18" width="14" height="40" rx="2" fill="#0b1830" stroke="#00e5ff" strokeWidth="3" />
      <rect x="86" y="14" width="18" height="6" rx="2" fill="#ff00ff" />
      <rect x="116" y="28" width="12" height="30" rx="2" fill="#0b1830" stroke="#00e5ff" strokeWidth="3" />
      <path d="M20 60 H180 L160 92 H40 Z" fill="#0b1830" stroke="#00e5ff" strokeWidth="3" strokeLinejoin="round" />
      <path d="M40 74 H160" stroke="#00e5ff" strokeWidth="2" opacity="0.5" />
      {[60, 80, 100, 120, 140].map((x) => (
        <circle key={x} cx={x} cy="68" r="3" fill="#ffd24a" />
      ))}
      <path d="M10 102 Q30 94 50 102 T90 102 T130 102 T170 102 T200 102" stroke="#00e5ff" strokeWidth="2" fill="none" opacity="0.6" />
    </svg>
  );
}

export function Stamp({ city, size = 140, ...props }: ArtProps & { city: string }) {
  const art = `stamp-${city.toLowerCase().replace(/\s+/g, '-')}`;
  if (hasArt(art)) return <ArtImage name={art} size={size} className={props.className} />;
  return (
    <svg width={size} height={size} viewBox="0 0 140 140" aria-hidden style={glow('#ff00ff')} {...props}>
      <circle cx="70" cy="70" r="62" fill="none" stroke="#ff00ff" strokeWidth="5" />
      <circle cx="70" cy="70" r="52" fill="none" stroke="#ff00ff" strokeWidth="2" strokeDasharray="4 5" />
      <text x="70" y="64" textAnchor="middle" fill="#ff00ff" fontFamily="Rajdhani, sans-serif" fontWeight="700" fontSize={city.length > 9 ? 17 : 22} letterSpacing="1">
        {city.toUpperCase()}
      </text>
      <text x="70" y="88" textAnchor="middle" fill="#ff00ff" fontFamily="JetBrains Mono, monospace" fontSize="10" letterSpacing="3">
        ✦ 80 WAYS ✦
      </text>
    </svg>
  );
}

export function Flame({ size = 20, lit = true, ...props }: ArtProps & { lit?: boolean }) {
  const c = lit ? '#ff7a1a' : '#555';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden style={lit ? glow(c) : undefined} {...props}>
      <path d="M12 2c1 3.5 5 5.5 5 11a5 5 0 0 1-10 0c0-2.5 1.2-4 2.5-5.2.2 1.7.9 2.7 2 3.2C11 8.5 11 5 12 2z" fill={c} />
      <path d="M12 13c.6 1.5 2 2 2 3.6a2 2 0 0 1-4 0c0-1 .6-1.7 1.2-2.2.1.5.4.8.8 1z" fill={lit ? '#ffd24a' : '#777'} />
    </svg>
  );
}

export const DISCIPLINE_ICON: Record<Discipline, typeof Waves> = {
  runner: PersonStanding,
  rider: Bike,
  swimmer: Waves,
  lifter: Dumbbell,
};

/** Your character: the generated avatar for your discipline, or its line icon until there is one. */
export function Avatar({ discipline, size = 56, className, iconClassName }: { discipline: Discipline; size?: number; className?: string; iconClassName?: string }) {
  if (hasArt(`avatar-${discipline}`)) return <ArtImage name={`avatar-${discipline}`} size={size} className={className} />;
  const Icon = DISCIPLINE_ICON[discipline];
  return <Icon className={iconClassName} />;
}

/**
 * A player's crest at a fixed size: masked to a clean circle with one brass ring drawn here, not in
 * the art, so it matches the crest picker whatever the generated image does at its edges.
 */
export function CrestCircle({ discipline, size, className }: { discipline: Discipline; size: number; className?: string }) {
  const name = `avatar-${discipline}`;
  return (
    <span
      className={cn('relative block shrink-0 overflow-hidden rounded-full bg-background ring-2 ring-accent/70 ring-offset-2 ring-offset-background', className)}
      style={{ width: size, height: size }}
    >
      {hasArt(name) ? (
        <img src={`/art/${name}.webp`} alt="" className="size-full scale-[1.12] object-cover" draggable={false} />
      ) : (
        <span className="flex size-full items-center justify-center">
          <Avatar discipline={discipline} iconClassName="size-1/2 text-accent" />
        </span>
      )}
    </span>
  );
}
