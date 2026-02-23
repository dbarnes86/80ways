import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

type ProgressGlow = "cyan" | "magenta" | "purple" | "success" | "warning";

interface CyberpunkProgressProps {
  value: number;
  max?: number;
  segments?: number;
  glow?: ProgressGlow;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
  className?: string;
}

const glowMap: Record<ProgressGlow, { bar: string; shadow: string; bg: string }> = {
  cyan: {
    bar: "bg-primary",
    shadow: "shadow-[0_0_8px_hsl(var(--glow-cyan)/0.6)]",
    bg: "bg-primary/15",
  },
  magenta: {
    bar: "bg-secondary",
    shadow: "shadow-[0_0_8px_hsl(var(--glow-magenta)/0.6)]",
    bg: "bg-secondary/15",
  },
  purple: {
    bar: "bg-accent",
    shadow: "shadow-[0_0_8px_hsl(var(--glow-purple)/0.6)]",
    bg: "bg-accent/15",
  },
  success: {
    bar: "bg-success",
    shadow: "shadow-[0_0_8px_hsl(var(--success)/0.6)]",
    bg: "bg-success/15",
  },
  warning: {
    bar: "bg-warning",
    shadow: "shadow-[0_0_8px_hsl(var(--warning)/0.6)]",
    bg: "bg-warning/15",
  },
};

const sizeMap = {
  sm: "h-2 gap-[1px]",
  md: "h-4 gap-[2px]",
  lg: "h-6 gap-[2px]",
};

export const CyberpunkProgress = ({
  value,
  max = 100,
  segments = 10,
  glow = "cyan",
  showLabel = false,
  size = "md",
  animated = true,
  className,
}: CyberpunkProgressProps) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const filledSegments = Math.round((percentage / 100) * segments);
  const colors = glowMap[glow];

  return (
    <div className={cn("w-full", className)}>
      <div className={cn("flex w-full rounded-sm overflow-hidden", sizeMap[size])}>
        {Array.from({ length: segments }).map((_, i) => {
          const isFilled = i < filledSegments;
          const isLast = i === filledSegments - 1 && filledSegments > 0;

          return (
            <motion.div
              key={i}
              className={cn(
                "flex-1 rounded-[1px] transition-all duration-300",
                isFilled
                  ? cn(colors.bar, isLast && animated ? colors.shadow : "")
                  : "bg-muted/40"
              )}
              initial={animated ? { opacity: 0, scaleY: 0.5 } : false}
              animate={
                animated
                  ? {
                      opacity: isFilled ? 1 : 0.4,
                      scaleY: 1,
                    }
                  : undefined
              }
              transition={{ delay: i * 0.03, duration: 0.2 }}
            />
          );
        })}
      </div>
      {showLabel && (
        <div className="flex justify-between mt-1">
          <span className="text-xs font-mono text-muted-foreground">
            {value.toFixed(1)} / {max}
          </span>
          <span className="text-xs font-mono text-muted-foreground">
            {percentage.toFixed(0)}%
          </span>
        </div>
      )}
    </div>
  );
};
