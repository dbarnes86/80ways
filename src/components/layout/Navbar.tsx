import { NavLink, useNavigate } from 'react-router-dom';
import { BookOpen, LayoutDashboard, LogOut, Map, ShoppingBag, Swords, Trophy, User } from 'lucide-react';
import { Button, cn } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useSeasonStore } from '@/stores/seasonStore';
import { getRaidSchedule, getRaidStatus } from '@/data/raids';
import { haptic } from '@/lib/native';

const DESKTOP_NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/map', icon: Map, label: 'Map' },
  { to: '/raids', icon: Swords, label: 'Raids' },
  { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { to: '/activity-history', icon: BookOpen, label: 'Logbook' },
  { to: '/store', icon: ShoppingBag, label: 'Store' },
  { to: '/profile', icon: User, label: 'Profile' },
];

/** Five tabs on phones; Logbook and Store are one tap away from Home and Profile. */
const TABS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/map', icon: Map, label: 'Map' },
  { to: '/raids', icon: Swords, label: 'Raids' },
  { to: '/leaderboard', icon: Trophy, label: 'Ranks' },
  { to: '/profile', icon: User, label: 'Me' },
];

function useRaidLive() {
  const season = useSeasonStore((s) => s.activeSeason);
  if (!season) return false;
  return getRaidSchedule(season.startDate, season.endDate).some((r) => getRaidStatus(r) === 'active');
}

export const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const raidLive = useRaidLive();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <>
      <nav className="sticky top-0 z-50 pt-[env(safe-area-inset-top)] bg-card/85 backdrop-blur-md">
        <div className="h-[2px] w-full bg-gradient-to-r from-primary via-secondary to-accent" />
        <div className="scan-lines pointer-events-none absolute inset-0" />
        <div className="relative z-10 border-b border-primary/15">
          <div className="container mx-auto flex h-14 items-center justify-between px-4">
            <NavLink to={user ? '/dashboard' : '/'} className="group flex items-center gap-2.5">
              <img src="/apple-touch-icon.png" alt="" className="size-9 rounded-[10px] shadow-[0_0_15px_hsl(var(--primary)/0.35)] transition-shadow duration-300 group-hover:shadow-[0_0_25px_hsl(var(--primary)/0.6)]" />
              <div className="leading-tight">
                <div className="font-heading text-lg tracking-wide text-glow-cyan">
                  80 <span className="text-secondary">WAYS</span>
                </div>
                <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Around the World</div>
              </div>
            </NavLink>

            {user && (
              <div className="hidden items-center gap-0.5 lg:flex">
                {DESKTOP_NAV.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      cn('relative flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors', isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground')
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon className="size-4" />
                        <span>{item.label}</span>
                        {item.to === '/raids' && raidLive && <span className="size-1.5 animate-pulse-soft rounded-full bg-destructive" />}
                        {isActive && <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.6)]" />}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              {user ? (
                <Button variant="ghost" size="icon" onClick={() => void handleSignOut()} className="hidden size-8 text-muted-foreground hover:text-destructive lg:inline-flex" title="Sign out" aria-label="Sign out">
                  <LogOut />
                </Button>
              ) : (
                <NavLink to="/login" className="font-mono text-sm text-muted-foreground transition-colors hover:text-primary">
                  Sign in
                </NavLink>
              )}
            </div>
          </div>
        </div>
      </nav>

      {user && (
        <nav
          aria-label="Main"
          className="fixed inset-x-0 bottom-0 z-50 border-t border-primary/20 bg-card/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
        >
          <ul className="mx-auto grid h-16 max-w-md grid-cols-5">
            {TABS.map((tab) => (
              <li key={tab.to}>
                <NavLink
                  to={tab.to}
                  onClick={() => haptic('select')}
                  className={({ isActive }) =>
                    cn(
                      'relative flex h-full flex-col items-center justify-center gap-1 text-[10px] font-medium tracking-wide transition-colors active:scale-95',
                      isActive ? 'text-primary' : 'text-muted-foreground',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && <span className="absolute top-0 h-[2px] w-8 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.8)]" />}
                      <span className="relative">
                        <tab.icon className={cn('size-5', isActive && 'drop-shadow-[0_0_6px_hsl(var(--primary)/0.7)]')} />
                        {tab.to === '/raids' && raidLive && (
                          <span className="absolute -right-1 -top-0.5 size-2 animate-pulse-soft rounded-full bg-destructive ring-2 ring-card" />
                        )}
                      </span>
                      {tab.label}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </>
  );
};
