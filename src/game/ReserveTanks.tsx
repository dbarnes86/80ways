import { ENERGY_TYPES } from '@/data/gameConstants';
import { ENERGY_THEME } from '@/data/energyTheme';
import { useEnergyStore } from '@/stores/energyStore';
import { cn } from '@/components/ui';
import { Orb, orbColor } from './art';

/** The four reserves as glowing tanks. Glanceable: colour, fill, number. */
export function ReserveTanks() {
  const energy = useEnergyStore();
  return (
    <div className="grid grid-cols-4 gap-2">
      {ENERGY_TYPES.map((type) => {
        const r = energy[type];
        const pct = r.max > 0 ? Math.min(1, r.current / r.max) : 0;
        const color = orbColor(type);
        return (
          <div key={type} className={cn('flex flex-col items-center gap-1.5 rounded-2xl border bg-card/70 p-2', ENERGY_THEME[type].border)}>
            <div className="relative h-20 w-9 overflow-hidden rounded-full border-2 bg-background/80" style={{ borderColor: `${color}66` }}>
              <div
                className="absolute inset-x-0 bottom-0 rounded-b-full"
                style={{
                  height: `${Math.max(pct > 0 ? 6 : 0, pct * 100)}%`,
                  background: `linear-gradient(to top, ${color}, ${color}88)`,
                  boxShadow: `0 0 14px ${color}`,
                  transition: 'height 1s cubic-bezier(.2,.8,.2,1)',
                }}
              />
            </div>
            <Orb type={type} size={20} />
            <p className={cn('font-heading text-base font-bold leading-none', ENERGY_THEME[type].text)}>{r.current.toFixed(1)}</p>
            <p className="text-[11px] font-medium text-muted-foreground">{ENERGY_THEME[type].label}</p>
          </div>
        );
      })}
    </div>
  );
}
