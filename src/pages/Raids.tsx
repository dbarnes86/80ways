import { useEffect, useState } from "react";
import { Sword, Users, Target, Zap, AlertCircle, Flame, ChevronRight, CheckCircle2, XCircle, Coins } from "lucide-react";
import { EnergyAllocator } from "@/components/EnergyAllocator";
import { supabase } from "@/lib/supabase";
import { useSeasonStore } from "@/stores/seasonStore";
import { useRaidStore } from "@/stores/raidStore";
import { useUserStore } from "@/stores/userStore";
import { ENERGY_THEME } from "@/data/energyTheme";
import { CREDITS_RAID_SUCCESS, type EnergyType } from "@/data/gameConstants";
import { formatTimeLeft, getRaidSchedule, getRaidStatus, RAID_XP_FIRST_CONTRIBUTION, type ScheduledRaid } from "@/data/raids";
import { claimRaidReward, contributeToRaid } from "@/lib/gameActions";
import { toast } from '@/components/toast';
import { Badge, Button, Dialog, HoloCard, SegmentedProgress, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui';

interface Contributor {
  display_name: string;
  total: number;
  is_you: boolean;
}

export default function Raids() {
  const activeSeason = useSeasonStore((s) => s.activeSeason);
  const { totals, available, loaded, fetchTotals } = useRaidStore();
  const claimed = useUserStore((s) => s.raidRewardsClaimed);

  const [contributing, setContributing] = useState<ScheduledRaid | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [contributors, setContributors] = useState<Contributor[]>([]);

  const raids = activeSeason ? getRaidSchedule(activeSeason.startDate, activeSeason.endDate) : [];
  const activeRaid = raids.find((r) => getRaidStatus(r) === "active");
  const upcoming = raids.filter((r) => getRaidStatus(r) === "upcoming").slice(0, 3);
  const past = raids.filter((r) => getRaidStatus(r) === "ended").reverse();

  useEffect(() => {
    if (activeSeason) void fetchTotals(activeSeason.id);
  }, [activeSeason, fetchTotals]);

  const activeRaidKey = activeRaid?.key;
  useEffect(() => {
    if (!activeSeason || !activeRaidKey || !available) return;
    supabase
      .rpc("get_raid_top_contributors", { p_season_id: activeSeason.id, p_raid_key: activeRaidKey, p_limit: 6 })
      .then(({ data }) => setContributors((data ?? []).map((c) => ({ ...c, total: Number(c.total) }))));
  }, [activeSeason, activeRaidKey, available, totals]);

  const handleContribute = async (selection: Record<EnergyType, number>) => {
    if (!contributing || !activeSeason) return;
    setSubmitting(true);
    try {
      const res = await contributeToRaid(contributing, activeSeason.id, selection);
      toast({
        title: "Fix pushed back!",
        description: `+${res.plan.totalEffective.toFixed(1)} kWh to the raid · +${res.xp} XP`,
      });
      if (res.levelUp) toast({ title: `Level ${res.levelUp.level}!`, description: `You're now a ${res.levelUp.name}.` });
      setContributing(null);
    } catch (err) {
      toast({ title: "Contribution failed", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClaim = (raid: ScheduledRaid) => {
    if (!activeSeason) return;
    const res = claimRaidReward(activeSeason.id, raid.key);
    if (res) toast({ title: "Reward claimed", description: `+${res.credits} credits` });
  };

  if (!activeSeason) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-heading mb-2 text-glow-cyan">Community Raids</h1>
        <p className="text-muted-foreground">No season is running right now, so Fix is lying low.</p>
      </div>
    );
  }

  const activeTotals = activeRaid ? totals[activeRaid.key] : undefined;
  const activeTotal = activeTotals?.total ?? 0;
  const activeBeaten = activeRaid ? activeTotal >= activeRaid.goalKwh : false;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-heading mb-2 text-glow-cyan">Community Raids</h1>
        <p className="text-muted-foreground">
          Detective Fix strikes every couple of weeks. Pool energy with every other traveller to push him back. First contribution earns{" "}
          {RAID_XP_FIRST_CONTRIBUTION} XP, and beating a raid pays {CREDITS_RAID_SUCCESS} credits to everyone who helped.
        </p>
      </div>

      {loaded && !available && (
        <HoloCard glow="none" corners={false} className="p-4 mb-6 text-sm text-warning">
          Raid HQ is offline. Contributions will open once the server is updated.
        </HoloCard>
      )}

      {activeRaid ? (
        <HoloCard glow="magenta" className="p-6 md:p-8 mb-8 border-2 border-destructive/30">
          <div
            className="flex items-center gap-2 mb-6 animate-float"
          >
            <AlertCircle className="w-5 h-5 text-destructive" />
            <Badge className="bg-destructive/20 text-destructive border-destructive/40 uppercase tracking-widest text-xs">
              <Flame className="w-3 h-3 mr-1" /> Raid active · ends in {formatTimeLeft(activeRaid.end)}
            </Badge>
          </div>

          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-heading mb-2 text-glow-magenta">{activeRaid.name}</h2>
              <p className="text-muted-foreground max-w-2xl">{activeRaid.narrative}</p>
            </div>
            <Sword className="w-10 h-10 text-secondary flex-shrink-0" />
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { icon: Target, label: "Goal", value: `${activeRaid.goalKwh} kWh`, color: "text-primary" },
              { icon: Users, label: "Travellers", value: (activeTotals?.participants ?? 0).toString(), color: "text-secondary" },
              {
                icon: Zap,
                label: "Best fuel",
                value: ENERGY_THEME[activeRaid.type].label,
                color: ENERGY_THEME[activeRaid.type].text,
              },
            ].map((stat) => (
              <div key={stat.label} className="p-3 rounded-lg text-center bg-muted/20 border border-border">
                <stat.icon className={`w-5 h-5 mx-auto mb-1 ${stat.color}`} />
                <div className={`font-mono truncate ${stat.label === "Best fuel" ? `text-sm md:text-base ${stat.color}` : "text-base md:text-xl"}`}>
                  {stat.value}
                </div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-mono text-secondary">
                {activeTotal.toFixed(1)} / {activeRaid.goalKwh} kWh
              </span>
              <span className="font-mono text-muted-foreground">{Math.min(100, (activeTotal / activeRaid.goalKwh) * 100).toFixed(0)}%</span>
            </div>
            <SegmentedProgress value={activeTotal} max={activeRaid.goalKwh} segments={20} glow="magenta" size="lg" />
            {activeTotals?.yourContribution ? (
              <p className="text-xs text-muted-foreground mt-2">You've contributed {activeTotals.yourContribution.toFixed(1)} kWh.</p>
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-4 p-4 rounded-lg border border-secondary/30 bg-secondary/5">
            <div>
              <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">
                {activeBeaten ? "Raid beaten" : "Raid reward"}
              </div>
              <div className="font-heading text-secondary flex items-center gap-1">
                <Coins className="w-4 h-4" /> {CREDITS_RAID_SUCCESS} credits each
              </div>
            </div>
            <Button
              className="glow-magenta bg-secondary text-secondary-foreground hover:bg-secondary/90"
              onClick={() => setContributing(activeRaid)}
              disabled={!available || activeBeaten}
            >
              {activeBeaten ? "Beaten!" : "Contribute"} <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {contributors.length > 0 && (
            <div className="mt-6">
              <h3 className="font-heading mb-3 text-sm uppercase tracking-wider text-muted-foreground">Top contributors</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {contributors.map((c, i) => (
                  <div
                    key={`${c.display_name}-${i}`}
                    className={`rounded-lg p-3 border ${c.is_you ? "border-primary/50 bg-primary/10" : "border-border bg-muted/20"}`}
                  >
                    <div className="text-sm font-heading truncate">
                      {c.display_name}
                      {c.is_you && <span className="text-primary text-xs"> (you)</span>}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">+{c.total.toFixed(1)} kWh</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </HoloCard>
      ) : (
        <HoloCard glow="none" className="p-6 mb-8 text-center">
          <Sword className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
          <p className="font-heading text-lg">All quiet. For now.</p>
          <p className="text-sm text-muted-foreground">
            {upcoming[0] ? `Fix's next move: ${upcoming[0].name}, in ${formatTimeLeft(upcoming[0].start)}.` : "No more raids this season."}
          </p>
        </HoloCard>
      )}

      {upcoming.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-heading mb-4">Incoming</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {upcoming.map((raid) => (
              <HoloCard key={raid.key} glow="cyan" className="p-5">
                <Badge variant="secondary" className="mb-3 uppercase tracking-widest text-[10px]">
                  In {formatTimeLeft(raid.start)}
                </Badge>
                <h3 className="text-lg font-heading mb-2">{raid.name}</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Starts</span>
                    <span className="font-mono">{raid.start.toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Goal</span>
                    <span className="font-mono">{raid.goalKwh} kWh</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Best fuel</span>
                    <span className={ENERGY_THEME[raid.type].text}>{ENERGY_THEME[raid.type].label}</span>
                  </div>
                </div>
              </HoloCard>
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <h2 className="text-2xl font-heading mb-4">Past raids</h2>
          <div className="space-y-2">
            {past.map((raid) => {
              const t = totals[raid.key];
              const won = (t?.total ?? 0) >= raid.goalKwh;
              const helped = (t?.yourContribution ?? 0) > 0;
              const isClaimed = claimed.includes(`${activeSeason.id}:${raid.key}`);
              return (
                <div key={raid.key} className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border">
                  {won ? <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" /> : <XCircle className="w-5 h-5 text-destructive flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="font-heading text-sm truncate">{raid.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {(t?.total ?? 0).toFixed(1)} / {raid.goalKwh} kWh · {t?.participants ?? 0} travellers
                      {helped && ` · you gave ${t!.yourContribution.toFixed(1)}`}
                    </p>
                  </div>
                  {won && helped && (
                    <Button size="sm" variant={isClaimed ? "ghost" : "default"} disabled={isClaimed} onClick={() => handleClaim(raid)}>
                      {isClaimed ? "Claimed" : `Claim ${CREDITS_RAID_SUCCESS}`}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Dialog open={!!contributing} onClose={() => setContributing(null)} className="max-w-xl max-h-[90vh] overflow-y-auto bg-background border-2 border-secondary/50">
          {contributing && (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading text-secondary">{contributing.name.toUpperCase()}</DialogTitle>
                <DialogDescription>
                  Spend reserves to push Fix back. {ENERGY_THEME[contributing.type].label} counts at full strength.
                </DialogDescription>
              </DialogHeader>
              <EnergyAllocator
                targetType={contributing.type}
                required={contributing.goalKwh}
                progress={totals[contributing.key]?.total ?? 0}
                submitLabel="Contribute"
                submitting={submitting}
                onSubmit={handleContribute}
                onCancel={() => setContributing(null)}
              />
            </>
          )}
              </Dialog>
    </div>
  );
}
