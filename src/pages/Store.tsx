import { Layers, ShieldOff, Zap, type LucideIcon } from 'lucide-react';
import { useUserStore } from '@/stores/userStore';
import { BOOSTERS, CREDITS_PER_ACTIVITY, CREDITS_PER_LEG_BASE, type BoosterId } from '@/data/gameConstants';
import { activateDecayInhibitor, buyBooster } from '@/lib/gameActions';
import { formatTimeLeft } from '@/data/raids';
import { haptic } from '@/lib/native';
import { toast } from '@/components/toast';
import { cn } from '@/components/ui';
import { Coin } from '@/game/art';
import { floatReward } from '@/game/rewards';
import { play } from '@/game/sfx';

const ICONS: Record<BoosterId, LucideIcon> = {
  energyAmplifier: Zap,
  decayInhibitor: ShieldOff,
  multiCharge: Layers,
};

/** What each piece of kit does, in the words the game uses everywhere else. */
const WHAT_IT_DOES: Record<BoosterId, string> = {
  energyAmplifier: 'Your next workout counts double.',
  multiCharge: 'Your next workout also tops up every other reserve.',
  decayInhibitor: 'Your reserves stop fading for three days.',
};

const ARMABLE: BoosterId[] = ['energyAmplifier', 'multiCharge'];

/**
 * The Chandlery: where coins become kit. The first visit is a lesson (what coins are for, what
 * you can afford right now), and anything bought is armed on the spot so it has a use.
 */
export default function Store() {
  const inventory = useUserStore((s) => s.inventory);
  const armed = useUserStore((s) => s.armedBooster);
  const armBooster = useUserStore((s) => s.armBooster);
  const frozenUntil = useUserStore((s) => s.effects.decayInhibitorUntil);
  const frozen = frozenUntil && new Date(frozenUntil) > new Date();

  const cheapest = (Object.keys(BOOSTERS) as BoosterId[]).reduce((a, b) => (BOOSTERS[a].price <= BOOSTERS[b].price ? a : b));
  const canAfford = inventory.credits >= BOOSTERS[cheapest].price;
  const owned = ARMABLE.reduce((n, id) => n + inventory[id], 0) + inventory.decayInhibitor;

  const buy = (id: BoosterId) => {
    if (!buyBooster(id)) {
      haptic('error');
      toast({ title: 'Not enough coins', description: 'Workouts, quests and legs pay out. Come back with more.', variant: 'destructive' });
      return;
    }
    play('coin');
    haptic('success');
    // Bought kit is armed on the spot unless something else already is, so the purchase has a use.
    if (ARMABLE.includes(id) && (!armed || armed === id)) {
      armBooster(id);
      floatReward(`${BOOSTERS[id].name} armed`, 'streak');
    } else {
      floatReward(`${BOOSTERS[id].name} in your kit`, 'streak');
    }
  };

  const arm = (id: BoosterId) => {
    haptic('select');
    play('tick');
    armBooster(armed === id ? null : id);
  };

  const activate = () => {
    const until = activateDecayInhibitor();
    if (until) {
      play('chime');
      toast({ title: 'Decay frozen', description: `Your reserves hold until ${until.toLocaleString()}.` });
    }
  };

  const ids = Object.keys(BOOSTERS) as BoosterId[];

  const lesson =
    owned === 0
      ? canAfford
        ? `Enough for ${aOrAn(BOOSTERS[cheapest].name)}. ${WHAT_IT_DOES[cheapest]}`
        : `${BOOSTERS[cheapest].price - inventory.credits} more coins and you can buy ${aOrAn(BOOSTERS[cheapest].name)}.`
      : armed
        ? `${BOOSTERS[armed].name} is armed. ${WHAT_IT_DOES[armed]}`
        : 'Nothing armed. Arm a piece of kit and it fires on your next workout.';

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 pb-6 pt-4">
      {/* Title and wallet on one line; the lesson, with the player's own numbers, under it. */}
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="kicker text-accent">Ship's stores</p>
          <h1 className="font-heading text-3xl font-bold leading-none">The Chandlery</h1>
        </div>
        <span className="flex items-center gap-1.5 font-heading text-3xl font-bold leading-none text-warning">
          <Coin size={24} /> {inventory.credits}
        </span>
      </div>
      <div className="space-y-1">
        <p className="leading-snug">{lesson}</p>
        <p className="text-xs text-muted-foreground">
          +{CREDITS_PER_ACTIVITY} a workout · quests and trunks · +{CREDITS_PER_LEG_BASE} and up a leg
        </p>
      </div>

      <div className="space-y-2.5">
        {ids.map((id) => {
          const booster = BOOSTERS[id];
          const Icon = ICONS[id];
          const have = inventory[id];
          const affordable = inventory.credits >= booster.price;
          const isArmed = armed === id && have > 0;
          const canUse = (ARMABLE.includes(id) || id === 'decayInhibitor') && have > 0;
          return (
            <div key={id} className={cn('panel flex items-center gap-3 p-3', isArmed && 'border-accent/70')}>
              <div className={cn('relative flex size-12 shrink-0 items-center justify-center rounded-xl border', isArmed ? 'border-accent bg-accent/15 text-accent' : 'border-border bg-card text-foreground')}>
                <Icon className="size-6" />
                {have > 0 && (
                  <span className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-accent font-heading text-xs font-bold text-background ring-2 ring-card" aria-label={`${have} in your kit`}>
                    {have}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-heading text-lg font-bold leading-tight">{booster.name}</p>
                <p className="text-sm leading-snug text-muted-foreground">{WHAT_IT_DOES[id]}</p>
                {canUse && (
                  <div className="mt-1 flex items-center gap-2">
                    {isArmed && <span className="rounded-full border border-accent/60 px-1.5 py-0.5 font-heading text-[10px] font-bold text-accent">ARMED</span>}
                    <button type="button" onClick={() => (id === 'decayInhibitor' ? activate() : arm(id))} className="text-sm font-bold text-accent">
                      {id === 'decayInhibitor' ? 'Activate' : isArmed ? 'Disarm' : 'Arm it'}
                    </button>
                  </div>
                )}
              </div>
              <button type="button" onClick={() => buy(id)} disabled={!affordable} className="btn-game btn-sm btn-gold shrink-0">
                <Coin size={18} /> {booster.price}
              </button>
            </div>
          );
        })}
      </div>

      {frozen && (
        <div className="panel flex items-center gap-3 p-3">
          <ShieldOff className="size-6 text-accent" />
          <div>
            <p className="font-heading font-bold">Decay Inhibitor active</p>
            <p className="text-sm text-muted-foreground">Reserves hold for another {formatTimeLeft(new Date(frozenUntil!))}</p>
          </div>
        </div>
      )}
    </div>
  );
}

const aOrAn = (name: string) => `${/^[aeiou]/i.test(name) ? 'an' : 'a'} ${name}`;
