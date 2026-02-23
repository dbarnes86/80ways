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
            {/* Simplified world map continents */}
            <g opacity={0.15} fill="none" stroke="hsl(187 100% 50%)" strokeWidth={0.3}>
              {/* North America */}
              <path d="M5,12 L8,10 L12,8 L18,7 L22,8 L25,10 L28,9 L30,11 L28,14 L30,16 L28,18 L26,20 L24,22 L22,26 L20,30 L18,32 L16,30 L14,28 L12,24 L10,20 L8,18 L6,16 L5,14 Z" />
              {/* South America */}
              <path d="M22,34 L24,32 L26,34 L28,36 L30,40 L30,44 L28,48 L26,50 L24,52 L22,50 L20,46 L20,42 L20,38 L22,34 Z" />
              {/* Europe */}
              <path d="M44,10 L46,8 L48,9 L50,8 L52,9 L54,10 L52,12 L54,14 L52,16 L50,18 L48,16 L46,14 L44,12 Z" />
              {/* Africa */}
              <path d="M44,20 L48,18 L52,18 L56,20 L58,24 L60,28 L60,32 L58,36 L56,40 L54,44 L52,46 L50,44 L48,40 L46,36 L44,32 L44,28 L42,24 L44,20 Z" />
              {/* Asia */}
              <path d="M54,8 L58,6 L62,5 L66,4 L70,5 L74,6 L78,5 L82,6 L86,8 L90,10 L92,12 L94,14 L92,16 L90,18 L88,20 L86,22 L82,24 L78,22 L74,20 L70,18 L66,16 L62,14 L58,12 L56,10 Z" />
              {/* India subcontinent */}
              <path d="M66,20 L70,22 L72,26 L74,30 L72,34 L70,36 L68,34 L66,30 L64,26 L66,22 Z" />
              {/* Southeast Asia / Indonesia */}
              <path d="M78,26 L80,24 L82,26 L84,28 L86,26 L88,28 L90,30 L88,32 L86,30 L84,32 L82,30 L80,28 Z" />
              {/* Australia */}
              <path d="M82,38 L86,36 L90,36 L94,38 L96,40 L96,44 L94,46 L90,48 L86,46 L84,44 L82,42 L82,38 Z" />
              {/* Japan */}
              <path d="M88,12 L90,10 L92,12 L90,14 L88,12 Z" />
              {/* UK / British Isles */}
              <path d="M45,11 L46,10 L47,11 L46,13 L45,12 Z" />
              {/* Greenland */}
              <path d="M30,4 L34,3 L38,4 L36,7 L32,7 L30,5 Z" />
            </g>

            {/* Grid */}
            {Array.from({ length: 11 }).map((_, i) => (
              <line
                key={`vg-${i}`}
                x1={i * 10}
                y1={0}
                x2={i * 10}
                y2={60}
                stroke="hsl(187 100% 50% / 0.04)"
                strokeWidth={0.15}
              />
            ))}
            {Array.from({ length: 7 }).map((_, i) => (
              <line
                key={`hg-${i}`}
                x1={0}
                y1={i * 10}
                x2={100}
                y2={i * 10}
                stroke="hsl(187 100% 50% / 0.04)"
                strokeWidth={0.15}
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
