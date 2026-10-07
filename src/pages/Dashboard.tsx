import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Plus, Swords } from 'lucide-react';
import { useEnergyStore } from '@/stores/energyStore';
import { useProgressionStore } from '@/stores/progressionStore';
import { selectHasJoined, useSeasonStore } from '@/stores/seasonStore';
import { useInboxStore } from '@/stores/inboxStore';
import { useRaidStore } from '@/stores/raidStore';
import { useAuth } from '@/contexts/AuthContext';
import { haptic } from '@/lib/native';
import { SeasonJoinPrompt } from '@/components/dashboard/SeasonJoinPrompt';
import { ConnectHealthCard } from '@/features/health';
import { ActivityLogger } from '@/components/ActivityLogger';
import { EnergyDeployment } from '@/components/EnergyDeployment';
import { JOURNEY_LEGS } from '@/data/journeyLegs';
import { ENERGY_TYPES, STARTER_EVENT } from '@/data/gameConstants';
import { formatTimeLeft, getRaidSchedule, getRaidStatus } from '@/data/raids';
import { getPlayerNarrativeDay } from '@/lib/gameEngine';
import { isHealthConnected } from '@/services/healthService';
import { CollectPanel } from '@/game/CollectPanel';
import { QuestRow } from '@/game/QuestRow';
import { ReserveTanks } from '@/game/ReserveTanks';
import { VoyageScene } from '@/game/VoyageScene';
import { useQuests } from '@/game/questActions';
import { play } from '@/game/sfx';
import { cn } from '@/components/ui';

function BigButton({ onClick, children, tone = 'primary' }: { onClick: () => void; children: React.ReactNode; tone?: 'primary' | 'magenta' }) {
  return (
    <button
      type="button"
      onClick={() => {
        haptic('tap');
        play('tick');
        onClick();
      }}
      className={cn(
        'press shine flex h-16 w-full items-center justify-center gap-3 rounded-2xl font-heading text-2xl font-bold tracking-wide',
        tone === 'primary' ? 'bg-primary text-primary-foreground shadow-[0_0_30px_hsl(var(--primary)/0.45)]' : 'bg-secondary text-white shadow-[0_0_30px_hsl(var(--secondary)/0.45)]',
      )}
    >
      {children}
    </button>
  );
}

/** Home: the voyage, anything waiting to collect, one big thing to do next, and today's quests. */
const Dashboard = () => {
  const energy = useEnergyStore();
  const { canJoinMainJourney, starterEventProgress } = useProgressionStore();
  const season = useSeasonStore();
  const hasJoined = useSeasonStore(selectHasJoined);
  const inbox = useInboxStore((s) => s.items.length);
  const raidTotals = useRaidStore((s) => s.totals);
  const { user } = useAuth();
  const quests = useQuests();

  const [loggerOpen, setLoggerOpen] = useState(false);
  const [deployOpen, setDeployOpen] = useState(false);

  const participation = hasJoined ? season.participation : null;
  const journeyDone = participation?.status === 'completed';
  const leg = JOURNEY_LEGS[participation?.currentLeg ?? 0] ?? JOURNEY_LEGS[0];
  const legFraction = participation ? participation.legProgress / leg.requiredEnergy.amount : 0;
  const hasEnergy = ENERGY_TYPES.some((t) => energy[t].current >= 0.1);
  const healthOn = !!user && isHealthConnected(user.id);

  const raids = season.activeSeason ? getRaidSchedule(season.activeSeason.startDate, season.activeSeason.endDate) : [];
  const activeRaid = raids.find((r) => getRaidStatus(r) === 'active');

  const scene = participation
    ? {
        from: journeyDone ? 'London' : leg.from,
        to: journeyDone ? 'London' : leg.to,
        progress: journeyDone ? 1 : legFraction,
        headline: journeyDone ? 'Wager won' : `Day ${getPlayerNarrativeDay(participation.currentLeg, legFraction, journeyDone)} of 80`,
        sub: journeyDone ? 'Around the world' : `Leg ${participation.currentLeg + 1} of ${JOURNEY_LEGS.length}`,
      }
    : {
        from: 'London',
        to: canJoinMainJourney ? 'The world' : 'Lift Off',
        progress: canJoinMainJourney ? 1 : starterEventProgress / STARTER_EVENT.requiredEnergy,
        headline: canJoinMainJourney ? 'Ready to sail' : `${starterEventProgress.toFixed(1)} / ${STARTER_EVENT.requiredEnergy} kWh`,
        sub: canJoinMainJourney ? 'Lift Off complete' : 'Lift Off · fill the meter',
        docked: true,
      };

  const dailyLeft = quests.daily.filter((q) => !q.claimed).length;

  return (
    <div className="mx-auto max-w-md space-y-5 px-4 pb-6 pt-4">
      <VoyageScene {...scene} />

      {activeRaid && (
        <Link to="/raids" className="press flex items-center gap-3 rounded-2xl border border-destructive/60 bg-destructive/15 p-4 shadow-[0_0_24px_hsl(var(--destructive)/0.3)]">
          <Swords className="size-8 shrink-0 animate-wobble text-destructive" />
          <div className="min-w-0 flex-1">
            <p className="font-heading text-lg font-bold text-destructive">Fix attacks!</p>
            <p className="truncate text-sm text-muted-foreground">
              {Math.max(0, activeRaid.goalKwh - (raidTotals[activeRaid.key]?.total ?? 0)).toFixed(0)} HP left · {formatTimeLeft(activeRaid.end)}
            </p>
          </div>
          <ChevronRight className="size-6 text-destructive" />
        </Link>
      )}

      {inbox > 0 ? (
        <CollectPanel />
      ) : participation && !journeyDone && hasEnergy ? (
        <BigButton onClick={() => setDeployOpen(true)}>Stoke the boiler</BigButton>
      ) : canJoinMainJourney && !hasJoined ? (
        <SeasonJoinPrompt onJoin={() => (user ? season.joinSeason(user.id) : Promise.resolve({ error: 'Not signed in' }))} />
      ) : healthOn ? (
        <div className="rounded-2xl border border-border bg-card/60 p-4 text-center">
          <p className="font-heading text-xl font-bold">Go work out.</p>
          <p className="text-sm text-muted-foreground">It’ll be waiting here to collect.</p>
        </div>
      ) : (
        <BigButton onClick={() => setLoggerOpen(true)}>
          <Plus className="size-7" /> Log a workout
        </BigButton>
      )}

      {user && <ConnectHealthCard userId={user.id} />}

      <section className="space-y-2">
        <Link to="/quests" className="flex items-baseline justify-between">
          <h2 className="font-heading text-xl font-bold">Today’s quests</h2>
          <span className="text-sm text-primary">{dailyLeft ? `${dailyLeft} left` : 'All done'} ›</span>
        </Link>
        {quests.story && !quests.story.claimed && quests.story.complete && <QuestRow quest={quests.story} compact />}
        {quests.daily.map((q) => (
          <QuestRow key={q.id} quest={q} compact />
        ))}
      </section>

      <section className="space-y-2">
        <h2 className="font-heading text-xl font-bold">Reserves</h2>
        <ReserveTanks />
      </section>

      {(healthOn || inbox > 0 || hasEnergy) && (
        <button type="button" onClick={() => setLoggerOpen(true)} className="block w-full py-2 text-center text-sm text-muted-foreground hover:text-primary">
          + Log a workout by hand
        </button>
      )}

      <ActivityLogger open={loggerOpen} onOpenChange={setLoggerOpen} />
      <EnergyDeployment open={deployOpen} onClose={() => setDeployOpen(false)} />
    </div>
  );
};

export default Dashboard;
