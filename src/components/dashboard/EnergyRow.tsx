import { motion } from 'framer-motion';
import { Anchor, PersonStanding, Bike, Dumbbell } from 'lucide-react';

type EnergyType = 'nautical' | 'terrestrial' | 'transport' | 'strength';

interface EnergyRowProps {
  reserves: Record<EnergyType, { current: number; max: number }>;
}

const CONFIG: Record<EnergyType, { icon: typeof Anchor; label: string; color: string; bar: string; border: string }> = {
  nautical: { icon: Anchor, label: 'NAU', color: 'text-primary', bar: 'bg-primary', border: 'border-primary/30' },
  terrestrial: { icon: PersonStanding, label: 'TER', color: 'text-success', bar: 'bg-success', border: 'border-success/30' },
  transport: { icon: Bike, label: 'TRA', color: 'text-warning', bar: 'bg-warning', border: 'border-warning/30' },
  strength: { icon: Dumbbell, label: 'STR', color: 'text-secondary', bar: 'bg-secondary', border: 'border-secondary/30' },
};

const TYPES: EnergyType[] = ['nautical', 'terrestrial', 'transport', 'strength'];

export const EnergyRow = ({ reserves }: EnergyRowProps) => {
  return (
    <div className="grid grid-cols-4 gap-2">
      {TYPES.map((type) => {
        const c = CONFIG[type];
        const Icon = c.icon;
        const r = reserves[type];
        const pct = r.max > 0 ? Math.min((r.current / r.max) * 100, 100) : 0;

        return (
          <div
            key={type}
            className={`rounded-lg border ${c.border} bg-card/80 p-2.5 text-center`}
          >
            <Icon className={`w-4 h-4 mx-auto mb-1 ${c.color}`} />
            <p className={`text-[10px] font-mono tracking-wider ${c.color}`}>{c.label}</p>
            {/* Mini bar */}
            <div className="h-1.5 rounded-full bg-muted/40 mt-1.5 overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${c.bar}`}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{ boxShadow: pct > 0 ? `0 0 6px hsl(var(--primary) / 0.4)` : 'none' }}
              />
            </div>
            <p className="text-[10px] font-mono text-muted-foreground mt-1">
              {r.current.toFixed(1)}<span className="text-muted-foreground/60">/{r.max}</span>
            </p>
          </div>
        );
      })}
    </div>
  );
};
