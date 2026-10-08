import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Crown, Loader2, LogOut, Pencil, ShoppingBag, Trophy } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useProgressionStore } from '@/stores/progressionStore';
import { useActivityStore } from '@/stores/activityStore';
import { useUserStore } from '@/stores/userStore';
import { selectHasJoined, useSeasonStore } from '@/stores/seasonStore';
import { KM_PER_MILE, type EnergyType } from '@/data/gameConstants';
import { ACHIEVEMENTS } from '@/data/achievements';
import { longestStreak } from '@/lib/gameEngine';
import { schedulePush } from '@/lib/gameSync';
import { haptic } from '@/lib/native';
import { DeleteAccount } from '@/features/DeleteAccount';
import { HealthSetting } from '@/features/health';
import { Passport } from '@/game/Passport';
import { isUnlocked } from '@/game/unlocks';
import { Avatar } from '@/game/art';
import { floatReward } from '@/game/rewards';
import { isMuted, play, setMuted } from '@/game/sfx';
import { toast } from '@/components/toast';
import { Button, Input, Switch, cn } from '@/components/ui';

const RARITY_RING: Record<string, string> = {
  legendary: 'border-warning shadow-[0_0_16px_hsl(var(--warning)/0.6)]',
  epic: 'border-accent shadow-[0_0_14px_hsl(var(--accent)/0.6)]',
  rare: 'border-primary shadow-[0_0_12px_hsl(var(--primary)/0.5)]',
  common: 'border-success/60',
};

function Tile({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card/70 px-1 py-3 text-center">
      <p className="font-heading text-2xl font-bold leading-none">{value}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

/** You: who you are, what you've done, what you've collected, and the settings at the bottom. */
export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const progression = useProgressionStore();
  const activities = useActivityStore((s) => s.activities);
  const { stats, settings, raidXpAwarded, setUnits, discipline } = useUserStore();
  const season = useSeasonStore();
  const hasJoined = useSeasonStore(selectHasJoined);

  const [displayName, setDisplayName] = useState('');
  const [savedName, setSavedName] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [soundOn, setSoundOn] = useState(() => !isMuted());

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('display_name')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        const name = data?.display_name || (user.user_metadata?.display_name as string | undefined) || '';
        setDisplayName(name);
        setSavedName(name);
      });
  }, [user]);

  const saveName = async () => {
    if (!user) return;
    const name = displayName.trim();
    if (name.length < 2 || name.length > 50) {
      toast({ title: 'Name must be 2–50 characters', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('profiles').upsert({ user_id: user.id, display_name: name }, { onConflict: 'user_id' });
    setSaving(false);
    if (error) {
      toast({ title: 'Couldn’t save', description: error.message, variant: 'destructive' });
    } else {
      setSavedName(name);
      setEditing(false);
      haptic('success');
    }
  };

  const imperial = settings.units === 'imperial';
  const distance = imperial ? stats.totalDistance / KM_PER_MILE : stats.totalDistance;
  const best = longestStreak(activities.map((a) => a.timestamp));

  const achievements = useMemo(() => {
    const participation = hasJoined ? season.participation : null;
    const ctx = {
      totalActivities: progression.totalActivities,
      totalDistanceKm: stats.totalDistance,
      totalEnergy: progression.totalEnergyGenerated,
      level: progression.level,
      starterEventCompleted: progression.starterEventCompleted,
      joinedSeason: !!participation,
      currentLeg: participation?.currentLeg ?? 0,
      journeyComplete: participation?.status === 'completed',
      journeysCompleted: stats.journeysCompleted,
      longestStreak: best,
      energyTypesUsed: new Set<EnergyType>(activities.map((a) => a.targetEnergyType)),
      raidsJoined: raidXpAwarded.length,
    };
    return ACHIEVEMENTS.map((a) => ({ ...a, isEarned: a.earned(ctx) }));
  }, [progression, stats, activities, raidXpAwarded, season.participation, hasJoined, best]);

  const earned = achievements.filter((a) => a.isEarned).length;
  const since = user?.created_at ? new Date(user.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : '';

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 pb-6 pt-4">
      {/* Who */}
      <div className="flex items-center gap-4">
        <div className="relative flex size-20 shrink-0 items-center justify-center rounded-full bg-card ring-2 ring-accent/70 shadow-[0_10px_30px_-14px_rgb(0_0_0/0.9)]">
          <Avatar discipline={discipline ?? 'runner'} size={76} className="-mt-3" iconClassName="size-10 text-accent" />
          <span className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full bg-primary font-heading text-lg font-bold text-primary-foreground ring-4 ring-background">
            {progression.level}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="flex gap-2">
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={50} className="h-11 text-base" autoFocus aria-label="Display name" />
              <Button onClick={() => void saveName()} disabled={saving} className="h-11">
                {saving ? <Loader2 className="animate-spin" /> : 'Save'}
              </Button>
            </div>
          ) : (
            <button type="button" onClick={() => setEditing(true)} className="flex max-w-full items-center gap-2 text-left">
              <span className="truncate font-heading text-3xl font-bold">{savedName || 'Explorer'}</span>
              <Pencil className="size-4 shrink-0 text-muted-foreground" />
            </button>
          )}
          <p className="font-heading text-lg text-primary">{progression.levelName}</p>
          {since && <p className="text-xs text-muted-foreground">On the crew since {since}</p>}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <Tile value={String(progression.totalActivities)} label="Workouts" />
        <Tile value={distance >= 100 ? Math.round(distance).toString() : distance.toFixed(1)} label={imperial ? 'Miles' : 'Km'} />
        <Tile value={progression.totalEnergyGenerated.toFixed(0)} label="kWh" />
        <Tile value={String(best)} label="Best streak" />
      </div>

      <nav className="grid grid-cols-4 gap-2" aria-label="More">
        {[
          { to: '/activity-history', label: 'Logbook', icon: BookOpen, feature: null },
          { to: '/store', label: 'Store', icon: ShoppingBag, feature: 'store' as const },
          { to: '/membership', label: 'Season Pass', icon: Crown, feature: 'pass' as const },
          { to: '/leaderboard', label: 'Ranks', icon: Trophy, feature: 'ranks' as const },
        ]
          .filter((l) => !l.feature || isUnlocked(l.feature, progression.level))
          .map((l) => (
          <Link key={l.to} to={l.to} className="press flex flex-col items-center gap-1.5 rounded-2xl border border-primary/25 bg-card/60 px-1 py-3 text-xs font-semibold hover:border-primary/60">
            <l.icon className="size-7 text-primary" /> {l.label}
          </Link>
        ))}
      </nav>

      {isUnlocked('map', progression.level) && <Passport />}

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="font-heading text-2xl font-bold">Badges</h2>
          <span className="font-heading text-lg font-bold text-primary">
            {earned} / {achievements.length}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {achievements.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => {
                play('tick');
                floatReward(`${a.name}: ${a.description}`, a.isEarned ? 'xp' : 'streak');
              }}
              className="flex flex-col items-center gap-1"
              aria-label={`${a.name}. ${a.description}. ${a.isEarned ? 'Earned' : 'Not yet'}`}
            >
              <span
                className={cn(
                  'flex size-16 items-center justify-center rounded-full border-2 bg-card text-3xl',
                  a.isEarned ? RARITY_RING[a.rarity] : 'border-border opacity-30 grayscale',
                )}
              >
                {a.icon}
              </span>
              <span className={cn('line-clamp-2 text-center text-[11px] font-semibold leading-tight', !a.isEarned && 'text-muted-foreground')}>{a.name}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-5 rounded-3xl border border-border bg-card/50 p-5">
        <h2 className="font-heading text-2xl font-bold">Settings</h2>
        {user && <HealthSetting userId={user.id} />}
        <div className="flex items-center justify-between">
          <p className="font-medium">Sound effects</p>
          <Switch
            checked={soundOn}
            label="Sound effects"
            onChange={(c) => {
              setMuted(!c);
              setSoundOn(c);
              if (c) play('chime');
            }}
          />
        </div>
        <div className="flex items-center justify-between">
          <p className="font-medium">Miles instead of km</p>
          <Switch
            checked={imperial}
            label="Imperial units"
            onChange={(c) => {
              setUnits(c ? 'imperial' : 'metric');
              schedulePush();
            }}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
          <Button variant="outline" onClick={() => void signOut().then(() => navigate('/login'))}>
            <LogOut /> Sign out
          </Button>
          <DeleteAccount />
        </div>
      </section>
    </div>
  );
}
