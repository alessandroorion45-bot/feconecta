import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import SEO from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { playUnlockChime } from "@/lib/badgeSound";
import GiftPremiumExperience from "@/components/gifts/GiftPremiumExperience";
import { Gift, Inbox, Send, ShoppingBag, HandHeart, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const sb = supabase as any;

interface GiftRecord {
  id: string;
  gift_message: string | null;
  opened_at: string | null;
  thanked_at: string | null;
  created_at: string;
  buyer_id: string | null;
  gift_to: string | null;
  store_products: {
    nome: string;
    icone: string | null;
    image_url: string | null;
    descricao: string | null;
    verse_reference: string | null;
    verse_text: string | null;
    raridade: string | null;
  } | null;
  sender_name?: string;
  receiver_name?: string;
}

const THANK_PRESETS = [
  "Muito obrigado!",
  "Deus lhe abençoe!",
  "O Senhor recompense sua generosidade!",
  "Que Cristo fortaleça sua caminhada!",
];

const GiftArt = ({ gift, size = "text-6xl" }: { gift: GiftRecord; size?: string }) => {
  const p = gift.store_products;
  if (p?.image_url) {
    return (
      <img
        src={p.image_url}
        alt={p.nome}
        loading="lazy"
        className="h-28 w-28 object-contain rounded-2xl transition-transform duration-300 drop-shadow-[0_0_16px_rgba(217,180,80,0.45)] hover:scale-105"
      />
    );
  }
  return <span className={size}>{p?.icone || "🎁"}</span>;
};

const GiftsKingdom = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [received, setReceived] = useState<GiftRecord[]>([]);
  const [sent, setSent] = useState<GiftRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // fluxo de abertura
  const [opening, setOpening] = useState<GiftRecord | null>(null);
  const [boxOpened, setBoxOpened] = useState(false);
  const [wasAlreadyOpen, setWasAlreadyOpen] = useState(false);
  const [thanking, setThanking] = useState(false);
  const [customThanks, setCustomThanks] = useState("");

  const loadGifts = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const [{ data: rec }, { data: env }] = await Promise.all([
      sb.from("store_purchases")
        .select("id, gift_message, opened_at, thanked_at, created_at, buyer_id, gift_to, store_products(nome, icone, image_url, descricao, verse_reference, verse_text, raridade)")
        .eq("gift_to", user.id)
        .eq("status", "approved")
        .order("created_at", { ascending: false }),
      sb.from("store_purchases")
        .select("id, gift_message, opened_at, thanked_at, created_at, buyer_id, gift_to, store_products(nome, icone, image_url, descricao, verse_reference, verse_text, raridade)")
        .eq("buyer_id", user.id)
        .not("gift_to", "is", null)
        .eq("status", "approved")
        .order("created_at", { ascending: false }),
    ]);

    // nomes de quem enviou/recebeu
    const ids = new Set<string>();
    (rec || []).forEach((g: GiftRecord) => g.buyer_id && ids.add(g.buyer_id));
    (env || []).forEach((g: GiftRecord) => g.gift_to && ids.add(g.gift_to));
    let names = new Map<string, string>();
    if (ids.size > 0) {
      const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", [...ids]);
      names = new Map((profiles || []).map((p) => [p.id, p.full_name || "Alguém"]));
    }

    setReceived((rec || []).map((g: GiftRecord) => ({ ...g, sender_name: g.buyer_id ? names.get(g.buyer_id) || "Alguém" : "Alguém" })));
    setSent((env || []).map((g: GiftRecord) => ({ ...g, receiver_name: g.gift_to ? names.get(g.gift_to) || "Alguém" : "Alguém" })));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadGifts();
  }, [loadGifts]);

  const startOpen = (gift: GiftRecord) => {
    setOpening(gift);
    setWasAlreadyOpen(!!gift.opened_at);
    setBoxOpened(false);
    setThanking(false);
    setCustomThanks("");
  };

  /** Revisitar um presente já aberto — mesma experiência premium, sem repetir o ritual da caixa */
  const viewAgain = (gift: GiftRecord) => {
    setOpening(gift);
    setWasAlreadyOpen(true);
    setBoxOpened(true);
    setThanking(false);
    setCustomThanks("");
  };

  const revealGift = async () => {
    if (!opening) return;
    setBoxOpened(true);
    playUnlockChime();
    if (!opening.opened_at) {
      await sb.from("store_purchases").update({ opened_at: new Date().toISOString() }).eq("id", opening.id);
      loadGifts();
    }
  };

  const sendThanks = async (message: string) => {
    if (!opening || !user || !opening.buyer_id) return;
    setThanking(true);
    const [{ error: updateError }, { error: notifyError }] = await Promise.all([
      sb.from("store_purchases").update({ thank_message: message, thanked_at: new Date().toISOString() }).eq("id", opening.id),
      supabase.from("notifications").insert({
        user_id: opening.buyer_id,
        actor_id: user.id,
        type: "gift_thanks",
        content: `🙏 agradeceu pelo presente "${opening.store_products?.nome}": "${message}"`,
        reference_id: opening.id,
      }),
    ]);
    setThanking(false);
    if (updateError || notifyError) {
      toast({ title: "Erro ao agradecer", description: (updateError || notifyError)?.message, variant: "destructive" });
      return;
    }
    toast({ title: "🙏 Agradecimento enviado!" });
    setOpening(null);
    loadGifts();
  };

  const unopenedCount = received.filter((g) => !g.opened_at).length;

  return (
    <div className="min-h-screen bg-background">
      <SEO path="/presentes" title="Presentes Kingdom" description="Envie e receba presentes digitais de carinho e incentivo entre irmãos na fé." noindex />
      <Header />

      <main className="container max-w-4xl mx-auto py-6 px-4 pb-16">
        <div className="text-center pt-4 pb-8">
          <div className="inline-flex items-center justify-center p-4 bg-gradient-divine rounded-full mb-4 shadow-glow">
            <Gift className="h-9 w-9 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-divine bg-clip-text text-transparent leading-tight pb-1">
            Presentes Kingdom
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto mt-3">
            Gestos de carinho, gratidão e incentivo entre irmãos na fé.
          </p>
          <Link to="/loja">
            <Button className="mt-4 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-white hover:opacity-90">
              <ShoppingBag className="h-4 w-4 mr-2" /> Enviar um presente
            </Button>
          </Link>
        </div>

        {!user ? (
          <p className="text-center text-muted-foreground py-10">Faça login para ver seus presentes.</p>
        ) : loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="recebidos">
            <TabsList className="grid w-full grid-cols-2 max-w-sm mx-auto">
              <TabsTrigger value="recebidos" className="gap-1.5">
                <Inbox className="h-4 w-4" /> Recebidos {unopenedCount > 0 && <span className="ml-1 rounded-full bg-amber-500 text-white text-[10px] px-1.5">{unopenedCount}</span>}
              </TabsTrigger>
              <TabsTrigger value="enviados" className="gap-1.5">
                <Send className="h-4 w-4" /> Enviados
              </TabsTrigger>
            </TabsList>

            <TabsContent value="recebidos" className="mt-6">
              {received.length === 0 ? (
                <p className="text-center text-muted-foreground py-10">Você ainda não recebeu presentes.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {received.map((gift) => (
                    <Card key={gift.id} className="overflow-hidden hover:shadow-lg transition-all">
                      <CardContent className="p-5 text-center flex flex-col items-center">
                        {gift.opened_at ? (
                          <button type="button" className="w-full flex flex-col items-center text-center focus:outline-none" onClick={() => viewAgain(gift)}>
                            <GiftArt gift={gift} />
                            <h3 className="font-bold mt-2">{gift.store_products?.nome}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">de {gift.sender_name}</p>
                            {gift.gift_message && (
                              <p className="text-xs italic text-muted-foreground mt-2 line-clamp-2">"{gift.gift_message}"</p>
                            )}
                            <p className="text-[10px] text-muted-foreground mt-2">
                              {formatDistanceToNow(new Date(gift.created_at), { addSuffix: true, locale: ptBR })}
                            </p>
                            <span className="mt-2 text-xs font-medium text-amber-600 dark:text-amber-400">
                              {gift.thanked_at ? "Ver presente" : "🙏 Ver e agradecer"}
                            </span>
                          </button>
                        ) : (
                          <>
                            <motion.div
                              animate={{ rotate: [0, -4, 4, -4, 0], scale: [1, 1.04, 1] }}
                              transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 1.2 }}
                              className="text-6xl"
                            >
                              🎁
                            </motion.div>
                            <h3 className="font-bold mt-2">Você recebeu um presente!</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">{gift.sender_name} enviou algo pra você</p>
                            <Button
                              size="sm"
                              className="mt-3 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-white hover:opacity-90"
                              onClick={() => startOpen(gift)}
                            >
                              <Gift className="h-4 w-4 mr-1.5" /> Abrir presente
                            </Button>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="enviados" className="mt-6">
              {sent.length === 0 ? (
                <p className="text-center text-muted-foreground py-10">Você ainda não enviou presentes.</p>
              ) : (
                <div className="space-y-3">
                  {sent.map((gift) => (
                    <Card key={gift.id}>
                      <CardContent className="p-4 flex items-center gap-4">
                        <GiftArt gift={gift} size="text-4xl" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">{gift.store_products?.nome}</p>
                          <p className="text-xs text-muted-foreground">para {gift.receiver_name} · {formatDistanceToNow(new Date(gift.created_at), { addSuffix: true, locale: ptBR })}</p>
                          {gift.thank_message && (
                            <p className="text-xs italic text-emerald-600 dark:text-emerald-400 mt-1">🙏 "{gift.thank_message}"</p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {gift.opened_at ? "Aberto ✓" : "Ainda não aberto"}
                        </span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>

      {/* Abertura do presente */}
      <Dialog open={!!opening} onOpenChange={(open) => !open && setOpening(null)}>
        <DialogContent
          className={
            boxOpened
              ? "sm:max-w-md text-center overflow-hidden p-0 border-none bg-transparent [&>button]:text-white/80 [&>button:hover]:text-white"
              : "sm:max-w-md text-center overflow-hidden"
          }
        >
          {opening && !boxOpened && (
            <div className="py-8">
              <motion.div
                className="text-8xl inline-block cursor-pointer"
                animate={{ rotate: [0, -5, 5, -5, 0], scale: [1, 1.06, 1] }}
                transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 0.8 }}
                onClick={revealGift}
              >
                🎁
              </motion.div>
              <p className="mt-4 text-sm text-muted-foreground">
                {opening.sender_name} enviou um presente pra você
              </p>
              <Button
                className="mt-5 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-white hover:opacity-90"
                onClick={revealGift}
              >
                <Gift className="h-4 w-4 mr-1.5" /> Abrir
              </Button>
            </div>
          )}

          {opening && boxOpened && (
            <div className="relative">
              {/* explosão de luz dourada — só numa abertura de verdade, não ao revisitar */}
              {!wasAlreadyOpen && (
                <AnimatePresence>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center">
                    {[...Array(24)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute text-2xl"
                        initial={{ x: 0, y: 0, scale: 0 }}
                        animate={{
                          x: (Math.random() - 0.5) * 440,
                          y: (Math.random() - 0.5) * 440,
                          scale: [0, 1, 0],
                          rotate: Math.random() * 360,
                        }}
                        transition={{ duration: 1.6, delay: i * 0.03, ease: "easeOut" }}
                      >
                        {["✨", "🎉", "💛", "🌟"][i % 4]}
                      </motion.div>
                    ))}
                  </motion.div>
                </AnimatePresence>
              )}

              <GiftPremiumExperience
                purchaseId={opening.id}
                productName={opening.store_products?.nome || "Presente"}
                imageUrl={opening.store_products?.image_url || null}
                icone={opening.store_products?.icone || null}
                giftMessage={opening.gift_message}
                verseReference={opening.store_products?.verse_reference}
                verseTextFallback={opening.store_products?.verse_text}
                raridade={opening.store_products?.raridade}
                senderName={opening.sender_name}
                isNewlyOpened={!wasAlreadyOpen}
                thankSlot={
                  !opening.thanked_at ? (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-white/70">🙏 Agradecer:</p>
                      <div className="flex flex-wrap gap-1.5 justify-center">
                        {THANK_PRESETS.map((preset) => (
                          <Button
                            key={preset}
                            variant="outline"
                            size="sm"
                            className="text-xs bg-white/5 border-white/15 text-white hover:bg-white/15 hover:text-white"
                            disabled={thanking}
                            onClick={() => sendThanks(preset)}
                          >
                            {preset}
                          </Button>
                        ))}
                      </div>
                      <div className="flex gap-2 pt-1">
                        <Input
                          placeholder="Ou escreva sua mensagem..."
                          value={customThanks}
                          onChange={(e) => setCustomThanks(e.target.value)}
                          maxLength={200}
                          className="text-sm bg-white/5 border-white/15 text-white placeholder:text-white/40"
                        />
                        <Button size="sm" disabled={!customThanks.trim() || thanking} onClick={() => sendThanks(customThanks.trim())}>
                          {thanking ? <Loader2 className="h-4 w-4 animate-spin" /> : <HandHeart className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  ) : undefined
                }
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GiftsKingdom;
