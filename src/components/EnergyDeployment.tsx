import { useEffect, useState } from 'react';
import { EnergyAllocator } from '@/components/EnergyAllocator';
import { useSeasonStore } from '@/stores/seasonStore';
import { useUserStore } from '@/stores/userStore';
import { JOURNEY_LEGS } from '@/data/journeyLegs';
import { ENERGY_THEME } from '@/data/energyTheme';
import { deployToLeg, type DeployResult, type EncounterPick } from '@/lib/gameActions';
import { toDayKey } from '@/lib/gameEngine';
import { DepartureReport, EncounterCard } from '@/game/Encounter';
import { drawEncounter, formatDeparture, inDepartureWindow } from '@/game/voyage';
import { announce, celebrate } from '@/game/rewards';
import { play } from '@/game/sfx';
import { toast } from '@/components/toast';
import { haptic } from '@/lib/native';
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui';

interface EnergyDeploymentProps {
  open: boolean;
  onClose: () => void;
}

/**
 * The day's departure: today's encounter card (once a day), then the spend, then what happened.
 * After the first stoke of the day it's just the spend.
 */
export const EnergyDeployment = ({ open, onClose }: EnergyDeploymentProps) => {
  const participation = useSeasonStore((s) => s.participation);
  const departure = useUserStore((s) => s.departureMinutes);
  const played = useUserStore((s) => !!s.voyageLog[toDayKey(new Date())]?.encounter);
  const [submitting, setSubmitting] = useState(false);
  const [pick, setPick] = useState<EncounterPick | null>(null);
  const [report, setReport] = useState<DeployResult | null>(null);

  // Each opening starts fresh.
  useEffect(() => {
    if (open) {
      setPick(null);
      setReport(null);
    }
  }, [open]);

  const leg = JOURNEY_LEGS[participation?.currentLeg ?? 0];
  if (!participation || !leg) return null;
  const theme = ENERGY_THEME[leg.requiredEnergy.type];
  const card = played ? undefined : drawEncounter(participation.currentLeg, toDayKey(new Date()));
  const onTime = inDepartureWindow(new Date(), departure);

  const pay = (res: DeployResult) => {
    play(res.legCompleted ? 'whoosh' : 'collect');
    haptic(res.legCompleted ? 'success' : 'tap');
    announce({
      xp: res.xp,
      credits: res.legCompleted ? 0 : res.credits - res.souvenirCredits,
      levelUp: res.levelUp,
      legCompletedCity: res.legCompleted ? JOURNEY_LEGS[res.legIndex].to : undefined,
      legCredits: res.credits - res.souvenirCredits,
      journeyComplete: res.journeyComplete,
    });
    if (res.souvenirCredits) celebrate({ kind: 'quest', title: `${JOURNEY_LEGS[res.legIndex].to} souvenirs complete`, xp: 0, credits: res.souvenirCredits });
  };

  const handleSubmit = async (selection: Parameters<typeof deployToLeg>[0]) => {
    setSubmitting(true);
    try {
      const res = await deployToLeg(selection, pick ?? undefined);
      if (res.encounter || res.punctual) {
        // Show what happened before the payout plays over it.
        play(res.encounter?.outcome === 'triumph' ? 'chime' : 'flip');
        haptic(res.encounter?.outcome === 'triumph' ? 'success' : 'tap');
        setReport(res);
      } else {
        onClose();
        pay(res);
      }
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

  const finish = () => {
    const res = report;
    onClose();
    if (res) pay(res);
  };

  const step = report ? 'report' : card && !pick ? 'card' : 'spend';
  const chosen = pick && card ? card.choices[pick.choice] : undefined;

  return (
    <Dialog open={open} onClose={() => (report ? finish() : onClose())} className="max-w-xl max-h-[90vh] overflow-y-auto bg-background border-2 border-accent/50">
      {step === 'report' && report ? (
        <DepartureReport res={report} onDone={finish} />
      ) : step === 'card' && card ? (
        <EncounterCard card={card} departure={formatDeparture(departure)} onTime={onTime} onPick={(choice) => setPick({ id: card.id, choice })} />
      ) : (
        <div className="space-y-5">
          <DialogHeader>
            <p className="kicker text-accent">{chosen ? card!.title : leg.narrative.title}</p>
            <DialogTitle className="text-3xl font-heading font-bold">{chosen ? chosen.label : 'Stoke the boiler'}</DialogTitle>
            <DialogDescription className="text-base">
              {leg.from} → {leg.to}. {Math.max(0, leg.requiredEnergy.amount - participation.legProgress).toFixed(1)} kWh of{' '}
              <span className={theme.text}>{theme.label}</span> to go.
              {onTime && ' On time for departure.'}
            </DialogDescription>
          </DialogHeader>

          <EnergyAllocator
            targetType={leg.requiredEnergy.type}
            required={leg.requiredEnergy.amount}
            progress={participation.legProgress}
            submitLabel="Stoke the boiler"
            submitting={submitting}
            onSubmit={handleSubmit}
            onCancel={onClose}
          />
        </div>
      )}
    </Dialog>
  );
};
