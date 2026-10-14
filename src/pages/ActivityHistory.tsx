import { useMemo, useState } from "react";
import { BookOpen, Download } from "lucide-react";
import { useActivityStore, type Activity } from "@/stores/activityStore";
import { useUserStore } from "@/stores/userStore";
import { ENERGY_THEME } from "@/data/energyTheme";
import { KM_PER_MILE } from "@/data/gameConstants";
import { cn } from '@/components/ui';
import { Orb } from '@/game/art';
import { haptic } from '@/lib/native';

type Range = "week" | "month" | "year" | "all";

const RANGES: { id: Range; label: string; days: number | null }[] = [
  { id: "week", label: "7 days", days: 7 },
  { id: "month", label: "30 days", days: 30 },
  { id: "year", label: "Year", days: null },
  { id: "all", label: "All", days: null },
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
    { label: "Workouts", value: filtered.length.toString() },
    { label: unitLabel === "mi" ? "Miles" : "Km", value: toUnit(totals.distance).toFixed(1) },
    { label: "Time", value: formatDuration(totals.minutes) },
    { label: "kWh", value: totals.energy.toFixed(1) },
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
    <div className="mx-auto max-w-md space-y-4 px-4 pb-6 pt-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="kicker text-accent">Ship's log</p>
          <h1 className="font-heading text-3xl font-bold leading-none">Logbook</h1>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={activities.length === 0}
          className="press flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40"
        >
          <Download className="size-4" /> Export
        </button>
      </div>

      <div className="grid grid-cols-4 rounded-full border border-border p-1" role="tablist" aria-label="Period">
        {RANGES.map((r) => (
          <button
            key={r.id}
            type="button"
            role="tab"
            aria-selected={range === r.id}
            onClick={() => {
              haptic('select');
              setRange(r.id);
            }}
            className={cn('rounded-full py-1.5 font-heading text-base font-bold transition-colors', range === r.id ? 'bg-accent text-background' : 'text-muted-foreground')}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* The period's totals in one slim row. */}
      <div className="panel grid grid-cols-4 divide-x divide-border/60 py-3">
        {statItems.map((st) => (
          <div key={st.label} className="px-1 text-center">
            <p className="font-heading text-xl font-bold leading-none">{st.value}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{st.label}</p>
          </div>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="panel py-10 text-center text-muted-foreground">
          <BookOpen className="mx-auto mb-3 size-10 opacity-50" />
          <p>{activities.length === 0 ? "No workouts yet. They show up here once collected on Home." : "Nothing logged in this period."}</p>
        </div>
      ) : (
        <ul className="panel divide-y divide-border/60">
          {filtered.map((a) => {
            const theme = ENERGY_THEME[a.targetEnergyType];
            const bits = [
              new Date(a.timestamp).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" }),
              formatDuration(a.duration),
              a.distance ? `${toUnit(a.distance).toFixed(1)} ${unitLabel}` : null,
            ].filter(Boolean);
            return (
              <li key={a.id} className="flex items-center gap-3 px-3 py-2.5" title={a.notes}>
                <Orb type={a.targetEnergyType} size={22} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-heading text-base font-bold leading-tight">{a.activityType}</p>
                  <p className="truncate text-xs text-muted-foreground">{bits.join(" · ")}</p>
                </div>
                <span className={cn("shrink-0 font-heading text-base font-bold", theme.text)}>+{a.actualEnergy.toFixed(1)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
