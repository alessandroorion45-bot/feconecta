import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  blur?: "sm" | "md" | "lg";
}

export function GlassCard({ children, className, blur = "md" }: GlassCardProps) {
  const blurClasses = {
    sm: "backdrop-blur-sm",
    md: "backdrop-blur-md",
    lg: "backdrop-blur-lg",
  };

  return (
    <div
      className={cn(
        "bg-white/10 dark:bg-black/10",
        "border border-white/20 dark:border-white/10",
        "rounded-lg shadow-lg",
        blurClasses[blur],
        className
      )}
    >
      {children}
    </div>
  );
}
