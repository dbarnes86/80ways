import { Coins, Shield } from 'lucide-react';
import { useProgressionStore } from '@/stores/progressionStore';
import { useUserStore } from '@/stores/userStore';
import { getLevelFromXP } from '@/data/gameConstants';

export const PlayerLevelBar = () => {
  const { xp, level, levelName } = useProgressionStore();
  const credits = useUserStore((s) => s.inventory.credits);
  const levelInfo = getLevelFromXP(xp);
  const maxed = levelInfo.xpForNext <= 0 || levelInfo.progress >= 1;

  return (
    <div className="bg-card/50 border border-border/30 rounded-lg p-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0">
          <Shield className="w-5 h-5 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-mono text-primary tracking-wider">LVL {level}</span>
            <span className="text-[10px] font-heading text-muted-foreground truncate ml-2">{levelName}</span>
          </div>
          <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-[width] duration-700 ease-out"
              style={{ width: `${levelInfo.progress * 100}%`, boxShadow: '0 0 6px hsl(var(--primary) / 0.4)' }}
            />
          </div>
          <div className="flex justify-between mt-0.5">
            <span className="text-[9px] font-mono text-muted-foreground">{xp} XP</span>
            <span className="text-[9px] font-mono text-muted-foreground">
              {maxed ? 'MAX' : `${levelInfo.xpInLevel}/${levelInfo.xpForNext}`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-warning/10 border border-warning/30 flex-shrink-0" title="Credits">
          <Coins className="w-3.5 h-3.5 text-warning" />
          <span className="text-xs font-mono text-warning">{credits}</span>
        </div>
      </div>
    </div>
  );
};
