import { MapPin, ArrowRight } from 'lucide-react';

interface JourneyHeroProps {
  currentDay: number;
  totalDays: number;
  from: string;
  to: string;
  legLabel: string;
  seasonNote?: string;
}

export const JourneyHero = ({ currentDay, totalDays, from, to, legLabel, seasonNote }: JourneyHeroProps) => {
  const progress = Math.min(1, currentDay / totalDays);
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center text-center py-4">
      <div className="relative w-40 h-40 mb-4">
        <svg viewBox="0 0 130 130" className="w-full h-full -rotate-90">
          <circle cx="65" cy="65" r={radius} fill="none" stroke="hsl(var(--muted) / 0.3)" strokeWidth="6" />
          <circle
            cx="65"
            cy="65"
            r={radius}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ filter: 'drop-shadow(0 0 6px hsl(var(--primary) / 0.5))', transition: 'stroke-dashoffset 1.5s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] font-mono text-muted-foreground tracking-widest">DAY</span>
          <span className="text-3xl font-heading font-bold text-primary">{currentDay}</span>
          <span className="text-[10px] font-mono text-muted-foreground tracking-widest">OF {totalDays}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm mb-1">
        <MapPin className="w-3.5 h-3.5 text-primary" />
        <span className="font-heading font-bold">{from}</span>
        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="font-heading font-bold text-muted-foreground">{to}</span>
      </div>
      <p className="text-xs text-muted-foreground font-mono">{legLabel}</p>
      {seasonNote && <p className="text-[11px] text-muted-foreground mt-1">{seasonNote}</p>}
    </div>
  );
};
