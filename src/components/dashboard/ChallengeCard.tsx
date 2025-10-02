import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Ship } from 'lucide-react';

interface ChallengeCardProps {
  title: string;
  from: string;
  to: string;
  requiredEnergy: {
    type: 'nautical' | 'terrestrial' | 'transport' | 'strength';
    amount: number;
  };
  currentProgress: number;
  onDeploy: () => void;
}

const ENERGY_COLOR_MAP = {
  nautical: 'text-cyan-400',
  terrestrial: 'text-lime-400',
  transport: 'text-orange-400',
  strength: 'text-magenta-400',
};

const OPTIMAL_ACTIVITIES = {
  nautical: ['Rowing', 'Swimming', 'Sailing', 'Kayaking'],
  terrestrial: ['Running', 'Walking', 'Hiking', 'Jogging'],
  transport: ['Cycling', 'Skateboarding', 'Rollerblading', 'E-biking'],
  strength: ['Weightlifting', 'CrossFit', 'Calisthenics', 'Yoga'],
};

export const ChallengeCard = ({ 
  title, 
  from, 
  to, 
  requiredEnergy, 
  currentProgress,
  onDeploy 
}: ChallengeCardProps) => {
  const percentage = (currentProgress / requiredEnergy.amount) * 100;
  const energyColor = ENERGY_COLOR_MAP[requiredEnergy.type];
  const optimalActivities = OPTIMAL_ACTIVITIES[requiredEnergy.type];

  return (
    <Card className="p-6 border-primary/30 bg-card/80 backdrop-blur relative overflow-hidden">
      {/* Victorian corner ornaments */}
      <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-primary/50" />
      <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-primary/50" />
      <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-primary/50" />
      <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-primary/50" />

      <div className="space-y-4">
        {/* Title */}
        <div>
          <h2 className="text-2xl font-bold mb-1">{title}</h2>
          <p className="text-muted-foreground">
            {from} → {to}
          </p>
        </div>

        {/* Illustration */}
        <div className="flex justify-center py-4">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Ship className="h-24 w-24 text-primary/50" />
          </motion.div>
        </div>

        {/* Required Energy */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-1">Required:</p>
          <p className={`text-2xl font-bold ${energyColor}`}>
            {requiredEnergy.amount.toFixed(1)} kWh {requiredEnergy.type.toUpperCase()}
          </p>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <Progress value={percentage} className="h-4" />
          <div className="flex justify-between text-sm font-mono">
            <span className={energyColor}>{currentProgress.toFixed(1)} / {requiredEnergy.amount} kWh</span>
            <span className="text-muted-foreground">{percentage.toFixed(0)}%</span>
          </div>
        </div>

        {/* Optimal Activities */}
        <div className="bg-muted/20 rounded-lg p-4">
          <p className="text-sm font-semibold mb-2">Optimal Activities:</p>
          <ul className="text-sm space-y-1 text-muted-foreground">
            {optimalActivities.map((activity) => (
              <li key={activity}>• {activity}</li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground mt-2 italic">
            Any activity accepted (reduced efficiency)
          </p>
        </div>

        {/* Deploy Button */}
        <Button
          onClick={onDeploy}
          disabled={currentProgress === 0}
          className="w-full text-lg py-6 bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
        >
          DEPLOY ENERGY
        </Button>
      </div>
    </Card>
  );
};
