import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, MapPin, Award, Zap, Flame, Activity, Globe, LogOut, Loader2, BookOpen, ShoppingBag, Crown, Trophy } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useProgressionStore } from "@/stores/progressionStore";
import { useActivityStore } from "@/stores/activityStore";
import { useUserStore } from "@/stores/userStore";
import { selectHasJoined, useSeasonStore } from "@/stores/seasonStore";
import { getLevelFromXP, KM_PER_MILE, type EnergyType } from "@/data/gameConstants";
import { ACHIEVEMENTS } from "@/data/achievements";
import { computeStreak, longestStreak } from "@/lib/gameEngine";
import { schedulePush } from "@/lib/gameSync";
import { DeleteAccount } from "@/features/DeleteAccount";
import { HealthSetting } from "@/features/health";
import { Passport } from "@/game/Passport";
import { isMuted, play, setMuted } from "@/game/sfx";
import { toast } from '@/components/toast';
import { Button, Input, Badge, Switch, HoloCard, SegmentedProgress } from '@/components/ui';

const rarityRing: Record<string, string> = {
  legendary: "glow-magenta",
  epic: "glow-purple",
  rare: "glow-cyan",
  common: "",
};

const rarityText: Record<string, string> = {
  legendary: "text-warning",
  epic: "text-accent",
  rare: "text-primary",
  common: "text-muted-foreground",
};

export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const progression = useProgressionStore();
  const activities = useActivityStore((s) => s.activities);
  const { stats, settings, raidXpAwarded, setUnits } = useUserStore();
  const season = useSeasonStore();
  const hasJoined = useSeasonStore(selectHasJoined);

  const [displayName, setDisplayName] = useState("");
  const [savedName, setSavedName] = useState("");
  const [saving, setSaving] = useState(false);
  const [soundOn, setSoundOn] = useState(() => !isMuted());

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const name = data?.display_name || (user.user_metadata?.display_name as string | undefined) || "";
        setDisplayName(name);
        setSavedName(name);
      });
  }, [user]);

  const saveName = async () => {
    if (!user) return;
    const name = displayName.trim();
    if (name.length < 2 || name.length > 50) {
      toast({ title: "Name must be 2–50 characters", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({ user_id: user.id, display_name: name }, { onConflict: "user_id" });
    setSaving(false);
    if (error) {
      toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
    } else {
      setSavedName(name);
      toast({ title: "Name updated", description: "This is how you'll appear on leaderboards." });
    }
  };

  const levelInfo = getLevelFromXP(progression.xp);
  const imperial = settings.units === "imperial";
  const distance = imperial ? stats.totalDistance / KM_PER_MILE : stats.totalDistance;
  const dates = activities.map((a) => a.timestamp);
  const currentStreak = computeStreak(dates);

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
      journeyComplete: participation?.status === "completed",
      journeysCompleted: stats.journeysCompleted,
      longestStreak: longestStreak(activities.map((a) => a.timestamp)),
      energyTypesUsed: new Set<EnergyType>(activities.map((a) => a.targetEnergyType)),
      raidsJoined: raidXpAwarded.length,
    };
    return ACHIEVEMENTS.map((a) => ({ ...a, isEarned: a.earned(ctx) }));
  }, [progression, stats, activities, raidXpAwarded, season.participation, hasJoined]);

  const earnedCount = achievements.filter((a) => a.isEarned).length;

  const statCards = [
    { label: "Activities", value: progression.totalActivities.toString(), icon: Activity, glow: "cyan" as const },
    { label: imperial ? "Miles" : "Kilometres", value: distance.toFixed(1), icon: MapPin, glow: "purple" as const },
    { label: "kWh generated", value: progression.totalEnergyGenerated.toFixed(1), icon: Zap, glow: "magenta" as const },
    { label: "Journeys", value: stats.journeysCompleted.toString(), icon: Globe, glow: "cyan" as const },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" }) : "—";

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-heading mb-2 text-glow-cyan">Profile</h1>
        <p className="text-muted-foreground">Your expedition record</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <HoloCard glow="cyan" className="p-6">
            <div className="text-center mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary mx-auto mb-4 flex items-center justify-center glow-purple">
                <User className="w-10 h-10 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-heading mb-1 break-words">{savedName || "Explorer"}</h2>
              <p className="text-muted-foreground text-sm break-all">{user?.email}</p>
            </div>

            <div className="mb-6 p-4 rounded-lg bg-muted/20 border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  Level {progression.level} · {progression.levelName}
                </span>
              </div>
              <SegmentedProgress value={levelInfo.progress * 100} segments={10} glow="cyan" size="sm" />
              <p className="text-xs text-muted-foreground mt-1 text-right font-mono">
                {progression.xp} XP{levelInfo.xpForNext > 0 && levelInfo.progress < 1 ? ` · ${levelInfo.xpForNext - levelInfo.xpInLevel} to next` : ""}
              </p>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Member since</span>
              <span className="text-sm font-mono">{memberSince}</span>
            </div>
          </HoloCard>

          <HoloCard glow="magenta" className="p-6 text-center">
            <Flame className="w-10 h-10 mx-auto mb-2 text-secondary" />
            <p className="text-3xl font-mono font-bold text-secondary">{currentStreak}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Day streak</p>
          </HoloCard>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <nav className="grid grid-cols-4 gap-2" aria-label="More">
            {[
              { to: '/leaderboard', label: 'Ranks', icon: Trophy },
              { to: '/activity-history', label: 'Logbook', icon: BookOpen },
              { to: '/store', label: 'Store', icon: ShoppingBag },
              { to: '/membership', label: 'Season Pass', icon: Crown },
            ].map((l) => (
              <Link key={l.to} to={l.to} className="press flex flex-col items-center gap-1.5 rounded-2xl border border-primary/25 bg-card/60 px-1 py-3 text-xs font-semibold transition-colors hover:border-primary/60">
                <l.icon className="size-7 text-primary" /> {l.label}
              </Link>
            ))}
          </nav>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statCards.map((stat, index) => (
              <div className="animate-fade-up" key={stat.label} style={{ animationDelay: `${index * 0.08}s` }}>
                <HoloCard glow={stat.glow} className="p-4">
                  <stat.icon className="w-5 h-5 text-primary mb-2" />
                  <div className="text-xl font-mono mb-1">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </HoloCard>
              </div>
            ))}
          </div>

          <Passport />

          <HoloCard glow="purple" className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-heading flex items-center gap-2">
                <Award className="w-5 h-5 text-accent" /> Achievements
              </h2>
              <Badge variant="secondary">
                {earnedCount} / {achievements.length}
              </Badge>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
              {achievements.map((badge, index) => (
                <div
                  key={badge.id}
                  className={`text-center ${badge.isEarned ? "" : "opacity-35 grayscale"} animate-scale-in`}
                  title={badge.description}
                 style={{ animationDelay: `${index * 0.03}s` }}>
                  <div
                    className={`w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-2 ${
                      badge.isEarned ? rarityRing[badge.rarity] : ""
                    }`}
                  >
                    <span className="text-2xl">{badge.icon}</span>
                  </div>
                  <div className="text-xs font-medium leading-tight">{badge.name}</div>
                  <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">{badge.description}</div>
                  <div className={`text-[9px] uppercase tracking-wider mt-0.5 ${rarityText[badge.rarity]}`}>{badge.rarity}</div>
                </div>
              ))}
            </div>
          </HoloCard>

          <HoloCard glow="none" className="p-6">
            <h2 className="text-2xl font-heading mb-6">Settings</h2>
            <div className="space-y-6">
              <div>
                <label htmlFor="display-name" className="text-sm font-medium mb-2 block">
                  Display name <span className="text-muted-foreground font-normal">(shown on leaderboards)</span>
                </label>
                <div className="flex gap-2">
                  <Input id="display-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={50} />
                  <Button onClick={saveName} disabled={saving || displayName.trim() === savedName}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                  </Button>
                </div>
              </div>

              {user && <HealthSetting userId={user.id} />}

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Sound effects</p>
                  <p className="text-xs text-muted-foreground">Chimes, coins and fanfares</p>
                </div>
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
                <div>
                  <p className="text-sm font-medium">Imperial units</p>
                  <p className="text-xs text-muted-foreground">Show distances in miles</p>
                </div>
                <Switch
                  checked={imperial}
                  label="Imperial units"
                  onChange={(c) => {
                    setUnits(c ? "imperial" : "metric");
                    schedulePush();
                  }}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
                <Button variant="outline" onClick={() => void handleSignOut()}>
                  <LogOut /> Sign out
                </Button>
                <DeleteAccount />
              </div>
            </div>
          </HoloCard>
        </div>
      </div>
    </div>
  );
}
