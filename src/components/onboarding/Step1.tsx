import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useOnboardingStore } from '@/stores/onboardingStore';
import foggPortrait from '@/assets/fogg-portrait.jpg';

export const Step1 = () => {
  const setStep = useOnboardingStore((state) => state.setStep);

  const handleAccept = () => {
    setStep(2);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto pb-8"
    >
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-4xl font-bold mb-2 text-glow">
          The Reform Club, London
        </h2>
        <p className="text-muted-foreground text-base md:text-lg">October 2, 2084</p>
      </div>

      <Card className="p-5 md:p-12 border-primary/20 bg-card/50 backdrop-blur relative overflow-hidden">
        {/* Victorian corner ornaments */}
        <div className="absolute top-0 left-0 w-12 h-12 md:w-16 md:h-16 border-t-2 border-l-2 border-primary/50" />
        <div className="absolute top-0 right-0 w-12 h-12 md:w-16 md:h-16 border-t-2 border-r-2 border-primary/50" />
        <div className="absolute bottom-0 left-0 w-12 h-12 md:w-16 md:h-16 border-b-2 border-l-2 border-primary/50" />
        <div className="absolute bottom-0 right-0 w-12 h-12 md:w-16 md:h-16 border-b-2 border-r-2 border-primary/50" />

        <div className="grid md:grid-cols-2 gap-6 items-start">
          <div className="order-2 md:order-1 space-y-4">
            <div className="space-y-4 text-base leading-relaxed">
              <p className="text-foreground/90">
                At precisely <span className="text-primary font-semibold">8:45 PM</span>, Phileas Fogg made an extraordinary wager: travel around the world in exactly <span className="text-primary font-semibold">80 days</span>.
              </p>
              
              <p className="text-foreground/90">
                The stakes? <span className="text-primary font-semibold">£20,000</span> (<span className="text-primary font-semibold">2 million credits</span>).
              </p>

              <p className="text-foreground/90">
                In 2084, thousands of adventurers like you will contribute through fitness activities.
              </p>
            </div>

            <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
              <h3 className="text-lg font-bold mb-2 text-primary">Your Challenge:</h3>
              <ul className="space-y-1.5 text-sm text-foreground/90">
                <li>• Complete your <span className="font-semibold">OWN journey</span> at your own pace</li>
                <li>• Help during <span className="font-semibold">raid events</span> when Detective Fix strikes</li>
                <li>• Track progress through <span className="font-semibold">80 narrative days</span></li>
              </ul>
            </div>
          </div>

          <div className="order-1 md:order-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
              <img 
                src={foggPortrait} 
                alt="Phileas Fogg" 
                className="relative rounded-lg border-2 border-primary/50 shadow-lg w-full max-h-[250px] md:max-h-none object-cover"
              />
            </motion.div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 text-center"
        >
          <p className="text-lg font-bold text-primary mb-4">
            Will you join the expedition?
          </p>

          <Button
            onClick={handleAccept}
            size="lg"
            className="text-lg px-8 py-5 bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-all duration-300 shadow-lg shadow-primary/50"
          >
            I ACCEPT THE CHALLENGE
          </Button>
        </motion.div>
      </Card>
    </motion.div>
  );
};
