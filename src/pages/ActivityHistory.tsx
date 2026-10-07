import { useMemo, useState } from "react";
import { BookOpen, Download, Zap } from "lucide-react";
import { useActivityStore, type Activity } from "@/stores/activityStore";
import { useUserStore } from "@/stores/userStore";
import { ENERGY_THEME } from "@/data/energyTheme";
import { KM_PER_MILE } from "@/data/gameConstants";
import { Button, HoloCard } from '@/components/ui';

type Range = "week" | "month" | "year" | "all";

const RANGES: { id: Range; label: string; days: number | null }[] = [
  { id: "week", label: "7 days", days: 7 },
  { id: "month", label: "30 days", days: 30 },
  { id: "year", label: "This year", days: null },
  { id: "all", label: "All time", days: null },
];

const inRange = (a: Activity, range: Range) => {
  const t = new Date(a.timestamp);
  const now = new Date();
  if (range === "all") return true;
  if (range === "year") return t.getFullYear() === now.getFullYear();
  const days = RANGES.find((r) => r.id === range)!.days!;
  return now.getTime() - t.getTime() <= days * 86_400_000;
};

const formatDuration = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`;
};

const csvEscape = (v: string | number | undefined) => {
  const s = v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export default function ActivityHistory() {
  const activities = useActivityStore((s) => s.activities);
  const imperial = useUserStore((s) => s.settings.units) === "imperial";
  const [range, setRange] = useState<Range>("month");

  const filtered = useMemo(() => activities.filter((a) => inRange(a, range)), [activities, range]);

  const toUnit = (km: number) => (imperial ? km / KM_PER_MILE : km);
  const unitLabel = imperial ? "mi" : "km";

  const totals = filtered.reduce(
    (acc, a) => ({
      minutes: acc.minutes + a.duration,
      distance: acc.distance + (a.distance ?? 0),
      energy: acc.energy + a.actualEnergy,
    }),
    { minutes: 0, distance: 0, energy: 0 },
  );

  const statItems = [
    { label: "Activities", value: filtered.length.toString(), glow: "cyan" as const },
    { label: "Distance", value: `${toUnit(totals.distance).toFixed(1)} ${unitLabel}`, glow: "purple" as const },
    { label: "Time", value: formatDuration(totals.minutes), glow: "magenta" as const },
    { label: "Energy", value: `${totals.energy.toFixed(1)} kWh`, glow: "cyan" as const },
  ];

  const exportCsv = () => {
    const header = ["date", "activity", "duration_min", "distance_km", "intensity", "reserve", "energy_kwh", "efficiency", "boosters", "notes"];
    const rows = activities.map((a) =>
      [
        a.timestamp,
        a.activityType,
        a.duration,
        a.distance?.toFixed(2),
        a.intensity,
        a.targetEnergyType,
        a.actualEnergy.toFixed(2),
        a.efficiency,
        a.boosterUsed,
        a.notes,
      ].map(csvEscape).join(","),
    );
    const blob = new Blob([[header.join(","), ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `atw80-logbook-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-heading mb-2 text-glow-cyan">Activity Logbook</h1>
        <p className="text-muted-foreground">Every workout that's powered your journey</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statItems.map((s, i) => (
          <div className="animate-fade-up" key={s.label} style={{ animationDelay: `${i * 0.08}s` }}>
            <HoloCard glow={s.glow} className="p-5">
              <div className="text-2xl font-mono mb-1">{s.value}</div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
            </HoloCard>
          </div>
        ))}
      </div>

      <HoloCard glow="none" corners={false} scanLines={false} className="p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {RANGES.map((r) => (
              <Button key={r.id} variant={range === r.id ? "default" : "outline"} size="sm" onClick={() => setRange(r.id)}>
                {r.label}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={activities.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </HoloCard>

      <HoloCard glow="cyan" className="p-4 md:p-6">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p>{activities.length === 0 ? "No activities yet. Log your first one from the dashboard." : "Nothing logged in this period."}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-3 font-heading text-xs text-muted-foreground">Date</th>
                  <th className="text-left py-3 px-3 font-heading text-xs text-muted-foreground">Activity</th>
                  <th className="text-left py-3 px-3 font-heading text-xs text-muted-foreground">Time</th>
                  <th className="text-left py-3 px-3 font-heading text-xs text-muted-foreground hidden sm:table-cell">Distance</th>
                  <th className="text-left py-3 px-3 font-heading text-xs text-muted-foreground hidden md:table-cell">Intensity</th>
                  <th className="text-right py-3 px-3 font-heading text-xs text-muted-foreground">Energy</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => {
                  const theme = ENERGY_THEME[a.targetEnergyType];
                  return (
                    <tr key={a.id} className="border-b border-border/50 hover:bg-primary/5 transition-smooth" title={a.notes}>
                      <td className="py-3 px-3 font-mono text-xs whitespace-nowrap">
                        {new Date(a.timestamp).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-primary/15 text-primary text-xs font-heading whitespace-nowrap">
                          {a.activityType}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-xs">{formatDuration(a.duration)}</td>
                      <td className="py-3 px-3 font-mono text-xs hidden sm:table-cell">
                        {a.distance ? `${toUnit(a.distance).toFixed(1)} ${unitLabel}` : "—"}
                      </td>
                      <td className="py-3 px-3 text-xs capitalize hidden md:table-cell">{a.intensity}</td>
                      <td className={`py-3 px-3 font-mono text-xs text-right whitespace-nowrap ${theme.text}`}>
                        <Zap className="w-3 h-3 inline mr-0.5" />
                        {a.actualEnergy.toFixed(1)} {theme.short}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </HoloCard>
    </div>
  );
}
