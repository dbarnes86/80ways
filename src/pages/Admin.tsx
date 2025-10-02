import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, Trophy, Activity, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function Admin() {
  const systemStats = [
    { label: "Total Users", value: "15,847", change: "+12%", icon: Users },
    { label: "Active Today", value: "3,421", change: "+8%", icon: Activity },
    { label: "Total Distance", value: "2.4M km", change: "+15%", icon: TrendingUp },
    { label: "Active Raids", value: "3", change: "0%", icon: Trophy },
  ];

  const recentUsers = [
    { name: "NeonRunner_84", joined: "2084-10-02", status: "active" },
    { name: "CyberExplorer", joined: "2084-10-02", status: "active" },
    { name: "QuantumSprint", joined: "2084-10-01", status: "inactive" },
    { name: "DigitalNomad", joined: "2084-10-01", status: "active" },
  ];

  const systemAlerts = [
    { type: "info", message: "System maintenance scheduled for 2084-10-05", time: "2 hours ago" },
    { type: "warning", message: "High server load detected on EU-West", time: "5 hours ago" },
    { type: "success", message: "New raid 'Alpine Challenge' launched successfully", time: "1 day ago" },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-heading mb-2 text-glow-cyan">Admin Panel</h1>
        <p className="text-muted-foreground">System overview and management</p>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {systemStats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-6 hover:border-primary transition-smooth">
              <stat.icon className="w-8 h-8 text-primary mb-3" />
              <div className="text-2xl font-mono mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground mb-2">{stat.label}</div>
              <Badge variant={stat.change.startsWith('+') ? 'default' : 'secondary'} className="text-xs">
                {stat.change}
              </Badge>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-heading">Recent Users</h2>
            <Button variant="outline" size="sm">View All</Button>
          </div>
          <div className="space-y-3">
            {recentUsers.map((user, index) => (
              <motion.div
                key={user.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-smooth"
              >
                <div>
                  <div className="font-heading">{user.name}</div>
                  <div className="text-sm text-muted-foreground font-mono">{user.joined}</div>
                </div>
                <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                  {user.status}
                </Badge>
              </motion.div>
            ))}
          </div>
        </Card>

        {/* System Alerts */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-heading">System Alerts</h2>
            <AlertCircle className="w-6 h-6 text-warning" />
          </div>
          <div className="space-y-3">
            {systemAlerts.map((alert, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-3 rounded-lg border ${
                  alert.type === 'warning' ? 'border-warning/50 bg-warning/10' :
                  alert.type === 'success' ? 'border-success/50 bg-success/10' :
                  'border-primary/50 bg-primary/10'
                }`}
              >
                <div className="text-sm mb-1">{alert.message}</div>
                <div className="text-xs text-muted-foreground font-mono">{alert.time}</div>
              </motion.div>
            ))}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-6">
          <h2 className="text-2xl font-heading mb-6">Quick Actions</h2>
          <div className="space-y-3">
            <Button className="w-full justify-start" variant="outline">Create New Raid</Button>
            <Button className="w-full justify-start" variant="outline">Add Stage Challenge</Button>
            <Button className="w-full justify-start" variant="outline">Manage Boosters</Button>
            <Button className="w-full justify-start" variant="outline">View Reports</Button>
            <Button className="w-full justify-start glow-cyan">Export Data</Button>
          </div>
        </Card>

        {/* System Status */}
        <Card className="p-6">
          <h2 className="text-2xl font-heading mb-6">System Status</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">API Server</span>
              <Badge className="glow-cyan">Operational</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Database</span>
              <Badge className="glow-cyan">Operational</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Storage</span>
              <Badge className="glow-cyan">Operational</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Analytics</span>
              <Badge variant="secondary">Degraded</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
