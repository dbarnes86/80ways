import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Swords, XCircle } from 'lucide-react';
import { EnergyAllocator } from '@/components/EnergyAllocator';
import { Button, Dialog, HoloCard } from '@/components/ui';
import { toast } from '@/components/toast';
import { BossCard, type Hit } from '@/features/raids/BossCard';
import { supabase } from '@/lib/supabase';
import { haptic } from '@/lib/native';
import { useSeasonStore } from '@/stores/seasonStore';
import { useRaidStore } from '@/stores/raidStore';
import { useUserStore } from '@/stores/userStore';
import { useEnergyStore } from '@/stores/energyStore';
import { selectIsMember, useMembershipStore } from '@/stores/membershipStore';
import { ENERGY_THEME } from '@/data/energyTheme';
import { ENERGY_TYPES, type EnergyType } from '@/data/gameConstants';
import { formatTimeLeft, getRaidSchedule, getRaidStatus, RAID_XP_FIRST_CONTRIBUTION, type ScheduledRaid } from '@/data/raids';
import { claimRaidReward, contributeToRaid } from '@/lib/gameActions';
import { Orb } from '@/game/art';
import { announce, floatReward } from '@/game/rewards';
import { grantChest } from '@/game/questActions';
import { play } from '@/game/sfx';

interface Contributor {
  display_name: string;
  total: number;
  is_you: boolean;
}

/** Other players' hits arrive by polling while the page is open. */
const REFRESH_MS = 20_000;

export default function Raids() {
  const activeSeason = useSeasonStore((s) => s.activeSeason);
  const { totals, available, loaded, fetchTotals } = useRaidStore();
  const claimed = useUserStore((s) => s.raidRewardsClaimed);
  const isMember = useMembershipStore(selectIsMember);
  const energy = useEnergyStore();
  const canStrike = ENERGY_TYPES.some((t) => energy[t].current >= 0.1);

  const [striking, setStriking] = useState<ScheduledRaid | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [hits, setHits] = useState<Hit[]>([]);
  const hitId = useRef(1);

  const raids = activeSeason ? getRaidSchedule(activeSeason.startDate, activeSeason.endDate) : [];
  const activeRaid = raids.find((r) => getRaidStatus(r) === 'active');
  const upcoming = raids.filter((r) => getRaidStatus(r) === 'upcoming').slice(0, 3);
  const past = raids.filter((r) => getRaidStatus(r) === 'ended').reverse();

  useEffect(() => {
    if (!activeSeason) return;
    void fetchTotals(activeSeason.id);
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') void fetchTotals(activeSeason.id);
    }, REFRESH_MS);
    return () => clearInterval(t);
  }, [activeSeason, fetchTotals]);

  const activeRaidKey = activeRaid?.key;
  useEffect(() => {
    if (!activeSeason || !activeRaidKey || !available) return;
    supabase
      .rpc('get_raid_top_contributors', { p_season_id: activeSeason.id, p_raid_key: activeRaidKey, p_limit: 6 })
      .then(({ data }) => setContributors((data ?? []).map((c) => ({ ...c, total: Number(c.total) }))));
  }, [activeSeason, activeRaidKey, available, totals]);

  const strike = async (selection: Record<EnergyType, number>) => {
    if (!striking || !activeSeason) return;
    setSubmitting(true);
    try {
      const res = await contributeToRaid(striking, activeSeason.id, selection);
      setStriking(null);
      const critical = res.plan.lines.every((l) => l.efficiency >= 1);
      const id = hitId.current++;
      setHits((h) => [...h, { id, amount: res.plan.totalEffective, critical }]);
      setTimeout(() => setHits((h) => h.filter((x) => x.id !== id)), 1500);
      haptic('heavy');
      play('hit');
      floatReward(critical ? 'Critical hit!' : 'Direct hit!', 'streak');
      announce({ xp: res.xp, levelUp: res.levelUp });
    } catch (err) {
      haptic('error');
      toast({ title: 'Strike failed', description: err instanceof Error ? err.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const claim = (raid: ScheduledRaid) => {
    if (!activeSeason) return;
    const res = claimRaidReward(activeSeason.id, raid.key);
    if (res) grantChest('silver', `${raid.name} beaten`);
  };

  if (!activeSeason) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-2 text-4xl font-heading text-glow-cyan">Raids</h1>
        <p className="text-muted-foreground">No season is running, so Fix is lying low.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 pb-6 pt-4">
      <div>
        <h1 className="font-heading text-3xl font-bold text-glow-magenta">The crew vs Fix</h1>
        <p className="text-muted-foreground">First hit +{RAID_XP_FIRST_CONTRIBUTION} XP. Beat him, open a chest.</p>
      </div>

      {loaded && !available && (
        <HoloCard glow="none" corners={false} className="mb-6 p-4 text-sm text-warning">
          Raid HQ is offline right now. Strikes will open again shortly.
        </HoloCard>
      )}

      {activeRaid ? (
        <>
          <BossCard
            raid={activeRaid}
            totals={totals[activeRaid.key]}
            canStrike={canStrike}
            isMember={isMember}
            available={available}
            hits={hits}
            onStrike={() => {
              haptic('tap');
              setStriking(activeRaid);
            }}
          />
          {contributors.length > 0 && (
            <div className="mb-10">
              <h3 className="mb-3 font-heading text-sm uppercase tracking-wider text-muted-foreground">Top damage</h3>
              <ol className="grid grid-cols-2 gap-2 md:grid-cols-3">
                {contributors.map((c, i) => (
                  <li
                    key={`${c.display_name}-${i}`}
                    className={`animate-fade-up rounded-lg border p-3 ${c.is_you ? 'border-primary/50 bg-primary/10' : 'border-border bg-muted/20'}`}
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <p className="truncate font-heading text-sm">
                      <span className="mr-1 font-mono text-muted-foreground">{i + 1}.</span>
                      {c.display_name}
                      {c.is_you && <span className="text-xs text-primary"> (you)</span>}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">-{c.total.toFixed(1)} HP</p>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-3 rounded-3xl border border-border bg-card/70 p-6 text-center">
          <Swords className="mx-auto size-12 text-muted-foreground" />
          {upcoming[0] ? (
            <>
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">Fix strikes in</p>
              <p className="font-heading text-5xl font-bold text-glow-magenta">{formatTimeLeft(upcoming[0].start)}</p>
              <p className="font-heading text-xl font-bold">{upcoming[0].name}</p>
              <p className="flex items-center justify-center gap-2 text-muted-foreground">
                Weak to <Orb type={upcoming[0].type} size={18} />
                <span className={ENERGY_THEME[upcoming[0].type].text}>{ENERGY_THEME[upcoming[0].type].label}</span>
              </p>
              <p className="text-muted-foreground">Bank some now.
              </p>
            </>
          ) : (
            <p className="font-heading text-xl font-bold">No more raids this season</p>
          )}
        </div>
      )}

      {upcoming.length > (activeRaid ? 0 : 1) && (
        <section className="space-y-2">
          <h2 className="font-heading text-xl font-bold">Coming up</h2>
          {upcoming.slice(activeRaid ? 0 : 1).map((raid) => (
            <div key={raid.key} className="flex items-center gap-3 rounded-2xl border border-border bg-card/60 p-3">
              <Orb type={raid.type} size={28} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-heading text-lg font-bold leading-tight">{raid.name}</p>
                <p className="text-sm text-muted-foreground">{raid.goalKwh} HP · weak to {ENERGY_THEME[raid.type].label}</p>
              </div>
              <span className="shrink-0 font-heading font-bold text-accent">{formatTimeLeft(raid.start)}</span>
            </div>
          ))}
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="mb-2 font-heading text-xl font-bold">Past raids</h2>
          <div className="space-y-2">
            {past.map((raid) => {
              const t = totals[raid.key];
              const won = (t?.total ?? 0) >= raid.goalKwh;
              const helped = (t?.yourContribution ?? 0) > 0;
              const isClaimed = claimed.includes(`${activeSeason.id}:${raid.key}`);
              return (
                <div key={raid.key} className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 p-3">
                  {won ? <CheckCircle2 className="size-5 shrink-0 text-success" /> : <XCircle className="size-5 shrink-0 text-destructive" />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-heading text-sm">{raid.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {won ? 'Fix defeated' : 'Fix escaped'} · {t?.participants ?? 0} crew
                      {helped && ` · you dealt ${t!.yourContribution.toFixed(1)}`}
                    </p>
                  </div>
                  {won && helped && (
                    <Button size="sm" variant={isClaimed ? 'ghost' : 'default'} disabled={isClaimed} onClick={() => claim(raid)}>
                      {isClaimed ? 'Opened' : 'Open chest'}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <Dialog
        open={!!striking}
        onClose={() => setStriking(null)}
        title={striking ? `Strike: ${striking.name}` : undefined}
        description={striking ? `Spend reserves to hit Fix. ${ENERGY_THEME[striking.type].label} is his weakness and lands as a critical.` : undefined}
        className="max-w-xl border-accent/50"
      >
        {striking && (
          <EnergyAllocator
            targetType={striking.type}
            required={striking.goalKwh}
            progress={totals[striking.key]?.total ?? 0}
            submitLabel="Strike"
            submitting={submitting}
            onSubmit={(s) => void strike(s)}
            onCancel={() => setStriking(null)}
          />
        )}
      </Dialog>
    </div>
  );
}
