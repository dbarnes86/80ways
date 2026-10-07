import { Zap, Layers, ShieldOff, Coins, type LucideIcon } from "lucide-react";
import { useUserStore } from "@/stores/userStore";
import {
  BOOSTERS,
  CREDITS_PER_ACTIVITY,
  CREDITS_PER_LEG_BASE,
  CREDITS_RAID_SUCCESS,
  DAILY_MISSION,
  type BoosterId,
} from "@/data/gameConstants";
import { activateDecayInhibitor, buyBooster } from "@/lib/gameActions";
import { formatTimeLeft } from "@/data/raids";
import { toast } from '@/components/toast';
import { Button, Badge, HoloCard } from '@/components/ui';

const ICONS: Record<BoosterId, LucideIcon> = {
  energyAmplifier: Zap,
  decayInhibitor: ShieldOff,
  multiCharge: Layers,
};

const rarityGlow = (r: string) => (r === "epic" ? ("purple" as const) : r === "rare" ? ("cyan" as const) : ("none" as const));

const rarityBadge = (r: string) =>
  r === "epic"
    ? "bg-accent/20 text-accent border-accent/40"
    : r === "rare"
      ? "bg-primary/20 text-primary border-primary/40"
      : "bg-muted text-muted-foreground";

const HOW_TO_USE: Record<BoosterId, string> = {
  energyAmplifier: "Tick it when logging an activity.",
  multiCharge: "Tick it when logging an activity.",
  decayInhibitor: "Activate it here, any time.",
};

export default function Store() {
  const inventory = useUserStore((s) => s.inventory);
  const frozenUntil = useUserStore((s) => s.effects.decayInhibitorUntil);

  const frozen = frozenUntil && new Date(frozenUntil) > new Date();

  const handleBuy = (id: BoosterId) => {
    if (buyBooster(id)) {
      toast({ title: `${BOOSTERS[id].name} acquired`, description: HOW_TO_USE[id] });
    } else {
      toast({ title: "Not enough credits", description: "Log activities and complete legs to earn more.", variant: "destructive" });
    }
  };

  const handleActivate = () => {
    const until = activateDecayInhibitor();
    if (until) toast({ title: "Decay frozen", description: `Your reserves won't decay until ${until.toLocaleString()}.` });
  };

  const ids = Object.keys(BOOSTERS) as BoosterId[];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-heading mb-2 text-glow-cyan">Booster Emporium</h1>
        <p className="text-muted-foreground">Spend the credits you earn on the road</p>
      </div>

      <HoloCard glow="cyan" className="p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Your balance</div>
            <div className="text-4xl font-mono font-bold text-warning flex items-center gap-2">
              <Coins className="w-8 h-8" /> {inventory.credits}
            </div>
          </div>
          <div className="text-xs text-muted-foreground space-y-0.5 sm:text-right">
            <p>+{CREDITS_PER_ACTIVITY} per activity · +{DAILY_MISSION.creditReward} daily mission</p>
            <p>+{CREDITS_PER_LEG_BASE}+ per leg · +{CREDITS_RAID_SUCCESS} per raid won</p>
          </div>
        </div>
      </HoloCard>

      <div className="grid md:grid-cols-3 gap-6">
        {ids.map((id, index) => {
          const booster = BOOSTERS[id];
          const Icon = ICONS[id];
          const owned = inventory[id];
          const affordable = inventory.credits >= booster.price;
          return (
            <div className="animate-fade-up" key={id} style={{ animationDelay: `${index * 0.1}s` }}>
              <HoloCard glow={rarityGlow(booster.rarity)} className="p-6 h-full flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${rarityBadge(booster.rarity)}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <Badge className={rarityBadge(booster.rarity)}>{booster.rarity.toUpperCase()}</Badge>
                </div>
                <h3 className="text-xl font-heading mb-2">{booster.name}</h3>
                <p className="text-sm text-muted-foreground mb-1">{booster.description}</p>
                <p className="text-xs text-muted-foreground mb-4 flex-1">{HOW_TO_USE[id]}</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">In your kit</span>
                    <span className="font-mono">{owned}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-2xl font-mono text-warning flex items-center gap-1">
                      <Coins className="w-5 h-5" /> {booster.price}
                    </div>
                    <div className="flex gap-2">
                      {id === "decayInhibitor" && owned > 0 && (
                        <Button size="sm" variant="outline" onClick={handleActivate}>
                          Activate
                        </Button>
                      )}
                      <Button size="sm" onClick={() => handleBuy(id)} disabled={!affordable}>
                        Buy
                      </Button>
                    </div>
                  </div>
                </div>
              </HoloCard>
            </div>
          );
        })}
      </div>

      <HoloCard glow="none" className="p-6 mt-8">
        <h2 className="text-2xl font-heading mb-4">Active effects</h2>
        {frozen ? (
          <div className="flex items-center gap-3">
            <ShieldOff className="w-6 h-6 text-accent" />
            <div>
              <p className="font-heading">Decay Inhibitor</p>
              <p className="text-sm text-muted-foreground">Reserves frozen for another {formatTimeLeft(new Date(frozenUntil!))}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nothing active. Amplifiers and Multi-Charges apply when you log an activity.</p>
        )}
      </HoloCard>
    </div>
  );
}
