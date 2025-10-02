import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { ArrowLeft, ClipboardList, Info, Check } from 'lucide-react';

export const Step5 = () => {
  const { setStep, updateUserData } = useOnboardingStore();

  const handleSkip = () => {
    updateUserData({
      selectedActivities: ['manual'],
    });
    setStep(6);
  };

  const connections = [
    {
      name: 'Apple Health',
      subtitle: 'Apple Health Core',
      status: 'coming-soon',
      description: 'Automatic sync from iPhone',
      icon: '🍎',
      available: false,
    },
    {
      name: 'Google Fit',
      subtitle: 'Google Fit Matrix',
      status: 'coming-soon',
      description: 'Automatic sync from Android',
      icon: '🤖',
      available: false,
    },
    {
      name: 'Strava',
      subtitle: 'Strava Net',
      status: 'coming-soon',
      description: 'Sync from Strava app',
      icon: '🏃',
      available: false,
    },
    {
      name: 'Manual Input',
      subtitle: 'Manual Logbook',
      status: 'available',
      description: 'Log activities manually',
      icon: <ClipboardList className="h-16 w-16" />,
      available: true,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto"
    >
      <Button
        variant="ghost"
        onClick={() => setStep(4)}
        className="mb-6 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold mb-2 text-glow">
          ESTABLISH NEURAL LINK
        </h2>
        <p className="text-muted-foreground text-lg mb-4">Connect your fitness tracking devices</p>
        <p className="text-foreground/90 max-w-2xl mx-auto">
          In 1872, Fogg relied on pocket watches and telegrams. In 2084, we have something better. 
          Connect your fitness trackers to automatically sync your activities.
        </p>
      </div>

      {/* Connection Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {connections.map((connection, index) => (
          <motion.div
            key={connection.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              className={`p-8 relative overflow-hidden transition-all duration-300 ${
                connection.available
                  ? 'border-primary/50 hover:border-primary cursor-pointer hover:shadow-lg hover:shadow-primary/20'
                  : 'border-muted bg-muted/10 opacity-60'
              }`}
            >
              {/* Victorian corner ornaments */}
              {connection.available && (
                <>
                  <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-primary/50" />
                  <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-primary/50" />
                  <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-primary/50" />
                  <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-primary/50" />
                </>
              )}

              <div className="flex flex-col items-center text-center">
                {/* Icon */}
                <div className={`mb-4 ${connection.available ? 'text-primary' : 'text-muted-foreground'}`}>
                  {typeof connection.icon === 'string' ? (
                    <div className="text-6xl">{connection.icon}</div>
                  ) : (
                    connection.icon
                  )}
                </div>

                {/* Name and Badge */}
                <h3 className="text-xl font-bold mb-2">{connection.name}</h3>
                <p className="text-muted-foreground mb-3">{connection.subtitle}</p>
                
                <Badge
                  className={
                    connection.available
                      ? 'bg-green-500/20 text-green-400 border-green-400/50 mb-4'
                      : 'bg-muted/20 text-muted-foreground border-muted mb-4'
                  }
                >
                  {connection.status === 'available' ? (
                    <>
                      <Check className="mr-1 h-3 w-3" />
                      AVAILABLE
                    </>
                  ) : (
                    'COMING SOON'
                  )}
                </Badge>

                {/* Description */}
                <p className="text-sm text-muted-foreground">{connection.description}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Information Box */}
      <Card className="p-6 border-primary/30 bg-primary/5 mb-8">
        <div className="flex items-start gap-3">
          <Info className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
          <div className="space-y-3">
            <h3 className="font-bold text-lg">INTEGRATION STATUS</h3>
            <div className="space-y-2 text-sm text-foreground/90">
              <p>Neural sync integration is under development.</p>
              <p>Manual activity logging is fully functional and ready to use.</p>
              <p className="font-semibold mt-4">Automatic sync will be available in future updates:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Apple Health (iOS) - Version 2.0</li>
                <li>Google Fit (Android) - Version 2.0</li>
                <li>Strava Integration - Version 2.1</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>

      <Button
        onClick={handleSkip}
        className="w-full text-lg py-6 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300"
      >
        SKIP FOR NOW
      </Button>
    </motion.div>
  );
};
