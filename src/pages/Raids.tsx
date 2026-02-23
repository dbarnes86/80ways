import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HolographicCard } from "@/components/ui/holographic-card";
import { CyberpunkProgress } from "@/components/ui/cyberpunk-progress";
import { Sword, Users, Target, Clock, AlertCircle, Flame, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Raids() {
  const activeRaid = {
    name: "Conquer the Alps",
    description: "Unite with adventurers worldwide to collectively traverse 100,000 km through the Alpine region",
    goal: 100000,
    current: 67842,
    participants: 5847,
    timeLeft: "2 days 14 hours",
    reward: "Exclusive Alpine Badge + 1000 pts",
    urgency: "high" as const,
  };

  const upcomingRaids = [
    {
      name: "Mediterranean Odyssey",
      startDate: "2084-10-15",
      goal: 75000,
      reward: "Mediterranean Explorer Badge",
    },
    {
      name: "Trans-Siberian Trek",
      startDate: "2084-10-22",
      goal: 150000,
      reward: "Siberian Survivor Badge + 2500 pts",
    },
  ];

  const recentContributors = [
    { name: "CyberExplorer", contribution: 234, avatar: "🚀" },
    { name: "NeonWanderer", contribution: 189, avatar: "✨" },
    { name: "DigitalNomad", contribution: 156, avatar: "🌟" },
    { name: "VictorianRunner", contribution: 142, avatar: "⚡" },
  ];

  const progress = (activeRaid.current / activeRaid.goal) * 100;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-heading mb-2 text-glow-cyan">Community Raids</h1>
        <p className="text-muted-foreground">Join forces for epic collective challenges</p>
      </div>

      {/* Active Raid — dramatic card */}
      <motion.div
        animate={{
          boxShadow: [
            "0 0 20px hsl(0 100% 63% / 0.15)",
            "0 0 40px hsl(0 100% 63% / 0.25)",
            "0 0 20px hsl(0 100% 63% / 0.15)",
          ],
        }}
        transition={{ duration: 3, repeat: Infinity }}
        className="rounded-lg mb-8"
      >
        <HolographicCard glow="magenta" className="p-8 border-2 border-destructive/30">
          {/* Urgency banner */}
          <motion.div
            animate={{ opacity: [1, 0.6, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="flex items-center gap-2 mb-6"
          >
            <AlertCircle className="w-5 h-5 text-destructive" />
            <Badge className="bg-destructive/20 text-destructive border-destructive/40 uppercase tracking-widest text-xs">
              <Flame className="w-3 h-3 mr-1" /> Active Raid — Ends Soon
            </Badge>
          </motion.div>

          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-3xl font-heading mb-2 text-glow-magenta">{activeRaid.name}</h2>
              <p className="text-muted-foreground max-w-2xl">{activeRaid.description}</p>
            </div>
            <motion.div
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <Sword className="w-12 h-12 text-secondary" />
            </motion.div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { icon: Target, label: "Goal", value: `${activeRaid.goal.toLocaleString()} km`, color: "text-primary" },
              { icon: Users, label: "Warriors", value: activeRaid.participants.toLocaleString(), color: "text-secondary" },
              { icon: Clock, label: "Remaining", value: activeRaid.timeLeft, color: "text-warning" },
            ].map((stat) => (
              <HolographicCard key={stat.label} glow="none" corners={false} scanLines={false} animated={false} className="p-4 text-center bg-muted/20">
                <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
                <div className="text-xl font-mono mb-1">{stat.value}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</div>
              </HolographicCard>
            ))}
          </div>

          {/* Progress */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-mono text-secondary">{activeRaid.current.toLocaleString()} / {activeRaid.goal.toLocaleString()} km</span>
              <span className="font-mono text-muted-foreground">{progress.toFixed(1)}%</span>
            </div>
            <CyberpunkProgress value={activeRaid.current} max={activeRaid.goal} segments={20} glow="magenta" size="lg" />
          </div>

          {/* Reward + CTA */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-secondary/30 bg-secondary/5">
            <div>
              <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Raid Reward</div>
              <div className="font-heading text-secondary">{activeRaid.reward}</div>
            </div>
            <Button className="glow-magenta bg-secondary text-secondary-foreground hover:bg-secondary/90">
              Contribute Now <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {/* Contributors */}
          <div className="mt-6">
            <h3 className="font-heading mb-4 text-sm uppercase tracking-wider text-muted-foreground">Top Contributors</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {recentContributors.map((c, i) => (
                <motion.div
                  key={c.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-muted/20 rounded-lg p-3 text-center border border-border hover:border-secondary/40 transition-smooth"
                >
                  <div className="text-3xl mb-2">{c.avatar}</div>
                  <div className="text-sm font-heading mb-1">{c.name}</div>
                  <div className="text-xs text-muted-foreground font-mono">+{c.contribution} km</div>
                </motion.div>
              ))}
            </div>
          </div>
        </HolographicCard>
      </motion.div>

      {/* Upcoming Raids */}
      <div>
        <h2 className="text-2xl font-heading mb-4">Incoming Raids</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {upcomingRaids.map((raid, index) => (
            <motion.div
              key={raid.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <HolographicCard glow="cyan" className="p-6">
                <Badge variant="secondary" className="mb-3 uppercase tracking-widest text-xs">Upcoming</Badge>
                <h3 className="text-xl font-heading mb-3">{raid.name}</h3>
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Starts</span>
                    <span className="font-mono">{raid.startDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Goal</span>
                    <span className="font-mono">{raid.goal.toLocaleString()} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reward</span>
                    <span className="text-primary font-heading">{raid.reward}</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full">Set Reminder</Button>
              </HolographicCard>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
