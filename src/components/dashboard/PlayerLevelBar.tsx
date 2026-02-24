import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { useProgressionStore } from '@/stores/progressionStore';
import { getLevelFromXP } from '@/data/gameConstants';

export const PlayerLevelBar = () => {
  const { xp, level, levelName } = useProgressionStore();
  const levelInfo = getLevelFromXP(xp);

  return (
    <div className="bg-card/50 border border-border/30 rounded-lg p-3">
      <div className="flex items-center gap-3">
        {/* Level badge */}
        <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0">
          <Shield className="w-5 h-5 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Level info row */}
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-mono text-primary tracking-wider">LVL {level}</span>
            <span className="text-[10px] font-heading text-muted-foreground truncate ml-2">
              {levelName}
            </span>
          </div>

          {/* XP bar */}
          <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${levelInfo.progress * 100}%` }}
              transition={{ duration: 0.8 }}
              style={{ boxShadow: '0 0 6px hsl(var(--primary) / 0.4)' }}
            />
          </div>

          {/* XP numbers */}
          <div className="flex justify-between mt-0.5">
            <span className="text-[9px] font-mono text-muted-foreground">{xp} XP</span>
            <span className="text-[9px] font-mono text-muted-foreground">
              {levelInfo.xpInLevel}/{levelInfo.xpForNext}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
