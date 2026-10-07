import { HolographicCard } from '@/components/ui/holographic-card';
import { CyberpunkProgress } from '@/components/ui/cyberpunk-progress';
import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';
import { ENERGY_THEME } from '@/data/energyTheme';
import type { EnergyType } from '@/data/gameConstants';

interface ActiveChallengeProps {
  title: string;
  description: string;
  requiredEnergy: {
    type: EnergyType;
    amount: number;
  };
  currentProgress: number;
  canDeploy: boolean;
  onDeploy: () => void;
}

export const ActiveChallenge = ({ title, description, requiredEnergy, currentProgress, canDeploy, onDeploy }: ActiveChallengeProps) => {
  const theme = ENERGY_THEME[requiredEnergy.type];

  return (
    <HolographicCard glow={theme.glow} className="p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <p className="text-[10px] font-mono text-muted-foreground tracking-widest">CURRENT LEG</p>
          <p className="font-heading font-bold leading-tight">{title}</p>
        </div>
        <Button
          onClick={onDeploy}
          disabled={!canDeploy}
          size="sm"
          className="flex-shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
        >
          <Zap className="w-3.5 h-3.5 mr-1" />
          DEPLOY
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mb-3 line-clamp-3">{description}</p>
      <div className="flex items-center gap-2 mb-2 text-sm">
        <theme.icon className={`w-4 h-4 ${theme.text}`} />
        <span className="font-mono">
          {currentProgress.toFixed(1)} / {requiredEnergy.amount.toFixed(1)} kWh
        </span>
        <span className={`text-xs ${theme.text}`}>{theme.label}</span>
      </div>
      <CyberpunkProgress value={currentProgress} max={requiredEnergy.amount} segments={12} glow="cyan" size="md" />
      {!canDeploy && (
        <p className="text-[11px] text-muted-foreground mt-2">Reserves empty. Log an activity to charge up, then deploy.</p>
      )}
    </HolographicCard>
  );
};
