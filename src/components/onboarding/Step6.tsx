import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import foggPortrait from '@/assets/fogg-portrait.jpg';
import passepartoutPortrait from '@/assets/passepartout-portrait.jpg';
import fixPortrait from '@/assets/fix-portrait.jpg';
import aoudaPortrait from '@/assets/aouda-portrait.jpg';

export const Step6 = () => {
  const setStep = useOnboardingStore((state) => state.setStep);

  const characters = [
    {
      name: 'PHILEAS FOGG',
      role: 'THE GENTLEMAN ADVENTURER',
      image: foggPortrait,
      bio: "Methodical, punctual, and determined. Fogg believes anything is possible with precise calculation and unwavering resolve. He's betting his fortune on completing this journey.",
      color: 'cyan',
      borderClass: 'border-cyan-400',
      badgeClass: 'bg-cyan-400/20 text-cyan-400 border-cyan-400/50',
    },
    {
      name: 'PASSEPARTOUT',
      role: 'THE FAITHFUL VALET',
      image: passepartoutPortrait,
      bio: "Fogg's resourceful French valet. Quick-witted and adaptable, he keeps the journey on track through his ingenuity and street smarts.",
      color: 'green',
      borderClass: 'border-green-400',
      badgeClass: 'bg-green-400/20 text-green-400 border-green-400/50',
    },
    {
      name: 'DETECTIVE FIX',
      role: 'THE RELENTLESS PURSUER',
      image: fixPortrait,
      bio: "Scotland Yard inspector convinced Fogg is a bank robber fleeing with stolen money. He'll stop at nothing to make an arrest, even if it means sabotaging the journey.",
      color: 'red',
      borderClass: 'border-red-400',
      badgeClass: 'bg-red-400/20 text-red-400 border-red-400/50',
      warning: true,
    },
    {
      name: 'AOUDA',
      role: 'THE RESCUED PRINCESS',
      image: aoudaPortrait,
      bio: "Rescued from danger in India, she joins the expedition and brings valuable local knowledge. Her presence changes everything for Fogg.",
      color: 'purple',
      borderClass: 'border-purple-400',
      badgeClass: 'bg-purple-400/20 text-purple-400 border-purple-400/50',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-6xl mx-auto"
    >
      <Button
        variant="ghost"
        onClick={() => setStep(5)}
        className="mb-6 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-2 text-glow">
          YOUR CREW & ADVERSARIES
        </h2>
        <p className="text-muted-foreground text-lg">Meet your companions on this journey</p>
      </div>

      {/* Character Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {characters.map((character, index) => (
          <motion.div
            key={character.name}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.2, duration: 0.5 }}
            whileHover={{ scale: 1.02 }}
          >
            <Card
              className={`p-8 border-2 ${character.borderClass} bg-card/50 backdrop-blur relative overflow-hidden ${
                character.warning ? 'animate-pulse' : ''
              }`}
            >
              {/* Victorian corner ornaments */}
              <div className={`absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 ${character.borderClass}`} />
              <div className={`absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 ${character.borderClass}`} />
              <div className={`absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 ${character.borderClass}`} />
              <div className={`absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 ${character.borderClass}`} />

              <div className="flex flex-col items-center text-center">
                {/* Portrait */}
                <motion.div
                  className="mb-6 relative"
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <div className={`w-40 h-40 rounded-full border-4 ${character.borderClass} overflow-hidden relative`}>
                    <img
                      src={character.image}
                      alt={character.name}
                      className="w-full h-full object-cover"
                    />
                    {character.warning && (
                      <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                        <AlertTriangle className="h-12 w-12 text-red-400" />
                      </div>
                    )}
                  </div>
                  <div className={`absolute inset-0 rounded-full border-4 ${character.borderClass} opacity-50 blur-md`} />
                </motion.div>

                {/* Name */}
                <h3 className="text-2xl font-bold mb-2">{character.name}</h3>

                {/* Role Badge */}
                <Badge className={`${character.badgeClass} mb-4 px-3 py-1`}>
                  {character.role}
                </Badge>

                {/* Biography */}
                <p className="text-foreground/90 leading-relaxed">{character.bio}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <Button
          onClick={() => setStep(7)}
          className="w-full text-xl py-6 bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-all duration-300 shadow-lg shadow-primary/50"
        >
          MEET YOUR DESTINY
        </Button>
      </motion.div>
    </motion.div>
  );
};
