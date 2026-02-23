import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { HolographicCard } from "@/components/ui/holographic-card";
import { CyberpunkProgress } from "@/components/ui/cyberpunk-progress";
import { User, Trophy, MapPin, Settings, Award, Target, Zap, Flame } from "lucide-react";
import { motion } from "framer-motion";

export default function Profile() {
  const profile = {
    name: "Phileas Fogg",
    email: "phileas.fogg@ludis.com",
    location: "London, England",
    joinDate: "2084-01-15",
    level: 42,
    levelProgress: 72,
    totalDistance: 2847,
    achievements: 28,
  };

  const badges = [
    { name: "First Steps", icon: "🏃", rarity: "common" },
    { name: "Century Club", icon: "💯", rarity: "rare" },
    { name: "World Traveler", icon: "🌍", rarity: "epic" },
    { name: "Alpine Champion", icon: "⛰️", rarity: "legendary" },
    { name: "Night Owl", icon: "🦉", rarity: "rare" },
    { name: "Speed Demon", icon: "⚡", rarity: "epic" },
  ];

  const stats = [
    { label: "Total Distance", value: "2,847 km", icon: MapPin, glow: "cyan" as const },
    { label: "Achievements", value: "28", icon: Award, glow: "purple" as const },
    { label: "Level", value: "42", icon: Target, glow: "magenta" as const },
    { label: "Rank", value: "#1,247", icon: Trophy, glow: "cyan" as const },
  ];

  const rarityGlow = (r: string) =>
    r === "legendary" ? "glow-magenta" : r === "epic" ? "glow-purple" : r === "rare" ? "glow-cyan" : "";

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-heading mb-2 text-glow-cyan">Profile</h1>
        <p className="text-muted-foreground">Your adventure chronicle</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <HolographicCard glow="cyan" className="p-6">
            <div className="text-center mb-6">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary mx-auto mb-4 flex items-center justify-center glow-purple"
              >
                <User className="w-12 h-12 text-primary-foreground" />
              </motion.div>
              <h2 className="text-2xl font-heading mb-1">{profile.name}</h2>
              <p className="text-muted-foreground text-sm">{profile.email}</p>
            </div>

            {/* Level progress */}
            <div className="mb-6 p-4 rounded-lg bg-muted/20 border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Level {profile.level}</span>
                <Badge className="bg-primary/20 text-primary border-primary/40 text-xs">
                  <Zap className="w-3 h-3 mr-1" /> {profile.levelProgress}%
                </Badge>
              </div>
              <CyberpunkProgress value={profile.levelProgress} segments={10} glow="cyan" size="sm" />
              <p className="text-xs text-muted-foreground mt-1 text-right">Next: Level {profile.level + 1}</p>
            </div>

            <div className="space-y-3 mb-6">
              {[
                { label: "Location", val: profile.location },
                { label: "Member Since", val: profile.joinDate },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">{row.label}</span>
                  <span className="text-sm font-mono">{row.val}</span>
                </div>
              ))}
            </div>

            <Button className="w-full" variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </HolographicCard>

          {/* Streak card */}
          <HolographicCard glow="magenta" className="p-6 text-center">
            <Flame className="w-10 h-10 mx-auto mb-2 text-secondary" />
            <p className="text-3xl font-mono font-bold text-secondary">14</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Day Streak</p>
          </HolographicCard>
        </div>

        {/* Stats & Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <HolographicCard glow={stat.glow} className="p-4">
                  <stat.icon className="w-5 h-5 text-primary mb-2" />
                  <div className="text-xl font-mono mb-1">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </HolographicCard>
              </motion.div>
            ))}
          </div>

          {/* Badges */}
          <HolographicCard glow="purple" className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-heading">Achievement Badges</h2>
              <Badge variant="secondary">{profile.achievements} Earned</Badge>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {badges.map((badge, index) => (
                <motion.div
                  key={badge.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.15, y: -4 }}
                  className="text-center group cursor-pointer"
                >
                  <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-2 transition-smooth ${rarityGlow(badge.rarity)}`}>
                    <span className="text-2xl">{badge.icon}</span>
                  </div>
                  <div className="text-xs font-medium">{badge.name}</div>
                  <div className={`text-[10px] uppercase tracking-wider mt-0.5 ${
                    badge.rarity === "legendary" ? "text-warning" :
                    badge.rarity === "epic" ? "text-accent" :
                    badge.rarity === "rare" ? "text-primary" :
                    "text-muted-foreground"
                  }`}>{badge.rarity}</div>
                </motion.div>
              ))}
            </div>
          </HolographicCard>

          {/* Settings */}
          <HolographicCard glow="none" className="p-6">
            <h2 className="text-2xl font-heading mb-6">Account Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Display Name</label>
                <Input defaultValue={profile.name} />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Email</label>
                <Input type="email" defaultValue={profile.email} />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Location</label>
                <Input defaultValue={profile.location} />
              </div>
              <div className="flex gap-3">
                <Button>Save Changes</Button>
                <Button variant="outline">Cancel</Button>
              </div>
            </div>
          </HolographicCard>
        </div>
      </div>
    </div>
  );
}
