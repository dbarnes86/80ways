import { useState, useEffect } from "react";
import { ArrowRight, User, Zap, Users, Globe } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { isNativeApp } from "@/lib/native";
import { COMPANY } from "@/data/company";
import foggPortrait from "@/assets/fogg-portrait.jpg";
import passepartoutPortrait from "@/assets/passepartout-portrait.jpg";
import fixPortrait from "@/assets/fix-portrait.jpg";
import aoudaPortrait from "@/assets/aouda-portrait.jpg";
import { StudioMark } from "@/components/StudioMark";
import { useAuth } from "@/contexts/AuthContext";
import { Button, Card } from '@/components/ui';

type SplashPhase = "studio" | "title" | "done";

export default function Landing() {
  const { user } = useAuth();
  const [splashPhase, setSplashPhase] = useState<SplashPhase>("studio");

  useEffect(() => {
    // Studio mark: fade in 0.8s, hold 1.5s, fade out 0.8s = ~3.1s
    const titleTimer = setTimeout(() => setSplashPhase("title"), 3100);
    // Title: fade in 0.8s, hold 2s, then show full page
    const doneTimer = setTimeout(() => setSplashPhase("done"), 6000);
    return () => {
      clearTimeout(titleTimer);
      clearTimeout(doneTimer);
    };
  }, []);

  // Splash sequence
  // The iOS app has its own native splash; it opens straight into the game.
  if (isNativeApp()) return <Navigate to={user ? "/dashboard" : "/onboard"} replace />;

  if (splashPhase !== "done") {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-background cursor-pointer"
        onClick={() => setSplashPhase("done")}
        role="button"
        aria-label="Skip intro"
      >
        <>
          {splashPhase === "studio" && (
            <div
              key="studio"
              className="flex flex-col items-center animate-fade-up"
            >
              <StudioMark className="text-5xl text-foreground" />
            </div>
          )}
          {splashPhase === "title" && (
            <div
              key="title"
              className="text-center animate-fade-up"
            >
              <h1 className="text-5xl md:text-7xl font-heading text-glow-cyan uppercase leading-tight">
                Around the World<br />in 80 Ways
              </h1>
            </div>
          )}
        </>
      </div>
    );
  }

  const howItWorks = [
    {
      icon: User,
      title: "YOUR PERSONAL EXPEDITION",
      items: [
        "Start from London anytime",
        "Progress at your own pace",
        "80 narrative days = however long it takes you",
      ],
      borderColor: "border-primary",
      glowClass: "hover:glow-cyan",
    },
    {
      icon: Zap,
      title: "FLEXIBLE ENERGY SYSTEM",
      items: [
        "Any activity charges any energy type",
        "Match activity to challenge for bonus rewards",
        "Build reserves strategically",
      ],
      borderColor: "border-accent",
      glowClass: "hover:glow-purple",
    },
    {
      icon: Users,
      title: "COMMUNITY RAID EVENTS",
      items: [
        "Join 8-hour global challenges",
        "Deploy energy when Detective Fix strikes",
        "Compete on raid leaderboards",
      ],
      borderColor: "border-secondary",
      glowClass: "hover:glow-magenta",
    },
  ];

  const characters = [
    {
      name: "Phileas Fogg",
      title: "The Gentleman Adventurer",
      bio: "Methodical and determined. Believes anything is possible with precise calculation.",
      image: foggPortrait,
      borderColor: "border-primary",
      glowClass: "hover:glow-cyan",
    },
    {
      name: "Passepartout",
      title: "The Loyal Companion",
      bio: "Fogg's resourceful valet. Keeps the journey on track.",
      image: passepartoutPortrait,
      borderColor: "border-accent",
      glowClass: "hover:glow-purple",
    },
    {
      name: "Detective Fix",
      title: "The Pursuer",
      bio: "Scotland Yard inspector. Will sabotage to make an arrest.",
      image: fixPortrait,
      borderColor: "border-destructive",
      glowClass: "hover:shadow-[0_0_20px_rgba(255,68,68,0.5)]",
    },
    {
      name: "Aouda",
      title: "The Princess",
      bio: "Rescued in India. Brings valuable knowledge.",
      image: aoudaPortrait,
      borderColor: "border-secondary",
      glowClass: "hover:glow-magenta",
    },
  ];

  return (
    <div
      className="min-h-screen animate-fade-up"
    >
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/20" />
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div
            className="text-center max-w-5xl mx-auto animate-fade-up"
          >
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-heading mb-6 text-glow-cyan uppercase leading-tight">
              Around the World<br />in 80 Ways
            </h1>
            <div className="text-xl md:text-2xl text-primary font-mono mb-8 tracking-wider">
              Your Personal Adventure // Community Challenges // 2084
            </div>
            <p className="text-lg md:text-xl text-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
              In 1872, Phileas Fogg bet he could circumnavigate the globe in 80 days. 
              In 2084, it's YOUR turn—start your own journey, progress at your own pace, 
              and join community raid events.
            </p>
            <div className="flex flex-col items-center gap-4">
              <Link to={user ? "/dashboard" : "/onboard"}>
                <Button size="lg" className="text-lg px-12 py-6 h-auto glow-cyan hover:scale-105 transition-smooth">
                  {user ? "CONTINUE YOUR JOURNEY" : "START THE JOURNEY"}
                  <ArrowRight className="ml-3 w-6 h-6" />
                </Button>
              </Link>
              {!user && (
                <Link to="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors font-mono">
                  Already an adventurer? Sign in
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* The Wager Section */}
      <section className="py-20 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="animate-fade-up"
           
           
          >
            <Card className="max-w-4xl mx-auto p-8 md:p-12 bg-card border-2 border-primary/50 relative victorian-corners glow-purple">
              <h2 className="text-3xl md:text-4xl font-heading text-center mb-8 text-primary">
                THE CHALLENGE
              </h2>
              <div className="space-y-6 text-center">
                <p className="text-lg md:text-xl leading-relaxed">
                  Starting from <span className="text-primary font-mono">London</span>, travel through:
                </p>
                <div className="font-mono text-sm md:text-base text-muted-foreground leading-loose">
                  London → Paris → Suez → Bombay → Calcutta → Hong Kong → Yokohama → San Francisco → New York → London
                </div>
                <div className="grid md:grid-cols-2 gap-4 mt-8">
                  <div className="bg-primary/10 rounded-lg p-4 border border-primary/30">
                    <div className="text-2xl font-mono text-primary mb-2">80</div>
                    <div className="text-sm text-muted-foreground">Narrative Days</div>
                  </div>
                  <div className="bg-secondary/10 rounded-lg p-4 border border-secondary/30">
                    <Globe className="w-8 h-8 text-secondary mx-auto mb-2" />
                    <div className="text-sm text-muted-foreground">Powered by YOUR fitness activities</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 border-t border-border">
        <div className="container mx-auto px-4">
          <h2
           
           
            className="text-3xl md:text-4xl font-heading text-center mb-12 text-glow-magenta animate-fade-up"
          >
            HOW IT WORKS
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {howItWorks.map((section, index) => (
              <div className="animate-fade-up"
                key={section.title}
               
               
               style={{ animationDelay: `${index * 0.2}s` }}>
                <Card className={`p-6 h-full border-2 ${section.borderColor} transition-smooth ${section.glowClass}`}>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      <section.icon className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-heading mb-4">{section.title}</h3>
                  </div>
                  <ul className="space-y-3">
                    {section.items.map((item, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start">
                        <span className="text-primary mr-2">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Characters Preview */}
      <section className="py-20 border-t border-border">
        <div className="container mx-auto px-4">
          <h2
           
           
            className="text-3xl md:text-4xl font-heading text-center mb-12 text-glow-cyan animate-fade-up"
          >
            MEET YOUR COMPANIONS
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {characters.map((character, index) => (
              <div className="animate-scale-in"
                key={character.name}
               
               
               style={{ animationDelay: `${index * 0.1}s` }}>
                <Card className={`overflow-hidden border-2 ${character.borderColor} transition-smooth ${character.glowClass} relative victorian-corners`}>
                  <div className="aspect-video overflow-hidden bg-gradient-to-br from-muted to-background">
                    <img 
                      src={character.image} 
                      alt={character.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-2xl font-heading mb-2">{character.name}</h3>
                    <div className="text-sm font-mono text-primary mb-3">{character.title}</div>
                    <p className="text-muted-foreground">{character.bio}</p>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="mb-6">
              <p className="text-xl font-heading text-primary">An Auguris Games production</p>
            </div>
            <div className="flex justify-center gap-6 text-sm text-muted-foreground">
              <Link to="/privacy" className="hover:text-primary transition-smooth">Privacy</Link>
              <span>•</span>
              <Link to="/terms" className="hover:text-primary transition-smooth">Terms</Link>
              <span>•</span>
              <a href={`mailto:${COMPANY.supportEmail}`} className="hover:text-primary transition-smooth">Contact</a>
            </div>
            <div className="mt-6 text-xs text-muted-foreground font-mono">
              © {new Date().getFullYear()} Auguris OÜ. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
