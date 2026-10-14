import { SOUVENIRS } from '@/data/encounters';
import { JOURNEY_LEGS } from '@/data/journeyLegs';
import { useUserStore } from '@/stores/userStore';
import { cn } from '@/components/ui';
import { floatReward } from './rewards';
import { play } from './sfx';

/** Three keepsakes a stop, brought home from good encounters. A full set glows. */
export function Souvenirs() {
  const owned = useUserStore((s) => s.souvenirs);
  return (
    <section className="grid grid-cols-3 gap-2">
      {SOUVENIRS.map((set, i) => {
        const full = set.every((s) => owned.includes(s.id));
        return (
          <div key={JOURNEY_LEGS[i].id} className={cn('rounded-2xl border bg-card/60 px-1 py-2 text-center', full ? 'border-accent/60 shadow-[0_0_12px_hsl(var(--accent)/0.4)]' : 'border-border')}>
            <p className={cn('truncate text-[11px] font-semibold', full ? 'text-accent' : 'text-muted-foreground')}>{JOURNEY_LEGS[i].to}</p>
            <div className="mt-1 flex justify-center gap-0.5">
              {set.map((s) => {
                const have = owned.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      play('tick');
                      floatReward(have ? s.name : 'Win an encounter on this leg', have ? 'xp' : 'streak');
                    }}
                    className={cn('text-2xl leading-none', !have && 'opacity-20 grayscale')}
                    aria-label={have ? s.name : 'Not found yet'}
                  >
                    {s.icon}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </section>
  );
}
