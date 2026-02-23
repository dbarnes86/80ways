import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useJourneyStore } from '@/stores/journeyStore';
import { useEnergyStore } from '@/stores/energyStore';
import { useUserStore } from '@/stores/userStore';
import { useAuth } from '@/contexts/AuthContext';
import { JourneyHero } from '@/components/dashboard/JourneyHero';
import { EnergyRow } from '@/components/dashboard/EnergyRow';
import { ActiveChallenge } from '@/components/dashboard/ActiveChallenge';
import { ActivityLogger } from '@/components/ActivityLogger';
import { EnergyDeployment } from '@/components/EnergyDeployment';
import { JOURNEY_LEGS } from '@/data/journeyLegs';
import { Plus, User } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const journey = useJourneyStore();
  const energyStore = useEnergyStore();
  const userStore = useUserStore();
  const { signOut } = useAuth();

  const [activityLoggerOpen, setActivityLoggerOpen] = useState(false);
  const [deploymentOpen, setDeploymentOpen] = useState(false);

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
