import { useEffect, useState } from "react";
import UserAvatar from "@/components/UserAvatar";
import AnimatedCosmeticFrame from "@/components/AnimatedCosmeticFrame";
import { supabase } from "@/integrations/supabase/client";

/* ------------------------------------------------------------------
 * Cache + busca em LOTE das molduras equipadas.
 *
 * O feed mostra dezenas de avatares; consultar a moldura de cada um
 * separadamente seria uma consulta por card (feed travando). Aqui os
 * pedidos que chegam no mesmo instante são juntados numa consulta só,
 * e o resultado fica em cache pelo tempo da sessão.
 * ------------------------------------------------------------------ */
const cache = new Map<string, string | null>();
const waiting = new Set<string>();
const subscribers = new Set<() => void>();
let timer: ReturnType<typeof setTimeout> | null = null;

async function flush() {
  timer = null;
  const ids = Array.from(waiting);
  waiting.clear();
  if (ids.length === 0) return;

  ids.forEach((id) => { if (!cache.has(id)) cache.set(id, null); }); // evita repetir pedido

  const { data } = await supabase
    .from("user_cosmetics")
    .select("user_id, cosmetic_key")
    .in("user_id", ids)
    .eq("tipo", "moldura")
    .eq("equipped", true);

  (data || []).forEach((c: { user_id: string; cosmetic_key: string }) => {
    cache.set(c.user_id, c.cosmetic_key);
  });
  subscribers.forEach((fn) => fn());
}

/** Moldura equipada de um usuário (null enquanto carrega ou se não tiver). */
export function useUserFrame(userId?: string | null): string | null {
  const [, force] = useState(0);

  useEffect(() => {
    if (!userId) return;
    const rerender = () => force((n) => n + 1);
    subscribers.add(rerender);

    if (!cache.has(userId)) {
      waiting.add(userId);
      if (!timer) timer = setTimeout(flush, 40); // junta os pedidos do mesmo tick
    }
    return () => { subscribers.delete(rerender); };
  }, [userId]);

  return userId ? cache.get(userId) ?? null : null;
}

/** Limpa o cache — use depois que o próprio usuário troca de moldura. */
export function clearFrameCache(userId?: string) {
  if (userId) cache.delete(userId);
  else cache.clear();
  subscribers.forEach((fn) => fn());
}

interface FramedAvatarProps {
  userId?: string | null;
  src?: string | null;
  fallback: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  onClick?: () => void;
}

/**
 * Avatar do usuário JÁ com a moldura da Kingdom Store, quando ele tem uma
 * equipada. Antes a moldura só aparecia no perfil — comprava e não via em
 * lugar nenhum enquanto usava o app. Este componente é o substituto direto
 * do UserAvatar em feed, comentários e listas.
 */
/* O avatar da plataforma é um "quadrado arredondado" (AvatarPro usa
 * borderRadius = max(8, largura * 0.22)), não um círculo. A moldura precisa do
 * MESMO raio, senão fica desencaixada — foi o que aconteceu no feed. */
const AVATAR_W: Record<NonNullable<FramedAvatarProps["size"]>, number> = {
  xs: 28, sm: 36, md: 48, lg: 64, xl: 96,
};

export const FramedAvatar = ({ userId, src, fallback, size = "md", className, onClick }: FramedAvatarProps) => {
  const frameKey = useUserFrame(userId);

  const avatar = (
    <UserAvatar src={src || undefined} fallback={fallback} size={size} className={className} onClick={onClick} userId={userId} />
  );

  if (!frameKey) return avatar;

  const w = AVATAR_W[size];
  return (
    <AnimatedCosmeticFrame
      cosmeticKey={frameKey}
      radiusPx={Math.max(8, Math.round(w * 0.22))}
      padPx={size === "xs" ? 2 : 3}
      className="shrink-0"
    >
      {avatar}
    </AnimatedCosmeticFrame>
  );
};

export default FramedAvatar;
