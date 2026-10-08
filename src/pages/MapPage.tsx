import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Lock } from 'lucide-react';
import { selectHasJoined, useSeasonStore } from '@/stores/seasonStore';
import { useEnergyStore } from '@/stores/energyStore';
import { JOURNEY_LEGS } from '@/data/journeyLegs';
import { ENERGY_THEME } from '@/data/energyTheme';
import { ENERGY_TYPES } from '@/data/gameConstants';
import { getDistanceCovered, getPlayerNarrativeDay } from '@/lib/gameEngine';
import { haptic } from '@/lib/native';
import { needsPass } from '@/lib/gameActions';
import { cn, Dialog, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui';
import { EnergyDeployment } from '@/components/EnergyDeployment';
import { Orb, Stamp } from '@/game/art';
import { play } from '@/game/sfx';

type LegStatus = 'complete' | 'active' | 'locked';

// City positions on a 100 x 60 map.
const CITY_POINTS: Record<string, { x: number; y: number }> = {
  'London': { x: 48, y: 22 },
  'London Port': { x: 49, y: 23 },
  'Paris': { x: 50, y: 25 },
  'Suez': { x: 57, y: 38 },
  'Bombay': { x: 70, y: 42 },
  'Calcutta': { x: 76, y: 38 },
  'Hong Kong': { x: 84, y: 40 },
  'Yokohama': { x: 92, y: 28 },
  'San Francisco': { x: 12, y: 28 },
  'New York': { x: 26, y: 26 },
  'Liverpool': { x: 47, y: 21 },
};

type Point = { x: number; y: number };

/** SVG path through the points; long eastward hops (the Pacific) wrap off the right edge and back in on the left. */
function buildRoute(points: Point[]): string {
  return points
    .map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const prev = points[i - 1];
      if (prev.x - p.x > 50) {
        const midY = (prev.y + p.y) / 2;
        return `L 100 ${midY} M 0 ${midY} L ${p.x} ${p.y}`;
      }
      return `L ${p.x} ${p.y}`;
    })
    .join(' ');
}

/** Where the ship is: part-way along the current leg (the Pacific wrap just sits at the start). */
function shipPoint(from: Point, to: Point, t: number): Point {
  if (from.x - to.x > 50) return from;
  return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
}

function Stat({ value, label, tone }: { value: string; label: string; tone: string }) {
  return (
    <div className="panel flex-1 !rounded-2xl px-2 py-3 text-center">
      <p className={cn('font-heading text-2xl font-bold leading-none', tone)}>{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export default function MapPage() {
  const season = useSeasonStore();
  const hasJoined = useSeasonStore(selectHasJoined);
  const energy = useEnergyStore();
  const participation = hasJoined ? season.participation : null;
  const journeyDone = participation?.status === 'completed';
  const currentLegIndex = participation?.currentLeg ?? 0;
  const currentLeg = JOURNEY_LEGS[currentLegIndex];
  const legFraction = participation ? participation.legProgress / currentLeg.requiredEnergy.amount : 0;
  const [openLeg, setOpenLeg] = useState<number | null>(null);
  const [deployOpen, setDeployOpen] = useState(false);

  const legStatus = (i: number): LegStatus => {
    if (!participation) return 'locked';
    if (journeyDone || i < currentLegIndex) return 'complete';
    if (i === currentLegIndex) return 'active';
    return 'locked';
  };

  const covered = participation ? getDistanceCovered(currentLegIndex, legFraction, journeyDone) : 0;
  const day = participation ? getPlayerNarrativeDay(currentLegIndex, legFraction, journeyDone) : 1;
  const stamps = participation ? JOURNEY_LEGS.slice(1).filter((_, i) => legStatus(i + 1) === 'complete').length : 0;
  const hasEnergy = ENERGY_TYPES.some((t) => energy[t].current >= 0.1);
  const locked = needsPass(participation);

  // London, then each leg's destination.
  const pathCities = [CITY_POINTS['London'], ...JOURNEY_LEGS.map((leg) => CITY_POINTS[leg.to])];
  const completedLegs = JOURNEY_LEGS.filter((_, i) => legStatus(i) === 'complete').length;
  const ship = participation && !journeyDone ? shipPoint(pathCities[currentLegIndex], pathCities[currentLegIndex + 1], Math.min(1, legFraction)) : pathCities[0];

  const open = (i: number) => {
    haptic('select');
    play('tick');
    setOpenLeg(i);
  };

  const selected = openLeg !== null ? JOURNEY_LEGS[openLeg] : null;
  const selectedStatus = openLeg !== null ? legStatus(openLeg) : 'locked';

  return (
    <div className="mx-auto max-w-md space-y-5 px-4 pb-6 pt-4">
      <div className="flex gap-2">
        <Stat value={`${day}`} label="Day of 80" tone="text-primary" />
        <Stat value={covered >= 1000 ? `${(covered / 1000).toFixed(1)}k` : `${Math.round(covered)}`} label="km sailed" tone="text-success" />
        <Stat value={`${stamps}/10`} label="Stamps" tone="text-secondary" />
      </div>

      <div className="overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-b from-[#071631] to-[#05050b] p-2">
        <svg viewBox="0 12 100 40" className="w-full" aria-label="Route map">
            <g opacity={0.32} fill="hsl(187 100% 50% / 0.05)" stroke="hsl(187 100% 50%)" strokeWidth={0.3}>
              {/* North America */}
              <path d="M5,12 L8,10 L12,8 L18,7 L22,8 L25,10 L28,9 L30,11 L28,14 L30,16 L28,18 L26,20 L24,22 L22,26 L20,30 L18,32 L16,30 L14,28 L12,24 L10,20 L8,18 L6,16 L5,14 Z" />
              {/* South America */}
              <path d="M22,34 L24,32 L26,34 L28,36 L30,40 L30,44 L28,48 L26,50 L24,52 L22,50 L20,46 L20,42 L20,38 L22,34 Z" />
              {/* Europe */}
              <path d="M44,10 L46,8 L48,9 L50,8 L52,9 L54,10 L52,12 L54,14 L52,16 L50,18 L48,16 L46,14 L44,12 Z" />
              {/* Africa */}
              <path d="M44,20 L48,18 L52,18 L56,20 L58,24 L60,28 L60,32 L58,36 L56,40 L54,44 L52,46 L50,44 L48,40 L46,36 L44,32 L44,28 L42,24 L44,20 Z" />
              {/* Asia */}
              <path d="M54,8 L58,6 L62,5 L66,4 L70,5 L74,6 L78,5 L82,6 L86,8 L90,10 L92,12 L94,14 L92,16 L90,18 L88,20 L86,22 L82,24 L78,22 L74,20 L70,18 L66,16 L62,14 L58,12 L56,10 Z" />
              {/* India subcontinent */}
              <path d="M66,20 L70,22 L72,26 L74,30 L72,34 L70,36 L68,34 L66,30 L64,26 L66,22 Z" />
              {/* Southeast Asia / Indonesia */}
              <path d="M78,26 L80,24 L82,26 L84,28 L86,26 L88,28 L90,30 L88,32 L86,30 L84,32 L82,30 L80,28 Z" />
              {/* Australia */}
              <path d="M82,38 L86,36 L90,36 L94,38 L96,40 L96,44 L94,46 L90,48 L86,46 L84,44 L82,42 L82,38 Z" />
              {/* Japan */}
              <path d="M88,12 L90,10 L92,12 L90,14 L88,12 Z" />
              {/* UK / British Isles */}
              <path d="M45,11 L46,10 L47,11 L46,13 L45,12 Z" />
              {/* Greenland */}
              <path d="M30,4 L34,3 L38,4 L36,7 L32,7 L30,5 Z" />
            </g>

          <path d={buildRoute(pathCities)} fill="none" stroke="hsl(187 100% 50% / 0.3)" strokeWidth={0.45} strokeDasharray="1 1" />
          {completedLegs > 0 && (
            <path
              d={buildRoute(pathCities.slice(0, completedLegs + 1))}
              fill="none"
              stroke="hsl(187 100% 50%)"
              strokeWidth={0.8}
              style={{ filter: 'drop-shadow(0 0 1px hsl(187 100% 50%))' }}
            />
          )}

          {pathCities.map((p, i) => {
            if (i === 1 || i === pathCities.length - 1) return null; // London Port and the finish sit on London
            const status: LegStatus | 'origin' = i === 0 ? 'origin' : legStatus(i - 1);
            const lit = status === 'complete' || status === 'origin';
            return (
              <g key={i} onClick={() => i > 0 && open(i - 1)} className={i > 0 ? 'cursor-pointer' : undefined}>
                <circle cx={p.x} cy={p.y} r={3.2} fill="transparent" />
                <circle cx={p.x} cy={p.y} r={1.1} fill={lit ? 'hsl(300 100% 50%)' : status === 'active' ? 'hsl(187 100% 50%)' : 'hsl(240 20% 35%)'} />
              </g>
            );
          })}

          {/* the ship */}
          <g transform={`translate(${ship.x} ${ship.y})`} style={{ transition: 'transform 1.2s ease-out' }}>
            <circle r={2.6} fill="none" stroke="hsl(187 100% 50%)" strokeWidth={0.25} className="animate-ring" />
            <path d="M-2 -0.2 H2 L1.3 1 H-1.3 Z M-0.4 -0.2 V-1.6 H0.4 V-0.2" fill="hsl(187 100% 50%)" style={{ filter: 'drop-shadow(0 0 1px hsl(187 100% 50%))' }} />
          </g>
        </svg>
      </div>

      {!participation && (
        <Link to="/dashboard" className="press block rounded-2xl border border-secondary/40 bg-secondary/10 p-4 text-center">
          <p className="font-heading text-lg font-bold text-secondary">The ship is in port</p>
          <p className="text-sm text-muted-foreground">Finish Lift Off and board to start the voyage.</p>
        </Link>
      )}

      {/* The route, one stop per city. */}
      <ol className="relative space-y-2">
        <span className="absolute bottom-6 left-[1.6rem] top-6 w-0.5 bg-border" aria-hidden />
        {JOURNEY_LEGS.map((leg, i) => {
          const status = legStatus(i);
          const theme = ENERGY_THEME[leg.requiredEnergy.type];
          const active = status === 'active';
          return (
            <li key={leg.id} className="relative">
              <button
                type="button"
                onClick={() => open(i)}
                className={cn(
                  'press flex w-full items-center gap-3 rounded-2xl border p-3 text-left',
                  active ? 'border-primary/60 bg-primary/10 shadow-[0_0_20px_hsl(var(--primary)/0.25)]' : 'border-transparent',
                  status === 'locked' && 'opacity-55',
                )}
              >
                <span
                  className={cn(
                    'relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border-2',
                    status === 'complete' && 'border-secondary bg-secondary/20',
                    active && 'border-primary bg-background',
                    status === 'locked' && 'border-border bg-background',
                  )}
                >
                  {status === 'complete' ? <Check className="size-5 text-secondary" strokeWidth={3} /> : status === 'locked' ? <Lock className="size-4 text-muted-foreground" /> : <span className="size-3 animate-pulse-soft rounded-full bg-primary" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={cn('font-heading text-lg font-bold leading-tight', active && 'text-primary')}>{leg.to}</p>
                  {active ? (
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary" style={{ width: `${Math.max(3, legFraction * 100)}%` }} />
                    </div>
                  ) : (
                    <p className="truncate text-sm text-muted-foreground">{leg.narrative.title}</p>
                  )}
                </div>
                <span className={cn('flex shrink-0 items-center gap-1 font-heading text-base font-bold', theme.text)}>
                  <Orb type={leg.requiredEnergy.type} size={16} />
                  {active ? `${participation!.legProgress.toFixed(1)}/${leg.requiredEnergy.amount}` : leg.requiredEnergy.amount}
                </span>
              </button>
              {active && locked && (
                <Link
                  to="/membership"
                  className="btn-game btn-pass shine mt-3 w-full"
                >
                  Keep sailing with the Season Pass
                </Link>
              )}
              {active && !locked && hasEnergy && (
                <button
                  type="button"
                  onClick={() => {
                    haptic('tap');
                    setDeployOpen(true);
                  }}
                  className="btn-game btn-primary shine mt-3 w-full"
                >
                  Stoke the boiler
                </button>
              )}
            </li>
          );
        })}
      </ol>

      <Dialog open={openLeg !== null} onClose={() => setOpenLeg(null)} className="max-w-lg border-2 border-primary/50 bg-background">
        {selected && (
          <>
            <DialogHeader>
              {selectedStatus === 'complete' && openLeg! > 0 && <Stamp city={selected.to} size={110} className="mx-auto -rotate-12" />}
              <p className="font-mono text-xs tracking-widest text-muted-foreground">
                LEG {selected.legNumber + 1} · {selected.distance.toLocaleString()} KM
              </p>
              <DialogTitle className="font-heading text-2xl">{selected.narrative.title}</DialogTitle>
              <DialogDescription>
                {selected.from} → {selected.to} · needs {selected.requiredEnergy.amount} kWh{' '}
                <span className={ENERGY_THEME[selected.requiredEnergy.type].text}>{ENERGY_THEME[selected.requiredEnergy.type].label}</span>
              </DialogDescription>
            </DialogHeader>
            {selectedStatus === 'locked' ? (
              <p className="flex items-center gap-2 py-3 text-muted-foreground">
                <Lock className="size-4" /> Not reached yet. Keep sailing.
              </p>
            ) : (
              <div className="space-y-3 text-base">
                <p className="italic text-muted-foreground">{selected.narrative.departureQuote}</p>
                <p className="leading-relaxed">{selected.narrative.description}</p>
                {selectedStatus === 'complete' && <p className="italic text-primary">{selected.narrative.arrivalQuote}</p>}
              </div>
            )}
          </>
        )}
      </Dialog>
      <EnergyDeployment open={deployOpen} onClose={() => setDeployOpen(false)} />
    </div>
  );
}
