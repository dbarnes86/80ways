import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { User, Trophy, MapPin, Settings, Award, Target } from "lucide-react";
import { motion } from "framer-motion";

export default function Profile() {
  const profile = {
    name: "Phileas Fogg",
    email: "phileas.fogg@ludis.com",
    location: "London, England",
    joinDate: "2084-01-15",
    level: 42,
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
    { label: "Total Distance", value: "2,847 km", icon: MapPin },
    { label: "Achievements", value: "28", icon: Award },
    { label: "Level", value: "42", icon: Target },
    { label: "Rank", value: "#1,247", icon: Trophy },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-heading mb-2 text-glow-cyan">Profile</h1>
        <p className="text-muted-foreground">Your adventure chronicle</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1 p-6 glow-cyan">
          <div className="text-center mb-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary mx-auto mb-4 flex items-center justify-center glow-purple">
              <User className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-heading mb-1">{profile.name}</h2>
            <p className="text-muted-foreground text-sm">{profile.email}</p>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Location</span>
              <span className="text-sm font-mono">{profile.location}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Member Since</span>
              <span className="text-sm font-mono">{profile.joinDate}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Level</span>
              <Badge className="glow-cyan">{profile.level}</Badge>
            </div>
          </div>

          <Button className="w-full glow-purple">
            <Settings className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        </Card>

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
                <Card className="p-4 hover:border-primary transition-smooth">
                  <stat.icon className="w-6 h-6 text-primary mb-2" />
                  <div className="text-xl font-mono mb-1">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Badges */}
          <Card className="p-6">
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
                  className="text-center group cursor-pointer"
                >
                  <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-2 transition-smooth group-hover:scale-110 ${
                    badge.rarity === 'legendary' ? 'glow-magenta' :
                    badge.rarity === 'epic' ? 'glow-purple' :
                    badge.rarity === 'rare' ? 'glow-cyan' : ''
                  }`}>
                    <span className="text-2xl">{badge.icon}</span>
                  </div>
                  <div className="text-xs font-medium">{badge.name}</div>
                </motion.div>
              ))}
            </div>
          </Card>

          {/* Settings */}
          <Card className="p-6">
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
                <Button className="glow-cyan">Save Changes</Button>
                <Button variant="outline">Cancel</Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
