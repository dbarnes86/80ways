import { cn } from '@/components/ui';
import { ENCOUNTER_BONUS, PUNCTUALITY_BONUS } from '@/data/gameConstants';
import type { Encounter } from '@/data/encounters';
import type { DeployResult } from '@/lib/gameActions';
import { haptic } from '@/lib/native';
import { play } from './sfx';

/** The day's card. Two choices, no numbers: the story is the hint, the spend decides it. */
export function EncounterCard({ card, departure, onTime, onPick }: { card: Encounter; departure: string; onTime: boolean; onPick: (choice: 0 | 1) => void }) {
  return (
    <div className="animate-fade-up space-y-5">
      <div>
        <p className={cn('kicker', card.fix ? 'text-destructive' : 'text-accent')}>{card.fix ? 'Detective Fix' : 'Today’s encounter'}</p>
        <p className="mt-1 font-heading text-3xl font-bold leading-tight">{card.title}</p>
        <p className="mt-2 text-lg leading-snug text-muted-foreground">{card.scene}</p>
      </div>
      <div className="space-y-3">
        {card.choices.map((c, i) => (
          <button
            key={c.label}
            type="button"
            onClick={() => {
              haptic('select');
              play('flip');
              onPick(i as 0 | 1);
            }}
            className="press panel w-full p-4 text-left font-heading text-xl font-bold leading-tight hover:border-accent/60"
          >
            {c.label}
          </button>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        How it goes depends on the energy you spend next. Departure {departure}
        {onTime ? ', and you’re on time.' : '.'}
      </p>
    </div>
  );
}

const OUTCOME = {
  triumph: { title: 'Triumph', tone: 'text-success' },
  steady: { title: 'Steady going', tone: 'text-accent' },
  setback: { title: 'Not this time', tone: 'text-muted-foreground' },
} as const;

/** What happened: the encounter's outcome, the on-time bonus, and anything brought home. */
export function DepartureReport({ res, onDone }: { res: DeployResult; onDone: () => void }) {
  const e = res.encounter;
  return (
    <div className="animate-fade-up space-y-5">
      {e && (
        <div>
          <p className="kicker text-accent">{e.card.title}</p>
          <p className={cn('mt-1 font-heading text-4xl font-bold', OUTCOME[e.outcome].tone)}>{OUTCOME[e.outcome].title}</p>
          <p className="mt-2 text-lg leading-snug">{e.outcome === 'setback' ? e.choice.lose : e.choice.win}</p>
        </div>
      )}
      <div className="panel space-y-2 p-4 text-sm">
        {e && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Encounter</span>
            <span className="font-mono">+{Math.round(ENCOUNTER_BONUS[e.outcome] * 100)}%</span>
          </div>
        )}
        {res.punctual && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Left on time</span>
            <span className="font-mono">+{Math.round(PUNCTUALITY_BONUS * 100)}%</span>
          </div>
        )}
        <div className="flex justify-between border-t border-border pt-2">
          <span className="text-muted-foreground">Bonus toward the leg</span>
          <span className="font-mono text-primary">+{res.bonus.toFixed(1)} kWh</span>
        </div>
      </div>
      {res.souvenir && (
        <div className="panel flex items-center gap-4 p-4">
          <span className="animate-stamp text-5xl" aria-hidden>
            {res.souvenir.icon}
          </span>
          <div>
            <p className="kicker text-accent">Souvenir</p>
            <p className="font-heading text-2xl font-bold leading-tight">{res.souvenir.name}</p>
            {res.souvenirCredits > 0 && <p className="text-sm text-success">Set complete: +{res.souvenirCredits} coins</p>}
          </div>
        </div>
      )}
      <button type="button" onClick={onDone} className="btn-game btn-primary shine w-full">
        Carry on
      </button>
    </div>
  );
}
