import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Clock, Users, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function Stages() {
  const stages = [
    {
      id: 1,
      name: "London Sprint",
      distance: 5,
      time: "24:00",
      participants: 2847,
      status: "active",
      prize: "500 pts",
    },
    {
      id: 2,
      name: "Paris Marathon",
      distance: 42.2,
      time: "3:30:00",
      participants: 1523,
      status: "upcoming",
      prize: "2000 pts",
    },
    {
      id: 3,
      name: "Alpine Challenge",
      distance: 100,
      time: "8:00:00",
      participants: 456,
      status: "upcoming",
      prize: "5000 pts",
    },
  ];

  const leaderboard = [
    { rank: 1, name: "NeonRunner_84", distance: 2847, time: "142:38:22", avatar: "🏃" },
    { rank: 2, name: "VictorianVelocity", distance: 2756, time: "145:12:08", avatar: "🚴" },
    { rank: 3, name: "CyberSprinter", distance: 2689, time: "148:45:33", avatar: "⚡" },
    { rank: 4, name: "DigitalNomad", distance: 2534, time: "151:22:19", avatar: "🌍" },
    { rank: 5, name: "QuantumRunner", distance: 2498, time: "153:08:44", avatar: "🔮" },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-heading mb-2 text-glow-cyan">Stage Challenges</h1>
        <p className="text-muted-foreground">Compete against adventurers worldwide</p>
      </div>

      {/* Active Stages */}
      <div className="mb-8">
        <h2 className="text-2xl font-heading mb-4">Available Challenges</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stages.map((stage, index) => (
            <motion.div
              key={stage.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`p-6 hover:border-primary transition-smooth ${stage.status === 'active' ? 'glow-cyan border-primary' : ''}`}>
                <div className="flex items-start justify-between mb-4">
                  <Trophy className={`w-8 h-8 ${stage.status === 'active' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <Badge variant={stage.status === 'active' ? 'default' : 'secondary'}>
                    {stage.status.toUpperCase()}
                  </Badge>
                </div>
                <h3 className="text-xl font-heading mb-3">{stage.name}</h3>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    <span>{stage.distance} km</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>Target: {stage.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>{stage.participants.toLocaleString()} participants</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Prize: </span>
                    <span className="font-mono text-primary">{stage.prize}</span>
                  </div>
                  <Button size="sm" variant={stage.status === 'active' ? 'default' : 'outline'}>
                    {stage.status === 'active' ? 'Join Now' : 'View Details'}
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-heading">Global Leaderboard</h2>
          <Badge className="glow-purple">Season 1</Badge>
        </div>
        <div className="space-y-2">
          {leaderboard.map((entry, index) => (
            <motion.div
              key={entry.rank}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center gap-4 p-4 rounded-lg transition-smooth ${
                index < 3 ? 'bg-gradient-to-r from-primary/10 to-transparent border border-primary/30' : 'bg-muted/30'
              } hover:bg-muted/50`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-mono font-bold ${
                index === 0 ? 'bg-warning text-warning-foreground glow-magenta' :
                index === 1 ? 'bg-muted-foreground/30' :
                index === 2 ? 'bg-warning/50' :
                'bg-muted'
              }`}>
                #{entry.rank}
              </div>
              <div className="text-2xl">{entry.avatar}</div>
              <div className="flex-1">
                <div className="font-heading">{entry.name}</div>
                <div className="text-sm text-muted-foreground font-mono">
                  {entry.distance.toLocaleString()} km
                </div>
              </div>
              <div className="text-right font-mono text-sm text-muted-foreground">
                {entry.time}
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  );
}
