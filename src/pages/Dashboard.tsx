import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
import { EnergyReserveCard } from '@/components/dashboard/EnergyReserveCard';
import { ChallengeCard } from '@/components/dashboard/ChallengeCard';
import { ActivityLogger, ActivityFormData } from '@/components/ActivityLogger';
import { 
  Plus, 
  Globe, 
  Users, 
  User, 
  MapPin, 
  Calendar,
  Ruler,
  Clock,
  AlertCircle,
  Sparkles
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const journey = useJourneyStore();
  const energyStore = useEnergyStore();
  const userStore = useUserStore();
  const raidStore = useRaidStore();
  
  const [activityLoggerOpen, setActivityLoggerOpen] = useState(false);
  
  // Apply energy decay on mount and hourly
  useEffect(() => {
    energyStore.applyDecay();
    const interval = setInterval(() => {
      energyStore.applyDecay();
    }, 60 * 60 * 1000); // 1 hour

    return () => clearInterval(interval);
  }, []);

  const currentLeg = journey.legs[journey.currentLeg];
  const subscription = userStore.subscription;
  
  const trialEndDate = subscription?.trialEnd ? new Date(subscription.trialEnd) : null;
  const daysRemaining = trialEndDate 
    ? Math.ceil((trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  const handleActivitySubmit = (data: ActivityFormData) => {
    console.log('Activity logged:', data);
    // TODO: Process activity and charge energy
    setActivityLoggerOpen(false);
  };

  const handleDeploy = () => {
    console.log('Deploy energy');
    // TODO: Open deploy modal
  };

  const handleCharge = (type: string) => {
    console.log('Charge', type);
    setActivityLoggerOpen(true);
  };

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      {/* Top Bar */}
      <div className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b border-primary/20">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <button 
              onClick={() => navigate('/')}
              className="text-lg font-bold hover:text-primary transition-colors"
            >
              Around the World in 80 Ways
            </button>

            {/* Journey Status */}
            <Card className="px-4 py-2 border-primary/30 bg-primary/5 hidden md:block">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {currentLeg?.from} → {currentLeg?.to}
                </p>
                <p className="text-xl font-bold">DAY {journey.currentDay} OF 80</p>
                <Progress value={(journey.currentDay / 80) * 100} className="h-1 mt-1" />
              </div>
            </Card>

            {/* Right Side */}
            <div className="flex items-center gap-4">
              {/* Subscription Badge */}
              {subscription?.status === 'trialing' && (
                <Badge className="bg-orange-500/20 text-orange-400 border-orange-400/50 px-3 py-1 hidden md:flex">
                  🎟️ TRIAL: {daysRemaining} DAYS LEFT
                </Badge>
              )}

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-card border-primary/30 z-[100]">
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    Subscription
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN - Energy Reserves */}
          <div className="lg:col-span-3 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">YOUR ENERGY RESERVES</h2>
              <p className="text-muted-foreground text-sm mb-4">Power for Fogg's Journey</p>
              
              <div className="space-y-4">
                <EnergyReserveCard
                  type="nautical"
                  current={energyStore.nautical.current}
                  max={energyStore.nautical.max}
                  lastUpdated={energyStore.nautical.lastUpdated}
                  onCharge={() => handleCharge('nautical')}
                />
                <EnergyReserveCard
                  type="terrestrial"
                  current={energyStore.terrestrial.current}
                  max={energyStore.terrestrial.max}
                  lastUpdated={energyStore.terrestrial.lastUpdated}
                  onCharge={() => handleCharge('terrestrial')}
                />
                <EnergyReserveCard
                  type="transport"
                  current={energyStore.transport.current}
                  max={energyStore.transport.max}
                  lastUpdated={energyStore.transport.lastUpdated}
                  onCharge={() => handleCharge('transport')}
                />
                <EnergyReserveCard
                  type="strength"
                  current={energyStore.strength.current}
                  max={energyStore.strength.max}
                  lastUpdated={energyStore.strength.lastUpdated}
                  onCharge={() => handleCharge('strength')}
                />
              </div>

              <Button
                onClick={() => setActivityLoggerOpen(true)}
                className="w-full mt-6 text-lg py-6 bg-lime-400 text-black hover:bg-lime-500"
              >
                <Plus className="mr-2 h-5 w-5" />
                LOG ACTIVITY
              </Button>
            </div>
          </div>

          {/* CENTER COLUMN - Expedition Status */}
          <div className="lg:col-span-6 space-y-6">
            {/* Current Challenge */}
            <div>
              <h2 className="text-2xl font-bold mb-4">ACTIVE CHALLENGE</h2>
              {currentLeg && journey.currentChallenge && (
                <ChallengeCard
                  title={currentLeg.narrative.title}
                  from={currentLeg.from}
                  to={currentLeg.to}
                  requiredEnergy={currentLeg.requiredEnergy}
                  currentProgress={journey.currentChallenge.currentProgress}
                  onDeploy={handleDeploy}
                />
              )}
            </div>

            {/* Journey Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4 text-center border-primary/30">
                <MapPin className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="text-lg font-bold">{currentLeg?.from}</p>
              </Card>
              <Card className="p-4 text-center border-primary/30">
                <Calendar className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-xs text-muted-foreground">Day</p>
                <p className="text-lg font-bold">{journey.currentDay} / 80</p>
              </Card>
              <Card className="p-4 text-center border-primary/30">
                <Ruler className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-xs text-muted-foreground">Distance</p>
                <p className="text-lg font-bold">
                  {journey.totalDistance.toLocaleString()} km
                </p>
              </Card>
            </div>

            {/* Story Updates */}
            <div>
              <h2 className="text-xl font-bold mb-4">RECENT TRANSMISSIONS</h2>
              <Card className="p-4 border-primary/30 max-h-60 overflow-y-auto">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">Fogg</span>
                        <span className="text-xs text-muted-foreground">2h ago</span>
                      </div>
                      <p className="text-sm text-foreground/90">"We depart at 8:45 PM sharp."</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-400/20 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">Passepartout</span>
                        <span className="text-xs text-muted-foreground">2h ago</span>
                      </div>
                      <p className="text-sm text-foreground/90">"All supplies loaded, Monsieur!"</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">System</span>
                        <span className="text-xs text-muted-foreground">3h ago</span>
                      </div>
                      <p className="text-sm text-foreground/90">Journey initialized</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* RIGHT COLUMN - Challenges & Events */}
          <div className="lg:col-span-3 space-y-6">
            {/* Daily Mission */}
            <div>
              <h2 className="text-xl font-bold mb-4">DAILY MISSION</h2>
              <Card className="p-6 border-primary/30 bg-card/80">
                <div className="text-center space-y-3">
                  <Clock className="h-12 w-12 mx-auto text-primary" />
                  <h3 className="font-bold text-lg">THE DAILY CONSTITUTIONAL</h3>
                  <p className="text-sm text-muted-foreground">
                    Complete any 30-minute activity
                  </p>
                  <div className="pt-3 border-t border-muted">
                    <p className="text-xs text-muted-foreground mb-1">Reward</p>
                    <p className="text-sm font-semibold">+100 XP, Supply Cache</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Progress</p>
                    <Progress value={0} className="h-2" />
                    <p className="text-xs mt-1">0 / 1</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Resets in: 8h 23m</p>
                </div>
              </Card>
            </div>

            {/* Raid Event */}
            <div>
              <h2 className="text-xl font-bold mb-4">RAID EVENTS</h2>
              {raidStore.activeRaid ? (
                <motion.div
                  animate={{ borderColor: ['#ff4444', '#ff0000', '#ff4444'] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Card className="p-6 border-2 border-red-400 bg-red-400/5">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-red-400" />
                        <h3 className="font-bold">RAID EVENT ACTIVE!</h3>
                      </div>
                      {/* Raid details would go here */}
                    </div>
                  </Card>
                </motion.div>
              ) : (
                <Card className="p-6 border-muted bg-muted/5">
                  <div className="text-center space-y-2">
                    <p className="text-muted-foreground">No Active Raid Event</p>
                    <p className="text-sm text-muted-foreground">Next raid starts soon</p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Bar - Mobile */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-card/95 backdrop-blur border-t border-primary/20 p-4 z-40">
        <div className="grid grid-cols-4 gap-2">
          <Button
            variant="ghost"
            className="flex-col h-auto py-3"
            onClick={() => setActivityLoggerOpen(true)}
          >
            <Plus className="h-5 w-5 mb-1" />
            <span className="text-xs">LOG</span>
          </Button>
          <Button
            variant="ghost"
            className="flex-col h-auto py-3"
            onClick={() => navigate('/map')}
          >
            <Globe className="h-5 w-5 mb-1" />
            <span className="text-xs">MAP</span>
          </Button>
          <Button
            variant="ghost"
            className="flex-col h-auto py-3"
            onClick={() => navigate('/raids')}
          >
            <Users className="h-5 w-5 mb-1" />
            <span className="text-xs">RAIDS</span>
          </Button>
          <Button
            variant="ghost"
            className="flex-col h-auto py-3"
            onClick={() => navigate('/profile')}
          >
            <User className="h-5 w-5 mb-1" />
            <span className="text-xs">PROFILE</span>
          </Button>
        </div>
      </div>

      {/* Activity Logger Modal */}
      <ActivityLogger
        open={activityLoggerOpen}
        onOpenChange={setActivityLoggerOpen}
        onSubmit={handleActivitySubmit}
      />
    </div>
  );
};

export default Dashboard;
