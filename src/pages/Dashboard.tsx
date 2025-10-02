import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Map, Trophy, TrendingUp, Zap, Target, Calendar } from "lucide-react";
import { motion } from "framer-motion";

export default function Dashboard() {
  const stats = [
    { label: "Total Distance", value: "2,847 km", icon: Map, color: "text-primary" },
    { label: "World Progress", value: "7.1%", icon: Target, color: "text-success" },
    { label: "Current Rank", value: "#1,247", icon: Trophy, color: "text-warning" },
    { label: "Active Streak", value: "12 days", icon: Calendar, color: "text-secondary" },
  ];

  const recentActivities = [
    { date: "2084-10-02", type: "Running", distance: "8.5 km", time: "42:30" },
    { date: "2084-10-01", type: "Cycling", distance: "25.3 km", time: "1:15:22" },
    { date: "2084-09-30", type: "Walking", distance: "5.2 km", time: "58:12" },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-heading mb-2 text-glow-cyan">Command Center</h1>
        <p className="text-muted-foreground">Your journey around the world in real-time</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-6 hover:border-primary transition-smooth hover:glow-cyan">
              <stat.icon className={`w-8 h-8 mb-3 ${stat.color}`} />
              <div className="text-2xl font-mono mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Journey Progress */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-heading">Journey Progress</h2>
            <Button variant="outline" size="sm">View Map</Button>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>London → Paris</span>
                <span className="font-mono">344 / 344 km</span>
              </div>
              <Progress value={100} className="h-2" />
              <div className="text-xs text-success mt-1">✓ Stage Complete</div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Paris → Marseille</span>
                <span className="font-mono">503 / 775 km</span>
              </div>
              <Progress value={65} className="h-2" />
              <div className="text-xs text-muted-foreground mt-1">65% Complete</div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Marseille → Rome</span>
                <span className="font-mono">0 / 521 km</span>
              </div>
              <Progress value={0} className="h-2" />
              <div className="text-xs text-muted-foreground mt-1">Locked</div>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-6">
          <h2 className="text-2xl font-heading mb-6">Quick Actions</h2>
          <div className="space-y-3">
            <Button className="w-full justify-start glow-cyan" variant="outline">
              <TrendingUp className="mr-2" />
              Log Activity
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Trophy className="mr-2" />
              Join Stage
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Zap className="mr-2" />
              Use Booster
            </Button>
          </div>
        </Card>

        {/* Recent Activities */}
        <Card className="lg:col-span-3 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-heading">Recent Activities</h2>
            <Button variant="outline" size="sm">View All</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-heading">Date</th>
                  <th className="text-left py-3 px-4 font-heading">Type</th>
                  <th className="text-left py-3 px-4 font-heading">Distance</th>
                  <th className="text-left py-3 px-4 font-heading">Duration</th>
                </tr>
              </thead>
              <tbody>
                {recentActivities.map((activity, index) => (
                  <tr key={index} className="border-b border-border hover:bg-muted/50 transition-smooth">
                    <td className="py-3 px-4 font-mono text-sm">{activity.date}</td>
                    <td className="py-3 px-4">{activity.type}</td>
                    <td className="py-3 px-4 font-mono">{activity.distance}</td>
                    <td className="py-3 px-4 font-mono text-sm">{activity.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
