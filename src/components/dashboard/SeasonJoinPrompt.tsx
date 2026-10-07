import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Crown, Loader2 } from 'lucide-react';
import { useSeasonStore } from '@/stores/seasonStore';
import { selectIsMember, useMembershipStore } from '@/stores/membershipStore';
import { JOURNEY_LEGS } from '@/data/journeyLegs';
import { haptic } from '@/lib/native';
import { play } from '@/game/sfx';
import { celebrate } from '@/game/rewards';

interface SeasonJoinProps {
  onJoin: () => Promise<{ error?: string }>;
}

/** Lift Off is done: board the season (Season Pass holders) or see what the pass gets you. */
export const SeasonJoinPrompt = ({ onJoin }: SeasonJoinProps) => {
  const { activeSeason, narrativeDay, getJoinLeg } = useSeasonStore();
  const isMember = useMembershipStore(selectIsMember);
  const membershipLoaded = useMembershipStore((s) => s.loaded);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!activeSeason) return null;

  const joinLeg = getJoinLeg();
  const from = JOURNEY_LEGS[joinLeg]?.from ?? 'London';
  const isUpcoming = activeSeason.status === 'upcoming';

  if (activeSeason.status === 'completed') {
    return (
      <div className="rounded-2xl border border-border bg-card/60 p-5 text-center">
        <p className="font-heading text-xl font-bold">{activeSeason.name} has finished</p>
        <p className="text-sm text-muted-foreground">The next voyage opens soon. Your XP and reserves carry over.</p>
      </div>
    );
  }

  const handleJoin = async () => {
    setJoining(true);
    setError(null);
    haptic('heavy');
    const res = await onJoin();
    setJoining(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    play('whoosh');
    celebrate({ kind: 'stamp', city: from, credits: 0 });
  };

  return (
    <div className="space-y-4 overflow-hidden rounded-3xl border border-secondary/40 bg-gradient-to-b from-secondary/15 to-transparent p-5 text-center">
      <div>
        <p className="font-heading text-3xl font-bold text-glow-magenta">{isUpcoming ? `${activeSeason.name} sets sail soon` : 'You’re cleared to sail'}</p>
        <p className="text-muted-foreground">
          {isUpcoming ? `Departs ${activeSeason.startDate.toLocaleDateString()}.` : `The crew is on day ${narrativeDay} of 80. You’ll board at ${from}.`}
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {isMember || !membershipLoaded ? (
        <button
          type="button"
          onClick={() => void handleJoin()}
          disabled={joining}
          className="press shine flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-secondary font-heading text-2xl font-bold text-white shadow-[0_0_30px_hsl(var(--secondary)/0.45)] disabled:opacity-70"
        >
          {joining ? <Loader2 className="animate-spin" /> : null}
          {isUpcoming ? 'Sign on' : 'Board the ship'}
        </button>
      ) : (
        <Link
          to="/membership"
          className="press shine flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-secondary font-heading text-2xl font-bold text-white shadow-[0_0_30px_hsl(var(--secondary)/0.45)]"
        >
          <Crown className="size-6" /> Get the Season Pass
        </Link>
      )}
    </div>
  );
};
