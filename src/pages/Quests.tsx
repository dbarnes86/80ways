import { Lock } from 'lucide-react';
import { formatTimeLeft } from '@/data/raids';
import { Chest } from '@/game/art';
import { useQuests } from '@/game/questActions';
import { QuestRow } from '@/game/QuestRow';
import { WEEKLY_UNLOCK_LEVEL } from '@/game/quests';
import { useProgressionStore } from '@/stores/progressionStore';
import { cn } from '@/components/ui';

function nextMidnight() {
  const d = new Date();
  d.setHours(24, 0, 0, 0);
  return d;
}

function nextMonday() {
  const d = new Date();
  d.setHours(24, 0, 0, 0);
  while (d.getDay() !== 1) d.setDate(d.getDate() + 1);
  return d;
}

function SetChest({ done, total, claimed, tier, label }: { done: number; total: number; claimed: boolean; tier: 'bronze' | 'silver' | 'gold'; label: string }) {
  return (
    <div className={cn('flex items-center gap-3 rounded-2xl border border-dashed p-3', claimed ? 'border-border opacity-50' : 'border-warning/50')}>
      <Chest size={44} tier={tier} open={claimed} className={!claimed && done === total ? 'animate-wobble' : ''} />
      <div className="flex-1">
        <p className="font-heading font-bold">{claimed ? 'Chest opened' : label}</p>
        <div className="mt-1 flex gap-1">
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className={cn('h-2 flex-1 rounded-full', i < done ? 'bg-warning shadow-[0_0_6px_hsl(var(--warning))]' : 'bg-muted')} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Quests() {
  const q = useQuests();
  const level = useProgressionStore((s) => s.level);
  const dailyDone = q.daily.filter((x) => x.claimed).length;
  const weeklyDone = q.weekly.filter((x) => x.claimed).length;

  return (
    <div className="mx-auto max-w-md space-y-7 px-4 pb-6 pt-4">
      {q.story && (
        <section className="space-y-2">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-secondary">Story</p>
          <QuestRow quest={q.story} />
        </section>
      )}

      <section className="space-y-2">
        <div className="flex items-baseline justify-between">
          <h2 className="font-heading text-2xl font-bold">Today</h2>
          <span className="font-mono text-xs text-muted-foreground">New in {formatTimeLeft(nextMidnight())}</span>
        </div>
        {q.daily.map((x) => (
          <QuestRow key={x.id} quest={x} />
        ))}
        <SetChest done={dailyDone} total={q.daily.length} claimed={q.dailyChestClaimed} tier={new Date().getDay() === 0 ? 'silver' : 'bronze'} label="Finish all three for a chest" />
      </section>

      <section className="space-y-2">
        <div className="flex items-baseline justify-between">
          <h2 className="font-heading text-2xl font-bold">Telegrams from Fogg</h2>
          {level >= WEEKLY_UNLOCK_LEVEL && <span className="font-mono text-xs text-muted-foreground">{formatTimeLeft(nextMonday())}</span>}
        </div>
        {level < WEEKLY_UNLOCK_LEVEL ? (
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card/60 p-4 text-muted-foreground">
            <Lock className="size-6 shrink-0" />
            <p>Weekly quests unlock at level {WEEKLY_UNLOCK_LEVEL}. One more workout should do it.</p>
          </div>
        ) : (
          <>
            {q.weekly.map((x) => (
              <QuestRow key={x.id} quest={x} />
            ))}
            <SetChest done={weeklyDone} total={q.weekly.length} claimed={q.weeklyChestClaimed} tier="gold" label="Finish all three for a gold chest" />
          </>
        )}
      </section>
    </div>
  );
}
