import { Check } from 'lucide-react';
import { cn } from '@/components/ui';
import { haptic } from '@/lib/native';
import { Chest, Coin, Orb } from './art';
import { claimQuest } from './questActions';
import type { Quest } from './quests';

function Ring({ value, done }: { value: number; done: boolean }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  return (
    <svg width="44" height="44" className="-rotate-90 shrink-0">
      <circle cx="22" cy="22" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="5" />
      <circle
        cx="22"
        cy="22"
        r={r}
        fill="none"
        stroke={done ? 'hsl(var(--success))' : 'hsl(var(--primary))'}
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - Math.min(1, value))}
        style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
      />
    </svg>
  );
}

const fmt = (q: Quest, n: number) => (q.unit === 'kWh' ? n.toFixed(1) : String(Math.floor(n)));

/** One quest: progress ring, title, reward, and a glowing Claim when it's done. */
export function QuestRow({ quest, compact = false }: { quest: Quest; compact?: boolean }) {
  const ready = quest.complete && !quest.claimed;
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-2xl border bg-card/80 p-3 transition-colors',
        ready ? 'border-success/60 shadow-[0_0_20px_hsl(var(--success)/0.25)]' : 'border-border',
        quest.claimed && 'opacity-50',
      )}
    >
      <div className="relative">
        <Ring value={quest.progress / quest.target} done={quest.complete} />
        <span className="absolute inset-0 flex items-center justify-center">
          {quest.claimed || quest.complete ? <Check className={cn('size-6 text-success', !quest.claimed && 'animate-bump')} strokeWidth={3} /> : quest.energy ? <Orb type={quest.energy} size={18} /> : null}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn('font-heading font-bold leading-tight', compact ? 'text-base' : 'text-lg')}>{quest.title}</p>
        <p className="text-sm text-muted-foreground">
          {quest.target > 1 || quest.unit ? `${fmt(quest, quest.progress)} / ${fmt(quest, quest.target)}${quest.unit ? ` ${quest.unit}` : ''}` : quest.hint ?? ''}
          {!compact && quest.hint && (quest.target > 1 || quest.unit) ? ` · ${quest.hint}` : ''}
        </p>
      </div>
      {ready ? (
        <button
          type="button"
          onClick={() => {
            haptic('heavy');
            claimQuest(quest);
          }}
          className="press shine shrink-0 rounded-xl bg-success px-4 py-3 font-heading text-lg font-bold text-background shadow-[0_0_16px_hsl(var(--success)/0.5)]"
        >
          Claim
        </button>
      ) : (
        !quest.claimed && (
          <div className="flex shrink-0 flex-col items-end gap-0.5 text-sm font-bold">
            {quest.chest ? (
              <Chest size={34} tier={quest.chest} />
            ) : (
              <>
                {quest.xp > 0 && <span className="text-primary">+{quest.xp} XP</span>}
                {quest.credits > 0 && (
                  <span className="flex items-center gap-1 text-warning">
                    <Coin size={14} />
                    {quest.credits}
                  </span>
                )}
              </>
            )}
          </div>
        )
      )}
    </div>
  );
}
