import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { useEnergyStore } from '@/stores/energyStore';
import { useJourneyStore } from '@/stores/journeyStore';
import { useUserStore } from '@/stores/userStore';
import { toast } from '@/hooks/use-toast';

interface EnergyDeploymentProps {
  open: boolean;
  onClose: () => void;
}

type EnergyType = 'nautical' | 'terrestrial' | 'transport' | 'strength';

const ENERGY_CONFIG = {
  nautical: {
    icon: '⛵',
    label: 'NAUTICAL',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-400/10',
    borderColor: 'border-cyan-400',
    glowColor: 'shadow-cyan-400/50',
  },
  terrestrial: {
    icon: '🏃',
    label: 'TERRESTRIAL',
    color: 'text-lime-400',
    bgColor: 'bg-lime-400/10',
    borderColor: 'border-lime-400',
    glowColor: 'shadow-lime-400/50',
  },
  transport: {
    icon: '🚴',
    label: 'TRANSPORT',
    color: 'text-orange-400',
    bgColor: 'bg-orange-400/10',
    borderColor: 'border-orange-400',
    glowColor: 'shadow-orange-400/50',
  },
  strength: {
    icon: '💪',
    label: 'STRENGTH',
    color: 'text-magenta-400',
    bgColor: 'bg-magenta-400/10',
    borderColor: 'border-magenta-400',
    glowColor: 'shadow-magenta-400/50',
  },
};

const getEfficiency = (reserveType: EnergyType, challengeType: EnergyType): number => {
  if (reserveType === challengeType) return 1.0;
  
  const relatedPairs = [
    ['nautical', 'terrestrial'],
    ['nautical', 'transport'],
    ['terrestrial', 'transport'],
  ];
  
  const isPairRelated = relatedPairs.some(pair => 
    (pair[0] === reserveType && pair[1] === challengeType) ||
    (pair[1] === reserveType && pair[0] === challengeType)
  );
  
  return isPairRelated ? 0.75 : 0.5;
};

export const EnergyDeployment = ({ open, onClose }: EnergyDeploymentProps) => {
  const currentChallenge = useJourneyStore((state) => state.currentChallenge);
  const currentLeg = useJourneyStore((state) => state.currentLeg);
  const legs = useJourneyStore((state) => state.legs);
  const updateProgress = useJourneyStore((state) => state.updateProgress);
  const completeLeg = useJourneyStore((state) => state.completeLeg);
  
  const energyReserves = {
    nautical: useEnergyStore((state) => state.nautical),
    terrestrial: useEnergyStore((state) => state.terrestrial),
    transport: useEnergyStore((state) => state.transport),
    strength: useEnergyStore((state) => state.strength),
  };
  const deployEnergy = useEnergyStore((state) => state.deployEnergy);
  
  const [sliderValues, setSliderValues] = useState<Record<EnergyType, number>>({
    nautical: 0,
    terrestrial: 0,
    transport: 0,
    strength: 0,
  });
  
  const [deploying, setDeploying] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [challengeComplete, setChallengeComplete] = useState(false);

  useEffect(() => {
    if (!open) {
      setSliderValues({ nautical: 0, terrestrial: 0, transport: 0, strength: 0 });
      setShowSuccess(false);
      setChallengeComplete(false);
    }
  }, [open]);

  if (!currentChallenge || !legs[currentLeg]) return null;

  const challengeType = currentChallenge.requiredEnergy.type as EnergyType;
  const requiredAmount = currentChallenge.requiredEnergy.amount;
  const currentProgress = currentChallenge.currentProgress;
  const remaining = Math.max(0, requiredAmount - currentProgress);

  const calculateDeploymentSummary = () => {
    let totalDeployed = 0;
    let totalProgress = 0;
    const deployments: Array<{ type: EnergyType; amount: number; efficiency: number; progress: number }> = [];

    (['nautical', 'terrestrial', 'transport', 'strength'] as EnergyType[]).forEach((type) => {
      const amount = sliderValues[type];
      if (amount > 0) {
        const efficiency = getEfficiency(type, challengeType);
        const progress = amount * efficiency;
        
        deployments.push({ type, amount, efficiency, progress });
        totalDeployed += amount;
        totalProgress += progress;
      }
    });

    const newProgress = currentProgress + totalProgress;
    const progressPercent = Math.min(100, (newProgress / requiredAmount) * 100);

    return { deployments, totalDeployed, totalProgress, newProgress, progressPercent };
  };

  const summary = calculateDeploymentSummary();

  const handleDeployAll = (type: 'optimal' | 'all') => {
    const newValues = { ...sliderValues };

    if (type === 'optimal') {
      const available = energyReserves[challengeType].current;
      newValues[challengeType] = Math.min(available, remaining);
    } else {
      (['nautical', 'terrestrial', 'transport', 'strength'] as EnergyType[]).forEach((t) => {
        newValues[t] = energyReserves[t].current;
      });
    }

    setSliderValues(newValues);
  };

  const handleReset = () => {
    setSliderValues({ nautical: 0, terrestrial: 0, transport: 0, strength: 0 });
  };

  const handleDeploy = async () => {
    if (summary.totalDeployed === 0) return;

    setDeploying(true);

    try {
      summary.deployments.forEach(({ type, amount }) => {
        deployEnergy(type, amount);
      });

      updateProgress(summary.newProgress);

      const isComplete = summary.newProgress >= requiredAmount;
      setChallengeComplete(isComplete);
      setShowSuccess(true);

      if (isComplete) {
        setTimeout(() => {
          completeLeg();
          useUserStore.getState().updateStats({
            totalActivities: useUserStore.getState().stats.totalActivities + 1,
          });
          toast({
            title: '🎉 Challenge Complete!',
            description: `${legs[currentLeg].narrative.title} completed!`,
          });
        }, 3000);
      } else {
        setTimeout(() => {
          toast({
            title: '⚡ Energy Deployed',
            description: `+${summary.totalProgress.toFixed(1)} kWh progress`,
          });
          onClose();
        }, 2000);
      }
    } catch (error) {
      toast({
        title: 'Deployment Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setDeploying(false);
    }
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background border-2 border-primary/50 shadow-2xl shadow-primary/20">
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="space-y-6"
        >
          <AnimatePresence mode="wait">
            {!showSuccess ? (
              <motion.div key="form" exit={{ opacity: 0 }}>
                {/* Header */}
                <div className="border-b border-primary/20 pb-4">
                  <h2 className="text-2xl font-bold text-primary">
                    DEPLOY ENERGY: {legs[currentLeg].narrative.title.toUpperCase()}
                  </h2>
                  <p className="text-sm text-muted-foreground">Use your reserves to progress your journey</p>
                </div>

                {/* Challenge Requirements */}
                <div className={`p-4 rounded-lg border-2 ${ENERGY_CONFIG[challengeType].borderColor} ${ENERGY_CONFIG[challengeType].bgColor} shadow-lg ${ENERGY_CONFIG[challengeType].glowColor}`}>
                  <h3 className="text-xl font-bold mb-2">{legs[currentLeg].from} → {legs[currentLeg].to}</h3>
                  <p className={`text-lg font-semibold ${ENERGY_CONFIG[challengeType].color} mb-3`}>
                    Required: {requiredAmount.toFixed(1)} kWh {ENERGY_CONFIG[challengeType].label}
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Your Progress:</p>
                    <Progress value={(currentProgress / requiredAmount) * 100} className="h-3" />
                    <div className="flex justify-between text-sm">
                      <span>{currentProgress.toFixed(1)} / {requiredAmount.toFixed(1)} kWh</span>
                      <span>{((currentProgress / requiredAmount) * 100).toFixed(0)}%</span>
                    </div>
                    <p className="text-lg font-bold text-amber-400">Remaining: {remaining.toFixed(1)} kWh needed</p>
                  </div>
                </div>

                {/* Energy Reserves */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold mb-1">YOUR AVAILABLE RESERVES</h3>
                    <p className="text-sm text-muted-foreground">Select which reserves to deploy</p>
                  </div>

                  {(['strength', 'terrestrial', 'nautical', 'transport'] as EnergyType[]).map((type) => {
                    const reserve = energyReserves[type];
                    const config = ENERGY_CONFIG[type];
                    const efficiency = getEfficiency(type, challengeType);
                    const isOptimal = type === challengeType;
                    const deployed = sliderValues[type];
                    const progress = deployed * efficiency;

                    return (
                      <div
                        key={type}
                        className={`p-4 rounded-lg border-2 ${deployed > 0 ? config.borderColor : 'border-muted'} ${config.bgColor} transition-all hover:shadow-lg ${deployed > 0 ? config.glowColor : ''}`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{config.icon}</span>
                            <div>
                              <h4 className={`font-bold ${config.color}`}>
                                {config.label}
                                {isOptimal && <span className="ml-2 text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">Optimal ✓</span>}
                              </h4>
                              <p className="text-xs text-muted-foreground">Available: {reserve.current.toFixed(1)} kWh</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-semibold ${
                              efficiency === 1.0 ? 'text-green-400' : 
                              efficiency === 0.75 ? 'text-yellow-400' : 
                              'text-red-400'
                            }`}>
                              Efficiency: {(efficiency * 100).toFixed(0)}%
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Slider
                            value={[sliderValues[type]]}
                            onValueChange={(val) => setSliderValues({ ...sliderValues, [type]: val[0] })}
                            max={reserve.current}
                            step={0.1}
                            disabled={reserve.current === 0}
                            className="w-full"
                          />
                          <div className="flex justify-between text-sm">
                            <span>Deploy: {deployed.toFixed(1)} kWh</span>
                            {deployed > 0 && (
                              <span className={config.color}>
                                Progress: +{progress.toFixed(1)} kWh ({((progress / requiredAmount) * 100).toFixed(0)}%)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 flex-wrap">
                  <Button
                    onClick={() => handleDeployAll('optimal')}
                    variant="outline"
                    size="sm"
                    className="border-primary/50"
                    disabled={energyReserves[challengeType].current === 0}
                  >
                    <Zap className="w-4 h-4 mr-1" />
                    Deploy All Optimal
                  </Button>
                  <Button
                    onClick={() => handleDeployAll('all')}
                    variant="outline"
                    size="sm"
                    className="border-primary/50"
                  >
                    <Zap className="w-4 h-4 mr-1" />
                    Deploy Everything
                  </Button>
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    size="sm"
                    className="border-primary/50"
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Reset Sliders
                  </Button>
                </div>

                {/* Deployment Summary */}
                <div className="p-4 rounded-lg border-2 border-primary/50 bg-primary/5">
                  <h3 className="text-lg font-bold mb-3">DEPLOYMENT SUMMARY</h3>
                  
                  {summary.deployments.length > 0 ? (
                    <div className="space-y-2 mb-4">
                      {summary.deployments.map(({ type, amount, progress }) => (
                        <div key={type} className="flex justify-between text-sm">
                          <span className={ENERGY_CONFIG[type].color}>
                            {ENERGY_CONFIG[type].label}: {amount.toFixed(1)} kWh
                          </span>
                          <span className="text-muted-foreground">→ {progress.toFixed(1)} kWh</span>
                        </div>
                      ))}
                      <div className="border-t border-primary/20 pt-2 mt-2">
                        <div className="flex justify-between font-semibold">
                          <span>Total Deployed:</span>
                          <span>{summary.totalDeployed.toFixed(1)} kWh</span>
                        </div>
                        <div className="flex justify-between font-semibold text-primary">
                          <span>Total Progress:</span>
                          <span>+{summary.totalProgress.toFixed(1)} kWh</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mb-4">No energy selected</p>
                  )}

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span>Challenge Progress:</span>
                      <span>{summary.progressPercent.toFixed(0)}%</span>
                    </div>
                    <Progress value={summary.progressPercent} className="h-3" />
                    <div className="flex justify-between text-sm">
                      <span>{summary.newProgress.toFixed(1)} / {requiredAmount.toFixed(1)} kWh</span>
                      <span className="text-amber-400">
                        Remaining: {Math.max(0, requiredAmount - summary.newProgress).toFixed(1)} kWh
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button onClick={onClose} variant="outline" className="flex-1">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDeploy}
                    disabled={summary.totalDeployed === 0 || deploying}
                    className="flex-1 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/50"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    {deploying ? 'Deploying...' : `Deploy ${summary.totalDeployed.toFixed(1)} kWh`}
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12 space-y-6"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, rotate: 360 }}
                  transition={{ type: 'spring', duration: 0.8 }}
                  className="flex justify-center"
                >
                  {challengeComplete ? (
                    <div className="text-8xl">🎉</div>
                  ) : (
                    <CheckCircle2 className="w-24 h-24 text-primary" />
                  )}
                </motion.div>

                <div>
                  <h2 className="text-3xl font-bold mb-2">
                    {challengeComplete ? 'CHALLENGE COMPLETE!' : 'ENERGY DEPLOYED!'}
                  </h2>
                  <p className="text-xl text-primary">+{summary.totalProgress.toFixed(1)} kWh Progress</p>
                </div>

                {challengeComplete ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-primary/10 rounded-lg border border-primary/50">
                      <Progress value={100} className="h-3 mb-2" />
                      <p className="font-semibold">{legs[currentLeg].to} Reached!</p>
                    </div>
                    <p className="text-sm italic text-muted-foreground">
                      "{legs[currentLeg].narrative.arrivalQuote}"
                    </p>
                    {currentLeg < legs.length - 1 && (
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm font-semibold mb-2">NEXT CHALLENGE:</p>
                        <p className="font-bold">{legs[currentLeg + 1].narrative.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Required: {legs[currentLeg + 1].requiredEnergy.amount} kWh {legs[currentLeg + 1].requiredEnergy.type}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-primary/10 rounded-lg border border-primary/50">
                      <p className="text-sm mb-2">Challenge: {summary.progressPercent.toFixed(0)}% Complete</p>
                      <Progress value={summary.progressPercent} className="h-3" />
                      <p className="text-sm mt-2 text-amber-400">
                        {(requiredAmount - summary.newProgress).toFixed(1)} kWh remaining
                      </p>
                    </div>
                    <p className="text-sm italic text-muted-foreground">
                      "Passepartout: 'Almost there, Monsieur!'"
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};
