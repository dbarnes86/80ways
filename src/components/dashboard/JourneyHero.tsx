import { motion } from 'framer-motion';
import { MapPin, ArrowRight } from 'lucide-react';

interface JourneyHeroProps {
  currentDay: number;
  totalDays: number;
  from: string;
  to: string;
  narrativeTitle: string;
}

export const JourneyHero = ({ currentDay, totalDays, from, to, narrativeTitle }: JourneyHeroProps) => {
  const progress = currentDay / totalDays;
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center text-center py-6">
      {/* Circular progress ring */}
      <div className="relative w-40 h-40 mb-4">
        <svg viewBox="0 0 130 130" className="w-full h-full -rotate-90">
          {/* Track */}
          <circle
            cx="65"
            cy="65"
            r={radius}
            fill="none"
            stroke="hsl(var(--muted) / 0.3)"
            strokeWidth="6"
          />
          {/* Progress */}
          <motion.circle
            cx="65"
            cy="65"
            r={radius}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            style={{ filter: 'drop-shadow(0 0 6px hsl(var(--primary) / 0.5))' }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-heading font-bold text-primary">{currentDay}</span>
          <span className="text-[10px] font-mono text-muted-foreground tracking-widest">OF {totalDays} DAYS</span>
        </div>
      </div>

      {/* Route */}
      <div className="flex items-center gap-2 text-sm mb-1">
        <MapPin className="w-3.5 h-3.5 text-primary" />
        <span className="font-heading font-bold">{from}</span>
        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="font-heading font-bold text-muted-foreground">{to}</span>
      </div>

      {/* Narrative title */}
      <p className="text-xs text-muted-foreground italic max-w-xs">{narrativeTitle}</p>
    </div>
  );
};
