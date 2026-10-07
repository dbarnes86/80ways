import { useMemo, useState } from 'react';
import { Zap, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { CyberpunkProgress } from '@/components/ui/cyberpunk-progress';
import { useEnergyStore } from '@/stores/energyStore';
import { ENERGY_THEME } from '@/data/energyTheme';
import { ENERGY_TYPES, getDeploymentEfficiency, type EnergyType } from '@/data/gameConstants';
import { planDeployment } from '@/lib/gameEngine';

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

const efficiencyClass = (e: number) => (e >= 1 ? 'text-success' : e >= 0.75 ? 'text-warning' : 'text-destructive');

export const EnergyAllocator = ({ targetType, required, progress, submitLabel, submitting, onSubmit, onCancel }: EnergyAllocatorProps) => {
  const reserves = useEnergyStore();
  const [selection, setSelection] = useState(empty);
  const remaining = Math.max(0, required - progress);

  const plan = useMemo(() => planDeployment(selection, targetType, remaining), [selection, targetType, remaining]);
  const after = Math.min(required, progress + plan.totalEffective);

  // Best efficiency first, so the list reads as a recommendation.
  const ordered = [...ENERGY_TYPES].sort((a, b) => getDeploymentEfficiency(b, targetType) - getDeploymentEfficiency(a, targetType));
  const hasAnyEnergy = ENERGY_TYPES.some((t) => reserves[t].current >= 0.05);

  /** Fill from the most efficient reserve down until the target is met. */
  const autoFill = () => {
    const next = empty();
    let left = remaining;
    for (const t of ordered) {
      if (left <= 0) break;
      const eff = getDeploymentEfficiency(t, targetType);
      const use = Math.min(reserves[t].current, left / eff);
      next[t] = use;
      left -= use * eff;
    }
    setSelection(next);
  };

  return (
    <div className="space-y-5">
      {!hasAnyEnergy && (
        <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
          Your reserves are empty. Log an activity to charge them first.
        </div>
      )}

      <div className="space-y-3">
        {ordered.map((type) => {
          const theme = ENERGY_THEME[type];
          const available = reserves[type].current;
          const efficiency = getDeploymentEfficiency(type, targetType);
          const value = selection[type];
          return (
            <div
              key={type}
              className={`p-3 rounded-lg border-2 transition-colors ${value > 0 ? `${theme.border} ${theme.bgSoft}` : 'border-muted'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <theme.icon className={`w-4 h-4 ${theme.text}`} />
                  <div>
                    <p className={`text-xs font-bold tracking-wider ${theme.text}`}>
                      {theme.label.toUpperCase()}
                      {type === targetType && (
                        <span className="ml-2 text-[10px] bg-success/20 text-success px-1.5 py-0.5 rounded">OPTIMAL</span>
                      )}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono">{available.toFixed(1)} kWh available</p>
                  </div>
                </div>
                <span className={`text-xs font-mono ${efficiencyClass(efficiency)}`}>{Math.round(efficiency * 100)}%</span>
              </div>
              <Slider
                value={[value]}
                onValueChange={(v) => setSelection((s) => ({ ...s, [type]: v[0] }))}
                max={Math.max(0.1, round1(available))}
                step={0.1}
                disabled={available < 0.1}
                aria-label={`${theme.label} energy to deploy`}
              />
              <div className="flex justify-between text-[11px] font-mono mt-1 text-muted-foreground">
                <span>Deploy {value.toFixed(1)}</span>
                {value > 0 && <span className={theme.text}>→ +{(value * efficiency).toFixed(1)} progress</span>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button type="button" onClick={autoFill} variant="outline" size="sm" className="border-primary/50" disabled={!hasAnyEnergy}>
          <Zap className="w-4 h-4 mr-1" /> Best mix
        </Button>
        <Button type="button" onClick={() => setSelection(empty())} variant="outline" size="sm" className="border-primary/50">
          <RefreshCw className="w-4 h-4 mr-1" /> Reset
        </Button>
      </div>

      <div className="p-4 rounded-lg border border-primary/40 bg-primary/5 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Spend</span>
          <span className="font-mono">{plan.totalDeployed.toFixed(1)} kWh</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Progress gained</span>
          <span className="font-mono text-primary">+{plan.totalEffective.toFixed(1)} kWh</span>
        </div>
        {plan.unused > 0.05 && (
          <p className="text-[11px] text-muted-foreground">
            {plan.unused.toFixed(1)} kWh selected isn't needed and stays in your reserves.
          </p>
        )}
        <CyberpunkProgress value={after} max={required} segments={12} glow="cyan" size="sm" />
        <div className="flex justify-between text-[11px] font-mono text-muted-foreground">
          <span>{after.toFixed(1)} / {required.toFixed(1)} kWh</span>
          <span>{Math.max(0, required - after).toFixed(1)} to go</span>
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="button" onClick={onCancel} variant="outline" className="flex-1">
          Cancel
        </Button>
        <Button
          type="button"
          onClick={() => onSubmit(selection)}
          disabled={plan.totalDeployed <= 0 || submitting}
          className="flex-1 bg-primary hover:bg-primary/90"
        >
          {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
          {submitLabel}
        </Button>
      </div>
    </div>
  );
};
