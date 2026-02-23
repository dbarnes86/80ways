import { NavLink, useNavigate } from "react-router-dom";
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
  X,
  LogOut
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/map", icon: Map, label: "Map" },
    { to: "/stages", icon: Trophy, label: "Stages" },
    { to: "/raids", icon: Sword, label: "Raids" },
    { to: "/activity-history", icon: BookOpen, label: "Logbook" },
    { to: "/store", icon: ShoppingBag, label: "Store" },
    { to: "/profile", icon: User, label: "Profile" },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 relative">
      {/* Top gradient accent line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-primary via-secondary to-accent" />

      <div className="bg-card/80 backdrop-blur-md border-b border-primary/15">
        {/* Scan line texture */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,240,255,0.02) 3px, rgba(0,240,255,0.02) 4px)',
          }}
        />

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <NavLink to="/" className="flex items-center gap-2.5 group">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[0_0_15px_hsl(187_100%_50%/0.4)] transition-shadow duration-300 group-hover:shadow-[0_0_25px_hsl(187_100%_50%/0.6)]"
              >
                <Map className="w-5 h-5 text-primary-foreground" />
              </motion.div>
              <div className="hidden md:block">
                <div className="font-heading text-lg leading-tight text-glow-cyan tracking-wide">
                  ATW<span className="text-secondary">80</span>
                </div>
                <div className="text-[9px] text-muted-foreground font-mono tracking-widest uppercase">
                  Around the World
                </div>
              </div>
            </NavLink>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-0.5">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `relative flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                      {/* Active indicator line */}
                      {isActive && (
                        <motion.div
                          layoutId="nav-active"
                          className="absolute bottom-0 left-2 right-2 h-[2px] bg-primary shadow-[0_0_8px_hsl(187_100%_50%/0.6)]"
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {user && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSignOut}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              )}

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-8 w-8"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="lg:hidden overflow-hidden bg-card/95 backdrop-blur-md border-b border-primary/15"
          >
            <div className="container mx-auto px-4 py-3 space-y-1">
              {navItems.map((item, i) => (
                <motion.div
                  key={item.to}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <NavLink
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                        isActive
                          ? "bg-primary/10 text-primary border-l-2 border-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`
                    }
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </NavLink>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
