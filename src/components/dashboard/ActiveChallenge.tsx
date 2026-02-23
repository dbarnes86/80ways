import { HolographicCard } from '@/components/ui/holographic-card';
import { CyberpunkProgress } from '@/components/ui/cyberpunk-progress';
import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';

interface ActiveChallengeProps {
  requiredEnergy: {
    type: 'nautical' | 'terrestrial' | 'transport' | 'strength';
    amount: number;
  };
  currentProgress: number;
  onDeploy: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  nautical: 'Nautical',
  terrestrial: 'Terrestrial',
  transport: 'Transport',
  strength: 'Strength',
};

const GLOW_MAP: Record<string, 'cyan' | 'magenta' | 'purple'> = {
  nautical: 'cyan',
  terrestrial: 'cyan',
  transport: 'purple',
  strength: 'magenta',
};

export const ActiveChallenge = ({ requiredEnergy, currentProgress, onDeploy }: ActiveChallengeProps) => {
  const pct = requiredEnergy.amount > 0 ? (currentProgress / requiredEnergy.amount) * 100 : 0;
  const glow = GLOW_MAP[requiredEnergy.type] || 'cyan';

  return (
    <HolographicCard glow={glow} className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[10px] font-mono text-muted-foreground tracking-widest">CHALLENGE REQUIREMENT</p>
          <p className="text-lg font-heading font-bold">
            {requiredEnergy.amount.toFixed(1)} kWh{' '}
            <span className="text-muted-foreground text-sm">{TYPE_LABELS[requiredEnergy.type]}</span>
          </p>
        </div>
        <Button
          onClick={onDeploy}
          disabled={currentProgress === 0}
          size="sm"
          className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
        >
          <Zap className="w-3.5 h-3.5 mr-1" />
          DEPLOY
        </Button>
      </div>
      <CyberpunkProgress value={currentProgress} max={requiredEnergy.amount} segments={12} glow={glow} size="md" showLabel />
    </HolographicCard>
  );
};
