import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { HolographicCard } from '@/components/ui/holographic-card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useJourneyStore } from '@/stores/journeyStore';
import { useEnergyStore } from '@/stores/energyStore';
import { useUserStore } from '@/stores/userStore';
import { useRaidStore } from '@/stores/raidStore';
import { useAuth } from '@/contexts/AuthContext';
import { JourneyHero } from '@/components/dashboard/JourneyHero';
import { EnergyRow } from '@/components/dashboard/EnergyRow';
import { ActiveChallenge } from '@/components/dashboard/ActiveChallenge';
import { ActivityLogger } from '@/components/ActivityLogger';
import { EnergyDeployment } from '@/components/EnergyDeployment';
import { JOURNEY_LEGS } from '@/data/journeyLegs';
import { Plus, User, ChevronDown, Clock, AlertCircle, Sparkles } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const journey = useJourneyStore();
  const energyStore = useEnergyStore();
  const userStore = useUserStore();
  const raidStore = useRaidStore();
  const { signOut } = useAuth();

  const [activityLoggerOpen, setActivityLoggerOpen] = useState(false);
  const [deploymentOpen, setDeploymentOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  // Apply energy decay on mount and hourly
  useEffect(() => {
    energyStore.applyDecay();
    const interval = setInterval(() => energyStore.applyDecay(), 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const currentLeg = JOURNEY_LEGS[journey.currentLeg] || JOURNEY_LEGS[0];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Minimal top bar */}
      <div className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b border-primary/20">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="text-sm font-heading font-bold tracking-wider hover:text-primary transition-colors"
          >
            ATW80
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                <User className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 bg-card border-primary/30 z-[100]">
              <DropdownMenuItem onClick={() => navigate('/profile')}>Profile</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/profile')}>Settings</DropdownMenuItem>
              <DropdownMenuItem onClick={() => { signOut(); navigate('/login'); }}>Log Out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main content — centered single column */}
      <div className="flex-1 container mx-auto px-4 max-w-md pb-28">
        {/* 1. Journey Hero Ring */}
        <JourneyHero
          currentDay={journey.currentDay}
          totalDays={80}
          from={currentLeg.from}
          to={currentLeg.to}
          narrativeTitle={currentLeg.narrative.title}
        />

        {/* 2. Active Challenge */}
        {currentLeg && (
          <div className="mb-6">
            <ActiveChallenge
              requiredEnergy={currentLeg.requiredEnergy}
              currentProgress={journey.currentChallenge?.currentProgress ?? 0}
              onDeploy={() => setDeploymentOpen(true)}
            />
          </div>
        )}

        {/* 3. Energy Reserves */}
        <div className="mb-6">
          <p className="text-[10px] font-mono text-muted-foreground tracking-widest mb-2">ENERGY RESERVES</p>
          <EnergyRow
            reserves={{
              nautical: energyStore.nautical,
              terrestrial: energyStore.terrestrial,
              transport: energyStore.transport,
              strength: energyStore.strength,
            }}
          />
        </div>

        {/* 4. Collapsible secondary info */}
        <div className="mb-6">
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>MORE</span>
            <motion.div animate={{ rotate: moreOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="w-3.5 h-3.5" />
            </motion.div>
          </button>

          <AnimatePresence>
            {moreOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden space-y-3 pt-2"
              >
                {/* Daily Mission */}
                <HolographicCard glow="purple" corners={false} className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-heading font-bold">DAILY CONSTITUTIONAL</p>
                      <p className="text-[10px] text-muted-foreground">Complete any 30-min activity</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[10px] font-mono text-accent">0/1</p>
                      <p className="text-[9px] text-muted-foreground">Resets 8h</p>
                    </div>
                  </div>
                </HolographicCard>

                {/* Raid Alert */}
                {raidStore.activeRaid ? (
                  <HolographicCard glow="magenta" className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="w-4 h-4 text-destructive" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-heading font-bold text-destructive">RAID ACTIVE</p>
                        <p className="text-[10px] text-muted-foreground">Join the defense!</p>
                      </div>
                    </div>
                  </HolographicCard>
                ) : (
                  <HolographicCard glow="none" corners={false} className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-muted/10 border border-muted flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs font-heading font-bold text-muted-foreground">NO ACTIVE RAID</p>
                        <p className="text-[10px] text-muted-foreground">Next raid coming soon</p>
                      </div>
                    </div>
                  </HolographicCard>
                )}

                {/* Latest Transmission */}
                <HolographicCard glow="cyan" corners={false} className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-heading font-bold">LATEST TRANSMISSION</p>
                      <p className="text-[10px] text-muted-foreground italic truncate">
                        "We depart at 8:45 PM sharp." — Fogg
                      </p>
                    </div>
                  </div>
                </HolographicCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 4. Sticky LOG ACTIVITY button */}
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

      {/* Modals */}
      <ActivityLogger open={activityLoggerOpen} onOpenChange={setActivityLoggerOpen} />
      <EnergyDeployment open={deploymentOpen} onClose={() => setDeploymentOpen(false)} />
    </div>
  );
};

export default Dashboard;
