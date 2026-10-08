import { useState } from 'react';
import { EnergyAllocator } from '@/components/EnergyAllocator';
import { useSeasonStore } from '@/stores/seasonStore';
import { JOURNEY_LEGS } from '@/data/journeyLegs';
import { ENERGY_THEME } from '@/data/energyTheme';
import { deployToLeg } from '@/lib/gameActions';
import { announce } from '@/game/rewards';
import { play } from '@/game/sfx';
import { toast } from '@/components/toast';
import { haptic } from '@/lib/native';
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui';

interface EnergyDeploymentProps {
  open: boolean;
  onClose: () => void;
}

export const EnergyDeployment = ({ open, onClose }: EnergyDeploymentProps) => {
  const participation = useSeasonStore((s) => s.participation);
  const [submitting, setSubmitting] = useState(false);
  const close = () => onClose();

  const leg = JOURNEY_LEGS[participation?.currentLeg ?? 0];
  if (!participation || !leg) return null;
  const theme = ENERGY_THEME[leg.requiredEnergy.type];

  const handleSubmit = async (selection: Parameters<typeof deployToLeg>[0]) => {
    setSubmitting(true);
    try {
      const res = await deployToLeg(selection);
      // Back to the map: the ship moves, and a finished leg gets its passport stamp.
      close();
      play(res.legCompleted ? 'whoosh' : 'collect');
      haptic(res.legCompleted ? 'success' : 'tap');
      announce({
        xp: res.xp,
        credits: res.legCompleted ? 0 : res.credits,
        levelUp: res.levelUp,
        legCompletedCity: res.legCompleted ? JOURNEY_LEGS[res.legIndex].to : undefined,
        legCredits: res.credits,
        journeyComplete: res.journeyComplete,
      });
    } catch (err) {
      toast({
        title: 'Deployment failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => close()} className="max-w-xl max-h-[90vh] overflow-y-auto bg-background border-2 border-accent/50">
        <>
            <div key="form" className="space-y-5">
              <DialogHeader>
                <p className="kicker text-accent">{leg.narrative.title}</p>
                <DialogTitle className="text-3xl font-heading font-bold">Stoke the boiler</DialogTitle>
                <DialogDescription className="text-base">
                  {leg.from} → {leg.to}. {Math.max(0, leg.requiredEnergy.amount - participation.legProgress).toFixed(1)} kWh of{' '}
                  <span className={theme.text}>{theme.label}</span> to go.
                </DialogDescription>
              </DialogHeader>

              <EnergyAllocator
                targetType={leg.requiredEnergy.type}
                required={leg.requiredEnergy.amount}
                progress={participation.legProgress}
                submitLabel="Stoke the boiler"
                submitting={submitting}
                onSubmit={handleSubmit}
                onCancel={close}
              />
            </div>
        </>
          </Dialog>
  );
};
