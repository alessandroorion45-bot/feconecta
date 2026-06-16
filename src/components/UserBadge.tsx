import { cn } from "@/lib/utils";

interface UserBadgeProps {
  icon: string;
  name: string;
  color: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

export const UserBadge = ({ 
  icon, 
  name, 
  color, 
  size = "sm",
  className 
}: UserBadgeProps) => {
  const sizeClasses = {
    xs: "text-[10px] px-1.5 py-0.5",
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-semibold bg-gradient-to-r shadow-sm border border-white/20",
        color,
        sizeClasses[size],
        className
      )}
      title={name}
    >
      <span>{icon}</span>
      <span className="text-white">{name}</span>
    </div>
  );
};
