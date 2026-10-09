import { JOURNEY_LEGS } from '@/data/journeyLegs';
import { selectHasJoined, useSeasonStore } from '@/stores/seasonStore';
import { cn } from '@/components/ui';
import { Stamp } from './art';

/** A stamp for every city on the route. Collected ones glow; the rest wait, greyed. */
/** Stamps earned so far, out of the ten cities; the Me tab shows it in its label. */
export function usePassportCount() {
  const participation = useSeasonStore((s) => s.participation);
  const joined = useSeasonStore(selectHasJoined);
  const done = participation?.status === 'completed';
  const legs = JOURNEY_LEGS.slice(1);
  const earned = (i: number) => joined && (done || (participation?.currentLeg ?? 0) > i + 1);
  return { earned, count: legs.filter((_, i) => earned(i)).length, total: legs.length };
}

export function Passport() {
  const { earned } = usePassportCount();
  const legs = JOURNEY_LEGS.slice(1);

  return (
    <section>
      <div className="grid grid-cols-5 gap-2">
        {legs.map((leg, i) => (
          <div key={leg.id} className={cn('flex aspect-square items-center justify-center rounded-2xl border bg-card/60', earned(i) ? 'border-accent/50' : 'border-border')}>
            <Stamp city={leg.to} size={60} className={cn(!earned(i) && 'opacity-20 grayscale', earned(i) && 'rotate-[-10deg]')} />
          </div>
        ))}
      </div>
    </section>
  );
}
