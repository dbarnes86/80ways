import { JOURNEY_LEGS } from '@/data/journeyLegs';
import { selectHasJoined, useSeasonStore } from '@/stores/seasonStore';
import { cn } from '@/components/ui';
import { Stamp } from './art';

/** A stamp for every city on the route. Collected ones glow; the rest wait, greyed. */
export function Passport() {
  const participation = useSeasonStore((s) => s.participation);
  const joined = useSeasonStore(selectHasJoined);
  const done = participation?.status === 'completed';
  const legs = JOURNEY_LEGS.slice(1);
  const earned = (i: number) => joined && (done || (participation?.currentLeg ?? 0) > i + 1);
  const count = legs.filter((_, i) => earned(i)).length;

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="font-heading text-2xl font-bold">Passport</h2>
        <span className="font-heading text-lg font-bold text-secondary">
          {count} / {legs.length}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {legs.map((leg, i) => (
          <div key={leg.id} className={cn('flex aspect-square items-center justify-center rounded-2xl border bg-card/60', earned(i) ? 'border-secondary/50' : 'border-border')}>
            <Stamp city={leg.to} size={72} className={cn(!earned(i) && 'opacity-20 grayscale', earned(i) && 'rotate-[-10deg]')} />
          </div>
        ))}
      </div>
    </section>
  );
}
