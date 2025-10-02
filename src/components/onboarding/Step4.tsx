import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useUserStore } from '@/stores/userStore';
import { 
  ArrowLeft, 
  Check,
  Anchor,
  Waves,
  Sailboat,
  Ship,
  PersonStanding,
  Footprints,
  Mountain,
  Bike,
  Activity,
  Zap,
  Dumbbell,
  Weight,
  Sparkles,
  Flame
} from 'lucide-react';

type ActivityType = {
  name: string;
  icon: any;
  energyType: 'nautical' | 'terrestrial' | 'transport' | 'strength';
};

type PerformanceTier = 'novice' | 'enhanced' | 'seasoned';

const ACTIVITIES: ActivityType[] = [
  // Nautical
  { name: 'Rowing', icon: Anchor, energyType: 'nautical' },
  { name: 'Swimming', icon: Waves, energyType: 'nautical' },
  { name: 'Sailing', icon: Sailboat, energyType: 'nautical' },
  { name: 'Kayaking', icon: Ship, energyType: 'nautical' },
  
  // Terrestrial
  { name: 'Running', icon: PersonStanding, energyType: 'terrestrial' },
  { name: 'Walking', icon: Footprints, energyType: 'terrestrial' },
  { name: 'Hiking', icon: Mountain, energyType: 'terrestrial' },
  { name: 'Jogging', icon: PersonStanding, energyType: 'terrestrial' },
  
  // Transport
  { name: 'Cycling', icon: Bike, energyType: 'transport' },
  { name: 'Skateboarding', icon: Activity, energyType: 'transport' },
  { name: 'Rollerblading', icon: Zap, energyType: 'transport' },
  { name: 'E-biking', icon: Bike, energyType: 'transport' },
  
  // Strength
  { name: 'Weightlifting', icon: Dumbbell, energyType: 'strength' },
  { name: 'CrossFit', icon: Weight, energyType: 'strength' },
  { name: 'Calisthenics', icon: Sparkles, energyType: 'strength' },
  { name: 'Yoga', icon: Flame, energyType: 'strength' },
];

const ENERGY_TYPE_CONFIG = {
  nautical: { label: 'NAUTICAL', color: 'text-cyan-400', borderColor: 'border-cyan-400' },
  terrestrial: { label: 'TERRESTRIAL', color: 'text-green-400', borderColor: 'border-green-400' },
  transport: { label: 'TRANSPORT', color: 'text-orange-400', borderColor: 'border-orange-400' },
  strength: { label: 'STRENGTH', color: 'text-magenta-400', borderColor: 'border-magenta-400' },
};

export const Step4 = () => {
  const { userData, setStep, updateUserData } = useOnboardingStore();
  const subscription = useUserStore((state) => state.subscription);
  
  const [selectedActivities, setSelectedActivities] = useState<string[]>(
    userData.selectedActivities || []
  );
  const [performanceTier, setPerformanceTier] = useState<PerformanceTier>(
    (userData.fitnessLevel as PerformanceTier) || 'enhanced'
  );
  const [weeklyGoal, setWeeklyGoal] = useState<number>(
    userData.weeklyGoal || 5
  );

  const handleActivityToggle = (activityName: string) => {
    setSelectedActivities(prev => 
      prev.includes(activityName)
        ? prev.filter(a => a !== activityName)
        : [...prev, activityName]
    );
  };

  const handleContinue = () => {
    updateUserData({
      selectedActivities,
      fitnessLevel: performanceTier,
      weeklyGoal,
    });
    setStep(5);
  };

  const groupedActivities = ACTIVITIES.reduce((acc, activity) => {
    if (!acc[activity.energyType]) {
      acc[activity.energyType] = [];
    }
    acc[activity.energyType].push(activity);
    return acc;
  }, {} as Record<string, ActivityType[]>);

  const trialEndDate = subscription?.trialEnd ? new Date(subscription.trialEnd) : null;
  const daysRemaining = trialEndDate 
    ? Math.ceil((trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 7;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-5xl mx-auto"
    >
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          onClick={() => setStep(3)}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Badge className="bg-green-500/20 text-green-400 border-green-400/50 px-4 py-2">
          <Check className="mr-2 h-4 w-4" />
          TRIAL ACTIVE • {daysRemaining} days remaining
        </Badge>
      </div>

      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold mb-2 text-glow">
          CONFIGURE BIOMETRIC SENSORS
        </h2>
        <p className="text-muted-foreground text-lg">What activities do you perform?</p>
      </div>

      <Card className="p-8 border-primary/20 bg-card/50 backdrop-blur mb-6">
        {/* Activity Selection Grid */}
        <div className="space-y-8">
          {Object.entries(groupedActivities).map(([energyType, activities]) => (
            <div key={energyType}>
              <h3 className={`text-lg font-bold mb-4 ${ENERGY_TYPE_CONFIG[energyType as keyof typeof ENERGY_TYPE_CONFIG].color}`}>
                {ENERGY_TYPE_CONFIG[energyType as keyof typeof ENERGY_TYPE_CONFIG].label}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {activities.map((activity) => {
                  const isSelected = selectedActivities.includes(activity.name);
                  const Icon = activity.icon;
                  
                  return (
                    <motion.div
                      key={activity.name}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Card
                        className={`p-6 cursor-pointer transition-all duration-300 relative ${
                          isSelected
                            ? `${ENERGY_TYPE_CONFIG[activity.energyType].borderColor} border-2 shadow-lg`
                            : 'border-muted hover:border-primary/50'
                        }`}
                        onClick={() => handleActivityToggle(activity.name)}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2">
                            <div className={`w-6 h-6 rounded-full ${ENERGY_TYPE_CONFIG[activity.energyType].borderColor.replace('border', 'bg')} flex items-center justify-center`}>
                              <Check className="h-4 w-4 text-white" />
                            </div>
                          </div>
                        )}
                        <div className="flex flex-col items-center text-center">
                          <Icon className={`h-12 w-12 mb-3 ${isSelected ? ENERGY_TYPE_CONFIG[activity.energyType].color : 'text-muted-foreground'}`} />
                          <span className={`font-semibold ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {activity.name}
                          </span>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Performance Tier */}
      <Card className="p-8 border-primary/20 bg-card/50 backdrop-blur mb-6">
        <Label className="text-2xl font-bold mb-6 block">PERFORMANCE TIER</Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { value: 'novice', label: 'NOVICE TRAVELER', desc: 'Just starting your fitness journey', color: 'blue' },
            { value: 'enhanced', label: 'ENHANCED EXPLORER', desc: 'Regular fitness activities', color: 'yellow' },
            { value: 'seasoned', label: 'SEASONED ADVENTURER', desc: 'Advanced fitness enthusiast', color: 'red' },
          ].map((tier) => (
            <motion.div
              key={tier.value}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className={`p-6 cursor-pointer transition-all duration-300 ${
                  performanceTier === tier.value
                    ? `border-${tier.color}-400 border-2 shadow-lg shadow-${tier.color}-400/20`
                    : 'border-muted hover:border-primary/50'
                }`}
                onClick={() => setPerformanceTier(tier.value as PerformanceTier)}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 mt-1 flex items-center justify-center ${
                    performanceTier === tier.value
                      ? `border-${tier.color}-400 bg-${tier.color}-400/20`
                      : 'border-muted'
                  }`}>
                    {performanceTier === tier.value && (
                      <div className={`w-2.5 h-2.5 rounded-full bg-${tier.color}-400`} />
                    )}
                  </div>
                  <div>
                    <h4 className={`font-bold mb-1 ${performanceTier === tier.value ? `text-${tier.color}-400` : 'text-foreground'}`}>
                      {tier.label}
                    </h4>
                    <p className="text-sm text-muted-foreground">{tier.desc}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Weekly Goal */}
      <Card className="p-8 border-primary/20 bg-card/50 backdrop-blur mb-6">
        <Label className="text-2xl font-bold mb-2 block">WEEKLY ACTIVITY TARGET</Label>
        <p className="text-muted-foreground mb-6">How many hours per week?</p>
        
        <div className="space-y-6">
          <div className="text-center">
            <div className="text-6xl font-bold text-primary mb-2">
              {weeklyGoal}
            </div>
            <div className="text-muted-foreground">hours per week</div>
          </div>

          <Slider
            value={[weeklyGoal]}
            onValueChange={([value]) => setWeeklyGoal(value)}
            min={0}
            max={20}
            step={1}
            className="w-full"
          />

          <div className="flex justify-between text-sm text-muted-foreground">
            <span>0</span>
            <span>5</span>
            <span>10</span>
            <span>15</span>
            <span>20</span>
          </div>
        </div>
      </Card>

      <Button
        onClick={handleContinue}
        disabled={selectedActivities.length === 0}
        className="w-full text-lg py-6 bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground transition-all duration-300"
      >
        CONTINUE
      </Button>
    </motion.div>
  );
};
