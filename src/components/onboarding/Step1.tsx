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
      className="max-w-4xl mx-auto"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold mb-2 text-glow">
          The Reform Club, London
        </h2>
        <p className="text-muted-foreground text-lg">October 2, 2084</p>
      </div>

      <Card className="p-8 md:p-12 border-primary/20 bg-card/50 backdrop-blur relative overflow-hidden">
        {/* Victorian corner ornaments */}
        <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-primary/50" />
        <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-primary/50" />
        <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-primary/50" />
        <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-primary/50" />

        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="order-2 md:order-1">
            <div className="space-y-6 text-lg leading-relaxed">
              <p className="text-foreground/90">
                At precisely <span className="text-primary font-semibold">8:45 PM</span>, Phileas Fogg made an extraordinary wager with his fellow Reform Club members: he would travel around the world in exactly <span className="text-primary font-semibold">80 days</span>.
              </p>
              
              <p className="text-foreground/90">
                The stakes? <span className="text-primary font-semibold">£20,000</span> (adjusted for inflation: <span className="text-primary font-semibold">2 million credits</span>).
              </p>

              <p className="text-foreground/90">
                But there's a twist—in 2084, we're not traveling alone. Thousands of adventurers like you will contribute to this journey through fitness activities.
              </p>

              <div className="bg-primary/10 border border-primary/30 rounded-lg p-6 my-6">
                <h3 className="text-xl font-bold mb-3 text-primary">Your Challenge:</h3>
                <ul className="space-y-2 text-foreground/90">
                  <li>• Complete your <span className="font-semibold">OWN journey</span> around the world at your own pace</li>
                  <li>• Help the community during <span className="font-semibold">raid events</span> when Detective Fix strikes</li>
                  <li>• Track your progress through <span className="font-semibold">80 narrative days</span></li>
                </ul>
              </div>

              <p className="text-xl font-bold text-primary text-center">
                Will you join the expedition?
              </p>
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
                className="relative rounded-lg border-2 border-primary/50 shadow-lg"
              />
            </motion.div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center"
        >
          <Button
            onClick={handleAccept}
            size="lg"
            className="text-xl px-12 py-6 bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-all duration-300 shadow-lg shadow-primary/50"
          >
            I ACCEPT THE CHALLENGE
          </Button>
        </motion.div>
      </Card>
    </motion.div>
  );
};
