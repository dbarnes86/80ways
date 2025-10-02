import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Map, 
  Trophy, 
  ShoppingBag, 
  User, 
  Sword,
  BookOpen,
  LayoutDashboard,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/map", icon: Map, label: "Map" },
    { to: "/stages", icon: Trophy, label: "Stages" },
    { to: "/raids", icon: Sword, label: "Raids" },
    { to: "/activity-history", icon: BookOpen, label: "Logbook" },
    { to: "/store", icon: ShoppingBag, label: "Store" },
    { to: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center glow-cyan transition-smooth group-hover:scale-110">
              <Map className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="hidden md:block">
              <div className="font-heading text-xl text-glow-cyan">Around the World</div>
              <div className="text-xs text-muted-foreground font-mono">in 80 Ways</div>
            </div>
          </NavLink>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-lg transition-smooth ${
                    isActive
                      ? "bg-primary/20 text-primary glow-cyan"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </NavLink>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-smooth ${
                    isActive
                      ? "bg-primary/20 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
};
