import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { cn } from '@/components/ui';
import { haptic } from '@/lib/native';
import { claimQuest } from './questActions';
import type { NextMove } from './nextMove';
import { play } from './sfx';

const TONE: Record<NextMove['action'], string> = {
  claim: 'bg-success text-background shadow-[0_0_30px_hsl(var(--success)/0.45)]',
  raid: 'bg-destructive text-white shadow-[0_0_30px_hsl(var(--destructive)/0.45)]',
  pass: 'bg-secondary text-white shadow-[0_0_30px_hsl(var(--secondary)/0.45)]',
  board: 'bg-secondary text-white shadow-[0_0_30px_hsl(var(--secondary)/0.45)]',
  deploy: 'bg-primary text-primary-foreground shadow-[0_0_30px_hsl(var(--primary)/0.45)]',
  log: 'bg-primary text-primary-foreground shadow-[0_0_30px_hsl(var(--primary)/0.45)]',
  store: 'bg-warning text-background shadow-[0_0_30px_hsl(var(--warning)/0.45)]',
  quests: 'bg-primary text-primary-foreground shadow-[0_0_30px_hsl(var(--primary)/0.45)]',
};

/** The one thing to do next, with the one button that does it. */
export function NextMoveCard({ move, onLog, onDeploy, onBoard }: { move: NextMove; onLog: () => void; onDeploy: () => void; onBoard: () => Promise<void> }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const go = async () => {
    haptic('tap');
    play('tick');
    switch (move.action) {
      case 'claim':
        if (move.quest) claimQuest(move.quest);
        return;
      case 'log':
        return onLog();
      case 'deploy':
        return onDeploy();
      case 'board':
        setBusy(true);
        await onBoard();
        setBusy(false);
        return;
      case 'pass':
        return navigate('/membership');
      case 'store':
        return navigate('/store');
      case 'raid':
        return navigate('/raids');
      case 'quests':
        return navigate('/quests');
    }
  };

  return (
    <div key={move.id} className="animate-fade-up space-y-3 rounded-3xl border border-primary/30 bg-card/80 p-5">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-primary">{move.kicker}</p>
      <div>
        <p className="font-heading text-3xl font-bold leading-tight">{move.title}</p>
        <p className="mt-1 text-muted-foreground">{move.body}</p>
      </div>
      <button
        type="button"
        onClick={() => void go()}
        disabled={busy}
        className={cn('press shine flex h-16 w-full items-center justify-center gap-2 rounded-2xl font-heading text-2xl font-bold tracking-wide disabled:opacity-70', TONE[move.action])}
      >
        {busy && <Loader2 className="animate-spin" />}
        {move.cta}
      </button>
    </div>
  );
}
