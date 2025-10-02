import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useJourneyStore } from '@/stores/journeyStore';
import { useUserStore } from '@/stores/userStore';
import { JOURNEY_LEGS } from '@/data/journeyLegs';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Anchor, PersonStanding, Bike, Dumbbell, Sparkles } from 'lucide-react';

export const Step7 = () => {
  const { userData, setStep } = useOnboardingStore();
  const navigate = useNavigate();

  const handleEmbark = () => {
    const journeyId = crypto.randomUUID();

    // Initialize journey with all legs
    useJourneyStore.getState().startJourney(journeyId);

    // Set legs data
    const legs = JOURNEY_LEGS.map((leg, index) => ({
      ...leg,
      id: leg.id,
      legNumber: leg.legNumber,
      from: leg.from,
      to: leg.to,
      distance: leg.distance,
      requiredEnergy: leg.requiredEnergy,
      narrative: leg.narrative,
      progress: 0,
      status: (index === 0 ? 'active' : 'locked') as 'active' | 'locked' | 'completed',
    }));

    useJourneyStore.setState({
      legs,
      currentLeg: 0,
      currentChallenge: {
        legId: JOURNEY_LEGS[0].id,
        requiredEnergy: JOURNEY_LEGS[0].requiredEnergy,
        currentProgress: 0,
        deploymentsCount: 0,
        startedAt: new Date(),
      },
    });

    // Save user onboarding data
    useUserStore.getState().setUser({
      displayName: userData.displayName,
      email: userData.email,
    });

    // Navigate to dashboard
    navigate('/dashboard');
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto"
    >
      <Button
        variant="ghost"
        onClick={() => setStep(6)}
        className="mb-6 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold mb-2 text-glow">
          MISSION START: LONDON SECTOR
        </h2>
        <p className="text-muted-foreground text-lg">Your journey begins now</p>
      </div>

      {/* Status Display */}
      <Card className="p-6 border-primary/30 bg-gradient-to-br from-primary/10 to-transparent mb-6">
        <div className="space-y-2 font-mono text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">CURRENT LOCATION:</span>
            <span className="text-primary font-bold">NEO-LONDON</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">STATUS:</span>
            <span className="text-green-400 font-bold">READY FOR DEPARTURE</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">NARRATIVE DAY:</span>
            <span className="text-foreground font-bold">1 OF 80</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">ENERGY RESERVES:</span>
            <span className="text-red-400 font-bold">EMPTY</span>
          </div>
        </div>
      </Card>

      {/* Mission Brief */}
      <Card className="p-8 border-primary/20 bg-card/50 backdrop-blur mb-6">
        <h3 className="text-2xl font-bold mb-4 text-primary">THE LIFT-OFF PROTOCOL</h3>
        
        <div className="space-y-4 text-foreground/90 mb-6">
          <p>
            Before Fogg can depart London, the ship must be loaded and prepared. This is your first challenge:
          </p>

          <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
            <h4 className="font-bold mb-2">CHALLENGE: Departure Preparations</h4>
            <p className="text-sm mb-1">Required: <span className="text-magenta-400 font-bold">3.0 kWh Strength Energy</span></p>
            <p className="text-sm">Location: London Port</p>
          </div>

          <div>
            <h4 className="font-bold mb-2">How to proceed:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm ml-2">
              <li>Log your fitness activities (any type)</li>
              <li>Choose which energy reserve to charge</li>
              <li>Deploy energy to complete challenges</li>
              <li>Progress through your personal journey</li>
            </ol>
          </div>

          <p className="italic text-sm">
            Remember: This is <span className="font-bold text-primary">YOUR</span> expedition. You move at your own pace. 
            There's no pressure to rush—80 narrative days can take as long as you need in real time.
          </p>

          <p className="text-sm">
            Community Raid Events will appear periodically where you can join others to overcome Fix's sabotage!
          </p>
        </div>
      </Card>

      {/* Energy Cores Status */}
      <Card className="p-6 border-primary/20 bg-card/50 backdrop-blur mb-6">
        <h3 className="text-xl font-bold mb-4">YOUR ENERGY CORES STATUS</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { icon: Anchor, label: 'Nautical', color: 'cyan' },
            { icon: PersonStanding, label: 'Terrestrial', color: 'green' },
            { icon: Bike, label: 'Transport', color: 'orange' },
            { icon: Dumbbell, label: 'Strength', color: 'magenta' },
          ].map((energy) => (
            <div key={energy.label} className="flex items-center gap-3 p-3 bg-background/50 rounded-lg">
              <energy.icon className={`h-6 w-6 text-${energy.color}-400`} />
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold">{energy.label}</span>
                  <span className="text-sm text-muted-foreground">0 / 10 kWh</span>
                </div>
                <motion.div 
                  className="h-2 bg-muted rounded-full overflow-hidden"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className={`h-full bg-${energy.color}-400`} style={{ width: '0%' }} />
                </motion.div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Quick Tips */}
      <Card className="p-6 border-primary/30 bg-primary/5 mb-8">
        <div className="flex items-start gap-3">
          <Sparkles className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-lg mb-3">TIPS FOR SUCCESS</h3>
            <ul className="space-y-2 text-sm text-foreground/90">
              <li>• Any activity can charge any energy type</li>
              <li>• Matching activity to type = 100% efficiency (bonus!)</li>
              <li>• Mismatched = 50% efficiency (still useful)</li>
              <li>• Energy decays 5% per day if unused</li>
              <li>• Replay completed stages to compete on leaderboards</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Embark Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.05 }}
      >
        <Button
          onClick={handleEmbark}
          className="w-full text-2xl py-8 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 shadow-lg shadow-primary/50 animate-pulse"
        >
          EMBARK ON JOURNEY
        </Button>
      </motion.div>
    </motion.div>
  );
};
