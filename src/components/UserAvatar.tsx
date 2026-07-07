import { AvatarPro, AvatarSize, AvatarRing } from "@/components/AvatarPro";

interface UserAvatarProps {
  src?: string | null;
  fallback: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  onClick?: () => void;
  userId?: string | null;
  ring?: AvatarRing;
  badgeIcon?: string | null;
}

const SIZE_MAP: Record<NonNullable<UserAvatarProps["size"]>, AvatarSize> = {
  xs: "xs",
  sm: "sm",
  md: "md",
  lg: "lg",
  xl: "xl",
};

/**
 * Wrapper de compatibilidade em torno de AvatarPro — mantém a API antiga
 * (fallback/size xs-xl) para não quebrar os call sites existentes, mas
 * renderiza o avatar circular padronizado da plataforma (sombra, halo,
 * borda por papel/VIP, status online, badge, skeleton).
 */
const UserAvatar = ({
  src,
  fallback,
  size = "md",
  className,
  onClick,
  userId,
  ring,
  badgeIcon,
}: UserAvatarProps) => {
  return (
    <AvatarPro
      src={src}
      name={fallback}
      userId={userId}
      size={SIZE_MAP[size]}
      ring={ring}
      badgeIcon={badgeIcon}
      className={className}
      clickable={onClick ? true : undefined}
      onClick={onClick}
    />
  );
};

export default UserAvatar;
