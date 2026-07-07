import { AvatarPro, AvatarSize, AvatarRing } from "@/components/AvatarPro";

interface RectAvatarProps {
  src?: string | null;
  fallback: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  onClick?: () => void;
  userId?: string | null;
  ring?: AvatarRing;
}

const SIZE_MAP: Record<NonNullable<RectAvatarProps["size"]>, AvatarSize> = {
  xs: "xs",
  sm: "sm",
  md: "md",
  lg: "lg",
  xl: "xl",
};

/**
 * Wrapper de compatibilidade em torno de AvatarPro — mantém a API antiga
 * para não quebrar os call sites existentes, renderizando o avatar
 * circular padronizado da plataforma.
 */
const RectAvatar = ({ src, fallback, size = "md", className, onClick, userId, ring }: RectAvatarProps) => {
  return (
    <AvatarPro
      src={src}
      name={fallback}
      userId={userId}
      size={SIZE_MAP[size]}
      ring={ring}
      className={className}
      clickable={onClick ? true : undefined}
      onClick={onClick}
    />
  );
};

export default RectAvatar;
