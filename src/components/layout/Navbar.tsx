import { useEffect, useRef } from 'react';
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

const TABS = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/quests', icon: ScrollText, label: 'Quests' },
  { to: '/map', icon: Map, label: 'Map' },
  { to: '/raids', icon: Swords, label: 'Raids' },
  { to: '/profile', icon: User, label: 'Me' },
];

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
                {TABS.map((t) => (
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
          <ul className="mx-auto grid h-[4.5rem] max-w-md grid-cols-5">
            {TABS.map((tab) => {
              const count = badge(tab.to);
              return (
                <li key={tab.to}>
                  <NavLink
                    to={tab.to}
                    onClick={() => {
                      haptic('select');
                      play('tick');
                    }}
                    className={({ isActive }) =>
                      cn('press relative flex h-full flex-col items-center justify-center gap-1 text-xs font-semibold', isActive ? 'text-primary' : 'text-muted-foreground')
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && <span className="absolute top-0 h-[3px] w-10 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary))]" />}
                        <span className="relative">
                          <tab.icon className={cn('size-7 transition-transform', isActive && 'scale-110 drop-shadow-[0_0_8px_hsl(var(--primary)/0.8)]')} />
                          {count > 0 && (
                            <span className="absolute -right-2.5 -top-1.5 flex h-5 min-w-5 animate-bump items-center justify-center rounded-full bg-secondary px-1 text-[11px] font-bold text-white ring-2 ring-card">
                              {count}
                            </span>
                          )}
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
