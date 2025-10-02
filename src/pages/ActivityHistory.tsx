import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, TrendingUp, Download } from "lucide-react";
import { motion } from "framer-motion";

export default function ActivityHistory() {
  const activities = [
    { id: 1, date: "2084-10-02", type: "Running", distance: 8.5, duration: "42:30", calories: 420, pace: "5:00" },
    { id: 2, date: "2084-10-01", type: "Cycling", distance: 25.3, duration: "1:15:22", calories: 680, pace: "2:58" },
    { id: 3, date: "2084-09-30", type: "Walking", distance: 5.2, duration: "58:12", pace: "11:12", calories: 210 },
    { id: 4, date: "2084-09-29", type: "Running", distance: 10.0, duration: "50:00", pace: "5:00", calories: 500 },
    { id: 5, date: "2084-09-28", type: "Cycling", distance: 30.5, duration: "1:30:00", pace: "2:57", calories: 820 },
    { id: 6, date: "2084-09-27", type: "Running", distance: 7.2, duration: "36:00", pace: "5:00", calories: 360 },
  ];

  const stats = {
    totalActivities: 124,
    totalDistance: "2,847 km",
    totalTime: "142:38:22",
    avgPace: "5:02 /km",
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-heading mb-2 text-glow-cyan">Activity Logbook</h1>
        <p className="text-muted-foreground">Your complete fitness chronicle</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-6 hover:border-primary transition-smooth">
            <div className="text-2xl font-mono mb-1">{stats.totalActivities}</div>
            <div className="text-sm text-muted-foreground">Total Activities</div>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="p-6 hover:border-primary transition-smooth">
            <div className="text-2xl font-mono mb-1">{stats.totalDistance}</div>
            <div className="text-sm text-muted-foreground">Total Distance</div>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="p-6 hover:border-primary transition-smooth">
            <div className="text-2xl font-mono mb-1">{stats.totalTime}</div>
            <div className="text-sm text-muted-foreground">Total Time</div>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="p-6 hover:border-primary transition-smooth">
            <div className="text-2xl font-mono mb-1">{stats.avgPace}</div>
            <div className="text-sm text-muted-foreground">Average Pace</div>
          </Card>
        </motion.div>
      </div>

      {/* Filters and Export */}
      <Card className="p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm">
              <Calendar className="w-4 h-4 mr-2" />
              This Week
            </Button>
            <Button variant="outline" size="sm">This Month</Button>
            <Button variant="outline" size="sm">This Year</Button>
            <Button variant="outline" size="sm">All Time</Button>
          </div>
          <Button variant="outline" size="sm" className="glow-cyan">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        </div>
      </Card>

      {/* Activities Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-heading">Recent Activities</h2>
          <TrendingUp className="w-6 h-6 text-success" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-heading">Date</th>
                <th className="text-left py-3 px-4 font-heading">Activity</th>
                <th className="text-left py-3 px-4 font-heading">Distance</th>
                <th className="text-left py-3 px-4 font-heading">Duration</th>
                <th className="text-left py-3 px-4 font-heading">Pace</th>
                <th className="text-left py-3 px-4 font-heading">Calories</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((activity, index) => (
                <motion.tr
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-border hover:bg-muted/50 transition-smooth cursor-pointer"
                >
                  <td className="py-4 px-4 font-mono text-sm">{activity.date}</td>
                  <td className="py-4 px-4">
                    <span className="px-2 py-1 rounded bg-primary/20 text-primary text-sm">
                      {activity.type}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-mono">{activity.distance} km</td>
                  <td className="py-4 px-4 font-mono text-sm">{activity.duration}</td>
                  <td className="py-4 px-4 font-mono text-sm">{activity.pace} /km</td>
                  <td className="py-4 px-4 font-mono">{activity.calories} kcal</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
