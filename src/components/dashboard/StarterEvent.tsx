import { motion } from 'framer-motion';
import { Zap, Rocket, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProgressionStore } from '@/stores/progressionStore';
import {
  STARTER_EVENT,
  MAIN_JOURNEY_UNLOCK_LEVEL,
  getLevelFromXP,
} from '@/data/gameConstants';

export const StarterEvent = () => {
  const {
    starterEventCompleted,
    starterEventProgress,
    xp,
    level,
    levelName,
    canJoinMainJourney,
  } = useProgressionStore();

  const progress = starterEventProgress / STARTER_EVENT.requiredEnergy;
  const levelInfo = getLevelFromXP(xp);

  // Determine narrative message
  const getNarrativeMessage = () => {
    if (starterEventCompleted) return STARTER_EVENT.narrative.complete;
    if (progress >= 0.5) return STARTER_EVENT.narrative.progress50;
    return STARTER_EVENT.narrative.intro;
  };

  if (canJoinMainJourney) return null; // Player has graduated

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 mb-3">
          <Rocket className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-mono text-primary tracking-wider">STARTER EVENT</span>
        </div>
        <h2 className="text-xl font-heading font-bold">{STARTER_EVENT.name}</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
          {STARTER_EVENT.description}
        </p>
      </div>

      {/* Narrative Quote */}
      <div className="bg-card/50 border border-border/50 rounded-lg p-4 italic text-sm text-foreground/80">
        "{getNarrativeMessage()}"
      </div>

      {/* Progress Ring */}
      <div className="flex flex-col items-center">
        <div className="relative w-32 h-32 mb-3">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle
              cx="50" cy="50" r="42"
              fill="none"
              stroke="hsl(var(--muted) / 0.3)"
              strokeWidth="5"
            />
            <motion.circle
              cx="50" cy="50" r="42"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 42}
              initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - progress) }}
              transition={{ duration: 1, ease: 'easeOut' }}
              style={{ filter: 'drop-shadow(0 0 6px hsl(var(--primary) / 0.5))' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Zap className="w-5 h-5 text-primary mb-0.5" />
            <span className="text-lg font-heading font-bold">
              {starterEventProgress.toFixed(1)}
            </span>
            <span className="text-[9px] font-mono text-muted-foreground">
              / {STARTER_EVENT.requiredEnergy} kWh
            </span>
          </div>
        </div>

        {starterEventCompleted && (
          <div className="text-center space-y-2">
            <p className="text-sm text-primary font-bold">✓ Starter Event Complete!</p>
            {level < MAIN_JOURNEY_UNLOCK_LEVEL ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Lock className="w-3 h-3" />
                <span>
                  Reach Level {MAIN_JOURNEY_UNLOCK_LEVEL} ({getLevelFromXP(xp).name}) to join the main journey
                </span>
              </div>
            ) : (
              <p className="text-xs text-primary/80">
                You're cleared to join the expedition!
              </p>
            )}
          </div>
        )}
      </div>

    </motion.div>
  );
};
