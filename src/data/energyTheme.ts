import { Anchor, Bike, Dumbbell, PersonStanding, type LucideIcon } from 'lucide-react';
import type { EnergyType } from './gameConstants';

/** Static class names per energy type (Tailwind can't see dynamically built ones). */
export const ENERGY_THEME: Record<
  EnergyType,
  { label: string; short: string; icon: LucideIcon; text: string; bg: string; bgSoft: string; border: string; glow: 'cyan' | 'magenta' | 'purple' }
> = {
  nautical: {
    label: 'Nautical',
    short: 'NAU',
    icon: Anchor,
    text: 'text-primary',
    bg: 'bg-primary',
    bgSoft: 'bg-primary/10',
    border: 'border-primary/40',
    glow: 'cyan',
  },
  terrestrial: {
    label: 'Terrestrial',
    short: 'TER',
    icon: PersonStanding,
    text: 'text-success',
    bg: 'bg-success',
    bgSoft: 'bg-success/10',
    border: 'border-success/40',
    glow: 'cyan',
  },
  transport: {
    label: 'Transport',
    short: 'TRA',
    icon: Bike,
    text: 'text-warning',
    bg: 'bg-warning',
    bgSoft: 'bg-warning/10',
    border: 'border-warning/40',
    glow: 'purple',
  },
  strength: {
    label: 'Strength',
    short: 'STR',
    icon: Dumbbell,
    text: 'text-secondary',
    bg: 'bg-secondary',
    bgSoft: 'bg-secondary/10',
    border: 'border-secondary/40',
    glow: 'magenta',
  },
};
