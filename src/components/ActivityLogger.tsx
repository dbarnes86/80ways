import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUserStore } from '@/stores/userStore';
import { useEnergyStore } from '@/stores/energyStore';
import { useActivityStore } from '@/stores/activityStore';
import { useToast } from '@/hooks/use-toast';
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
  AlertTriangle,
  Check,
  Loader2
} from 'lucide-react';

interface ActivityLoggerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ACTIVITIES = [
  // Nautical
  { name: 'Rowing', icon: Anchor, energyType: 'nautical' },
  { name: 'Swimming', icon: Waves, energyType: 'nautical' },
  { name: 'Sailing', icon: Sailboat, energyType: 'nautical' },
  { name: 'Kayaking', icon: Ship, energyType: 'nautical' },
  
  // Terrestrial
  { name: 'Running', icon: PersonStanding, energyType: 'terrestrial' },
  { name: 'Walking', icon: Footprints, energyType: 'terrestrial' },
  { name: 'Hiking', icon: Mountain, energyType: 'terrestrial' },
  { name: 'Jogging', icon: PersonStanding, energyType: 'terrestrial' },
  
  // Transport
  { name: 'Cycling', icon: Bike, energyType: 'transport' },
  { name: 'Skateboarding', icon: ActivityIcon, energyType: 'transport' },
  { name: 'Rollerblading', icon: Zap, energyType: 'transport' },
  { name: 'E-biking', icon: Bike, energyType: 'transport' },
  
  // Strength
  { name: 'Weightlifting', icon: Dumbbell, energyType: 'strength' },
  { name: 'CrossFit', icon: Weight, energyType: 'strength' },
  { name: 'Calisthenics', icon: Sparkles, energyType: 'strength' },
  { name: 'Yoga', icon: Flame, energyType: 'strength' },
];

const ACTIVITY_TYPE_MAP: Record<string, string> = {
  'Rowing': 'nautical',
  'Swimming': 'nautical',
  'Sailing': 'nautical',
  'Kayaking': 'nautical',
  'Running': 'terrestrial',
  'Walking': 'terrestrial',
  'Hiking': 'terrestrial',
  'Jogging': 'terrestrial',
  'Cycling': 'transport',
  'Skateboarding': 'transport',
  'Rollerblading': 'transport',
  'E-biking': 'transport',
  'Weightlifting': 'strength',
  'CrossFit': 'strength',
  'Calisthenics': 'strength',
  'Yoga': 'strength',
};

const ENERGY_GROUPS = {
  nautical: { label: 'NAUTICAL', color: 'cyan', icon: Anchor },
  terrestrial: { label: 'TERRESTRIAL', color: 'lime', icon: PersonStanding },
  transport: { label: 'TRANSPORT', color: 'orange', icon: Bike },
  strength: { label: 'STRENGTH', color: 'magenta', icon: Dumbbell },
};

const INTENSITY_OPTIONS = [
  { 
    value: 'light', 
    label: 'LIGHT', 
    description: 'A gentle pace',
    multiplier: 0.5,
    icon: Droplet,
    color: 'blue'
  },
  { 
    value: 'moderate', 
    label: 'MODERATE', 
    description: 'Steady progress',
    multiplier: 1.0,
    icon: Droplets,
    color: 'yellow'
  },
  { 
    value: 'vigorous', 
    label: 'VIGOROUS', 
    description: 'Maximum effort',
    multiplier: 1.5,
    icon: Droplets,
    color: 'red'
  },
];

const calculateEnergy = (
  duration: number,
  intensity: 'light' | 'moderate' | 'vigorous',
  distance: number | undefined,
  activityType: string,
  targetType: string
) => {
  const intensityMultipliers = {
    light: 0.5,
    moderate: 1.0,
    vigorous: 1.5,
  };

  const baseEnergy = (duration / 60) * intensityMultipliers[intensity];
  const distanceBonus = distance ? distance * 0.1 : 0;
  const totalBase = baseEnergy + distanceBonus;

  const optimalType = ACTIVITY_TYPE_MAP[activityType];
  const efficiency = optimalType === targetType ? 1.0 : 0.5;

  return {
    baseEnergy: totalBase,
    efficiency,
    actualEnergy: totalBase * efficiency,
  };
};

export const ActivityLogger = ({ open, onOpenChange }: ActivityLoggerProps) => {
  const { toast } = useToast();
  const inventory = useUserStore((state) => state.inventory);
  const addActivity = useActivityStore((state) => state.addActivity);
  const chargeEnergy = useEnergyStore((state) => state.chargeEnergy);
  const updateStats = useUserStore((state) => state.updateStats);
  const updateInventory = useUserStore((state) => state.updateInventory);
  const stats = useUserStore((state) => state.stats);

  const [formData, setFormData] = useState({
    activityType: '',
    duration: 30,
    distance: undefined as number | undefined,
    intensity: 'moderate' as 'light' | 'moderate' | 'vigorous',
    timestamp: new Date(),
    notes: '',
    targetEnergyType: '' as string,
    useEnergyAmplifier: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [unit, setUnit] = useState<'km' | 'mi'>('km');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const selectedActivity = ACTIVITIES.find(a => a.name === formData.activityType);
  const showDistance = selectedActivity?.energyType !== 'strength';
  const optimalType = formData.activityType ? ACTIVITY_TYPE_MAP[formData.activityType] : '';

  // Auto-select optimal energy type when activity changes
  useEffect(() => {
    if (formData.activityType && !formData.targetEnergyType) {
      setFormData(prev => ({ ...prev, targetEnergyType: optimalType }));
    }
  }, [formData.activityType, optimalType]);

  const energyCalc = formData.targetEnergyType 
    ? calculateEnergy(
        formData.duration,
        formData.intensity,
        formData.distance,
        formData.activityType,
        formData.targetEnergyType
      )
    : null;

  const finalEnergy = energyCalc && formData.useEnergyAmplifier 
    ? energyCalc.actualEnergy * 2 
    : energyCalc?.actualEnergy || 0;

  const handleDurationChange = (delta: number) => {
    const newDuration = Math.max(1, Math.min(600, formData.duration + delta));
    setFormData(prev => ({ ...prev, duration: newDuration }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    
    if (!formData.activityType) newErrors.activityType = 'Activity type is required';
    if (formData.duration < 1 || formData.duration > 600) newErrors.duration = 'Duration must be between 1 and 600 minutes';
    if (formData.distance !== undefined && formData.distance <= 0) newErrors.distance = 'Distance must be positive';
    if (formData.notes.length > 500) newErrors.notes = 'Notes must be less than 500 characters';
    if (!formData.targetEnergyType) newErrors.targetEnergyType = 'Please select an energy reserve';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);

    try {
      const activity = {
        id: crypto.randomUUID(),
        timestamp: formData.timestamp,
        activityType: formData.activityType,
        targetEnergyType: formData.targetEnergyType as any,
        efficiency: energyCalc!.efficiency,
        duration: formData.duration,
        distance: formData.distance,
        intensity: formData.intensity,
        notes: formData.notes,
        baseEnergy: energyCalc!.baseEnergy,
        actualEnergy: finalEnergy,
        boosterUsed: formData.useEnergyAmplifier ? 'energyAmplifier' as const : undefined,
      };

      addActivity(activity);
      chargeEnergy(formData.targetEnergyType as any, finalEnergy);

      updateStats({
        totalActivities: stats.totalActivities + 1,
        totalDistance: stats.totalDistance + (formData.distance || 0),
        totalEnergyGenerated: stats.totalEnergyGenerated + finalEnergy,
      });

      if (formData.useEnergyAmplifier) {
        updateInventory({
          energyAmplifier: inventory.energyAmplifier - 1,
        });
      }

      setSuccess(true);
      
      toast({
        title: "Activity Recorded!",
        description: `+${finalEnergy.toFixed(1)} kWh ${formData.targetEnergyType}`,
      });

      setTimeout(() => {
        setSuccess(false);
        onOpenChange(false);
        setFormData({
          activityType: '',
          duration: 30,
          distance: undefined,
          intensity: 'moderate',
          timestamp: new Date(),
          notes: '',
          targetEnergyType: '',
          useEnergyAmplifier: false,
        });
      }, 2000);

    } catch (error: any) {
      setErrors({ submit: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background border-2 border-primary/50">
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="mb-6"
              >
                <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                  <Check className="h-12 w-12 text-green-500" />
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h2 className="text-3xl font-bold mb-4">ACTIVITY RECORDED!</h2>
                <p className="text-xl text-green-400 mb-6">
                  +{finalEnergy.toFixed(1)} kWh added to<br />
                  {formData.targetEnergyType.toUpperCase()} RESERVES
                </p>
                <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 max-w-md mx-auto">
                  <p className="text-sm italic text-foreground/90">
                    "Excellent work! Our reserves are replenished."
                    <br />
                    <span className="text-primary">— Phileas Fogg</span>
                  </p>
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <DialogHeader>
                <DialogTitle className="text-3xl font-bold text-glow">LOG BIOMETRIC DATA</DialogTitle>
                <p className="text-muted-foreground">Record your expedition activity</p>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                {/* Activity Type */}
                <div>
                  <Label className="text-lg mb-3 block">ACTIVITY CLASSIFICATION</Label>
                  <Select
                    value={formData.activityType}
                    onValueChange={(value) => {
                      const activity = ACTIVITIES.find(a => a.name === value);
                      setFormData(prev => ({ 
                        ...prev, 
                        activityType: value,
                        targetEnergyType: activity?.energyType || null 
                      }));
                    }}
                  >
                    <SelectTrigger className="bg-background/50 border-primary/30 focus:border-primary text-lg h-12 z-50">
                      <SelectValue placeholder="Select activity type" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-primary/30 max-h-80 overflow-y-auto z-[100]">
                      {Object.entries(ENERGY_GROUPS).map(([type, config]) => (
                        <div key={type}>
                          <div className={`px-2 py-2 text-sm font-bold text-${config.color}-400 border-b border-${config.color}-400/30`}>
                            {config.label}
                          </div>
                          {ACTIVITIES
                            .filter(a => a.energyType === type)
                            .map((activity) => {
                              const Icon = activity.icon;
                              return (
                                <SelectItem 
                                  key={activity.name} 
                                  value={activity.name}
                                  className="cursor-pointer hover:bg-primary/10 py-3"
                                >
                                  <div className="flex items-center gap-3">
                                    <Icon className="h-5 w-5" />
                                    <span>{activity.name}</span>
                                  </div>
                                </SelectItem>
                              );
                            })}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.activityType && (
                    <p className="text-red-500 text-sm mt-1">{errors.activityType}</p>
                  )}
                </div>

                {/* Duration */}
                <div>
                  <Label className="text-lg mb-3 block">DURATION (MINUTES)</Label>
                  <div className="flex items-center gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={() => handleDurationChange(-5)}
                      className="border-primary/30"
                    >
                      <Minus className="h-5 w-5" />
                    </Button>
                    <Input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                      className="text-center text-3xl font-mono bg-background/50 border-primary/30 focus:border-primary flex-1"
                      min={1}
                      max={600}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={() => handleDurationChange(5)}
                      className="border-primary/30"
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>
                  {errors.duration && (
                    <p className="text-red-500 text-sm mt-1">{errors.duration}</p>
                  )}
                </div>

                {/* Distance (conditional) */}
                {showDistance && (
                  <div>
                    <Label className="text-lg mb-3 block">DISTANCE COVERED</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.distance || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, distance: parseFloat(e.target.value) || undefined }))}
                        placeholder="Optional"
                        className="bg-background/50 border-primary/30 focus:border-green-400 text-lg flex-1"
                      />
                      <div className="flex border border-primary/30 rounded-md overflow-hidden">
                        <Button
                          type="button"
                          variant={unit === 'km' ? 'default' : 'ghost'}
                          onClick={() => setUnit('km')}
                          className="rounded-none"
                        >
                          KM
                        </Button>
                        <Button
                          type="button"
                          variant={unit === 'mi' ? 'default' : 'ghost'}
                          onClick={() => setUnit('mi')}
                          className="rounded-none"
                        >
                          MI
                        </Button>
                      </div>
                    </div>
                    {errors.distance && (
                      <p className="text-red-500 text-sm mt-1">{errors.distance}</p>
                    )}
                  </div>
                )}

                {/* Intensity */}
                <div>
                  <Label className="text-lg mb-3 block">EXERTION COEFFICIENT</Label>
                  <div className="grid grid-cols-3 gap-4">
                    {INTENSITY_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      const isSelected = formData.intensity === option.value;
                      
                      return (
                        <motion.div
                          key={option.value}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Card
                            className={`p-4 cursor-pointer transition-all duration-300 ${
                              isSelected
                                ? `border-${option.color}-400 border-2 shadow-lg`
                                : 'border-muted hover:border-primary/50'
                            }`}
                            onClick={() => setFormData(prev => ({ ...prev, intensity: option.value as any }))}
                          >
                            <div className="flex flex-col items-center text-center">
                              <Icon className={`h-8 w-8 mb-2 ${isSelected ? `text-${option.color}-400` : 'text-muted-foreground'}`} />
                              <h4 className={`font-bold mb-1 text-sm ${isSelected ? `text-${option.color}-400` : ''}`}>
                                {option.label}
                              </h4>
                              <p className="text-xs text-muted-foreground mb-1">{option.description}</p>
                              <p className="text-xs font-mono">{option.multiplier} energy</p>
                            </div>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <Label className="text-lg mb-3 block">FIELD NOTES</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional observations... (optional)"
                    className="bg-background/50 border-primary/30 focus:border-primary font-mono min-h-24"
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-right">
                    {formData.notes.length} / 500
                  </p>
                  {errors.notes && (
                    <p className="text-red-500 text-sm mt-1">{errors.notes}</p>
                  )}
                </div>

                {/* ENERGY ALLOCATION SECTION */}
                {formData.activityType && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <div>
                      <Label className="text-lg mb-3 block">CHARGE WHICH RESERVES?</Label>
                      <p className="text-sm text-muted-foreground mb-4">
                        You can charge any energy type, but matching gives bonuses
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(ENERGY_GROUPS).map(([type, config]) => {
                          const isOptimal = type === optimalType;
                          const isSelected = formData.targetEnergyType === type;
                          const Icon = config.icon;
                          
                          const tempCalc = calculateEnergy(
                            formData.duration,
                            formData.intensity,
                            formData.distance,
                            formData.activityType,
                            type
                          );

                          const optimalActivities = ACTIVITIES
                            .filter(a => a.energyType === type)
                            .map(a => a.name);

                          return (
                            <motion.div
                              key={type}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Card
                                className={`p-4 cursor-pointer transition-all duration-300 ${
                                  isSelected
                                    ? `border-${config.color}-400 border-2 bg-${config.color}-400/5`
                                    : isOptimal
                                    ? 'border-green-400 border bg-green-400/5'
                                    : 'border-muted hover:border-primary/50'
                                }`}
                                onClick={() => setFormData(prev => ({ ...prev, targetEnergyType: type }))}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`w-5 h-5 rounded-full border-2 mt-1 flex items-center justify-center ${
                                    isSelected
                                      ? `border-${config.color}-400 bg-${config.color}-400/20`
                                      : 'border-muted'
                                  }`}>
                                    {isSelected && (
                                      <div className={`w-2.5 h-2.5 rounded-full bg-${config.color}-400`} />
                                    )}
                                  </div>
                                  
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <Icon className={`h-5 w-5 ${isOptimal ? 'text-green-400' : `text-${config.color}-400`}`} />
                                        <h4 className="font-bold text-sm">
                                          {config.label} RESERVES
                                        </h4>
                                      </div>
                                      {isOptimal && (
                                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                                          ✓ OPTIMAL
                                        </span>
                                      )}
                                      {!isOptimal && (
                                        <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded flex items-center gap-1">
                                          <AlertTriangle className="h-3 w-3" />
                                          50%
                                        </span>
                                      )}
                                    </div>
                                    
                                    <p className="text-sm font-mono mb-1">
                                      Efficiency: {tempCalc.efficiency === 1.0 ? '100%' : '50%'}
                                    </p>
                                    <p className="text-sm mb-2">
                                      Will generate: <span className="font-bold">{tempCalc.actualEnergy.toFixed(1)} kWh</span>
                                    </p>
                                    
                                    {!isOptimal && (
                                      <p className="text-xs text-muted-foreground">
                                        Better for: {optimalActivities.slice(0, 2).join(', ')}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </Card>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Energy Calculation Preview */}
                    {energyCalc && (
                      <Card className="p-6 border-primary/30 bg-gradient-to-br from-primary/10 to-transparent">
                        <h3 className="text-xl font-bold mb-4">ESTIMATED ENERGY GENERATION</h3>
                        
                        <div className="text-center mb-6">
                          <motion.div
                            key={finalEnergy}
                            initial={{ scale: 1.2, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-6xl font-bold text-primary mb-2"
                          >
                            {finalEnergy.toFixed(1)} kWh
                          </motion.div>
                          <Zap className="h-12 w-12 mx-auto text-primary animate-pulse" />
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">TARGET:</span>
                            <span className="font-bold">{formData.targetEnergyType.toUpperCase()} RESERVES</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">EFFICIENCY:</span>
                            <span className={`font-bold ${energyCalc.efficiency === 1.0 ? 'text-green-400' : 'text-amber-400'}`}>
                              {energyCalc.efficiency === 1.0 ? '100% ✓' : '50%'}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-primary/20">
                          <p className="text-xs text-muted-foreground mb-2">Calculation:</p>
                          <div className="space-y-1 text-xs font-mono">
                            <div>• Base: {energyCalc.baseEnergy.toFixed(1)} kWh ({formData.duration}min × {formData.intensity})</div>
                            {formData.distance && (
                              <div>• Distance bonus: +{(formData.distance * 0.1).toFixed(1)} kWh</div>
                            )}
                            <div>• Efficiency: ×{energyCalc.efficiency} {energyCalc.efficiency === 1.0 ? '(optimal!)' : '(reduced)'}</div>
                            {formData.useEnergyAmplifier && (
                              <div>• Amplifier: ×2.0</div>
                            )}
                            <div className="font-bold">• Total: {finalEnergy.toFixed(1)} kWh</div>
                          </div>
                        </div>

                        {energyCalc.efficiency === 1.0 && (
                          <div className="mt-4 bg-green-500/20 border border-green-400/50 rounded-lg p-3 text-center">
                            <p className="text-sm font-bold text-green-400">
                              ✓ OPTIMAL MATCH! +50 XP BONUS
                            </p>
                          </div>
                        )}

                        {energyCalc.efficiency < 1.0 && (
                          <div className="mt-4 bg-amber-500/20 border border-amber-400/50 rounded-lg p-3 text-center">
                            <p className="text-sm font-bold text-amber-400">
                              50% EFFICIENCY
                            </p>
                          </div>
                        )}
                      </Card>
                    )}

                    {/* Educational Reasoning */}
                    <Accordion type="single" collapsible className="border border-primary/20 rounded-lg">
                      <AccordionItem value="reasoning" className="border-none">
                        <AccordionTrigger className="px-4 hover:no-underline">
                          <div className="flex items-center gap-2">
                            <Info className="h-4 w-4 text-primary" />
                            <span className="text-sm">Why the difference?</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <p className="text-sm text-foreground/90 leading-relaxed">
                            Think of it like fuel types. {formData.activityType} (foot power) naturally
                            charges {optimalType.charAt(0).toUpperCase() + optimalType.slice(1)} reserves better than other types.
                            <br /><br />
                            You CAN cross-charge any activity into any reserve, but it&apos;s
                            less efficient—like using diesel in a gas engine. Still works,
                            just not optimal!
                          </p>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>

                    {/* Booster Section */}
                    {inventory.energyAmplifier > 0 && (
                      <Card className="p-4 border-primary/30 bg-primary/5">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={formData.useEnergyAmplifier}
                            onCheckedChange={(checked) => 
                              setFormData(prev => ({ ...prev, useEnergyAmplifier: !!checked }))
                            }
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <Label className="font-bold flex items-center gap-2 mb-2">
                              <Zap className="h-4 w-4 text-amber-400" />
                              USE ENERGY AMPLIFIER (2× energy)
                            </Label>
                            <p className="text-sm text-muted-foreground mb-2">
                              You have: <span className="font-bold text-foreground">{inventory.energyAmplifier} available</span>
                            </p>
                            <div className="text-sm space-y-1">
                              <div>Without: +{energyCalc?.actualEnergy.toFixed(1)} kWh</div>
                              <div className="font-bold text-primary">
                                With: +{(energyCalc?.actualEnergy || 0) * 2} kWh ⚡
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    )}
                  </motion.div>
                )}

                {/* Form Actions */}
                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="border-red-400 text-red-400 hover:bg-red-400/10"
                  >
                    CANCEL
                  </Button>
                  <Button
                    type="submit"
                    disabled={!formData.activityType || !formData.targetEnergyType || submitting}
                    className="flex-1 text-lg py-6 bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        PROCESSING...
                      </>
                    ) : (
                      <>
                        RECORD → {formData.targetEnergyType.toUpperCase() || 'ACTIVITY'}
                      </>
                    )}
                  </Button>
                </div>

                {errors.submit && (
                  <div className="bg-red-500/20 border border-red-400 rounded-lg p-3 text-sm text-red-400">
                    {errors.submit}
                  </div>
                )}
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
