import { useEffect, useRef } from 'react';
import { useProgressionStore } from '@/stores/progressionStore';
import { isUnlocked, useIsNew, type Feature } from '@/game/unlocks';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, LogOut, Map, ScrollText, Swords, User } from 'lucide-react';
import { Button, cn } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useSeasonStore } from '@/stores/seasonStore';
import { useInboxStore } from '@/stores/inboxStore';
import { getRaidSchedule, getRaidStatus } from '@/data/raids';
import { haptic } from '@/lib/native';
import { Hud } from '@/game/Hud';
import { useQuests } from '@/game/questActions';
import { floatReward } from '@/game/rewards';
import { play } from '@/game/sfx';

const TABS: { to: string; icon: typeof Home; label: string; feature?: Feature }[] = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/quests', icon: ScrollText, label: 'Quests', feature: 'quests' },
  { to: '/map', icon: Map, label: 'Map', feature: 'map' },
  { to: '/raids', icon: Swords, label: 'Raids', feature: 'raids' },
  { to: '/profile', icon: User, label: 'Me' },
];

/** A tab that's just been unlocked wears NEW until it's opened. */
function NewBadge({ feature, active }: { feature: Feature; active: boolean }) {
  const [isNew, markSeen] = useIsNew(feature);
  useEffect(() => {
    if (active && isNew) markSeen();
  }, [active, isNew, markSeen]);
  if (!isNew) return null;
  return <span className="absolute -right-4 -top-2 animate-bump rounded-full bg-warning px-1.5 text-[10px] font-bold uppercase text-background ring-2 ring-card">New</span>;
}

function useRaidLive() {
  const season = useSeasonStore((s) => s.activeSeason);
  if (!season) return false;
  return getRaidSchedule(season.startDate, season.endDate).some((r) => getRaidStatus(r) === 'active');
}

/** Pings when a quest becomes ready to claim, wherever you are in the app. */
function useQuestReadyPing(claimable: number) {
  const last = useRef(claimable);
  const mountedAt = useRef(Date.now());
  useEffect(() => {
    if (claimable > last.current && Date.now() - mountedAt.current > 2500) {
      floatReward('Quest complete! Claim it', 'streak');
      play('chime', 5);
      haptic('success');
    }
    last.current = claimable;
  }, [claimable]);
}

export const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const raidLive = useRaidLive();
  const { claimable } = useQuests();
  const inbox = useInboxStore((s) => s.items.length);
  useQuestReadyPing(claimable);
  const level = useProgressionStore((s) => s.level);
  const tabs = TABS.filter((t) => !t.feature || isUnlocked(t.feature, level));

  const badge = (to: string) => (to === '/quests' ? claimable : to === '/dashboard' ? inbox : 0);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-primary/15 bg-background/85 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-4 px-4">
          <NavLink to={user ? '/dashboard' : '/'} className={cn('items-center gap-2', user ? 'hidden lg:flex' : 'flex')}>
            <img src="/apple-touch-icon.png" alt="" className="size-9 rounded-[10px]" />
            <span className="font-heading text-lg tracking-wide text-glow-cyan">
              80 <span className="text-secondary">WAYS</span>
            </span>
          </NavLink>

          {user ? (
            <>
              <div className="min-w-0 flex-1 lg:max-w-md">
                <Hud />
              </div>
              <nav className="ml-auto hidden items-center gap-1 lg:flex" aria-label="Main">
                {tabs.map((t) => (
                  <NavLink
                    key={t.to}
                    to={t.to}
                    className={({ isActive }) =>
                      cn('relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium', isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground')
                    }
                  >
                    <t.icon className="size-4" /> {t.label}
                    {badge(t.to) > 0 && <span className="rounded-full bg-secondary px-1.5 text-[10px] font-bold text-white">{badge(t.to)}</span>}
                  </NavLink>
                ))}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => void signOut().then(() => navigate('/login'))}
                  className="size-8 text-muted-foreground hover:text-destructive"
                  aria-label="Sign out"
                >
                  <LogOut />
                </Button>
              </nav>
            </>
          ) : (
            <NavLink to="/login" className="ml-auto font-mono text-sm text-muted-foreground hover:text-primary">
              Sign in
            </NavLink>
          )}
        </div>
      </header>

      {user && (
        <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-50 border-t border-primary/20 bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
          <ul className="mx-auto grid h-[4.75rem] max-w-md" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
            {tabs.map((tab) => {
              const count = badge(tab.to);
              return (
                <li key={tab.to} className="flex">
                  <NavLink
                    to={tab.to}
                    onClick={() => {
                      haptic('select');
                      play('tick');
                    }}
                    className={({ isActive }) =>
                      cn('press relative mx-1 my-1.5 flex flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl font-heading text-sm font-bold tracking-wide', isActive ? 'bg-primary/15 text-primary' : 'text-muted-foreground')
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span className="relative">
                          <tab.icon className={cn('size-7 transition-transform', isActive && 'scale-110 drop-shadow-[0_0_8px_hsl(var(--primary)/0.8)]')} />
                          {count > 0 && (
                            <span className="absolute -right-2.5 -top-1.5 flex h-5 min-w-5 animate-bump items-center justify-center rounded-full bg-secondary px-1 text-[11px] font-bold text-white ring-2 ring-card">
                              {count}
                            </span>
                          )}
                          {tab.feature && <NewBadge feature={tab.feature} active={isActive} />}
                          {tab.to === '/raids' && raidLive && <span className="absolute -right-1 -top-0.5 size-2.5 animate-pulse-soft rounded-full bg-destructive ring-2 ring-card" />}
                        </span>
                        {tab.label}
                      </>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </>
  );
};
