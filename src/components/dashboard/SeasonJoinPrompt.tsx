import { useState } from 'react';
import { Globe, Map, Calendar, ArrowRight, Loader2 } from 'lucide-react';
import { useSeasonStore } from '@/stores/seasonStore';
import { JOURNEY_LEGS } from '@/data/journeyLegs';
import { Button } from '@/components/ui';

interface SeasonJoinProps {
  onJoin: () => Promise<{ error?: string }>;
}

export const SeasonJoinPrompt = ({ onJoin }: SeasonJoinProps) => {
  const { activeSeason, narrativeDay, getJoinLeg } = useSeasonStore();
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!activeSeason) return null;

  const joinLeg = getJoinLeg();
  const joinLegData = JOURNEY_LEGS[joinLeg];
  const isUpcoming = activeSeason.status === 'upcoming';
  const isOver = activeSeason.status === 'completed';

  const handleJoin = async () => {
    setJoining(true);
    setError(null);
    const res = await onJoin();
    if (res.error) setError(res.error);
    setJoining(false);
  };

  if (isOver) {
    return (
      <div className="border border-border rounded-xl p-5 space-y-2 text-center">
        <Globe className="w-6 h-6 text-muted-foreground mx-auto" />
        <h3 className="font-heading font-bold">{activeSeason.name} has finished</h3>
        <p className="text-sm text-muted-foreground">
          The next expedition opens soon. Keep logging activities in the meantime, your reserves and XP carry over.
        </p>
      </div>
    );
  }

  return (
    <div
      className="border border-primary/30 bg-primary/5 rounded-xl p-5 space-y-4 animate-scale-in"
    >
      <div className="flex items-center gap-2">
        <Globe className="w-5 h-5 text-primary" />
        <h3 className="font-heading font-bold text-lg">{activeSeason.name}</h3>
      </div>

      <p className="text-sm text-muted-foreground">
        {isUpcoming
          ? `Season ${activeSeason.seasonNumber} sets sail ${activeSeason.startDate.toLocaleDateString()}. Sign on now and you'll start in London.`
          : `You're cleared for departure. The expedition is on day ${narrativeDay} of 80.`}
      </p>

      {!isUpcoming && joinLeg > 0 && (
        <div className="bg-card/50 rounded-lg p-3 text-xs text-foreground/70">
          <p className="font-bold text-foreground/90 mb-1">Catching up with the crew</p>
          <p>
            You'll join at <span className="text-primary font-semibold">{joinLegData?.from}</span> (leg {joinLeg + 1} of{' '}
            {JOURNEY_LEGS.length}). Earlier legs are in the ship's log on the Map.
          </p>
        </div>
      )}

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span>Ends {activeSeason.endDate.toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-1">
          <Map className="w-3 h-3" />
          <span>{activeSeason.totalDistanceKm.toLocaleString()} km</span>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button onClick={handleJoin} disabled={joining} className="w-full gap-2" size="lg">
        {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {isUpcoming ? 'Sign on for the season' : 'Board the expedition'}
        {!joining && <ArrowRight className="w-4 h-4" />}
      </Button>
    </div>
  );
};
