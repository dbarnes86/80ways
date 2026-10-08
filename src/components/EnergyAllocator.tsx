import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useEnergyStore } from '@/stores/energyStore';
import { useUserStore } from '@/stores/userStore';
import { ENERGY_THEME } from '@/data/energyTheme';
import { ENERGY_TYPES, getDeploymentEfficiency, type EnergyType } from '@/data/gameConstants';
import { planDeployment } from '@/lib/gameEngine';
import { Slider, cn } from '@/components/ui';
import { legAdvice, valueWord } from '@/game/coach';
import { Orb } from '@/game/art';

interface EnergyAllocatorProps {
  targetType: EnergyType;
  required: number;
  progress: number;
  submitLabel: string;
  submitting?: boolean;
  onSubmit: (selection: Record<EnergyType, number>) => void;
  onCancel: () => void;
}

const empty = (): Record<EnergyType, number> => ({ nautical: 0, terrestrial: 0, transport: 0, strength: 0 });
const round1 = (n: number) => Math.floor(n * 10) / 10;

/**
 * Stoking the boiler. The screen's job is to teach, not just to take a number: what this leg
 * runs on, what each reserve is worth against it, and the one workout that would close the gap.
 */
export const EnergyAllocator = ({ targetType, required, progress, submitLabel, submitting, onSubmit, onCancel }: EnergyAllocatorProps) => {
  const reserves = useEnergyStore();
  const discipline = useUserStore((s) => s.discipline);
  const [selection, setSelection] = useState(empty);
  const [picked, setPicked] = useState<string | null>(null);
  const remaining = Math.max(0, required - progress);

  const plan = useMemo(() => planDeployment(selection, targetType, remaining), [selection, targetType, remaining]);
  const after = Math.min(required, progress + plan.totalEffective);
  const held = useMemo(() => Object.fromEntries(ENERGY_TYPES.map((t) => [t, reserves[t].current])) as Record<EnergyType, number>, [reserves]);
  const advice = useMemo(() => legAdvice({ targetType, remaining, reserves: held, discipline }), [targetType, remaining, held, discipline]);

  // Best value first, so the list reads as a recommendation.
  const ordered = [...ENERGY_TYPES].sort((a, b) => getDeploymentEfficiency(b, targetType) - getDeploymentEfficiency(a, targetType));
  const hasAnyEnergy = ENERGY_TYPES.some((t) => reserves[t].current >= 0.05);
  const target = ENERGY_THEME[targetType];

  /** Fill from the best-value reserve down until the leg is met, and say what was picked and why. */
  const bestMix = () => {
    const next = empty();
    let left = remaining;
    const used: string[] = [];
    for (const t of ordered) {
      if (left <= 0) break;
      const eff = getDeploymentEfficiency(t, targetType);
      const use = Math.min(reserves[t].current, left / eff);
      if (use < 0.05) continue;
      next[t] = use;
      left -= use * eff;
      used.push(`${use.toFixed(1)} ${ENERGY_THEME[t].label} at ${valueWord(eff)}`);
    }
    setSelection(next);
    setPicked(used.length ? `Spending ${used.join(', then ')}. Best value first, nothing wasted.` : null);
  };

  return (
    <div className="space-y-5">
      {/* The situation, in one sentence. This is the lesson. */}
      <div className={cn('panel flex items-start gap-3 p-4', target.border)}>
        <Orb type={targetType} size={40} />
        <div className="min-w-0">
          <p className="font-heading text-lg font-bold leading-tight">{advice.situation}</p>
          {advice.next && <p className="mt-1 text-sm text-muted-foreground">{advice.next}</p>}
        </div>
      </div>

      <div className="space-y-2">
        {ordered.map((type) => {
          const theme = ENERGY_THEME[type];
          const available = reserves[type].current;
          const efficiency = getDeploymentEfficiency(type, targetType);
          const value = selection[type];
          return (
            <div key={type} className={cn('rounded-2xl border-2 p-3 transition-colors', value > 0 ? `${theme.border} ${theme.bgSoft}` : 'border-border', available < 0.05 && 'opacity-50')}>
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Orb type={type} size={26} />
                  <div>
                    <p className={cn('font-heading text-lg font-bold leading-none', theme.text)}>{theme.label}</p>
                    <p className="font-mono text-xs text-muted-foreground">{available.toFixed(1)} kWh in reserve</p>
                  </div>
                </div>
                <span className={cn('rounded-full border px-2 py-0.5 font-heading text-sm font-bold', efficiency >= 1 ? 'border-success/60 text-success' : efficiency >= 0.75 ? 'border-accent/60 text-accent' : 'border-border text-muted-foreground')}>
                  {valueWord(efficiency)}
                </span>
              </div>
              <Slider value={value} onChange={(v) => setSelection((s) => ({ ...s, [type]: v }))} max={Math.max(0.1, round1(available))} disabled={available < 0.1} label={`${theme.label} energy to spend`} />
              <div className="mt-1 flex justify-between font-mono text-xs text-muted-foreground">
                <span>Spend {value.toFixed(1)}</span>
                {value > 0 && <span className={theme.text}>→ {(value * efficiency).toFixed(1)} toward the leg</span>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-2">
        <div className="flex gap-2">
          <button type="button" onClick={bestMix} disabled={!hasAnyEnergy} className="btn-game btn-quiet btn-sm flex-1">
            Best mix
          </button>
          <button
            type="button"
            onClick={() => {
              setSelection(empty());
              setPicked(null);
            }}
            className="btn-game btn-quiet btn-sm flex-1"
          >
            Reset
          </button>
        </div>
        {picked && <p className="text-sm text-muted-foreground">{picked}</p>}
      </div>

      <div className="panel space-y-2 p-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Spend</span>
          <span className="font-mono">{plan.totalDeployed.toFixed(1)} kWh</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Toward the leg</span>
          <span className="font-mono text-primary">+{plan.totalEffective.toFixed(1)} kWh</span>
        </div>
        {plan.unused > 0.05 && <p className="text-xs text-muted-foreground">{plan.unused.toFixed(1)} kWh isn't needed and stays in your reserves.</p>}
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${Math.min(100, (after / required) * 100)}%` }} />
        </div>
        <div className="flex justify-between font-mono text-xs text-muted-foreground">
          <span>
            {after.toFixed(1)} / {required.toFixed(1)} kWh
          </span>
          <span>{Math.max(0, required - after).toFixed(1)} to go</span>
        </div>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onCancel} className="btn-game btn-quiet btn-sm flex-1">
          Not now
        </button>
        <button type="button" onClick={() => onSubmit(selection)} disabled={plan.totalDeployed <= 0 || submitting} className="btn-game btn-primary btn-sm flex-[2]">
          {submitting ? <Loader2 className="animate-spin" /> : null} {submitLabel}
        </button>
      </div>
    </div>
  );
};
