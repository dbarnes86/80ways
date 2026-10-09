import { useState } from 'react';
import { Lock } from 'lucide-react';
import { formatTimeLeft } from '@/data/raids';
import { Chest } from '@/game/art';
import { useQuests } from '@/game/questActions';
import { QuestRow } from '@/game/QuestRow';
import { WEEKLY_UNLOCK_LEVEL } from '@/game/quests';
import { useProgressionStore } from '@/stores/progressionStore';
import { cn } from '@/components/ui';
import { haptic } from '@/lib/native';
import { play } from '@/game/sfx';

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

/** The set chest as a compact header line: the chest, one pip per quest, what it is. */
function SetChest({ done, total, claimed, tier, label }: { done: number; total: number; claimed: boolean; tier: 'bronze' | 'silver' | 'gold'; label: string }) {
  return (
    <div className={cn('flex min-w-0 items-center gap-3 px-1', claimed && 'opacity-50')}>
      <Chest size={36} tier={tier} open={claimed} className={!claimed && done === total ? 'animate-wobble' : ''} />
      <div className="flex gap-1">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={cn('h-2 w-6 rounded-full', i < done ? 'bg-warning' : 'bg-muted')} />
        ))}
      </div>
      <p className="truncate whitespace-nowrap text-sm text-muted-foreground">{claimed ? 'Chest opened' : label}</p>
    </div>
  );
}

export default function Quests() {
  const q = useQuests();
  const level = useProgressionStore((s) => s.level);
  const dailyDone = q.daily.filter((x) => x.claimed).length;
  const weeklyDone = q.weekly.filter((x) => x.claimed).length;
  const weeklyOpen = level >= WEEKLY_UNLOCK_LEVEL;
  const ready = (list: typeof q.daily) => list.some((x) => x.complete && !x.claimed);
  // Open on whichever list has something to claim; today otherwise.
  const [tab, setTab] = useState<'today' | 'week'>(() => (!ready(q.daily) && weeklyOpen && ready(q.weekly) ? 'week' : 'today'));

  return (
    <div className="mx-auto max-w-md space-y-5 px-4 pb-6 pt-4">
      {q.story && (
        <section className="space-y-2">
          <p className="kicker text-accent">Story</p>
          <QuestRow quest={q.story} />
        </section>
      )}

      {/* Today and this week as two tabs: one list of three at a time, never a scroll. */}
      <div className="grid grid-cols-2 rounded-full border border-border p-1" role="tablist" aria-label="Quests">
        {([
          ['today', 'Today', ready(q.daily)],
          ['week', 'This week', weeklyOpen && ready(q.weekly)],
        ] as const).map(([k, label, dot]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            onClick={() => {
              haptic('select');
              play('tick');
              setTab(k);
            }}
            className={cn('relative rounded-full py-2 font-heading text-lg font-bold transition-colors', tab === k ? 'bg-accent text-background' : 'text-muted-foreground')}
          >
            {label}
            {dot && <span className="absolute right-4 top-1/2 size-2 -translate-y-1/2 animate-pulse-soft rounded-full bg-success" aria-label="Ready to claim" />}
          </button>
        ))}
      </div>

      {tab === 'today' ? (
        <section className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <SetChest done={dailyDone} total={q.daily.length} claimed={q.dailyChestClaimed} tier={new Date().getDay() === 0 ? 'silver' : 'bronze'} label="All three: chest" />
            <span className="shrink-0 whitespace-nowrap font-mono text-xs text-muted-foreground">{formatTimeLeft(nextMidnight())}</span>
          </div>
          {q.daily.map((x) => (
            <QuestRow key={x.id} quest={x} />
          ))}
        </section>
      ) : (
        <section className="space-y-2">
          {!weeklyOpen ? (
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-card/60 p-4 text-muted-foreground">
              <Lock className="size-6 shrink-0" />
              <p>Fogg's weekly telegrams start at level {WEEKLY_UNLOCK_LEVEL}. One more workout should do it.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3">
                <SetChest done={weeklyDone} total={q.weekly.length} claimed={q.weeklyChestClaimed} tier="gold" label="All three: gold chest" />
                <span className="shrink-0 whitespace-nowrap font-mono text-xs text-muted-foreground">{formatTimeLeft(nextMonday())}</span>
              </div>
              {q.weekly.map((x) => (
                <QuestRow key={x.id} quest={x} />
              ))}
            </>
          )}
        </section>
      )}
    </div>
  );
}
