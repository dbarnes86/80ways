import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sword, Users, Target, Clock } from "lucide-react";
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

      {/* Active Raid */}
      <Card className="p-8 mb-8 border-primary glow-purple">
        <div className="flex items-start justify-between mb-6">
          <div>
            <Badge className="mb-3 glow-cyan">ACTIVE RAID</Badge>
            <h2 className="text-3xl font-heading mb-2">{activeRaid.name}</h2>
            <p className="text-muted-foreground max-w-2xl">{activeRaid.description}</p>
          </div>
          <Sword className="w-12 h-12 text-primary" />
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="text-center">
            <Target className="w-8 h-8 text-primary mx-auto mb-2" />
            <div className="text-2xl font-mono mb-1">{activeRaid.goal.toLocaleString()} km</div>
            <div className="text-sm text-muted-foreground">Goal</div>
          </div>
          <div className="text-center">
            <Users className="w-8 h-8 text-secondary mx-auto mb-2" />
            <div className="text-2xl font-mono mb-1">{activeRaid.participants.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Participants</div>
          </div>
          <div className="text-center">
            <Clock className="w-8 h-8 text-warning mx-auto mb-2" />
            <div className="text-2xl font-mono mb-1">{activeRaid.timeLeft}</div>
            <div className="text-sm text-muted-foreground">Time Remaining</div>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Progress</span>
            <span className="font-mono">{activeRaid.current.toLocaleString()} / {activeRaid.goal.toLocaleString()} km</span>
          </div>
          <Progress value={progress} className="h-3 glow-cyan" />
          <div className="text-sm text-muted-foreground mt-1">{progress.toFixed(1)}% Complete</div>
        </div>

        <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg border border-primary/30 mb-6">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Raid Reward</div>
            <div className="font-heading">{activeRaid.reward}</div>
          </div>
          <Button className="glow-cyan">Contribute Now</Button>
        </div>

        {/* Top Contributors */}
        <div>
          <h3 className="font-heading mb-4">Recent Contributors</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {recentContributors.map((contributor, index) => (
              <motion.div
                key={contributor.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="bg-muted/30 rounded-lg p-3 text-center hover:bg-muted/50 transition-smooth"
              >
                <div className="text-3xl mb-2">{contributor.avatar}</div>
                <div className="text-sm font-heading mb-1">{contributor.name}</div>
                <div className="text-xs text-muted-foreground font-mono">+{contributor.contribution} km</div>
              </motion.div>
            ))}
          </div>
        </div>
      </Card>

      {/* Upcoming Raids */}
      <div>
        <h2 className="text-2xl font-heading mb-4">Upcoming Raids</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {upcomingRaids.map((raid, index) => (
            <motion.div
              key={raid.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6 hover:border-primary transition-smooth">
                <Badge variant="secondary" className="mb-3">UPCOMING</Badge>
                <h3 className="text-xl font-heading mb-2">{raid.name}</h3>
                <div className="space-y-2 mb-4">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Starts: </span>
                    <span className="font-mono">{raid.startDate}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Goal: </span>
                    <span className="font-mono">{raid.goal.toLocaleString()} km</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Reward: </span>
                    <span className="text-primary">{raid.reward}</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full">Set Reminder</Button>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
