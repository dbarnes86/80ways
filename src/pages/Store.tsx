import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, TrendingUp, Shield, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function Store() {
  const boosters = [
    {
      id: 1,
      name: "Velocity Surge",
      icon: Zap,
      description: "Double your distance for 1 hour",
      price: 100,
      duration: "1 hour",
      rarity: "common",
    },
    {
      id: 2,
      name: "Endurance Elixir",
      icon: Shield,
      description: "50% bonus distance for 24 hours",
      price: 250,
      duration: "24 hours",
      rarity: "rare",
    },
    {
      id: 3,
      name: "Quantum Leap",
      icon: Sparkles,
      description: "Triple distance for 30 minutes",
      price: 500,
      duration: "30 minutes",
      rarity: "epic",
    },
    {
      id: 4,
      name: "Marathon Mode",
      icon: TrendingUp,
      description: "1.5x distance for 7 days",
      price: 750,
      duration: "7 days",
      rarity: "legendary",
    },
  ];

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "bg-muted text-muted-foreground";
      case "rare":
        return "bg-primary/20 text-primary";
      case "epic":
        return "bg-accent/20 text-accent";
      case "legendary":
        return "bg-warning/20 text-warning";
      default:
        return "bg-muted";
    }
  };

  const getRarityGlow = (rarity: string) => {
    switch (rarity) {
      case "rare":
        return "glow-cyan";
      case "epic":
        return "glow-purple";
      case "legendary":
        return "glow-magenta";
      default:
        return "";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-heading mb-2 text-glow-cyan">Booster Emporium</h1>
        <p className="text-muted-foreground">Accelerate your journey with power-ups</p>
      </div>

      {/* Balance Card */}
      <Card className="p-6 mb-8 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/50 glow-cyan">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Your Balance</div>
            <div className="text-4xl font-mono font-bold text-primary">2,450 pts</div>
          </div>
          <Button className="glow-purple">Purchase Points</Button>
        </div>
      </Card>

      {/* Boosters Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {boosters.map((booster, index) => (
          <motion.div
            key={booster.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`p-6 h-full flex flex-col hover:border-primary transition-smooth ${getRarityGlow(booster.rarity)}`}>
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getRarityColor(booster.rarity)}`}>
                  <booster.icon className="w-6 h-6" />
                </div>
                <Badge className={getRarityColor(booster.rarity)}>
                  {booster.rarity.toUpperCase()}
                </Badge>
              </div>
              <h3 className="text-xl font-heading mb-2">{booster.name}</h3>
              <p className="text-sm text-muted-foreground mb-4 flex-1">{booster.description}</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-mono">{booster.duration}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-mono text-primary">{booster.price} pts</div>
                  <Button size="sm" className={getRarityGlow(booster.rarity)}>
                    Purchase
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Active Boosters */}
      <Card className="p-6 mt-8">
        <h2 className="text-2xl font-heading mb-4">Active Boosters</h2>
        <div className="text-center py-8 text-muted-foreground">
          <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No active boosters</p>
          <p className="text-sm mt-1">Purchase a booster to enhance your journey</p>
        </div>
      </Card>
    </div>
  );
}
