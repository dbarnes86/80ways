import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Anchor, 
  Waves, 
  Sailboat, 
  Ship,
  PersonStanding,
  Footprints,
  Mountain,
  Bike,
  Activity,
  Zap,
  Dumbbell,
  Weight,
  Sparkles,
  Flame,
  Plus,
  Minus,
  Droplet,
  Droplets
} from 'lucide-react';

interface ActivityLoggerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ActivityFormData) => void;
}

export interface ActivityFormData {
  activityType: string;
  duration: number;
  distance?: number;
  intensity: 'light' | 'moderate' | 'vigorous';
  timestamp: Date;
  notes: string;
  targetEnergyType: string | null;
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
  { name: 'Skateboarding', icon: Activity, energyType: 'transport' },
  { name: 'Rollerblading', icon: Zap, energyType: 'transport' },
  { name: 'E-biking', icon: Bike, energyType: 'transport' },
  
  // Strength
  { name: 'Weightlifting', icon: Dumbbell, energyType: 'strength' },
  { name: 'CrossFit', icon: Weight, energyType: 'strength' },
  { name: 'Calisthenics', icon: Sparkles, energyType: 'strength' },
  { name: 'Yoga', icon: Flame, energyType: 'strength' },
];

const ENERGY_GROUPS = {
  nautical: { label: 'NAUTICAL', color: 'cyan' },
  terrestrial: { label: 'TERRESTRIAL', color: 'lime' },
  transport: { label: 'TRANSPORT', color: 'orange' },
  strength: { label: 'STRENGTH', color: 'magenta' },
};

const INTENSITY_OPTIONS = [
  { 
    value: 'light', 
    label: 'LIGHT', 
    description: 'A gentle pace',
    multiplier: '0.5×',
    icon: Droplet,
    color: 'blue'
  },
  { 
    value: 'moderate', 
    label: 'MODERATE', 
    description: 'Steady progress',
    multiplier: '1.0×',
    icon: Droplets,
    color: 'yellow'
  },
  { 
    value: 'vigorous', 
    label: 'VIGOROUS', 
    description: 'Maximum effort',
    multiplier: '1.5×',
    icon: Droplets,
    color: 'red'
  },
];

export const ActivityLogger = ({ open, onOpenChange, onSubmit }: ActivityLoggerProps) => {
  const [formData, setFormData] = useState<ActivityFormData>({
    activityType: '',
    duration: 30,
    distance: undefined,
    intensity: 'moderate',
    timestamp: new Date(),
    notes: '',
    targetEnergyType: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [unit, setUnit] = useState<'km' | 'mi'>('km');

  const selectedActivity = ACTIVITIES.find(a => a.name === formData.activityType);
  const showDistance = selectedActivity?.energyType !== 'strength';

  const handleDurationChange = (delta: number) => {
    const newDuration = Math.max(1, Math.min(600, formData.duration + delta));
    setFormData(prev => ({ ...prev, duration: newDuration }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    
    if (!formData.activityType) {
      newErrors.activityType = 'Activity type is required';
    }
    
    if (formData.duration < 1 || formData.duration > 600) {
      newErrors.duration = 'Duration must be between 1 and 600 minutes';
    }
    
    if (formData.distance !== undefined && formData.distance <= 0) {
      newErrors.distance = 'Distance must be positive';
    }
    
    if (formData.notes.length > 500) {
      newErrors.notes = 'Notes must be less than 500 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      ...formData,
      targetEnergyType: selectedActivity?.energyType || null,
    });
    
    // Reset form
    setFormData({
      activityType: '',
      duration: 30,
      distance: undefined,
      intensity: 'moderate',
      timestamp: new Date(),
      notes: '',
      targetEnergyType: null,
    });
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background border-2 border-primary/50">
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

          <Button
            type="submit"
            className="w-full text-lg py-6 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            PROCEED TO ENERGY SELECTION
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
