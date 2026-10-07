import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Coins, Flag, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CyberpunkProgress } from '@/components/ui/cyberpunk-progress';
import { EnergyAllocator } from '@/components/EnergyAllocator';
import { useSeasonStore } from '@/stores/seasonStore';
import { JOURNEY_LEGS } from '@/data/journeyLegs';
import { ENERGY_THEME } from '@/data/energyTheme';
import { deployToLeg, type DeployResult } from '@/lib/gameActions';
import { toast } from '@/hooks/use-toast';

interface EnergyDeploymentProps {
  open: boolean;
  onClose: () => void;
}

export const EnergyDeployment = ({ open, onClose }: EnergyDeploymentProps) => {
  const participation = useSeasonStore((s) => s.participation);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<DeployResult | null>(null);

  const close = () => {
    onClose();
    setTimeout(() => setResult(null), 200);
  };

  // While the success screen is up, keep showing the leg that was just completed.
  const legIndex = result ? result.legIndex : participation?.currentLeg ?? 0;
  const leg = JOURNEY_LEGS[legIndex];
  if (!participation || !leg) return null;

  const theme = ENERGY_THEME[leg.requiredEnergy.type];
  const nextLeg = JOURNEY_LEGS[legIndex + 1];

  const handleSubmit = async (selection: Parameters<typeof deployToLeg>[0]) => {
    setSubmitting(true);
    try {
      const res = await deployToLeg(selection);
      setResult(res);
      if (res.levelUp) toast({ title: `Level ${res.levelUp.level}!`, description: `You're now a ${res.levelUp.name}.` });
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
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-background border-2 border-primary/50">
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div key="form" exit={{ opacity: 0 }} className="space-y-5">
              <DialogHeader>
                <DialogTitle className="text-xl font-heading font-bold text-primary">
                  {leg.narrative.title.toUpperCase()}
                </DialogTitle>
                <DialogDescription>
                  {leg.from} → {leg.to}. Needs {leg.requiredEnergy.amount.toFixed(1)} kWh{' '}
                  <span className={theme.text}>{theme.label}</span>.
                </DialogDescription>
              </DialogHeader>

              <EnergyAllocator
                targetType={leg.requiredEnergy.type}
                required={leg.requiredEnergy.amount}
                progress={participation.legProgress}
                submitLabel="Deploy"
                submitting={submitting}
                onSubmit={handleSubmit}
                onCancel={close}
              />
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6 space-y-5"
            >
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} className="flex justify-center">
                {result.legCompleted ? (
                  <Flag className="w-20 h-20 text-success" />
                ) : (
                  <CheckCircle2 className="w-20 h-20 text-primary" />
                )}
              </motion.div>

              <div>
                <h2 className="text-2xl font-heading font-bold mb-1">
                  {result.journeyComplete ? 'AROUND THE WORLD!' : result.legCompleted ? `${leg.to.toUpperCase()} REACHED` : 'ENERGY DEPLOYED'}
                </h2>
                <p className="text-primary">+{result.plan.totalEffective.toFixed(1)} kWh progress</p>
              </div>

              <div className="flex justify-center gap-3 text-sm font-mono">
                <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary">+{result.xp} XP</span>
                {result.credits > 0 && (
                  <span className="px-3 py-1 rounded-full bg-warning/10 border border-warning/30 text-warning flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5" /> +{result.credits}
                  </span>
                )}
              </div>

              {result.legCompleted ? (
                <div className="space-y-4">
                  <p className="text-sm italic text-muted-foreground max-w-sm mx-auto">{leg.narrative.arrivalQuote}</p>
                  {result.journeyComplete ? (
                    <div className="p-4 rounded-lg border border-secondary/40 bg-secondary/10 text-sm flex items-center gap-2 justify-center">
                      <Sparkles className="w-4 h-4 text-secondary" />
                      Fogg's wager is won. You've circled the globe this season.
                    </div>
                  ) : nextLeg ? (
                    <div className="p-4 bg-muted/30 rounded-lg text-left">
                      <p className="text-[10px] font-mono text-muted-foreground tracking-widest mb-1">NEXT LEG</p>
                      <p className="font-bold">{nextLeg.narrative.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {nextLeg.from} → {nextLeg.to} · {nextLeg.requiredEnergy.amount} kWh{' '}
                        <span className={ENERGY_THEME[nextLeg.requiredEnergy.type].text}>
                          {ENERGY_THEME[nextLeg.requiredEnergy.type].label}
                        </span>
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="p-4 rounded-lg border border-primary/40 bg-primary/5 space-y-2">
                  <CyberpunkProgress value={result.newProgress} max={leg.requiredEnergy.amount} segments={12} glow="cyan" size="sm" />
                  <p className="text-sm text-muted-foreground">
                    {(leg.requiredEnergy.amount - result.newProgress).toFixed(1)} kWh to {leg.to}
                  </p>
                </div>
              )}

              <Button onClick={close} className="w-full">Continue</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
