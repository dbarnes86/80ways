import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Anchor, PersonStanding, Bike, Dumbbell, Zap } from 'lucide-react';

type EnergyType = 'nautical' | 'terrestrial' | 'transport' | 'strength';

interface EnergyReserveCardProps {
  type: EnergyType;
  current: number;
  max: number;
  lastUpdated: Date;
  onCharge: () => void;
}

const ENERGY_CONFIG = {
  nautical: {
    icon: Anchor,
    label: 'NAUTICAL ENERGY',
    description: 'For steamers and sea passages',
    color: 'cyan',
    bgColor: 'bg-cyan-400',
    borderColor: 'border-cyan-400',
    textColor: 'text-cyan-400',
  },
  terrestrial: {
    icon: PersonStanding,
    label: 'TERRESTRIAL ENERGY',
    description: 'For railways and overland trek',
    color: 'lime',
    bgColor: 'bg-lime-400',
    borderColor: 'border-lime-400',
    textColor: 'text-lime-400',
  },
  transport: {
    icon: Bike,
    label: 'TRANSPORT ENERGY',
    description: 'For velocipedes and carriages',
    color: 'orange',
    bgColor: 'bg-orange-400',
    borderColor: 'border-orange-400',
    textColor: 'text-orange-400',
  },
  strength: {
    icon: Dumbbell,
    label: 'STRENGTH ENERGY',
    description: 'For obstacles and heavy work',
    color: 'magenta',
    bgColor: 'bg-magenta-400',
    borderColor: 'border-magenta-400',
    textColor: 'text-magenta-400',
  },
};

export const EnergyReserveCard = ({ type, current, max, lastUpdated, onCharge }: EnergyReserveCardProps) => {
  const config = ENERGY_CONFIG[type];
  const Icon = config.icon;
  const percentage = (current / max) * 100;

  const formatLastCharged = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours === 0) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`p-4 border-2 ${config.borderColor} bg-card/80 backdrop-blur relative overflow-hidden`}>
        {/* Victorian corner ornaments */}
        <div className={`absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 ${config.borderColor} opacity-50`} />
        <div className={`absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 ${config.borderColor} opacity-50`} />
        <div className={`absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 ${config.borderColor} opacity-50`} />
        <div className={`absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 ${config.borderColor} opacity-50`} />

        {/* Icon in hexagon */}
        <div className="flex items-start justify-between mb-3">
          <motion.div
            animate={{ rotate: [0, 5, 0, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className={`${config.textColor}`}
          >
            <Icon className="h-8 w-8" />
          </motion.div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCharge}
            className={`${config.textColor} hover:bg-${config.color}-400/20`}
          >
            <Zap className="h-4 w-4" />
          </Button>
        </div>

        {/* Reserve name */}
        <h3 className={`font-bold mb-1 ${config.textColor}`}>{config.label}</h3>
        <p className="text-xs text-muted-foreground italic mb-3">{config.description}</p>

        {/* Progress bar */}
        <div className="mb-2">
          <Progress value={percentage} className="h-2 bg-muted" />
        </div>

        {/* Current / Max display */}
        <div className="flex justify-between items-center text-sm font-mono mb-2">
          <span className={config.textColor}>{current.toFixed(1)} kWh / {max} kWh</span>
          <span className="text-muted-foreground">{percentage.toFixed(0)}%</span>
        </div>

        {/* Decay info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div>Decay: -5%/day</div>
          <div>Last charged: {current === 0 ? 'Never' : formatLastCharged(lastUpdated)}</div>
        </div>
      </Card>
    </motion.div>
  );
};
