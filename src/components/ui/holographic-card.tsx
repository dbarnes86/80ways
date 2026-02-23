import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

type GlowColor = "cyan" | "magenta" | "purple" | "none";

interface HolographicCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: GlowColor;
  scanLines?: boolean;
  corners?: boolean;
  animated?: boolean;
}

const glowStyles: Record<GlowColor, string> = {
  cyan: "shadow-[0_0_15px_hsl(var(--glow-cyan)/0.3),0_0_30px_hsl(var(--glow-cyan)/0.15)] border-primary/40 hover:shadow-[0_0_20px_hsl(var(--glow-cyan)/0.4),0_0_40px_hsl(var(--glow-cyan)/0.2)]",
  magenta: "shadow-[0_0_15px_hsl(var(--glow-magenta)/0.3),0_0_30px_hsl(var(--glow-magenta)/0.15)] border-secondary/40 hover:shadow-[0_0_20px_hsl(var(--glow-magenta)/0.4),0_0_40px_hsl(var(--glow-magenta)/0.2)]",
  purple: "shadow-[0_0_15px_hsl(var(--glow-purple)/0.3),0_0_30px_hsl(var(--glow-purple)/0.15)] border-accent/40 hover:shadow-[0_0_20px_hsl(var(--glow-purple)/0.4),0_0_40px_hsl(var(--glow-purple)/0.2)]",
  none: "border-border",
};

const cornerColor: Record<GlowColor, string> = {
  cyan: "border-primary",
  magenta: "border-secondary",
  purple: "border-accent",
  none: "border-primary",
};

const HolographicCard = React.forwardRef<HTMLDivElement, HolographicCardProps>(
  ({ className, glow = "cyan", scanLines = true, corners = true, animated = true, children, ...props }, ref) => {
    const Wrapper = animated ? motion.div : "div";
    const animationProps = animated
      ? {
          initial: { opacity: 0, y: 8 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.4, ease: "easeOut" },
        }
      : {};

    return (
      <Wrapper
        ref={ref}
        className={cn(
          "relative rounded-lg border bg-card text-card-foreground overflow-hidden transition-shadow duration-300",
          glowStyles[glow],
          className
        )}
        {...(animationProps as any)}
        {...props}
      >
        {/* Scan lines overlay */}
        {scanLines && (
          <div
            className="pointer-events-none absolute inset-0 z-10"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,240,255,0.03) 2px, rgba(0,240,255,0.03) 4px)",
            }}
          />
        )}

        {/* Holographic shimmer */}
        <div
          className="pointer-events-none absolute inset-0 z-10 opacity-0 hover:opacity-100 transition-opacity duration-500"
          style={{
            background:
              "linear-gradient(105deg, transparent 40%, rgba(0,240,255,0.06) 45%, rgba(255,0,255,0.04) 50%, transparent 55%)",
          }}
        />

        {/* Corner brackets */}
        {corners && (
          <>
            <Corner position="top-left" color={cornerColor[glow]} />
            <Corner position="top-right" color={cornerColor[glow]} />
            <Corner position="bottom-left" color={cornerColor[glow]} />
            <Corner position="bottom-right" color={cornerColor[glow]} />
          </>
        )}

        {/* Content */}
        <div className="relative z-20">{children}</div>
      </Wrapper>
    );
  }
);
HolographicCard.displayName = "HolographicCard";

/* Corner bracket sub-component */
function Corner({ position, color }: { position: string; color: string }) {
  const size = "w-3 h-3";
  const base = `absolute ${size} z-20 pointer-events-none`;

  const posMap: Record<string, string> = {
    "top-left": `top-1 left-1 border-t-2 border-l-2`,
    "top-right": `top-1 right-1 border-t-2 border-r-2`,
    "bottom-left": `bottom-1 left-1 border-b-2 border-l-2`,
    "bottom-right": `bottom-1 right-1 border-b-2 border-r-2`,
  };

  return <div className={cn(base, posMap[position], color)} />;
}

export { HolographicCard };
export type { HolographicCardProps, GlowColor };
