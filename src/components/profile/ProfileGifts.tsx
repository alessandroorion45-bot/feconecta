import { memo, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Gift, ChevronRight } from "lucide-react";

const sb = supabase as any;

interface ReceivedGift {
  id: string;
  store_products: {
    nome: string;
    icone: string | null;
    image_url: string | null;
  } | null;
}

interface ProfileGiftsProps {
  userId: string;
  /** RLS só deixa o próprio presenteado ver as compras — a seção só faz sentido no dono */
  isOwner: boolean;
}

/** 🎁 Presentes Recebidos — os mais recentes, com link pra coleção completa */
const ProfileGifts = memo(({ userId, isOwner }: ProfileGiftsProps) => {
  const [items, setItems] = useState<ReceivedGift[] | null>(null);

  useEffect(() => {
    if (!userId || !isOwner) return;
    let cancelled = false;
    sb.from("store_purchases")
      .select("id, store_products(nome, icone, image_url)")
      .eq("gift_to", userId)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data }: { data: ReceivedGift[] | null }) => {
        if (!cancelled) setItems(data || []);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, isOwner]);

  if (!isOwner || !items) return null;

  // Estado vazio elegante (só o dono vê)
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/70 bg-card/40 px-4 py-6 text-center">
        <div className="text-4xl mb-2 opacity-70">🎁</div>
        <p className="text-sm font-medium text-foreground/80">Nenhum presente ainda</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Quando alguém te presentear na{" "}
          <Link to="/loja" className="text-rose-500 hover:underline">Kingdom Store</Link>, ele aparece aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-[250ms]">
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-rose-500/10 to-transparent border-b border-border/50">
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Gift className="h-4 w-4 text-rose-500" />
          Presentes Recebidos
        </span>
        <Link
          to="/presentes"
          className="flex items-center gap-0.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:underline"
        >
          Ver todos <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="flex gap-3 p-4 overflow-x-auto snap-x sm:justify-center">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-col items-center gap-1 shrink-0 snap-start rounded-xl border border-border/50 bg-muted/40 px-3 py-2.5 hover:scale-[1.04] hover:border-rose-400/40 transition-all duration-[250ms]"
            title={item.store_products?.nome}
          >
            {item.store_products?.image_url ? (
              <img src={item.store_products.image_url} alt="" loading="lazy" className="h-10 w-10 rounded-lg object-cover" />
            ) : (
              <span className="text-3xl leading-none">{item.store_products?.icone || "🎁"}</span>
            )}
            <span className="text-[10px] text-muted-foreground max-w-[76px] truncate text-center">
              {item.store_products?.nome}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});

ProfileGifts.displayName = "ProfileGifts";

export default ProfileGifts;
