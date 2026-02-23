import { motion } from 'framer-motion';
import { HolographicCard } from '@/components/ui/holographic-card';
import { LocationCard } from '@/components/map/LocationCard';
import { useJourneyStore } from '@/stores/journeyStore';
import { JOURNEY_LEGS } from '@/data/journeyLegs';
import { MapPin, Globe, Compass } from 'lucide-react';

// Simple city coordinates mapped to a 0-100 viewBox for the SVG path
const CITY_POINTS: Record<string, { x: number; y: number }> = {
  'London': { x: 48, y: 22 },
  'London Port': { x: 49, y: 23 },
  'Paris': { x: 50, y: 25 },
  'Suez': { x: 57, y: 38 },
  'Bombay': { x: 70, y: 42 },
  'Calcutta': { x: 76, y: 38 },
  'Hong Kong': { x: 84, y: 40 },
  'Yokohama': { x: 92, y: 28 },
  'San Francisco': { x: 12, y: 28 },
  'New York': { x: 26, y: 26 },
  'Liverpool': { x: 47, y: 21 },
};

export default function MapPage() {
  const journey = useJourneyStore();

  // Build stages from JOURNEY_LEGS data
  const stages = JOURNEY_LEGS.map((leg) => ({
    name: leg.to,
    country: leg.from + ' → ' + leg.to,
    distance: leg.distance,
    status: (leg.legNumber === 0 ? 'start' : leg.status) as 'complete' | 'active' | 'locked' | 'start',
    legNumber: leg.legNumber,
    narrative: leg.narrative.title,
  }));

  // Calculate path progress
  const completedLegs = JOURNEY_LEGS.filter((l) => (l.status as string) === 'complete').length;
  const totalDistance = JOURNEY_LEGS.reduce((sum, l) => sum + l.distance, 0);
  const coveredDistance = JOURNEY_LEGS.slice(0, completedLegs + 1).reduce((sum, l) => sum + l.distance, 0);

  // Build SVG path points
  const pathCities = JOURNEY_LEGS.map((leg) => CITY_POINTS[leg.to] || CITY_POINTS[leg.from]).filter(Boolean);

  const pathD = pathCities
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-glow-cyan flex items-center gap-3">
            <Globe className="w-8 h-8 text-primary" />
            EXPEDITION MAP
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {coveredDistance.toLocaleString()} / {totalDistance.toLocaleString()} km traversed
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
          <Compass className="w-4 h-4 text-primary" />
          <span>Day {journey.currentDay} of 80</span>
        </div>
      </div>

      {/* SVG Map Visualization */}
      <HolographicCard glow="cyan" className="p-4 mb-8">
        <div className="aspect-[21/9] w-full relative">
          <svg viewBox="0 0 100 60" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
            {/* Grid */}
            {Array.from({ length: 11 }).map((_, i) => (
              <line
                key={`vg-${i}`}
                x1={i * 10}
                y1={0}
                x2={i * 10}
                y2={60}
                stroke="hsl(187 100% 50% / 0.06)"
                strokeWidth={0.2}
              />
            ))}
            {Array.from({ length: 7 }).map((_, i) => (
              <line
                key={`hg-${i}`}
                x1={0}
                y1={i * 10}
                x2={100}
                y2={i * 10}
                stroke="hsl(187 100% 50% / 0.06)"
                strokeWidth={0.2}
              />
            ))}

            {/* Full path (dim) */}
            <path d={pathD} fill="none" stroke="hsl(187 100% 50% / 0.15)" strokeWidth={0.4} strokeDasharray="1 1" />

            {/* Completed path (bright) */}
            {completedLegs > 0 && (
              <motion.path
                d={pathCities
                  .slice(0, completedLegs + 1)
                  .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
                  .join(' ')}
                fill="none"
                stroke="hsl(187 100% 50%)"
                strokeWidth={0.5}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, ease: 'easeInOut' }}
              />
            )}

            {/* City dots */}
            {pathCities.map((p, i) => {
                  const currentLeg = JOURNEY_LEGS[i];
                  const legStatus = currentLeg.status as string;
                  const isComplete = legStatus === 'complete' || legStatus === 'start';
                  const isActive = legStatus === 'active';
                  const isLocked = legStatus === 'locked';

              return (
                <g key={i}>
                  {isActive && (
                    <motion.circle
                      cx={p.x}
                      cy={p.y}
                      r={2}
                      fill="none"
                      stroke="hsl(187 100% 50%)"
                      strokeWidth={0.2}
                      animate={{ r: [1.5, 3, 1.5], opacity: [0.8, 0, 0.8] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isActive ? 1.2 : 0.8}
                    fill={isComplete ? 'hsl(84 81% 44%)' : isActive ? 'hsl(187 100% 50%)' : 'hsl(240 20% 30%)'}
                  />
                  <text
                    x={p.x}
                    y={p.y - 2}
                    textAnchor="middle"
                    fill={isLocked ? 'hsl(0 0% 40%)' : 'hsl(0 0% 80%)'}
                    fontSize={1.8}
                    fontFamily="var(--font-mono)"
                  >
                    {currentLeg.to}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </HolographicCard>

      {/* Journey Stages */}
      <h2 className="text-2xl font-heading font-bold mb-4 flex items-center gap-2">
        <MapPin className="w-5 h-5 text-primary" />
        JOURNEY LEGS
      </h2>
      <div className="space-y-3">
        {stages.map((stage, index) => (
          <motion.div
            key={stage.legNumber}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.06 }}
          >
            <LocationCard
              name={stage.name}
              country={stage.country}
              distance={stage.distance}
              status={stage.status}
              legNumber={stage.legNumber}
              narrative={stage.narrative}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
