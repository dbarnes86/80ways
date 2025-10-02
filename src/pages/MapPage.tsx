import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Lock, MapPin } from "lucide-react";
import { motion } from "framer-motion";

export default function MapPage() {
  const stages = [
    { name: "London", country: "England", distance: 0, status: "start", lat: 51.5074, lng: -0.1278 },
    { name: "Paris", country: "France", distance: 344, status: "complete", lat: 48.8566, lng: 2.3522 },
    { name: "Marseille", country: "France", distance: 775, status: "active", lat: 43.2965, lng: 5.3698 },
    { name: "Rome", country: "Italy", distance: 521, status: "locked", lat: 41.9028, lng: 12.4964 },
    { name: "Athens", country: "Greece", distance: 1053, status: "locked", lat: 37.9838, lng: 23.7275 },
    { name: "Istanbul", country: "Turkey", distance: 1057, status: "locked", lat: 41.0082, lng: 28.9784 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "complete":
        return "border-success bg-success/20";
      case "active":
        return "border-primary bg-primary/20 glow-cyan";
      case "locked":
        return "border-muted bg-muted/20";
      default:
        return "border-primary bg-primary/20";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "complete":
        return <CheckCircle className="w-5 h-5 text-success" />;
      case "active":
        return <MapPin className="w-5 h-5 text-primary animate-pulse" />;
      case "locked":
        return <Lock className="w-5 h-5 text-muted-foreground" />;
      default:
        return <MapPin className="w-5 h-5 text-primary" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-heading mb-2 text-glow-cyan">Journey Map</h1>
        <p className="text-muted-foreground">Chart your course around the world</p>
      </div>

      {/* Map Visualization Placeholder */}
      <Card className="p-8 mb-8 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/50">
        <div className="aspect-video rounded-lg bg-card border border-border flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
          <div className="relative z-10 text-center">
            <MapPin className="w-16 h-16 text-primary mx-auto mb-4 glow-cyan" />
            <p className="text-xl font-heading text-muted-foreground">Interactive Map Coming Soon</p>
            <p className="text-sm text-muted-foreground mt-2">Track your journey in real-time</p>
          </div>
        </div>
      </Card>

      {/* Stages List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-heading mb-4">Journey Stages</h2>
        {stages.map((stage, index) => (
          <motion.div
            key={stage.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`p-6 transition-smooth ${getStatusColor(stage.status)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-card border-2 border-current flex items-center justify-center">
                    {getStatusIcon(stage.status)}
                  </div>
                  <div>
                    <h3 className="text-xl font-heading">{stage.name}</h3>
                    <p className="text-sm text-muted-foreground">{stage.country}</p>
                  </div>
                </div>
                <div className="text-right">
                  {stage.distance > 0 && (
                    <div className="text-xl font-mono mb-1">{stage.distance} km</div>
                  )}
                  <Badge
                    variant={
                      stage.status === "complete"
                        ? "default"
                        : stage.status === "active"
                        ? "default"
                        : "secondary"
                    }
                    className={stage.status === "active" ? "glow-cyan" : ""}
                  >
                    {stage.status === "start" ? "Starting Point" : stage.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
