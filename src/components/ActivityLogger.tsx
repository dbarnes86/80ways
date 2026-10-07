import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUserStore } from '@/stores/userStore';
import { useToast } from '@/hooks/use-toast';
import { logActivity, type LogActivityResult } from '@/lib/gameActions';
import { calculateActivityEnergy, getNativeEnergyType } from '@/lib/gameEngine';
import { ENERGY_THEME } from '@/data/energyTheme';
import {
  DAILY_MISSION,
  ENERGY_TYPES,
  INTENSITY_MULTIPLIERS,
  KM_PER_MILE,
  MULTI_CHARGE_SPILLOVER,
  XP_OPTIMAL_MATCH_BONUS,
  type EnergyType,
  type Intensity,
} from '@/data/gameConstants';
import {
  Anchor,
  Waves,
  Sailboat,
  Ship,
  PersonStanding,
  Footprints,
  Mountain,
  Bike,
  Activity as ActivityIcon,
  Zap,
  Dumbbell,
  Weight,
  Sparkles,
  Flame,
  Plus,
  Minus,
  Droplet,
  Droplets,
  Info,
  Check,
  Loader2,
  Layers,
  Coins,
  Rocket,
  Trophy,
  type LucideIcon,
} from 'lucide-react';

interface ActivityLoggerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ACTIVITIES: { name: string; icon: LucideIcon }[] = [
  { name: 'Rowing', icon: Anchor },
  { name: 'Swimming', icon: Waves },
  { name: 'Sailing', icon: Sailboat },
  { name: 'Kayaking', icon: Ship },
  { name: 'Running', icon: PersonStanding },
  { name: 'Walking', icon: Footprints },
  { name: 'Hiking', icon: Mountain },
  { name: 'Jogging', icon: PersonStanding },
  { name: 'Cycling', icon: Bike },
  { name: 'Skateboarding', icon: ActivityIcon },
  { name: 'Rollerblading', icon: Zap },
  { name: 'E-biking', icon: Bike },
  { name: 'Weightlifting', icon: Dumbbell },
  { name: 'CrossFit', icon: Weight },
  { name: 'Calisthenics', icon: Sparkles },
  { name: 'Yoga', icon: Flame },
];

const INTENSITY_OPTIONS: { value: Intensity; label: string; description: string; icon: LucideIcon; selected: string }[] = [
  { value: 'light', label: 'LIGHT', description: 'A gentle pace', icon: Droplet, selected: 'border-primary text-primary' },
  { value: 'moderate', label: 'MODERATE', description: 'Steady progress', icon: Droplets, selected: 'border-warning text-warning' },
  { value: 'vigorous', label: 'VIGOROUS', description: 'Maximum effort', icon: Flame, selected: 'border-destructive text-destructive' },
];

/** yyyy-MM-ddTHH:mm in local time, for <input type="datetime-local">. */
const toLocalInput = (d: Date) => {
  const off = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
};

const emptyForm = () => ({
  activityType: '',
  duration: 30,
  distance: '' as string,
  intensity: 'moderate' as Intensity,
  performedAt: toLocalInput(new Date()),
  notes: '',
  targetEnergyType: '' as EnergyType | '',
  useAmplifier: false,
  useMultiCharge: false,
});

export const ActivityLogger = ({ open, onOpenChange }: ActivityLoggerProps) => {
  const { toast } = useToast();
  const inventory = useUserStore((s) => s.inventory);
  const preferredUnit = useUserStore((s) => s.settings.units);

  const [form, setForm] = useState(emptyForm);
  const [unit, setUnit] = useState<'km' | 'mi'>(preferredUnit === 'imperial' ? 'mi' : 'km');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<LogActivityResult | null>(null);

  const nativeType = form.activityType ? getNativeEnergyType(form.activityType) : undefined;
  const showDistance = nativeType && nativeType !== 'strength';
  const distanceKm = useMemo(() => {
    const n = parseFloat(form.distance);
    if (!showDistance || !Number.isFinite(n) || n <= 0) return undefined;
    return unit === 'mi' ? n * KM_PER_MILE : n;
  }, [form.distance, unit, showDistance]);

  const preview = (target: EnergyType, boosters = true) =>
    calculateActivityEnergy({
      durationMin: form.duration,
      intensity: form.intensity,
      distanceKm,
      activityType: form.activityType,
      targetType: target,
      amplifier: boosters && form.useAmplifier,
      multiCharge: boosters && form.useMultiCharge,
    });

  const calc = form.targetEnergyType ? preview(form.targetEnergyType) : null;

  const close = (next: boolean) => {
    onOpenChange(next);
    if (!next) {
      setTimeout(() => {
        setForm(emptyForm());
        setErrors({});
        setResult(null);
      }, 200);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    const performedAt = new Date(form.performedAt);

    if (!form.activityType) nextErrors.activityType = 'Pick an activity';
    if (form.duration < 1 || form.duration > 600) nextErrors.duration = 'Duration must be between 1 and 600 minutes';
    if (form.distance && !(parseFloat(form.distance) > 0)) nextErrors.distance = 'Distance must be positive';
    if (Number.isNaN(performedAt.getTime())) nextErrors.performedAt = 'Pick when you did it';
    else if (performedAt.getTime() > Date.now() + 60_000) nextErrors.performedAt = "Can't log the future, sadly";
    else if (Date.now() - performedAt.getTime() > 7 * 86_400_000) nextErrors.performedAt = 'Activities must be from the last 7 days';
    if (!form.targetEnergyType) nextErrors.targetEnergyType = 'Pick a reserve to charge';

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    try {
      const res = logActivity({
        activityType: form.activityType,
        targetType: form.targetEnergyType as EnergyType,
        durationMin: form.duration,
        intensity: form.intensity,
        distanceKm,
        notes: form.notes,
        performedAt,
        useAmplifier: form.useAmplifier,
        useMultiCharge: form.useMultiCharge,
      });
      setResult(res);
      if (res.levelUp) {
        toast({ title: `Level ${res.levelUp.level}!`, description: `You're now a ${res.levelUp.name}.` });
      }
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : 'Something went wrong' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background border-2 border-primary/50">
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="py-8 text-center space-y-5"
            >
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: 'spring' }}>
                <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto">
                  <Check className="h-10 w-10 text-success" />
                </div>
              </motion.div>

              <div>
                <h2 className="text-2xl font-heading font-bold mb-2">ACTIVITY RECORDED</h2>
                <p className={`text-lg ${ENERGY_THEME[result.activity.targetEnergyType].text}`}>
                  +{result.energy.toFixed(1)} kWh {ENERGY_THEME[result.activity.targetEnergyType].label.toUpperCase()}
                </p>
                {Object.keys(result.spillover).length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Multi-Charge: +{Object.values(result.spillover)[0]!.toFixed(1)} kWh to every other reserve
                  </p>
                )}
              </div>

              <div className="flex justify-center gap-3 text-sm font-mono">
                <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary">+{result.xp} XP</span>
                <span className="px-3 py-1 rounded-full bg-warning/10 border border-warning/30 text-warning flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5" /> +{result.credits}
                </span>
              </div>

              <div className="space-y-2 max-w-sm mx-auto">
                {result.starterCompleted && (
                  <div className="rounded-lg border border-primary/40 bg-primary/10 p-3 text-sm flex items-center gap-2">
                    <Rocket className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>Lift Off complete! You're cleared to board the expedition.</span>
                  </div>
                )}
                {result.dailyMissionCompleted && (
                  <div className="rounded-lg border border-accent/40 bg-accent/10 p-3 text-sm flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-accent flex-shrink-0" />
                    <span>{DAILY_MISSION.name} done for today.</span>
                  </div>
                )}
                {result.levelUp && (
                  <div className="rounded-lg border border-secondary/40 bg-secondary/10 p-3 text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-secondary flex-shrink-0" />
                    <span>Level {result.levelUp.level}: {result.levelUp.name}</span>
                  </div>
                )}
              </div>

              <p className="text-sm italic text-muted-foreground max-w-sm mx-auto">
                "Excellent work. Our reserves are replenished." <span className="text-primary">— Phileas Fogg</span>
              </p>

              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => { setForm(emptyForm()); setResult(null); }}>
                  Log another
                </Button>
                <Button onClick={() => close(false)}>Done</Button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DialogHeader>
                <DialogTitle className="text-2xl md:text-3xl font-heading font-bold text-glow">LOG ACTIVITY</DialogTitle>
                <DialogDescription>Record a workout to charge your energy reserves</DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                {/* Activity Type */}
                <div>
                  <Label className="text-sm font-mono tracking-wider mb-2 block">ACTIVITY</Label>
                  <Select
                    value={form.activityType}
                    onValueChange={(value) => {
                      setForm((prev) => ({ ...prev, activityType: value, targetEnergyType: getNativeEnergyType(value) ?? '' }));
                      setErrors((prev) => ({ ...prev, activityType: '' }));
                    }}
                  >
                    <SelectTrigger className="bg-background/50 border-primary/30 focus:border-primary text-lg h-12">
                      <SelectValue placeholder="Select activity type" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-primary/30 max-h-80 z-[100]">
                      {ENERGY_TYPES.map((type) => (
                        <SelectGroup key={type}>
                          <SelectLabel className={`text-xs font-mono tracking-wider ${ENERGY_THEME[type].text}`}>
                            {ENERGY_THEME[type].label.toUpperCase()}
                          </SelectLabel>
                          {ACTIVITIES.filter((a) => getNativeEnergyType(a.name) === type).map((activity) => (
                            <SelectItem key={activity.name} value={activity.name} className="cursor-pointer py-2.5">
                              <div className="flex items-center gap-3">
                                <activity.icon className="h-4 w-4" />
                                <span>{activity.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.activityType && <p className="text-destructive text-sm mt-1">{errors.activityType}</p>}
                </div>

                {/* Duration */}
                <div>
                  <Label className="text-sm font-mono tracking-wider mb-2 block">DURATION (MINUTES)</Label>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={() => setForm((p) => ({ ...p, duration: Math.max(1, p.duration - 5) }))}
                      className="border-primary/30"
                      aria-label="5 minutes less"
                    >
                      <Minus className="h-5 w-5" />
                    </Button>
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={form.duration}
                      onChange={(e) => setForm((p) => ({ ...p, duration: parseInt(e.target.value) || 0 }))}
                      className="text-center text-3xl font-mono h-14 bg-background/50 border-primary/30 focus:border-primary flex-1"
                      min={1}
                      max={600}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={() => setForm((p) => ({ ...p, duration: Math.min(600, p.duration + 5) }))}
                      className="border-primary/30"
                      aria-label="5 minutes more"
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>
                  {errors.duration && <p className="text-destructive text-sm mt-1">{errors.duration}</p>}
                </div>

                {/* Distance */}
                {showDistance && (
                  <div>
                    <Label className="text-sm font-mono tracking-wider mb-2 block">DISTANCE (OPTIONAL)</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="0.1"
                        value={form.distance}
                        onChange={(e) => setForm((p) => ({ ...p, distance: e.target.value }))}
                        placeholder="0.0"
                        className="bg-background/50 border-primary/30 text-lg h-12 flex-1"
                      />
                      <div className="flex border border-primary/30 rounded-md overflow-hidden">
                        {(['km', 'mi'] as const).map((u) => (
                          <Button
                            key={u}
                            type="button"
                            variant={unit === u ? 'default' : 'ghost'}
                            onClick={() => setUnit(u)}
                            className="rounded-none h-12"
                          >
                            {u.toUpperCase()}
                          </Button>
                        ))}
                      </div>
                    </div>
                    {errors.distance && <p className="text-destructive text-sm mt-1">{errors.distance}</p>}
                  </div>
                )}

                {/* Intensity */}
                <div>
                  <Label className="text-sm font-mono tracking-wider mb-2 block">INTENSITY</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {INTENSITY_OPTIONS.map((option) => {
                      const isSelected = form.intensity === option.value;
                      return (
                        <Card
                          key={option.value}
                          role="button"
                          tabIndex={0}
                          aria-pressed={isSelected}
                          className={`p-3 cursor-pointer transition-all border-2 ${
                            isSelected ? option.selected : 'border-muted hover:border-primary/50'
                          }`}
                          onClick={() => setForm((p) => ({ ...p, intensity: option.value }))}
                          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setForm((p) => ({ ...p, intensity: option.value }))}
                        >
                          <div className="flex flex-col items-center text-center">
                            <option.icon className={`h-6 w-6 mb-1 ${isSelected ? '' : 'text-muted-foreground'}`} />
                            <h4 className="font-bold text-xs">{option.label}</h4>
                            <p className="text-[10px] text-muted-foreground hidden sm:block">{option.description}</p>
                            <p className="text-[10px] font-mono text-muted-foreground">×{INTENSITY_MULTIPLIERS[option.value]}</p>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                {/* When */}
                <div>
                  <Label htmlFor="performed-at" className="text-sm font-mono tracking-wider mb-2 block">WHEN</Label>
                  <Input
                    id="performed-at"
                    type="datetime-local"
                    value={form.performedAt}
                    max={toLocalInput(new Date())}
                    onChange={(e) => setForm((p) => ({ ...p, performedAt: e.target.value }))}
                    className="bg-background/50 border-primary/30 h-12"
                  />
                  {errors.performedAt && <p className="text-destructive text-sm mt-1">{errors.performedAt}</p>}
                </div>

                {/* Reserve selection */}
                {form.activityType && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4">
                    <div>
                      <Label className="text-sm font-mono tracking-wider mb-1 block">CHARGE WHICH RESERVE?</Label>
                      <p className="text-xs text-muted-foreground mb-3">Any reserve works. The matching one charges at 100%, others at 50%.</p>

                      <div className="grid grid-cols-2 gap-3">
                        {ENERGY_TYPES.map((type) => {
                          const theme = ENERGY_THEME[type];
                          const isOptimal = type === nativeType;
                          const isSelected = form.targetEnergyType === type;
                          const est = preview(type, false);
                          return (
                            <Card
                              key={type}
                              role="button"
                              tabIndex={0}
                              aria-pressed={isSelected}
                              className={`p-3 cursor-pointer transition-all border-2 ${
                                isSelected ? `${theme.border} ${theme.bgSoft}` : 'border-muted hover:border-primary/50'
                              }`}
                              onClick={() => setForm((p) => ({ ...p, targetEnergyType: type }))}
                              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setForm((p) => ({ ...p, targetEnergyType: type }))}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <theme.icon className={`h-4 w-4 ${theme.text}`} />
                                  <span className="font-bold text-xs">{theme.label.toUpperCase()}</span>
                                </div>
                                <span
                                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                                    isOptimal ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'
                                  }`}
                                >
                                  {isOptimal ? '100%' : '50%'}
                                </span>
                              </div>
                              <p className="text-sm font-mono">+{est.actualEnergy.toFixed(1)} kWh</p>
                            </Card>
                          );
                        })}
                      </div>
                      {errors.targetEnergyType && <p className="text-destructive text-sm mt-1">{errors.targetEnergyType}</p>}
                    </div>

                    {/* Boosters */}
                    {(inventory.energyAmplifier > 0 || inventory.multiCharge > 0) && (
                      <Card className="p-4 border-primary/30 bg-primary/5 space-y-3">
                        <p className="text-xs font-mono tracking-wider text-muted-foreground">BOOSTERS</p>
                        {inventory.energyAmplifier > 0 && (
                          <label className="flex items-start gap-3 cursor-pointer">
                            <Checkbox
                              checked={form.useAmplifier}
                              onCheckedChange={(c) => setForm((p) => ({ ...p, useAmplifier: !!c }))}
                              className="mt-0.5"
                            />
                            <div className="text-sm">
                              <span className="font-bold flex items-center gap-1.5">
                                <Zap className="h-4 w-4 text-warning" /> Energy Amplifier (2× energy)
                              </span>
                              <span className="text-xs text-muted-foreground">{inventory.energyAmplifier} in your kit</span>
                            </div>
                          </label>
                        )}
                        {inventory.multiCharge > 0 && (
                          <label className="flex items-start gap-3 cursor-pointer">
                            <Checkbox
                              checked={form.useMultiCharge}
                              onCheckedChange={(c) => setForm((p) => ({ ...p, useMultiCharge: !!c }))}
                              className="mt-0.5"
                            />
                            <div className="text-sm">
                              <span className="font-bold flex items-center gap-1.5">
                                <Layers className="h-4 w-4 text-accent" /> Multi-Charge (+{MULTI_CHARGE_SPILLOVER * 100}% to every other reserve)
                              </span>
                              <span className="text-xs text-muted-foreground">{inventory.multiCharge} in your kit</span>
                            </div>
                          </label>
                        )}
                      </Card>
                    )}

                    {/* Estimate */}
                    {calc && (
                      <Card className="p-5 border-primary/30 bg-gradient-to-br from-primary/10 to-transparent">
                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-xs font-mono text-muted-foreground tracking-wider">ESTIMATED</p>
                            <motion.p
                              key={calc.actualEnergy.toFixed(2)}
                              initial={{ scale: 1.1, opacity: 0.5 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="text-4xl font-heading font-bold text-primary"
                            >
                              {calc.actualEnergy.toFixed(1)} kWh
                            </motion.p>
                          </div>
                          <Zap className="h-10 w-10 text-primary animate-pulse" />
                        </div>
                        <div className="mt-3 pt-3 border-t border-primary/20 space-y-0.5 text-xs font-mono text-muted-foreground">
                          <div>
                            Base {(form.duration / 60 * INTENSITY_MULTIPLIERS[form.intensity]).toFixed(2)} kWh ({form.duration} min × {form.intensity})
                          </div>
                          {distanceKm && <div>Distance +{(distanceKm * 0.1).toFixed(2)} kWh ({distanceKm.toFixed(1)} km)</div>}
                          <div>Efficiency ×{calc.efficiency}{calc.isOptimal ? ` (matched, +${XP_OPTIMAL_MATCH_BONUS} XP)` : ''}</div>
                          {form.useAmplifier && <div>Amplifier ×2</div>}
                          {form.duration >= DAILY_MISSION.minDuration && <div className="text-accent">Counts toward the {DAILY_MISSION.name}</div>}
                        </div>
                      </Card>
                    )}

                    {!calc?.isOptimal && nativeType && (
                      <div className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Info className="h-4 w-4 flex-shrink-0 text-primary" />
                        <span>
                          {form.activityType} naturally charges {ENERGY_THEME[nativeType].label}. Cross-charging still works, just at half rate.
                        </span>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Notes */}
                <div>
                  <Label className="text-sm font-mono tracking-wider mb-2 block">NOTES</Label>
                  <Textarea
                    value={form.notes}
                    onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                    placeholder="Optional"
                    className="bg-background/50 border-primary/30 min-h-20"
                    maxLength={500}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => close(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!form.activityType || !form.targetEnergyType || submitting}
                    className="flex-1 text-base py-6 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Recording...
                      </>
                    ) : (
                      <>Record {calc ? `+${calc.actualEnergy.toFixed(1)} kWh` : 'activity'}</>
                    )}
                  </Button>
                </div>

                {errors.submit && (
                  <div className="bg-destructive/20 border border-destructive rounded-lg p-3 text-sm text-destructive">{errors.submit}</div>
                )}
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
