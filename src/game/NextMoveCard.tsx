import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { cn } from '@/components/ui';
import { haptic } from '@/lib/native';
import { claimQuest } from './questActions';
import type { NextMove } from './nextMove';
import { play } from './sfx';

const TONE: Record<NextMove['action'], string> = {
  claim: 'btn-go',
  raid: 'btn-danger',
  pass: 'btn-pass',
  board: 'btn-pass',
  deploy: 'btn-primary',
  log: 'btn-primary',
  store: 'btn-gold',
  quests: 'btn-primary',
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
    <div key={move.id} className="panel panel-hero animate-fade-up space-y-4 p-5">
      <div>
        <p className="kicker text-accent">{move.kicker}</p>
        <p className="mt-1 font-heading text-[2.1rem] font-bold leading-[1.05]">{move.title}</p>
        <p className="mt-1.5 text-lg leading-snug text-muted-foreground">{move.body}</p>
      </div>
      <button type="button" onClick={() => void go()} disabled={busy} className={cn('btn-game shine w-full', TONE[move.action])}>
        {busy && <Loader2 className="animate-spin" />}
        {move.cta}
      </button>
    </div>
  );
}
