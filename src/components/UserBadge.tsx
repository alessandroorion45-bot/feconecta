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

  // `color` precisa ser um par de classes de gradiente ("from-... to-...").
  // Se vier vazio ou um hexadecimal (erro que já deixou selos ilegíveis em três
  // telas), o gradiente não pinta e sobra texto branco em fundo claro. Aqui a
  // cor inválida cai num cinza legível em vez de sumir.
  const isGradientClass = typeof color === "string" && color.includes("from-");
  const safeColor = isGradientClass ? color : "from-slate-400 to-slate-500";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-semibold bg-gradient-to-r shadow-sm border border-white/20",
        safeColor,
        sizeClasses[size],
        className
      )}
      title={name}
    >
      <span>{icon}</span>
      <span className="text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)]">{name}</span>
    </div>
  );
};
