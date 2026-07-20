import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  rarityStyle,
  giftThemeFor,
  isCelebratory,
  fetchGiftVerse,
  FetchedVerse,
  ParticleKind,
} from "@/lib/giftPresentation";
import { startGiftAmbient, stopGiftAmbient } from "@/lib/giftAmbient";
import { Heart, Share2, Bookmark, BookmarkCheck, Volume2, VolumeX, Sparkles } from "lucide-react";

const sb = supabase as any;

const REACTIONS: { key: string; emoji: string; label: string }[] = [
  { key: "amem", emoji: "🙏", label: "Amém" },
  { key: "gratidao", emoji: "❤️", label: "Gratidão" },
  { key: "gloria", emoji: "✨", label: "Glória a Deus" },
  { key: "aleluia", emoji: "🙌", label: "Aleluia" },
];

const PARTICLE_EMOJI: Record<ParticleKind, string> = {
  leaves: "🍃",
  "gold-dust": "✨",
  crystals: "💎",
  stars: "⭐",
  "light-rays": "",
  embers: "🔥",
  wheat: "🌾",
  notes: "🎵",
  "map-lights": "✦",
  hearts: "💛",
  sparkles: "✨",
};

export interface GiftPremiumExperienceProps {
  purchaseId: string;
  productName: string;
  imageUrl: string | null;
  icone: string | null;
  giftMessage?: string | null;
  verseReference?: string | null;
  verseTextFallback?: string | null;
  raridade?: string | null;
  senderName?: string | null;
  /** true só no instante da primeira abertura (selo + raio de luz + confete extra se comemorativo) */
  isNewlyOpened?: boolean;
  /** UI de "agradecer" já existente no chamador (lógica não duplicada aqui) */
  thankSlot?: React.ReactNode;
}

const GiftPremiumExperience = ({
  purchaseId,
  productName,
  imageUrl,
  icone,
  giftMessage,
  verseReference,
  verseTextFallback,
  raridade,
  senderName,
  isNewlyOpened,
  thankSlot,
}: GiftPremiumExperienceProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const reduced = useReducedMotion();
  const style = rarityStyle(raridade);
  const theme = giftThemeFor(productName);
  const celebratory = isCelebratory(productName);

  const [verse, setVerse] = useState<FetchedVerse | null>(null);
  const [verseLoading, setVerseLoading] = useState(true);
  const [typedMessage, setTypedMessage] = useState("");
  const [messageDone, setMessageDone] = useState(!giftMessage || reduced);
  const [showClosing, setShowClosing] = useState(false);
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({});
  const [myReaction, setMyReaction] = useState<string | null>(null);
  const [favorited, setFavorited] = useState(false);
  const [ambientOn, setAmbientOn] = useState(false);
  const typeTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Versículo: sempre buscado da Bíblia real (bible_books/bible_verses)
  useEffect(() => {
    let cancelled = false;
    setVerseLoading(true);
    fetchGiftVerse(verseReference, verseTextFallback).then((v) => {
      if (!cancelled) {
        setVerse(v);
        setVerseLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [verseReference, verseTextFallback]);

  // Typewriter na mensagem do presente
  useEffect(() => {
    if (!giftMessage || reduced) {
      setTypedMessage(giftMessage || "");
      setMessageDone(true);
      return;
    }
    setTypedMessage("");
    setMessageDone(false);
    let i = 0;
    typeTimer.current = setInterval(() => {
      i += 1;
      setTypedMessage(giftMessage.slice(0, i));
      if (i >= giftMessage.length) {
        if (typeTimer.current) clearInterval(typeTimer.current);
        setMessageDone(true);
      }
    }, 38);
    return () => {
      if (typeTimer.current) clearInterval(typeTimer.current);
    };
  }, [giftMessage, reduced]);

  // Mensagem temática de fechamento — revela depois que o versículo carrega
  useEffect(() => {
    if (verseLoading) return;
    const t = setTimeout(() => setShowClosing(true), reduced ? 100 : 900);
    return () => clearTimeout(t);
  }, [verseLoading, reduced]);

  // Reações: carrega + assina atualização em tempo real
  useEffect(() => {
    let cancelled = false;
    const loadReactions = async () => {
      const { data } = await sb.from("gift_reactions").select("user_id, reaction").eq("purchase_id", purchaseId);
      if (cancelled || !data) return;
      const counts: Record<string, number> = {};
      let mine: string | null = null;
      (data as { user_id: string; reaction: string }[]).forEach((r) => {
        counts[r.reaction] = (counts[r.reaction] || 0) + 1;
        if (r.user_id === user?.id) mine = r.reaction;
      });
      setReactionCounts(counts);
      setMyReaction(mine);
    };
    loadReactions();

    const channel = supabase
      .channel(`gift-reactions-${purchaseId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "gift_reactions", filter: `purchase_id=eq.${purchaseId}` }, loadReactions)
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [purchaseId, user?.id]);

  // Favorito
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    sb.from("gift_favorites")
      .select("id")
      .eq("purchase_id", purchaseId)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }: { data: { id: string } | null }) => {
        if (!cancelled) setFavorited(!!data);
      });
    return () => {
      cancelled = true;
    };
  }, [purchaseId, user]);

  // Áudio ambiente nunca sobrevive ao fechar o modal
  useEffect(() => () => stopGiftAmbient(), []);

  const toggleReaction = async (key: string) => {
    if (!user) return;
    const next = myReaction === key ? null : key;
    setMyReaction(next);
    if (next) {
      await sb.from("gift_reactions").upsert({ purchase_id: purchaseId, user_id: user.id, reaction: next }, { onConflict: "purchase_id,user_id" });
    } else {
      await sb.from("gift_reactions").delete().eq("purchase_id", purchaseId).eq("user_id", user.id);
    }
  };

  const toggleFavorite = async () => {
    if (!user) return;
    setFavorited((f) => !f);
    if (!favorited) {
      await sb.from("gift_favorites").insert({ purchase_id: purchaseId, user_id: user.id });
      toast({ title: "⭐ Guardado nos seus favoritos" });
    } else {
      await sb.from("gift_favorites").delete().eq("purchase_id", purchaseId).eq("user_id", user.id);
    }
  };

  const toggleAmbient = () => {
    if (ambientOn) {
      stopGiftAmbient();
      setAmbientOn(false);
    } else {
      startGiftAmbient();
      setAmbientOn(true);
    }
  };

  const share = async () => {
    const text = `🎁 ${productName}${giftMessage ? `\n"${giftMessage}"` : ""}${verse ? `\n\n📖 "${verse.text}" — ${verse.reference}` : ""}\n\nRecebi na Aliança Kingdom ✨`;
    if (navigator.share) {
      try {
        await navigator.share({ title: productName, text });
        return;
      } catch {
        // usuário cancelou ou sem permissão — cai no WhatsApp
      }
    }
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  const particleEmoji = PARTICLE_EMOJI[theme.particle];

  return (
    <div
      className="relative overflow-hidden rounded-lg"
      style={{ background: "radial-gradient(circle at 50% 20%, rgba(255,255,255,0.06), transparent 55%), linear-gradient(165deg, #14101f 0%, #1c1530 55%, #0f0b18 100%)" }}
    >
      {/* Partículas sutis de fundo */}
      {!reduced && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
          {theme.particle === "light-rays"
            ? [...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute top-0 h-full w-8 opacity-0"
                  style={{
                    left: `${10 + i * 20}%`,
                    background: `linear-gradient(180deg, transparent, ${style.glow}, transparent)`,
                    filter: "blur(6px)",
                  }}
                  animate={{ opacity: [0, 0.5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, delay: i * 0.8, ease: "easeInOut" }}
                />
              ))
            : [...Array(10)].map((_, i) => (
                <motion.span
                  key={i}
                  className="absolute text-sm opacity-70"
                  style={{ left: `${6 + ((i * 41) % 88)}%` }}
                  initial={{ y: "108%", opacity: 0 }}
                  animate={{ y: "-8%", opacity: [0, 0.8, 0] }}
                  transition={{ duration: 7 + (i % 5), repeat: Infinity, delay: i * 0.7, ease: "linear" }}
                >
                  {particleEmoji}
                </motion.span>
              ))}
        </div>
      )}

      <div className="relative flex flex-col items-center text-center px-6 py-8">
        {/* Selo de carinho + raio de luz — só na abertura */}
        <AnimatePresence>
          {isNewlyOpened && (
            <>
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-[11px] tracking-wide text-amber-200/90 mb-3 flex items-center gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Este presente foi enviado com carinho para fortalecer sua caminhada com Cristo.
              </motion.p>
              {!reduced && (
                <motion.div
                  className="absolute left-1/2 top-0 w-24 -translate-x-1/2 pointer-events-none"
                  style={{ height: "40%", background: "linear-gradient(180deg, rgba(255,255,255,0.5), transparent)", filter: "blur(4px)" }}
                  initial={{ opacity: 0, scaleY: 0 }}
                  animate={{ opacity: [0, 0.8, 0], scaleY: [0, 1, 1] }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  aria-hidden
                />
              )}
            </>
          )}
        </AnimatePresence>

        {/* Moldura + arte + glow por raridade */}
        <motion.div
          className="relative mt-1"
          initial={reduced ? false : { scale: 1.15, opacity: 0 }}
          animate={{ scale: 1, opacity: 1, y: reduced ? 0 : [0, -3, 0] }}
          transition={{
            scale: { duration: 0.6, ease: "easeOut" },
            opacity: { duration: 0.6 },
            y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.6 },
          }}
        >
          <div
            className="relative rounded-2xl p-[3px] overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${style.rim[0]}, ${style.rim[1]})`,
              boxShadow: `0 0 24px ${style.glow}, 0 0 60px ${style.glow}`,
            }}
          >
            {/* cantos ornamentados */}
            {["-top-1 -left-1", "-top-1 -right-1", "-bottom-1 -left-1", "-bottom-1 -right-1"].map((pos) => (
              <span key={pos} className={`absolute ${pos} text-[10px] z-10`} style={{ color: style.rim[0] }} aria-hidden>
                ✦
              </span>
            ))}

            <div className="relative rounded-xl overflow-hidden bg-black/20 p-2">
              {imageUrl ? (
                <img src={imageUrl} alt={productName} className="h-40 w-40 sm:h-48 sm:w-48 object-contain" />
              ) : (
                <div className="h-40 w-40 sm:h-48 sm:w-48 flex items-center justify-center text-7xl">{icone || "🎁"}</div>
              )}

              {/* shine — reflexo de vidro cruzando a cada 6s */}
              {!reduced && (
                <motion.div
                  className="absolute inset-y-0 w-1/3 pointer-events-none"
                  style={{ background: "linear-gradient(105deg, transparent, rgba(255,255,255,0.35), transparent)" }}
                  initial={{ x: "-140%" }}
                  animate={{ x: "260%" }}
                  transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 4.4, ease: "easeInOut" }}
                />
              )}

              {style.holographic && !reduced && (
                <motion.div
                  className="absolute inset-0 pointer-events-none mix-blend-overlay"
                  style={{ background: "conic-gradient(from 0deg, transparent 0%, rgba(255,255,255,0.6) 6%, transparent 14%, transparent 100%)" }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                />
              )}
            </div>
          </div>
        </motion.div>

        {/* Nome, categoria, status */}
        <h2
          className="mt-4 text-2xl font-bold text-white"
          style={{ textShadow: `0 0 18px ${style.glow}` }}
        >
          {productName}
        </h2>
        <p className="text-xs text-amber-200/70 mt-1">🎁 Presente Cristão · {style.label}</p>
        <p className="text-xs text-white/50 mt-0.5">
          {senderName ? `Presente recebido de ${senderName}` : "Presente recebido"}
        </p>

        {/* Mensagem com typewriter */}
        {giftMessage && (
          <motion.p
            className="mt-4 text-sm italic text-white/90 max-w-sm min-h-[1.5em]"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            "{typedMessage}
            {!messageDone && <span className="animate-pulse">▍</span>}"
          </motion.p>
        )}

        {/* Versículo — sempre buscado da Bíblia real */}
        {!verseLoading && verse && (
          <motion.div
            className="mt-4 max-w-sm"
            initial={reduced ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: messageDone ? 0.2 : 0, duration: 0.5 }}
          >
            <p className="text-[11px] tracking-widest uppercase text-amber-200/80 mb-1.5">📖 Palavra de Deus</p>
            <p className="text-sm italic text-white/90 leading-relaxed font-serif">
              {verse.text.split(" ").map((word, i) => (
                <motion.span
                  key={i}
                  initial={reduced ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: reduced ? 0 : i * 0.04, duration: 0.3 }}
                  className="inline-block mr-1"
                >
                  {word}
                </motion.span>
              ))}
            </p>
            <p className="text-xs font-semibold text-amber-300 mt-1.5">— {verse.reference}</p>
          </motion.div>
        )}

        {/* Mensagem temática de fechamento */}
        <AnimatePresence>
          {showClosing && (
            <motion.p
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mt-3 text-xs text-emerald-200/80 italic max-w-xs"
            >
              {theme.closingMessage}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Reações */}
        <div className="flex items-center gap-2 mt-5">
          {REACTIONS.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => toggleReaction(r.key)}
              className={`flex flex-col items-center gap-0.5 rounded-xl px-2.5 py-1.5 text-xs transition-all duration-200 ${
                myReaction === r.key ? "bg-amber-400/20 ring-1 ring-amber-400/60" : "bg-white/5 hover:bg-white/10"
              }`}
              title={r.label}
            >
              <span className="text-base">{r.emoji}</span>
              {reactionCounts[r.key] > 0 && <span className="text-white/60">{reactionCounts[r.key]}</span>}
            </button>
          ))}
        </div>

        {/* Ações */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
          <Button size="sm" variant="outline" className="gap-1.5 bg-white/5 border-white/15 text-white hover:bg-white/15 hover:text-white" onClick={share}>
            <Share2 className="h-3.5 w-3.5" /> Compartilhar
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5 bg-white/5 border-white/15 text-white hover:bg-white/15 hover:text-white" onClick={toggleFavorite}>
            {favorited ? <BookmarkCheck className="h-3.5 w-3.5 text-amber-300" /> : <Bookmark className="h-3.5 w-3.5" />}
            {favorited ? "Favoritado" : "Favoritar"}
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5 bg-white/5 border-white/15 text-white hover:bg-white/15 hover:text-white" onClick={toggleAmbient}>
            {ambientOn ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            {ambientOn ? "Silenciar" : "Ouvir ambiente"}
          </Button>
        </div>

        {/* Agradecer — lógica do chamador, só o slot visual aqui */}
        {thankSlot && <div className="mt-5 w-full">{thankSlot}</div>}
      </div>

      {/* Confete extra — só presentes comemorativos, só na abertura */}
      {isNewlyOpened && celebratory && !reduced && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          {[...Array(16)].map((_, i) => (
            <motion.span
              key={i}
              className="absolute text-lg"
              style={{ left: `${50}%`, top: `${30}%` }}
              initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
              animate={{
                x: (Math.random() - 0.5) * 260,
                y: (Math.random() - 0.5) * 220,
                scale: [0, 1, 0],
                rotate: Math.random() * 360,
              }}
              transition={{ duration: 1.3, delay: i * 0.03, ease: "easeOut" }}
            >
              {["🎉", "✨", "💛"][i % 3]}
            </motion.span>
          ))}
        </div>
      )}
    </div>
  );
};

export default GiftPremiumExperience;
