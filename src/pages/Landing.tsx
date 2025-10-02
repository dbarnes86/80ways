import { Button } from "@/components/ui/button";
import { ArrowRight, Map, Trophy, Users, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Landing() {
  const features = [
    {
      icon: Map,
      title: "Global Journey",
      description: "Travel 40,075 km around the Earth through your fitness activities"
    },
    {
      icon: Trophy,
      title: "Stage Challenges",
      description: "Compete in timed stages and climb the leaderboards"
    },
    {
      icon: Users,
      title: "Community Raids",
      description: "Join forces in epic community challenges"
    },
    {
      icon: Zap,
      title: "Power Boosters",
      description: "Unlock boosters to accelerate your adventure"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/20" />
        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl md:text-7xl font-heading mb-6 text-glow-cyan">
              Around the World<br />in 80 Ways
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 font-body">
              Transform your fitness into a neon-lit Victorian adventure.<br />
              Journey 40,075 km around the globe, one workout at a time.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/onboard">
                <Button size="lg" className="group glow-cyan">
                  Begin Your Journey
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10">
                  View Dashboard
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 border-t border-border">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-heading text-center mb-12 text-glow-magenta">
            Your Adventure Awaits
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="relative bg-card border border-border rounded-lg p-6 hover:border-primary transition-smooth hover:glow-cyan group"
              >
                <div className="absolute inset-0 victorian-corners opacity-0 group-hover:opacity-100 transition-smooth" />
                <feature.icon className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-heading mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/50 rounded-lg p-8 glow-purple"
          >
            <h2 className="text-3xl font-heading mb-4">Ready to Start?</h2>
            <p className="text-muted-foreground mb-6">
              Join thousands of adventurers on the greatest fitness journey of 2084
            </p>
            <Link to="/onboard">
              <Button size="lg" className="glow-cyan">
                Embark Now
                <ArrowRight className="ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
