import { ENERGY_TYPES } from '@/data/gameConstants';
import { ENERGY_THEME } from '@/data/energyTheme';
import { useEnergyStore } from '@/stores/energyStore';
import { cn } from '@/components/ui';
import { Orb, orbColor } from './art';

/** The four reserves in one slim row: colour, number, a fill bar. Glanceable, never a scroll. */
export function ReserveTanks() {
  const energy = useEnergyStore();
  return (
    <div className="panel grid grid-cols-4 divide-x divide-border/60 px-1 py-3">
      {ENERGY_TYPES.map((type) => {
        const r = energy[type];
        const pct = r.max > 0 ? Math.min(1, r.current / r.max) : 0;
        const color = orbColor(type);
        return (
          <div key={type} className="flex flex-col items-center gap-1.5 px-2">
            <div className="flex items-center gap-1.5">
              <Orb type={type} size={16} />
              <span className={cn('font-heading text-xl font-bold leading-none', ENERGY_THEME[type].text)}>{r.current.toFixed(1)}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.max(pct > 0 ? 6 : 0, pct * 100)}%`, background: color, transition: 'width 1s cubic-bezier(.2,.8,.2,1)' }}
              />
            </div>
            <span className="text-[11px] font-medium text-muted-foreground">{ENERGY_THEME[type].label}</span>
          </div>
        );
      })}
    </div>
  );
}
