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
        "bg-foreground/5",
        "border border-foreground/10",
        "rounded-lg shadow-lg",
        blurClasses[blur],
        className
      )}
    >
      {children}
    </div>
  );
}
