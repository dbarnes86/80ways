import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Anchor, PersonStanding, Bike, Dumbbell, Zap } from 'lucide-react';

type EnergyType = 'nautical' | 'terrestrial' | 'transport' | 'strength';

interface EnergyPodProps {
  type: EnergyType;
  current: number;
  max: number;
  lastUpdated: Date;
  onCharge: () => void;
}

const ENERGY_CONFIG = {
  nautical: {
    icon: Anchor,
    label: 'NAUTICAL',
    description: 'Sea passages',
    hsl: '187 100% 50%',
    glowClass: 'shadow-[0_0_12px_hsl(187_100%_50%/0.4)]',
    textClass: 'text-primary',
    barClass: 'bg-primary',
    borderClass: 'border-primary/40',
    bgFill: 'from-primary/20 to-primary/5',
  },
  terrestrial: {
    icon: PersonStanding,
    label: 'TERRESTRIAL',
    description: 'Overland trek',
    hsl: '84 81% 44%',
    glowClass: 'shadow-[0_0_12px_hsl(84_81%_44%/0.4)]',
    textClass: 'text-success',
    barClass: 'bg-success',
    borderClass: 'border-success/40',
    bgFill: 'from-success/20 to-success/5',
  },
  transport: {
    icon: Bike,
    label: 'TRANSPORT',
    description: 'Vehicles',
    hsl: '25 95% 61%',
    glowClass: 'shadow-[0_0_12px_hsl(25_95%_61%/0.4)]',
    textClass: 'text-warning',
    barClass: 'bg-warning',
    borderClass: 'border-warning/40',
    bgFill: 'from-warning/20 to-warning/5',
  },
  strength: {
    icon: Dumbbell,
    label: 'STRENGTH',
    description: 'Heavy work',
    hsl: '300 100% 50%',
    glowClass: 'shadow-[0_0_12px_hsl(300_100%_50%/0.4)]',
    textClass: 'text-secondary',
    barClass: 'bg-secondary',
    borderClass: 'border-secondary/40',
    bgFill: 'from-secondary/20 to-secondary/5',
  },
};

const TOTAL_SEGMENTS = 10;

export const EnergyPod = ({ type, current, max, lastUpdated, onCharge }: EnergyPodProps) => {
  const config = ENERGY_CONFIG[type];
  const Icon = config.icon;
  const percentage = Math.min((current / max) * 100, 100);
  const filledSegments = Math.round((percentage / 100) * TOTAL_SEGMENTS);

  const formatLastCharged = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours === 0) return 'Now';
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  const isLow = percentage < 25;
  const isCritical = percentage < 10;

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      transition={{ duration: 0.2 }}
      className={`
        relative rounded-lg border bg-card/90 backdrop-blur overflow-hidden
        ${config.borderClass} ${config.glowClass}
        transition-shadow duration-300
      `}
    >
      {/* Scan lines */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px)',
        }}
      />

      <div className="relative z-20 p-3">
        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <motion.div
              animate={isCritical ? { opacity: [1, 0.3, 1] } : {}}
              transition={{ duration: 0.8, repeat: Infinity }}
              className={`
                w-8 h-8 rounded flex items-center justify-center
                bg-gradient-to-br ${config.bgFill}
                border ${config.borderClass}
              `}
            >
              <Icon className={`h-4 w-4 ${config.textClass}`} />
            </motion.div>
            <div>
              <h3 className={`text-xs font-heading font-bold tracking-wider ${config.textClass}`}>
                {config.label}
              </h3>
              <p className="text-[10px] text-muted-foreground">{config.description}</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onCharge}
            className={`h-7 w-7 ${config.textClass} hover:bg-card`}
          >
            <Zap className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Battery visualization */}
        <div className="flex items-end gap-[3px] h-16 mb-2">
          {Array.from({ length: TOTAL_SEGMENTS }).map((_, i) => {
            const isFilled = i < filledSegments;
            const isTopSegment = i === filledSegments - 1 && filledSegments > 0;

            return (
              <motion.div
                key={i}
                className="flex-1 rounded-sm relative overflow-hidden"
                style={{ height: `${40 + (i + 1) * 6}%` }}
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{
                  opacity: 1,
                  scaleY: 1,
                }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
              >
                {/* Background segment */}
                <div className="absolute inset-0 bg-muted/30 rounded-sm" />

                {/* Filled segment */}
                {isFilled && (
                  <motion.div
                    className={`absolute inset-0 rounded-sm ${config.barClass}`}
                    style={{ opacity: 0.6 + (i / TOTAL_SEGMENTS) * 0.4 }}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ delay: i * 0.06, duration: 0.4 }}
                  />
                )}

                {/* Pulse on top segment */}
                {isTopSegment && (
                  <motion.div
                    className={`absolute inset-0 rounded-sm ${config.barClass}`}
                    animate={{ opacity: [0.8, 1, 0.8] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between">
          <div className="font-mono text-xs">
            <span className={config.textClass}>{current.toFixed(1)}</span>
            <span className="text-muted-foreground"> / {max}</span>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span>-5%/d</span>
            <span>•</span>
            <span>{current === 0 ? '—' : formatLastCharged(lastUpdated)}</span>
          </div>
        </div>

        {/* Low energy warning */}
        {isLow && (
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className={`mt-2 text-center text-[10px] font-heading tracking-wider ${
              isCritical ? 'text-destructive' : 'text-warning'
            }`}
          >
            {isCritical ? '⚠ CRITICAL — CHARGE NOW' : '⚡ LOW RESERVES'}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
