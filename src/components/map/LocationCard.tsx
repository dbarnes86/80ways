import { motion } from 'framer-motion';
import { HolographicCard } from '@/components/ui/holographic-card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Lock, MapPin, Navigation } from 'lucide-react';
import type { GlowColor } from '@/components/ui/holographic-card';

type LocationStatus = 'complete' | 'active' | 'locked' | 'start';

interface LocationCardProps {
  name: string;
  country: string;
  distance: number;
  status: LocationStatus;
  legNumber: number;
  narrative?: string;
  onClick?: () => void;
}

const STATUS_CONFIG: Record<LocationStatus, { glow: GlowColor; badge: string; badgeClass: string }> = {
  start: {
    glow: 'cyan',
    badge: 'ORIGIN',
    badgeClass: 'bg-primary/20 text-primary border-primary/40',
  },
  complete: {
    glow: 'none',
    badge: 'COMPLETE',
    badgeClass: 'bg-success/20 text-success border-success/40',
  },
  active: {
    glow: 'cyan',
    badge: 'CURRENT',
    badgeClass: 'bg-primary/20 text-primary border-primary/40',
  },
  locked: {
    glow: 'none',
    badge: 'LOCKED',
    badgeClass: 'bg-muted/20 text-muted-foreground border-muted',
  },
};

const StatusIcon = ({ status }: { status: LocationStatus }) => {
  switch (status) {
    case 'complete':
      return <CheckCircle className="w-5 h-5 text-success" />;
    case 'active':
      return (
        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>
          <Navigation className="w-5 h-5 text-primary" />
        </motion.div>
      );
    case 'locked':
      return <Lock className="w-5 h-5 text-muted-foreground" />;
    default:
      return <MapPin className="w-5 h-5 text-primary" />;
  }
};

export const LocationCard = ({
  name,
  country,
  distance,
  status,
  legNumber,
  narrative,
  onClick,
}: LocationCardProps) => {
  const config = STATUS_CONFIG[status];
  const isLocked = status === 'locked';

  return (
    <HolographicCard
      glow={config.glow}
      corners={status === 'active'}
      scanLines={!isLocked}
      animated={false}
      className={`p-0 cursor-pointer transition-all duration-200 ${
        isLocked ? 'opacity-50' : 'hover:scale-[1.01]'
      }`}
      onClick={onClick}
    >
      <div className="flex items-stretch">
        {/* Left accent strip */}
        <div
          className={`w-1 flex-shrink-0 rounded-l-lg ${
            status === 'active'
              ? 'bg-primary shadow-[0_0_8px_hsl(187_100%_50%/0.5)]'
              : status === 'complete'
              ? 'bg-success'
              : 'bg-muted'
          }`}
        />

        <div className="flex-1 p-4 flex items-center justify-between gap-4">
          {/* Left: icon + info */}
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                status === 'active'
                  ? 'border-primary/40 bg-primary/10'
                  : status === 'complete'
                  ? 'border-success/40 bg-success/10'
                  : 'border-muted bg-muted/10'
              }`}
            >
              <StatusIcon status={status} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-muted-foreground">
                  LEG {String(legNumber).padStart(2, '0')}
                </span>
                <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 ${config.badgeClass}`}>
                  {config.badge}
                </Badge>
              </div>
              <h3 className="font-heading font-bold text-lg leading-tight">{name}</h3>
              <p className="text-xs text-muted-foreground">{country}</p>
            </div>
          </div>

          {/* Right: distance + narrative hint */}
          <div className="text-right flex-shrink-0">
            {distance > 0 && (
              <p className="font-mono text-sm">
                {distance.toLocaleString()} <span className="text-muted-foreground text-xs">km</span>
              </p>
            )}
            {narrative && !isLocked && (
              <p className="text-[10px] text-muted-foreground mt-1 max-w-[140px] truncate hidden sm:block">
                {narrative}
              </p>
            )}
          </div>
        </div>
      </div>
    </HolographicCard>
  );
};
