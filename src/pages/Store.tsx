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

  return (
    <div className="mx-auto max-w-md space-y-5 px-4 pb-6 pt-4">
      <div>
        <p className="kicker text-accent">Ship's stores</p>
        <h1 className="font-heading text-3xl font-bold">The Chandlery</h1>
        <p className="text-muted-foreground">Coins buy kit. Kit makes a workout count for more.</p>
      </div>

      {/* The lesson, with the player's own numbers: what they can afford right now. */}
      <div className="panel panel-hero space-y-2 p-5">
        <div className="flex items-baseline justify-between">
          <span className="kicker text-muted-foreground">Your coins</span>
          <span className="flex items-center gap-2 font-heading text-4xl font-bold text-warning">
            <Coin size={28} /> {inventory.credits}
          </span>
        </div>
        <p className="text-lg leading-snug">
          {owned === 0
            ? canAfford
              ? `Enough for ${aOrAn(BOOSTERS[cheapest].name)}. ${WHAT_IT_DOES[cheapest]}`
              : `${BOOSTERS[cheapest].price - inventory.credits} more coins and you can buy ${aOrAn(BOOSTERS[cheapest].name)}. ${WHAT_IT_DOES[cheapest]}`
            : armed
              ? `${BOOSTERS[armed].name} is armed. ${WHAT_IT_DOES[armed]}`
              : 'Nothing armed. Arm a piece of kit and it fires on your next workout.'}
        </p>
        <p className="text-xs text-muted-foreground">
          +{CREDITS_PER_ACTIVITY} a workout · quests and trunks · +{CREDITS_PER_LEG_BASE} and up a leg
        </p>
      </div>

      <div className="space-y-3">
        {ids.map((id) => {
          const booster = BOOSTERS[id];
          const Icon = ICONS[id];
          const have = inventory[id];
          const affordable = inventory.credits >= booster.price;
          const isArmed = armed === id && have > 0;
          return (
            <div key={id} className={cn('panel p-4', isArmed && 'border-accent/70')}>
              <div className="flex items-start gap-3">
                <div className={cn('flex size-12 shrink-0 items-center justify-center rounded-xl border', isArmed ? 'border-accent bg-accent/15 text-accent' : 'border-border bg-card text-foreground')}>
                  <Icon className="size-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-heading text-xl font-bold">{booster.name}</h3>
                    <span className="kicker text-muted-foreground">{booster.rarity}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{WHAT_IT_DOES[id]}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">
                  In your kit: <span className="font-heading font-bold text-foreground">{have}</span>
                  {isArmed && <span className="ml-2 rounded-full border border-accent/60 px-2 py-0.5 font-heading text-xs font-bold text-accent">ARMED</span>}
                </span>
                <div className="flex gap-2">
                  {ARMABLE.includes(id) && have > 0 && (
                    <button type="button" onClick={() => arm(id)} className={cn('btn-game btn-sm', isArmed ? 'btn-quiet' : 'btn-primary')}>
                      {isArmed ? 'Disarm' : 'Arm'}
                    </button>
                  )}
                  {id === 'decayInhibitor' && have > 0 && (
                    <button type="button" onClick={activate} className="btn-game btn-sm btn-primary">
                      Activate
                    </button>
                  )}
                  <button type="button" onClick={() => buy(id)} disabled={!affordable} className="btn-game btn-sm btn-gold">
                    <Coin size={18} /> {booster.price}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {frozen && (
        <div className="panel flex items-center gap-3 p-4">
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
