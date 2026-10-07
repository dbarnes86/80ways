import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useEnergyStore } from '@/stores/energyStore';
import { useProgressionStore } from '@/stores/progressionStore';
import { selectHasJoined, useSeasonStore } from '@/stores/seasonStore';
import { useActivityStore } from '@/stores/activityStore';
import { useUserStore } from '@/stores/userStore';
import { useRaidStore } from '@/stores/raidStore';
import { useAuth } from '@/contexts/AuthContext';
import { JourneyHero } from '@/components/dashboard/JourneyHero';
import { EnergyRow } from '@/components/dashboard/EnergyRow';
import { ActiveChallenge } from '@/components/dashboard/ActiveChallenge';
import { StarterEvent } from '@/components/dashboard/StarterEvent';
import { SeasonJoinPrompt } from '@/components/dashboard/SeasonJoinPrompt';
import { PlayerLevelBar } from '@/components/dashboard/PlayerLevelBar';
import { ActivityLogger } from '@/components/ActivityLogger';
import { EnergyDeployment } from '@/components/EnergyDeployment';
import { JOURNEY_LEGS } from '@/data/journeyLegs';
import { DAILY_MISSION, ENERGY_TYPES } from '@/data/gameConstants';
import { formatTimeLeft, getRaidSchedule, getRaidStatus } from '@/data/raids';
import { computeStreak, getPlayerNarrativeDay, toDayKey } from '@/lib/gameEngine';
import { Plus, Clock, AlertCircle, Sparkles, Flame, ShieldOff, Trophy, Loader2 } from 'lucide-react';
import { Button, HoloCard } from '@/components/ui';

const Dashboard = () => {
  const energy = useEnergyStore();
  const { canJoinMainJourney } = useProgressionStore();
  const season = useSeasonStore();
  const hasJoined = useSeasonStore(selectHasJoined);
  const activities = useActivityStore((s) => s.activities);
  const lastDailyMission = useUserStore((s) => s.lastDailyMission);
  const decayFrozenUntil = useUserStore((s) => s.effects.decayInhibitorUntil);
  const raidTotals = useRaidStore((s) => s.totals);
  const { user } = useAuth();

  const [activityLoggerOpen, setActivityLoggerOpen] = useState(false);
  const [deploymentOpen, setDeploymentOpen] = useState(false);

  const participation = hasJoined ? season.participation : null;
  const journeyDone = participation?.status === 'completed';
  const currentLeg = JOURNEY_LEGS[participation?.currentLeg ?? 0] ?? JOURNEY_LEGS[0];
  const legFraction = participation ? participation.legProgress / currentLeg.requiredEnergy.amount : 0;
  const hasEnergy = ENERGY_TYPES.some((t) => energy[t].current >= 0.1);

  // Phase logic: starter → join prompt → main journey
  const showStarterEvent = !canJoinMainJourney;
  const showJoinPrompt = canJoinMainJourney && !hasJoined;
  const showMainJourney = canJoinMainJourney && hasJoined;

  const today = toDayKey(new Date());
  const dailyDone = lastDailyMission === today;
  const streak = computeStreak(activities.map((a) => a.timestamp));
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);

  const raids = season.activeSeason ? getRaidSchedule(season.activeSeason.startDate, season.activeSeason.endDate) : [];
  const activeRaid = raids.find((r) => getRaidStatus(r) === 'active');
  const nextRaid = raids.find((r) => getRaidStatus(r) === 'upcoming');

  const daysLeft = season.activeSeason
    ? Math.max(0, Math.ceil((season.activeSeason.endDate.getTime() - Date.now()) / 86_400_000))
    : null;

  const frozen = decayFrozenUntil && new Date(decayFrozenUntil) > new Date();

  return (
    <div className="bg-background flex flex-col">
      <div className="flex-1 container mx-auto px-4 max-w-md pb-28">
        <div className="mt-4 mb-6">
          <PlayerLevelBar />
        </div>

        {/* Phase 1: Lift Off starter event */}
        {showStarterEvent && (
          <div className="mb-6">
            <StarterEvent />
          </div>
        )}

        {/* Phase 2: Board the season */}
        {showJoinPrompt && (
          <div className="mb-6">
            {season.loaded ? (
              season.activeSeason ? (
                <SeasonJoinPrompt onJoin={() => (user ? season.joinSeason(user.id) : Promise.resolve({ error: 'Not signed in' }))} />
              ) : (
                <div className="border border-border rounded-xl p-5 text-center text-sm text-muted-foreground">
                  Couldn't reach the shipping office to find this season. Check your connection and refresh.
                </div>
              )
            ) : (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}
          </div>
        )}

        {/* Phase 3: The journey */}
        {showMainJourney && participation && (
          <>
            <JourneyHero
              currentDay={getPlayerNarrativeDay(participation.currentLeg, legFraction, journeyDone)}
              totalDays={80}
              from={journeyDone ? 'London' : currentLeg.from}
              to={journeyDone ? 'London' : currentLeg.to}
              legLabel={journeyDone ? 'JOURNEY COMPLETE' : `LEG ${participation.currentLeg + 1} OF ${JOURNEY_LEGS.length}`}
              seasonNote={daysLeft !== null ? `${daysLeft} days left in ${season.activeSeason?.name ?? 'the season'}` : undefined}
            />

            <div className="mb-6">
              {journeyDone ? (
                <HoloCard glow="magenta" className="p-5 text-center space-y-2">
                  <Trophy className="w-8 h-8 text-secondary mx-auto" />
                  <p className="font-heading font-bold text-lg">Wager won</p>
                  <p className="text-sm text-muted-foreground">
                    You've made it around the world. Keep charging for raids and climb the leaderboard until the season closes.
                  </p>
                  <Link to="/leaderboard" className="text-sm text-primary hover:underline">See the leaderboard</Link>
                </HoloCard>
              ) : (
                <ActiveChallenge
                  title={currentLeg.narrative.title}
                  description={currentLeg.narrative.description}
                  requiredEnergy={currentLeg.requiredEnergy}
                  currentProgress={participation.legProgress}
                  canDeploy={hasEnergy}
                  onDeploy={() => setDeploymentOpen(true)}
                />
              )}
            </div>
          </>
        )}

        {/* Energy Reserves */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-mono text-muted-foreground tracking-widest">ENERGY RESERVES</p>
            <p className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
              {frozen ? (
                <>
                  <ShieldOff className="w-3 h-3 text-accent" />
                  <span className="text-accent">Decay frozen {formatTimeLeft(new Date(decayFrozenUntil!))}</span>
                </>
              ) : (
                '−5% / day'
              )}
            </p>
          </div>
          <EnergyRow
            reserves={{
              nautical: energy.nautical,
              terrestrial: energy.terrestrial,
              transport: energy.transport,
              strength: energy.strength,
            }}
          />
        </div>

        {/* Secondary info */}
        <div className="space-y-3">
          <HoloCard glow="purple" corners={false} className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-heading font-bold">{DAILY_MISSION.name.toUpperCase()}</p>
                <p className="text-[10px] text-muted-foreground">
                  {DAILY_MISSION.description} · +{DAILY_MISSION.xpReward} XP, +{DAILY_MISSION.creditReward} credits
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`text-[10px] font-mono ${dailyDone ? 'text-success' : 'text-accent'}`}>{dailyDone ? '1/1 ✓' : '0/1'}</p>
                <p className="text-[9px] text-muted-foreground">Resets {formatTimeLeft(midnight)}</p>
              </div>
            </div>
          </HoloCard>

          {streak > 0 && (
            <HoloCard glow="none" corners={false} className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-secondary/10 border border-secondary/30 flex items-center justify-center flex-shrink-0">
                  <Flame className="w-4 h-4 text-secondary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-heading font-bold">{streak}-DAY STREAK</p>
                  <p className="text-[10px] text-muted-foreground">Log something every day to keep it going</p>
                </div>
              </div>
            </HoloCard>
          )}

          <Link to="/raids" className="block">
            {activeRaid ? (
              <HoloCard glow="magenta" className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-4 h-4 text-destructive" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-heading font-bold text-destructive">RAID: {activeRaid.name.toUpperCase()}</p>
                    <p className="text-[10px] text-muted-foreground">
                      Fix has {Math.max(0, activeRaid.goalKwh - (raidTotals[activeRaid.key]?.total ?? 0)).toFixed(0)} HP left · ends in {formatTimeLeft(activeRaid.end)}
                    </p>
                  </div>
                </div>
              </HoloCard>
            ) : (
              <HoloCard glow="none" corners={false} className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-muted/10 border border-muted flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs font-heading font-bold text-muted-foreground">NO ACTIVE RAID</p>
                    <p className="text-[10px] text-muted-foreground">
                      {nextRaid ? `${nextRaid.name} in ${formatTimeLeft(nextRaid.start)}` : 'No more raids this season'}
                    </p>
                  </div>
                </div>
              </HoloCard>
            )}
          </Link>

          <HoloCard glow="cyan" corners={false} className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-heading font-bold">LATEST TRANSMISSION</p>
                <p className="text-[11px] text-muted-foreground italic">
                  {showMainJourney && !journeyDone ? currentLeg.narrative.departureQuote : JOURNEY_LEGS[0].narrative.departureQuote}
                </p>
              </div>
            </div>
          </HoloCard>
        </div>
      </div>

      {/* Sticky LOG ACTIVITY button */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-t from-background via-background/95 to-transparent">
        <div className="max-w-md mx-auto">
          <Button
            onClick={() => setActivityLoggerOpen(true)}
            className="w-full text-lg py-7 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_hsl(var(--primary)/0.4)] font-heading tracking-wider"
          >
            <Plus className="mr-2 h-5 w-5" />
            LOG ACTIVITY
          </Button>
        </div>
      </div>

      <ActivityLogger open={activityLoggerOpen} onOpenChange={setActivityLoggerOpen} />
      <EnergyDeployment open={deploymentOpen} onClose={() => setDeploymentOpen(false)} />
    </div>
  );
};

export default Dashboard;
