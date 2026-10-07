import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronDown } from 'lucide-react';
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
const HELP: Record<Quest['action'], { text: string; cta?: string; to?: string }> = {
  log: { text: 'Apple Health brings workouts in on their own. Or log one by hand.', cta: 'Log a workout', to: '/dashboard?log=1' },
  deploy: { text: 'Spend energy from your reserves to sail the ship onward.', cta: 'Stoke the boiler', to: '/dashboard?deploy=1' },
  board: { text: 'Finish Lift Off, then board from Home.', cta: 'Go to Home', to: '/dashboard' },
  raid: { text: 'When Fix attacks, spend energy on the Raids tab to hit him.', cta: 'Go to Raids', to: '/raids' },
  quests: { text: '' },
};

export function QuestRow({ quest, compact = false }: { quest: Quest; compact?: boolean }) {
  const ready = quest.complete && !quest.claimed;
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const help = HELP[quest.action];
  const canHelp = !quest.complete && !quest.claimed && !!help.cta;
  return (
    <div className={cn('rounded-2xl border bg-card/80 transition-colors', ready ? 'border-success/60 shadow-[0_0_20px_hsl(var(--success)/0.25)]' : 'border-border', quest.claimed && 'opacity-50')}>
    <div
      role={canHelp ? 'button' : undefined}
      tabIndex={canHelp ? 0 : undefined}
      onClick={() => canHelp && setOpen((o) => !o)}
      className={cn(
        'flex items-center gap-3 p-3',
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
      ) : canHelp ? (
        <ChevronDown className={cn('size-5 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />
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
    {open && canHelp && (
      <div className="animate-fade-up space-y-3 border-t border-border p-3">
        <p className="text-sm text-muted-foreground">{quest.hint ? `${quest.hint}. ` : ''}{help.text}</p>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-bold">
            Reward: {quest.chest ? 'a chest' : `${quest.xp ? `+${quest.xp} XP` : ''}${quest.credits ? ` · ${quest.credits} coins` : ''}`}
          </span>
          <button type="button" onClick={() => navigate(help.to!)} className="press rounded-xl bg-primary px-4 py-2.5 font-heading text-base font-bold text-primary-foreground">
            {help.cta}
          </button>
        </div>
      </div>
    )}
    </div>
  );
}
