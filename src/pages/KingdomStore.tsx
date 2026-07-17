import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { initMercadoPago, Payment } from "@mercadopago/sdk-react";
import Header from "@/components/Header";
import SEO from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import KingdomBadge from "@/components/kingdom-badges/KingdomBadge";
import { BACKGROUND_STYLES, EFFECT_STYLES } from "@/lib/cosmetics";
import AnimatedCosmeticFrame from "@/components/AnimatedCosmeticFrame";
import { playUnlockChime } from "@/lib/badgeSound";
import {
  ShoppingBag, Heart, Gift, Search, ArrowLeft, Clock, Copy, Check, PartyPopper, Sparkles, Loader2, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

let mpInitialized = false;
function ensureMercadoPagoInitialized() {
  if (mpInitialized) return;
  const publicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;
  if (!publicKey) return;
  initMercadoPago(publicKey, { locale: "pt-BR" });
  mpInitialized = true;
}

interface StoreProduct {
  id: string;
  nome: string;
  slug: string;
  descricao: string | null;
  mensagem: string | null;
  verse_reference: string | null;
  verse_text: string | null;
  tipo: "selo" | "moldura" | "fundo" | "efeito" | "outro";
  badge_id: string | null;
  cosmetic_key: string | null;
  image_url: string | null;
  preco: number;
  aura: string | null;
  categoria: string;
  giftable: boolean;
  limitado: boolean;
  estoque: number | null;
  badges?: { image_url: string | null; icon: string; rarity: string } | null;
}

interface StoreCategory {
  nome: string;
  icone: string | null;
}

interface UserSearchResult {
  id: string;
  full_name: string;
  email: string;
}

type PurchaseStep = "config" | "payment" | "qr" | "done";

const POLL_INTERVAL_MS = 3000;
const POLL_MAX_ATTEMPTS = 100;

const formatBRL = (v: number) => `R$ ${Number(v).toFixed(2).replace(".", ",")}`;

/** Pré-visualização de um cosmético (moldura/fundo/efeito) sem asset externo */
const CosmeticPreview = ({ product }: { product: StoreProduct }) => {
  if (product.image_url) {
    return <img src={product.image_url} alt="" loading="lazy" className="h-24 w-24 rounded-full object-cover" />;
  }
  if (product.tipo === "moldura" && product.cosmetic_key) {
    return (
      <AnimatedCosmeticFrame cosmeticKey={product.cosmetic_key}>
        <div className="h-32 w-24 bg-gradient-to-b from-muted to-muted/60 flex flex-col items-center justify-center gap-1">
          <span className="text-3xl">🙂</span>
          <span className="text-[9px] text-muted-foreground">seu avatar</span>
        </div>
      </AnimatedCosmeticFrame>
    );
  }
  if (product.tipo === "fundo" && product.cosmetic_key) {
    return <div className="h-24 w-24 rounded-xl border" style={{ background: BACKGROUND_STYLES[product.cosmetic_key] }} />;
  }
  if (product.tipo === "efeito" && product.cosmetic_key) {
    const fx = EFFECT_STYLES[product.cosmetic_key];
    return (
      <div className="relative h-24 w-24 rounded-xl bg-muted/60 border overflow-hidden flex items-center justify-center">
        {[...Array(fx?.count || 5)].map((_, i) => (
          <motion.span
            key={i}
            className="absolute text-sm"
            initial={{ y: 90, x: 8 + i * 12, opacity: 0 }}
            animate={{ y: -10, opacity: [0, 1, 0] }}
            transition={{ duration: 2.4 + (i % 3), repeat: Infinity, delay: i * 0.4, ease: "linear" }}
          >
            {fx?.emoji}
          </motion.span>
        ))}
        <span className="text-xs text-muted-foreground">seu perfil</span>
      </div>
    );
  }
  return <div className="h-24 w-24 rounded-xl bg-muted" />;
};

const KingdomStore = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [ownedCosmetics, setOwnedCosmetics] = useState<{ cosmetic_key: string; tipo: string; equipped: boolean }[]>([]);
  const [ownedBadgeIds, setOwnedBadgeIds] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<{ mensal: number; ativa: boolean; progresso: number } | null>(null);

  // fluxo de compra
  const [buying, setBuying] = useState<StoreProduct | null>(null);
  const [step, setStep] = useState<PurchaseStep>("config");
  const [isGift, setIsGift] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState<UserSearchResult[]>([]);
  const [giftTo, setGiftTo] = useState<UserSearchResult | null>(null);
  const [giftMessage, setGiftMessage] = useState("");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
  const [purchaseId, setPurchaseId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    ensureMercadoPagoInitialized();
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [{ data: prods }, { data: cats }, { data: settings }, { data: progresso }] = await Promise.all([
      supabase.from("store_products").select("*, badges(image_url, icon, rarity)").eq("status", "active").order("ordem", { ascending: true }),
      supabase.from("store_categories").select("nome, icone").order("ordem", { ascending: true }),
      supabase.from("store_settings").select("meta_mensal, meta_ativa").eq("id", 1).maybeSingle(),
      supabase.rpc("get_store_monthly_progress"),
    ]);
    setProducts((prods || []) as StoreProduct[]);
    setCategories(cats || []);
    if (settings) setMeta({ mensal: Number(settings.meta_mensal), ativa: settings.meta_ativa, progresso: Number(progresso || 0) });

    if (user) {
      const [{ data: cosmetics }, { data: userBadges }] = await Promise.all([
        supabase.from("user_cosmetics").select("cosmetic_key, tipo, equipped").eq("user_id", user.id),
        supabase.from("user_badges").select("badge_id").eq("user_id", user.id),
      ]);
      setOwnedCosmetics(cosmetics || []);
      setOwnedBadgeIds(new Set((userBadges || []).map((b: { badge_id: string }) => b.badge_id)));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // polling do PIX
  useEffect(() => {
    if (step !== "qr" || !purchaseId) return;
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts += 1;
      if (attempts > POLL_MAX_ATTEMPTS) {
        clearInterval(interval);
        return;
      }
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-purchase-status?id=${purchaseId}`,
          { headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } },
        );
        if (!response.ok) return;
        const data = await response.json();
        if (data.status === "approved") {
          clearInterval(interval);
          setStep("done");
          playUnlockChime();
          loadAll();
        } else if (data.status === "rejected" || data.status === "cancelled") {
          clearInterval(interval);
          toast({ title: "Pagamento não aprovado", description: "Nenhum valor foi cobrado.", variant: "destructive" });
          setBuying(null);
        }
      } catch {
        // tenta de novo no próximo ciclo
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [step, purchaseId, toast, loadAll]);

  const openBuy = (product: StoreProduct, gift: boolean) => {
    if (!user) {
      toast({ title: "Faça login para comprar", description: "A Kingdom Store é para membros da comunidade." });
      return;
    }
    setBuying(product);
    setIsGift(gift);
    setGiftTo(null);
    setGiftMessage("");
    setUserSearch("");
    setUserResults([]);
    setStep(gift ? "config" : "payment");
  };

  const closeBuy = () => {
    setBuying(null);
    setStep("config");
    setQrCode(null);
    setQrCodeBase64(null);
    setPurchaseId(null);
    setCopied(false);
  };

  const searchUsers = async (query: string) => {
    if (!query || query.length < 2) {
      setUserResults([]);
      return;
    }
    const { data } = await supabase
      .from("users")
      .select("id, email, full_name")
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
      .neq("id", user?.id || "")
      .limit(8);
    setUserResults((data || []).map((u) => ({ id: u.id, full_name: u.full_name || "Sem nome", email: u.email || "" })));
  };

  const handleBrickSubmit = async ({ formData }: { formData: any }) => {
    if (!buying || submittingRef.current) return;
    submittingRef.current = true;
    try {
      const deviceId = (window as any).MP_DEVICE_SESSION_ID;
      const { data, error } = await supabase.functions.invoke("process-store-purchase", {
        body: {
          productId: buying.id,
          giftToUserId: isGift ? giftTo?.id : null,
          giftMessage: isGift ? giftMessage : null,
          formData,
          deviceId,
        },
      });

      if (error || data?.error) {
        let message = data?.error;
        if (!message && error && "context" in error) {
          try {
            message = (await (error as any).context.json())?.error;
          } catch { /* corpo não-JSON */ }
        }
        toast({ title: "Não foi possível processar", description: message || "Tente novamente.", variant: "destructive" });
        throw new Error(message || "Falha na compra");
      }

      setPurchaseId(data.purchaseId);
      setQrCode(data.qrCode);
      setQrCodeBase64(data.qrCodeBase64);
      setStep("qr");
    } finally {
      submittingRef.current = false;
    }
  };

  const copyPix = async () => {
    if (!qrCode) return;
    await navigator.clipboard.writeText(qrCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const equipCosmetic = async (cosmeticKey: string, tipo: string) => {
    if (!user) return;
    await supabase.from("user_cosmetics").update({ equipped: false }).eq("user_id", user.id).eq("tipo", tipo);
    const { error } = await supabase.from("user_cosmetics").update({ equipped: true }).eq("user_id", user.id).eq("cosmetic_key", cosmeticKey);
    if (error) {
      toast({ title: "Erro ao equipar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "✨ Equipado!", description: "Já está visível no seu perfil." });
    loadAll();
  };

  const unequipCosmetic = async (cosmeticKey: string) => {
    if (!user) return;
    await supabase.from("user_cosmetics").update({ equipped: false }).eq("user_id", user.id).eq("cosmetic_key", cosmeticKey);
    loadAll();
  };

  const ownsProduct = (product: StoreProduct): boolean => {
    if (product.tipo === "selo" && product.badge_id) return ownedBadgeIds.has(product.badge_id);
    if (product.cosmetic_key) return ownedCosmetics.some((c) => c.cosmetic_key === product.cosmetic_key);
    return false;
  };

  const isEquipped = (product: StoreProduct): boolean =>
    !!product.cosmetic_key && ownedCosmetics.some((c) => c.cosmetic_key === product.cosmetic_key && c.equipped);

  const filtered = selectedCategory === "all" ? products : products.filter((p) => p.categoria === selectedCategory);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        path="/loja"
        title="Kingdom Store"
        description="Apoie o Aliança Kingdom com selos de apoiador, presentes e personalizações de perfil. Todo o conteúdo bíblico continua gratuito."
      />
      <Header />

      <main className="container max-w-6xl mx-auto py-6 px-4 pb-16">
        {/* Hero */}
        <div className="text-center pt-4 pb-8">
          <div className="inline-flex items-center justify-center p-4 bg-gradient-divine rounded-full mb-4 shadow-glow">
            <ShoppingBag className="h-9 w-9 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-divine bg-clip-text text-transparent leading-tight pb-1">
            Kingdom Store
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto mt-3 leading-relaxed">
            ❤️ <strong className="text-foreground">Ajude a manter o Aliança Kingdom online.</strong>
            <br />
            O acesso à Palavra de Deus continuará gratuito para todos. Sua contribuição ajuda a manter servidores,
            banco de dados e o desenvolvimento da plataforma.
          </p>
        </div>

        {/* Meta do mês */}
        {meta?.ativa && meta.mensal > 0 && (
          <Card className="mb-8 border-amber-500/30 max-w-xl mx-auto">
            <CardContent className="py-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-semibold flex items-center gap-1.5">
                  <Heart className="h-4 w-4 text-amber-500" /> Meta do mês
                </span>
                <span className="text-muted-foreground">
                  {formatBRL(meta.progresso)} de {formatBRL(meta.mensal)}
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 transition-all"
                  style={{ width: `${Math.min(100, (meta.progresso / meta.mensal) * 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Categorias */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          <Button variant={selectedCategory === "all" ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory("all")}>
            Todos
          </Button>
          {categories.map((c) => (
            <Button
              key={c.nome}
              variant={selectedCategory === c.nome ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(c.nome)}
            >
              {c.icone} {c.nome}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((product) => {
              const owned = ownsProduct(product);
              const equipped = isEquipped(product);
              const soldOut = product.limitado && product.estoque !== null && product.estoque <= 0;

              return (
                <Card key={product.id} className="relative overflow-hidden transition-all hover:shadow-xl hover:scale-[1.015] border-border/70">
                  <CardContent className="p-5 flex flex-col items-center text-center">
                    <div className="mb-4 mt-1">
                      {product.tipo === "selo" ? (
                        <KingdomBadge
                          rarity={product.badges?.rarity || "epic"}
                          imageUrl={product.image_url || product.badges?.image_url}
                          emoji={product.badges?.icon}
                          size="lg"
                        />
                      ) : (
                        <CosmeticPreview product={product} />
                      )}
                    </div>

                    <h3 className="font-bold">{product.nome}</h3>
                    {product.descricao && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.descricao}</p>
                    )}
                    {product.verse_reference && (
                      <p className="text-[11px] italic text-amber-600 dark:text-amber-400 mt-1.5">📖 {product.verse_reference}</p>
                    )}

                    <div className="mt-3 text-lg font-bold text-foreground">{formatBRL(product.preco)}</div>
                    {product.limitado && product.estoque !== null && (
                      <Badge variant="outline" className="mt-1 text-[10px]">
                        {soldOut ? "Esgotado" : `Restam ${product.estoque}`}
                      </Badge>
                    )}

                    <div className="mt-4 flex gap-2 w-full">
                      {owned && product.cosmetic_key ? (
                        equipped ? (
                          <Button variant="default" size="sm" className="flex-1" onClick={() => unequipCosmetic(product.cosmetic_key!)}>
                            <CheckCircle2 className="h-4 w-4 mr-1.5" /> Equipado
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => equipCosmetic(product.cosmetic_key!, product.tipo)}>
                            Equipar
                          </Button>
                        )
                      ) : owned ? (
                        <Button variant="outline" size="sm" className="flex-1" disabled>
                          <CheckCircle2 className="h-4 w-4 mr-1.5 text-emerald-500" /> Na sua coleção
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          disabled={soldOut}
                          className="flex-1 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-white hover:opacity-90"
                          onClick={() => openBuy(product, false)}
                        >
                          <Heart className="h-4 w-4 mr-1.5" /> Apoiar
                        </Button>
                      )}
                      {product.giftable && !soldOut && (
                        <Button variant="outline" size="sm" onClick={() => openBuy(product, true)} title="Presentear alguém">
                          <Gift className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">Nenhum item nessa categoria ainda.</div>
        )}

        <p className="text-center text-xs text-muted-foreground mt-10 max-w-lg mx-auto">
          Todos os itens são cosméticos e colecionáveis — nenhum concede vantagem espiritual ou funcional.
          Todo o conteúdo bíblico da plataforma continua gratuito.
        </p>
      </main>

      {/* Modal de compra */}
      <Dialog open={!!buying} onOpenChange={(open) => !open && closeBuy()}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          {buying && step === "config" && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-amber-500" /> Presentear: {buying.nome}
                </DialogTitle>
                <DialogDescription>Escolha quem vai receber e escreva uma mensagem de carinho.</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Para quem?</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Nome ou e-mail..."
                      className="pl-9"
                      value={userSearch}
                      onChange={(e) => { setUserSearch(e.target.value); searchUsers(e.target.value); }}
                    />
                  </div>
                  {userResults.length > 0 && (
                    <div className="mt-2 border rounded-lg max-h-48 overflow-y-auto">
                      {userResults.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => { setGiftTo(u); setUserResults([]); setUserSearch(u.full_name); }}
                          className="w-full p-2.5 hover:bg-accent text-left flex flex-col transition-colors"
                        >
                          <span className="font-medium text-sm">{u.full_name}</span>
                          <span className="text-xs text-muted-foreground">{u.email}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {giftTo && (
                  <div className="rounded-lg bg-muted/50 p-3 text-sm">
                    🎁 Presente para <strong>{giftTo.full_name}</strong>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium mb-2 block">Mensagem (opcional)</label>
                  <Input
                    placeholder='Ex: "Que Deus continue fortalecendo sua caminhada."'
                    value={giftMessage}
                    onChange={(e) => setGiftMessage(e.target.value)}
                    maxLength={200}
                  />
                </div>

                <Button
                  className="w-full h-11 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-white font-semibold hover:opacity-90"
                  disabled={!giftTo}
                  onClick={() => setStep("payment")}
                >
                  Continuar · {formatBRL(buying.preco)}
                </Button>
              </div>
            </>
          )}

          {buying && step === "payment" && (
            <>
              <DialogHeader>
                {isGift && (
                  <button type="button" onClick={() => setStep("config")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-1 w-fit">
                    <ArrowLeft className="h-3.5 w-3.5" /> Voltar
                  </button>
                )}
                <DialogTitle>
                  {isGift ? `Presente: ${buying.nome}` : buying.nome} · {formatBRL(buying.preco)}
                </DialogTitle>
                <DialogDescription>Pagamento processado com segurança pelo Mercado Pago.</DialogDescription>
              </DialogHeader>

              <Payment
                initialization={{ amount: Number(buying.preco) }}
                customization={{ paymentMethods: { bankTransfer: "all" } }}
                onSubmit={handleBrickSubmit}
                onError={(err) => console.error("[KingdomStore] Payment Brick error:", err)}
              />
            </>
          )}

          {buying && step === "qr" && (
            <div className="text-center py-2">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10">
                <Clock className="h-7 w-7 text-amber-500 animate-pulse" />
              </div>
              <DialogHeader>
                <DialogTitle className="text-center">Escaneie o PIX para concluir</DialogTitle>
                <DialogDescription className="text-center">
                  Assim que o pagamento for confirmado, esta tela atualiza sozinha.
                </DialogDescription>
              </DialogHeader>
              {qrCodeBase64 && (
                <img src={`data:image/png;base64,${qrCodeBase64}`} alt="QR Code PIX" className="mx-auto my-4 h-48 w-48 rounded-lg border border-border" />
              )}
              <Button variant="outline" onClick={copyPix} className="w-full gap-2">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Código copiado!" : "Copiar código PIX"}
              </Button>
            </div>
          )}

          {buying && step === "done" && (
            <div className="relative text-center py-4">
              <AnimatePresence>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center">
                  {[...Array(26)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute text-2xl"
                      initial={{ x: 0, y: 0, scale: 0 }}
                      animate={{
                        x: (Math.random() - 0.5) * 480,
                        y: (Math.random() - 0.5) * 480,
                        scale: [0, 1, 0],
                        rotate: Math.random() * 360,
                      }}
                      transition={{ duration: 1.7, delay: i * 0.035, ease: "easeOut" }}
                    >
                      {["🎉", "✨", "💛", "🙏", "👑", "🌟"][i % 6]}
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>

              <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200 }}>
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                  <PartyPopper className="h-7 w-7 text-emerald-500" />
                </div>
                <DialogHeader>
                  <DialogTitle className="text-center">
                    {isGift ? "Presente enviado! 🎁" : "Muito obrigado! 🎉"}
                  </DialogTitle>
                  <DialogDescription className="text-center">
                    {isGift
                      ? `${giftTo?.full_name} vai receber "${buying.nome}" com a sua mensagem.`
                      : buying.mensagem || "Sua contribuição ajuda a manter esta missão viva."}
                  </DialogDescription>
                </DialogHeader>
                {buying.verse_reference && (
                  <p className="mt-3 text-xs italic text-amber-600 dark:text-amber-400">
                    {buying.verse_text ? `"${buying.verse_text}" — ` : ""}📖 {buying.verse_reference}
                  </p>
                )}
                <Button onClick={closeBuy} className="mt-5 w-full">
                  <Sparkles className="h-4 w-4 mr-1.5" /> Fechar
                </Button>
              </motion.div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KingdomStore;
