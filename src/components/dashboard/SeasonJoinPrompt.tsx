import { motion } from 'framer-motion';
import { Globe, Users, Calendar, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSeasonStore } from '@/stores/seasonStore';
import { useProgressionStore } from '@/stores/progressionStore';
import { JOURNEY_LEGS } from '@/data/journeyLegs';

interface SeasonJoinProps {
  onJoin: () => void;
}

export const SeasonJoinPrompt = ({ onJoin }: SeasonJoinProps) => {
  const { activeSeason, narrativeDay, globalLeg } = useSeasonStore();
  const { canJoinMainJourney } = useProgressionStore();

  if (!activeSeason || !canJoinMainJourney) return null;

  const currentLegData = JOURNEY_LEGS[globalLeg];
  const isUpcoming = activeSeason.status === 'upcoming';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="border border-primary/30 bg-primary/5 rounded-xl p-5 space-y-4"
    >
      <div className="flex items-center gap-2">
        <Globe className="w-5 h-5 text-primary" />
        <h3 className="font-heading font-bold text-lg">{activeSeason.name}</h3>
      </div>

      <p className="text-sm text-muted-foreground">
        {isUpcoming
          ? `Season ${activeSeason.seasonNumber} begins ${activeSeason.startDate.toLocaleDateString()}. Be ready!`
          : `The expedition is on Day ${narrativeDay}/80. The crew is currently at ${currentLegData?.from || 'London'}.`
        }
      </p>

      {!isUpcoming && globalLeg > 0 && (
        <div className="bg-card/50 rounded-lg p-3 text-xs text-foreground/70">
          <p className="font-bold text-foreground/90 mb-1">Late Joiner Catch-Up</p>
          <p>
            You'll join the journey at <span className="text-primary font-semibold">{currentLegData?.from}</span> (Leg {globalLeg + 1}/{JOURNEY_LEGS.length}). 
            Previous legs are recorded in the ship's log for you to read.
          </p>
        </div>
      )}

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span>Ends {activeSeason.endDate.toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          <span>{activeSeason.totalDistanceKm.toLocaleString()} km total</span>
        </div>
      </div>

      <Button
        onClick={onJoin}
        className="w-full gap-2"
        size="lg"
      >
        {isUpcoming ? 'Register for Season' : 'Board the Expedition'}
        <ArrowRight className="w-4 h-4" />
      </Button>
    </motion.div>
  );
};
