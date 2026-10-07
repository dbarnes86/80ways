import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trophy, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { selectHasJoined, useSeasonStore } from "@/stores/seasonStore";
import { JOURNEY_LEGS } from "@/data/journeyLegs";
import { getDistanceCovered } from "@/lib/gameEngine";
import { Badge, Button, HoloCard } from '@/components/ui';

interface Row {
  rank: number;
  displayName: string;
  currentLeg: number;
  legProgress: number;
  status: string;
  xp: number;
  isYou: boolean;
}

const medal = (rank: number) =>
  rank === 1 ? "bg-warning text-warning-foreground" : rank === 2 ? "bg-muted-foreground/40" : rank === 3 ? "bg-warning/50" : "bg-muted";

export default function Leaderboard() {
  const activeSeason = useSeasonStore((s) => s.activeSeason);
  const hasJoined = useSeasonStore(selectHasJoined);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async (seasonId: string) => {
    setLoading(true);
    const { data, error } = await supabase.rpc("get_season_leaderboard", { p_season_id: seasonId, p_limit: 50 });
    setLoading(false);
    if (error) {
      setError("The leaderboard isn't available yet.");
      return;
    }
    setError(null);
    setRows(
      (data ?? []).map((r) => ({
        rank: Number(r.rank),
        displayName: r.display_name,
        currentLeg: r.current_leg,
        legProgress: Number(r.leg_progress),
        status: r.status,
        xp: r.xp,
        isYou: r.is_you,
      })),
    );
  };

  useEffect(() => {
    if (activeSeason) void load(activeSeason.id);
  }, [activeSeason]);

  const describe = (r: Row) => {
    const done = r.status === "completed";
    const leg = JOURNEY_LEGS[r.currentLeg] ?? JOURNEY_LEGS[0];
    const km = getDistanceCovered(r.currentLeg, r.legProgress / leg.requiredEnergy.amount, done);
    return { km, where: done ? "Back in London" : `${leg.from} → ${leg.to}` };
  };

  const top = rows?.filter((r) => !r.isYou || r.rank <= 50) ?? [];
  const you = rows?.find((r) => r.isYou);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-heading mb-2 text-glow-cyan">Leaderboard</h1>
          <p className="text-muted-foreground">Who's furthest round the world this season</p>
        </div>
        {activeSeason && (
          <Button variant="ghost" size="icon" onClick={() => load(activeSeason.id)} disabled={loading} aria-label="Refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        )}
      </div>

      {you && (
        <HoloCard glow="cyan" className="p-5 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono text-muted-foreground tracking-widest">YOUR POSITION</p>
              <p className="text-3xl font-heading font-bold text-primary">#{you.rank}</p>
            </div>
            <div className="text-right">
              <p className="font-mono">{describe(you).km.toLocaleString()} km</p>
              <p className="text-xs text-muted-foreground">{describe(you).where}</p>
            </div>
          </div>
        </HoloCard>
      )}

      {!hasJoined && activeSeason && (
        <HoloCard glow="none" corners={false} className="p-4 mb-6 text-sm text-muted-foreground">
          You're not on the expedition yet. <Link to="/dashboard" className="text-primary hover:underline">Board from your dashboard</Link> to get ranked.
        </HoloCard>
      )}

      <HoloCard glow="purple" className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-heading flex items-center gap-2">
            <Trophy className="w-5 h-5 text-warning" /> Expedition Standings
          </h2>
          {activeSeason && <Badge className="bg-accent/20 text-accent border-accent/40">Season {activeSeason.seasonNumber}</Badge>}
        </div>

        {rows === null && !error ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <p className="text-center py-10 text-muted-foreground">{error}</p>
        ) : top.length === 0 ? (
          <p className="text-center py-10 text-muted-foreground">Nobody has boarded yet. Be the first.</p>
        ) : (
          <div className="space-y-2">
            {top.map((entry, index) => {
              const d = describe(entry);
              return (
                <div
                  key={`${entry.rank}-${entry.displayName}`}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    entry.isYou
                      ? "bg-primary/15 border border-primary/50"
                      : entry.rank <= 3
                        ? "bg-gradient-to-r from-primary/10 to-transparent border border-primary/20"
                        : "bg-muted/20"
                  } animate-fade-up`}
                 style={{ animationDelay: `${Math.min(index, 10) * 0.04}s` }}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-mono font-bold text-sm flex-shrink-0 ${medal(entry.rank)}`}>
                    #{entry.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-heading truncate">
                      {entry.displayName}
                      {entry.isYou && <span className="text-primary text-xs ml-2">(you)</span>}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{d.where}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-mono text-sm">{d.km.toLocaleString()} km</div>
                    <div className="text-[10px] text-muted-foreground font-mono">{entry.xp.toLocaleString()} XP</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </HoloCard>
    </div>
  );
}
