import { memo, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import GiftPremiumExperience from "@/components/gifts/GiftPremiumExperience";
import { Gift, ChevronRight } from "lucide-react";

const sb = supabase as any;

interface ReceivedGift {
  id: string;
  created_at: string;
  buyer_id: string | null;
  gift_message: string | null;
  store_products: {
    nome: string;
    slug: string | null;
    icone: string | null;
    image_url: string | null;
    descricao: string | null;
    verse_reference: string | null;
    verse_text: string | null;
    raridade: string | null;
  } | null;
  sender_name?: string;
}

interface ProfileGiftsProps {
  userId: string;
  /** RLS só deixa o próprio presenteado ver as compras — a seção só faz sentido no dono */
  isOwner: boolean;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

/** 🎁 Presentes Recebidos — com remetente, data e detalhe ao clicar */
const ProfileGifts = memo(({ userId, isOwner }: ProfileGiftsProps) => {
  const [items, setItems] = useState<ReceivedGift[] | null>(null);
  const [detail, setDetail] = useState<ReceivedGift | null>(null);

  useEffect(() => {
    if (!userId || !isOwner) return;
    let cancelled = false;

    (async () => {
      const { data } = await sb
        .from("store_purchases")
        .select("id, created_at, buyer_id, gift_message, store_products(nome, slug, icone, image_url, descricao, verse_reference, verse_text, raridade)")
        .eq("gift_to", userId)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(6);
      if (cancelled) return;

      const gifts: ReceivedGift[] = data || [];
      const ids = [...new Set(gifts.map((g) => g.buyer_id).filter(Boolean))] as string[];
      let names = new Map<string, string>();
      if (ids.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", ids);
        names = new Map((profiles || []).map((p) => [p.id, p.full_name || "Alguém"]));
      }
      if (cancelled) return;
      setItems(gifts.map((g) => ({ ...g, sender_name: g.buyer_id ? names.get(g.buyer_id) || "Alguém" : "Alguém" })));
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, isOwner]);

  if (!isOwner || !items) return null;

  // Estado vazio inspirador
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/70 bg-card/40 px-5 py-7 text-center">
        <div className="text-4xl mb-2">🎁</div>
        <p className="text-sm font-semibold text-foreground">Presentes Recebidos</p>
        <p className="text-xs text-muted-foreground mt-1.5 max-w-sm mx-auto leading-relaxed">
          Ainda nenhum presente. Quando alguém enviar um presente pela Kingdom Store, ele
          aparecerá aqui.
        </p>
        <p className="text-xs italic text-muted-foreground/80 mt-2">
          "Há mais alegria em dar do que em receber." — Atos 20:35
        </p>
        <Button asChild size="sm" variant="outline" className="mt-3 border-rose-400/50 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10">
          <Link to="/loja">Conhecer Presentes</Link>
        </Button>
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
        {items.map((item, i) => (
          <motion.button
            key={item.id}
            type="button"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.06, duration: 0.25 }}
            onClick={() => setDetail(item)}
            className="flex flex-col items-center gap-1 shrink-0 snap-start rounded-xl border border-border/50 bg-muted/40 px-3 py-2.5 hover:scale-[1.04] hover:border-rose-400/40 transition-all duration-[250ms] focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/60"
            title={item.store_products?.nome}
          >
            {item.store_products?.image_url ? (
              <img
                src={item.store_products.image_url}
                alt=""
                loading="lazy"
                className="h-14 w-14 object-contain rounded-lg transition-transform duration-300 drop-shadow-[0_0_8px_rgba(217,180,80,0.35)]"
              />
            ) : (
              <span className="text-3xl leading-none">{item.store_products?.icone || "🎁"}</span>
            )}
            <span className="text-[10px] font-medium text-foreground/90 max-w-[80px] truncate text-center">
              {item.store_products?.nome}
            </span>
            <span className="text-[9px] text-muted-foreground max-w-[80px] truncate text-center">
              de {item.sender_name}
            </span>
            <span className="text-[9px] text-muted-foreground/70">{formatDate(item.created_at)}</span>
          </motion.button>
        ))}
      </div>

      <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="sm:max-w-md text-center overflow-hidden p-0 border-none bg-transparent [&>button]:text-white/80 [&>button:hover]:text-white">
          <DialogTitle className="sr-only">{detail?.store_products?.nome}</DialogTitle>
          {detail && (
            <GiftPremiumExperience
              purchaseId={detail.id}
              productName={detail.store_products?.nome || "Presente"}
              productSlug={detail.store_products?.slug}
              imageUrl={detail.store_products?.image_url || null}
              icone={detail.store_products?.icone || null}
              giftMessage={detail.gift_message}
              verseReference={detail.store_products?.verse_reference}
              verseTextFallback={detail.store_products?.verse_text}
              raridade={detail.store_products?.raridade}
              senderName={detail.sender_name}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
});

ProfileGifts.displayName = "ProfileGifts";

export default ProfileGifts;
