import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useEnergyStore } from '@/stores/energyStore';
import { useProgressionStore } from '@/stores/progressionStore';
import { selectHasJoined, useSeasonStore } from '@/stores/seasonStore';
import { useInboxStore } from '@/stores/inboxStore';
import { useMembershipStore } from '@/stores/membershipStore';
import { useUserStore } from '@/stores/userStore';
import { useAuth } from '@/contexts/AuthContext';
import { ConnectHealthCard } from '@/features/health';
import { ActivityLogger } from '@/components/ActivityLogger';
import { EnergyDeployment } from '@/components/EnergyDeployment';
import { toast } from '@/components/toast';
import { cn } from '@/components/ui';
import { JOURNEY_LEGS } from '@/data/journeyLegs';
import { BOOSTERS, ENERGY_TYPES, MAIN_JOURNEY_UNLOCK_LEVEL, STARTER_EVENT } from '@/data/gameConstants';
import { getRaidSchedule, getRaidStatus } from '@/data/raids';
import { getPlayerNarrativeDay } from '@/lib/gameEngine';
import { needsPass } from '@/lib/gameActions';
import { isHealthConnected } from '@/services/healthService';
import { CollectPanel } from '@/game/CollectPanel';
import { NextMoveCard } from '@/game/NextMoveCard';
import { ReserveTanks } from '@/game/ReserveTanks';
import { VoyageScene } from '@/game/VoyageScene';
import { nextMove } from '@/game/nextMove';
import { useQuests } from '@/game/questActions';
import { celebrate } from '@/game/rewards';
import { play } from '@/game/sfx';
import { isUnlocked } from '@/game/unlocks';

/**
 * Home fits one screen, top to bottom: where you are (the voyage), the one thing to do next,
 * one line for today's quests, one row of reserves. Anything waiting to collect takes the "next"
 * slot.
 */
const Dashboard = () => {
  const energy = useEnergyStore();
  const progression = useProgressionStore();
  const season = useSeasonStore();
  const hasJoined = useSeasonStore(selectHasJoined);
  const inbox = useInboxStore((s) => s.items.length);
  const credits = useUserStore((s) => s.inventory.credits);
  const inventory = useUserStore((s) => s.inventory);
  const discipline = useUserStore((s) => s.discipline);
  const armed = useUserStore((s) => s.armedBooster === 'energyAmplifier' && s.inventory.energyAmplifier > 0);
  useMembershipStore((s) => s.membership); // re-render when the pass changes
  const { user } = useAuth();
  const quests = useQuests();
  const [params, setParams] = useSearchParams();

  const [loggerOpen, setLoggerOpen] = useState(false);
  const [deployOpen, setDeployOpen] = useState(false);

  // Quests link here with ?log=1 or ?deploy=1.
  useEffect(() => {
    if (params.get('log')) setLoggerOpen(true);
    if (params.get('deploy')) setDeployOpen(true);
    if (params.get('log') || params.get('deploy')) setParams({}, { replace: true });
  }, [params, setParams]);

  const participation = hasJoined ? season.participation : null;
  const journeyDone = participation?.status === 'completed';
  const leg = JOURNEY_LEGS[participation?.currentLeg ?? 0] ?? JOURNEY_LEGS[0];
  const legFraction = participation ? participation.legProgress / leg.requiredEnergy.amount : 0;
  const totalEnergy = ENERGY_TYPES.reduce((t, k) => t + energy[k].current, 0);
  const healthOn = !!user && isHealthConnected(user.id);
  const raids = season.activeSeason ? getRaidSchedule(season.activeSeason.startDate, season.activeSeason.endDate) : [];
  const raidActive = raids.some((r) => getRaidStatus(r) === 'active');
  const locked = needsPass(participation);

  const claimable = [quests.story, ...quests.daily, ...quests.weekly].find((q) => q && q.complete && !q.claimed);

  const move = nextMove({
    claimable,
    starterDone: progression.starterEventCompleted,
    starterProgress: progression.starterEventProgress,
    starterRequired: STARTER_EVENT.requiredEnergy,
    level: progression.level,
    unlockLevel: MAIN_JOURNEY_UNLOCK_LEVEL,
    seasonOpen: !!season.activeSeason && season.activeSeason.status !== 'completed',
    joined: !!participation,
    journeyDone,
    needsPass: locked,
    passCity: JOURNEY_LEGS[Math.max(0, (participation?.currentLeg ?? 1) - 1)]?.to ?? 'Paris',
    leg: participation ? { to: leg.to, type: leg.requiredEnergy.type, remaining: Math.max(0, leg.requiredEnergy.amount - participation.legProgress) } : undefined,
    energy: totalEnergy,
    raidActive,
    healthOn,
    credits,
    boosters: inventory.energyAmplifier + inventory.multiCharge + inventory.decayInhibitor,
    cheapestBooster: Math.min(...Object.values(BOOSTERS).map((b) => b.price)),
    storeOpen: isUnlocked('store', progression.level),
    raidsOpen: isUnlocked('raids', progression.level),
    discipline,
    armed,
  });

  const board = async () => {
    if (!user) return;
    const res = await season.joinSeason(user.id);
    if (res.error) {
      toast({ title: 'Couldn’t board', description: res.error, variant: 'destructive' });
      return;
    }
    play('whoosh');
    const joinedAt = useSeasonStore.getState().participation?.currentLeg ?? 0;
    celebrate({ kind: 'stamp', city: JOURNEY_LEGS[joinedAt]?.from ?? 'London', credits: 0 });
  };

  const scene = participation
    ? {
        from: journeyDone ? 'London' : leg.from,
        to: journeyDone ? 'London' : leg.to,
        progress: journeyDone ? 1 : legFraction,
        headline: journeyDone ? 'Wager won' : `Day ${getPlayerNarrativeDay(participation.currentLeg, legFraction, journeyDone)} of 80`,
        sub: journeyDone ? 'Around the world' : `Leg ${participation.currentLeg + 1} of ${JOURNEY_LEGS.length}`,
      }
    : progression.starterEventCompleted
      ? { from: 'London', to: 'Paris', progress: 0, headline: 'In port', sub: 'Next stop: Paris', docked: true }
      : {
          from: 'London',
          to: 'Lift Off',
          progress: progression.starterEventProgress / STARTER_EVENT.requiredEnergy,
          headline: 'Lift Off',
          sub: `${progression.starterEventProgress.toFixed(1)} of ${STARTER_EVENT.requiredEnergy} kWh${armed ? ' · next workout ×2' : ''}`,
          docked: true,
        };

  const dailyLeft = quests.daily.filter((q) => !q.claimed).length;

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 pb-6 pt-4">
      <VoyageScene {...scene} />

      {inbox > 0 ? (
        <CollectPanel />
      ) : (
        <NextMoveCard move={move} onLog={() => setLoggerOpen(true)} onDeploy={() => setDeployOpen(true)} onBoard={board} />
      )}

      {user && <ConnectHealthCard userId={user.id} />}

      {/* One line each: the detail lives on its own tab, Home stays on one screen. */}
      {isUnlocked('quests', progression.level) && (
        <Link to="/quests" className="press panel flex items-center gap-3 px-4 py-3">
          <span className="font-heading text-xl font-bold">Today’s quests</span>
          <span className="flex flex-1 justify-end gap-1.5" aria-hidden>
            {quests.daily.map((q) => (
              <span key={q.id} className={cn('size-2.5 rounded-full', q.claimed ? 'bg-accent' : q.complete ? 'animate-pulse-soft bg-success' : 'bg-muted')} />
            ))}
          </span>
          <span className="text-sm text-muted-foreground">{dailyLeft ? `${dailyLeft} left` : 'All done'} ›</span>
        </Link>
      )}

      {isUnlocked('reserves', progression.level) && <ReserveTanks />}

      <ActivityLogger open={loggerOpen} onOpenChange={setLoggerOpen} />
      <EnergyDeployment open={deployOpen} onClose={() => setDeployOpen(false)} />
    </div>
  );
};

export default Dashboard;
