import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import KingdomBadge from "@/components/kingdom-badges/KingdomBadge";
import { themeForCategory, drawVerseRef, fetchVerseText, RevealedVerse } from "@/lib/revealVerses";
import { useToast } from "@/hooks/use-toast";
import { ImageIcon, Share2, Download, Loader2, BookOpen, ChevronLeft } from "lucide-react";

const sb = supabase as any;

export interface RevealBadgeData {
  badgeId: string | null;
  name: string;
  category: string;
  rarity: string;
  rarityColors?: { corInicio: string; corFim: string } | null;
  imageUrl?: string | null;
  emoji?: string;
  icon?: React.ReactNode;
}

interface SeloRevelacaoModalProps {
  badge: RevealBadgeData | null;
  onClose: () => void;
  /** Abre o modal clássico de detalhes do selo (info, raridade, estatísticas) */
  onShowDetails?: () => void;
}

type Phase = "ritual" | "reveal" | "image";

/** Duração do ritual de abertura (antecipação antes da palavra emergir) */
const RITUAL_MS = 1400;

/**
 * ✨ Revelação de Versículo — ao clicar no selo, uma pequena liturgia digital:
 * o selo "respira" e brilha, então uma palavra bíblica personalizada emerge.
 * Cada revelação fica guardada no diário de bênçãos do usuário.
 */
const SeloRevelacaoModal = ({ badge, onClose, onShowDetails }: SeloRevelacaoModalProps) => {
  const reduced = useReducedMotion();
  const { toast } = useToast();
  const [phase, setPhase] = useState<Phase>("ritual");
  const [verse, setVerse] = useState<RevealedVerse | null>(null);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [weeklyCount, setWeeklyCount] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  // prévia local instantânea (o storage remoto pode demorar a propagar)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const runId = useRef(0);

  useEffect(() => {
    if (!badge) return;
    const id = ++runId.current;
    setPhase(reduced ? "reveal" : "ritual");
    setVerse(null);
    setWeeklyCount(null);
    setSaved(false);
    setImageUrl(null);
    setPreviewUrl(null);

    (async () => {
      // Quem está revelando (a palavra é pra quem clica, não pro dono do perfil)
      const { data: { user } } = await supabase.auth.getUser();
      let revealedRefs: string[] = [];
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle();
        if (runId.current !== id) return;
        const name = (profile?.full_name || "").trim().split(/\s+/)[0];
        setFirstName(name || null);

        if (badge.badgeId) {
          const { data: prev } = await sb
            .from("user_verse_reveals")
            .select("verse_reference")
            .eq("user_id", user.id)
            .eq("badge_id", badge.badgeId);
          revealedRefs = (prev || []).map((r: { verse_reference: string }) => r.verse_reference);
        }
      }

      const ref = drawVerseRef(themeForCategory(badge.category), revealedRefs);
      const revealed = await fetchVerseText(ref);
      if (runId.current !== id) return;
      setVerse(revealed);

      // Guarda no diário de bênçãos + contador da semana (silencioso se falhar)
      if (user) {
        try {
          await sb.from("user_verse_reveals").insert({
            user_id: user.id,
            badge_id: badge.badgeId,
            verse_reference: revealed.reference,
            verse_text: revealed.text,
          });
          if (runId.current !== id) return;
          setSaved(true);
          const weekStart = new Date();
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          weekStart.setHours(0, 0, 0, 0);
          const { count } = await sb
            .from("user_verse_reveals")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .gte("revealed_at", weekStart.toISOString());
          if (runId.current !== id) return;
          setWeeklyCount(count ?? null);
        } catch {
          // diário indisponível não impede a revelação
        }
      }
    })();

    // O ritual dura o suficiente pra criar antecipação
    if (!reduced) {
      const t = setTimeout(() => {
        if (runId.current === id) setPhase((p) => (p === "ritual" ? "reveal" : p));
      }, RITUAL_MS);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [badge]);

  // ---------- Imagem compartilhável (story 9:16) ----------
  const generateImage = async () => {
    if (!verse || !badge) return;
    setGenerating(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas não suportado");

      // Fundo sagrado — roxo profundo com luz dourada
      const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bg.addColorStop(0, "#1a1030");
      bg.addColorStop(0.5, "#241543");
      bg.addColorStop(1, "#120b22");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const light = ctx.createRadialGradient(540, 420, 0, 540, 420, 900);
      light.addColorStop(0, "rgba(251,191,36,0.20)");
      light.addColorStop(0.4, "rgba(251,191,36,0.07)");
      light.addColorStop(1, "transparent");
      ctx.fillStyle = light;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Partículas de luz
      for (let i = 0; i < 70; i++) {
        ctx.globalAlpha = Math.random() * 0.5 + 0.15;
        ctx.fillStyle = i % 3 === 0 ? "#fbbf24" : "#ffffff";
        ctx.beginPath();
        ctx.arc(Math.random() * 1080, Math.random() * 1920, Math.random() * 2.2 + 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Molduras de canto douradas
      ctx.strokeStyle = "rgba(251,191,36,0.45)";
      ctx.lineWidth = 3;
      const p = 90, l = 110;
      const corners: [number, number, number, number, number, number][] = [
        [p, p + l, p, p, p + l, p],
        [1080 - p - l, p, 1080 - p, p, 1080 - p, p + l],
        [p, 1920 - p - l, p, 1920 - p, p + l, 1920 - p],
        [1080 - p - l, 1920 - p, 1080 - p, 1920 - p, 1080 - p, 1920 - p - l],
      ];
      for (const [x1, y1, x2, y2, x3, y3] of corners) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x3, y3);
        ctx.stroke();
      }

      // Cabeçalho
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(251,191,36,0.9)";
      ctx.font = "600 34px Arial, sans-serif";
      ctx.fillText("✦ UMA PALAVRA REVELADA ✦", 540, 320);
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.font = "28px Arial, sans-serif";
      ctx.fillText(`Selo ${badge.name}`, 540, 372);

      // Versículo (herói) — serifado
      const fontSize = 52;
      const lineHeight = fontSize * 1.65;
      ctx.font = `italic ${fontSize}px Georgia, "Times New Roman", serif`;
      const words = `“${verse.text}”`.split(" ");
      const lines: string[] = [];
      let line = "";
      for (const w of words) {
        const test = line ? `${line} ${w}` : w;
        if (ctx.measureText(test).width > 860 && line) {
          lines.push(line);
          line = w;
        } else line = test;
      }
      if (line) lines.push(line);

      let y = 960 - (lines.length * lineHeight) / 2;
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 12;
      for (const ln of lines) {
        ctx.fillText(ln, 540, y);
        y += lineHeight;
      }
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;

      // Referência
      ctx.font = "bold 40px Georgia, serif";
      ctx.fillStyle = "rgba(251,191,36,0.95)";
      ctx.fillText(`— ${verse.reference} —`, 540, y + 70);

      // Marca
      ctx.font = "26px Arial, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.fillText("aliancakingdom.com.br", 540, 1920 - 130);

      const dataUrl = canvas.toDataURL("image/png", 1.0);
      const blob = await (await fetch(dataUrl)).blob();
      const { data: { user } } = await supabase.auth.getUser();
      const fileName = `${user?.id || "anon"}/revelacao-${Date.now()}.png`;
      const { error: upErr } = await supabase.storage
        .from("verse-images")
        .upload(fileName, blob, { contentType: "image/png" });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from("verse-images").getPublicUrl(fileName);
      setPreviewUrl(dataUrl);
      setImageUrl(publicUrl);
      setPhase("image");
    } catch (e: any) {
      toast({ title: "Erro ao criar a arte", description: e.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const downloadImage = async () => {
    if (!imageUrl) return;
    try {
      const blob = await (await fetch(imageUrl)).blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `revelacao-${(verse?.reference || "versiculo").replace(/[\s:]+/g, "-")}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(imageUrl, "_blank");
    }
  };

  const shareImage = async () => {
    if (!imageUrl || !verse) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: verse.reference,
          text: `"${verse.text}" — ${verse.reference}`,
          url: imageUrl,
        });
        return;
      } catch {
        // cai pro WhatsApp
      }
    }
    const msg = `✨ ${verse.reference}\n\n"${verse.text}"\n\n📖 ${imageUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const ordinal = weeklyCount && weeklyCount > 1 ? `${weeklyCount}ª bênção revelada nesta semana` : null;

  return (
    <Dialog open={!!badge} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden border border-amber-500/25 bg-transparent shadow-2xl [&>button]:text-white/70 [&>button]:hover:text-white">
        <DialogTitle className="sr-only">Revelação de versículo do selo {badge?.name}</DialogTitle>
        {badge && (
          <motion.div
            className="relative min-h-[440px] flex flex-col items-center justify-center px-6 py-10 text-center"
            style={{
              background:
                "radial-gradient(circle at 50% 18%, rgba(251,191,36,0.16), transparent 55%), linear-gradient(165deg, #1a1030 0%, #241543 55%, #120b22 100%)",
            }}
            exit={{ scale: 0.96, opacity: 0 }}
          >
            {/* Partículas de luz flutuando */}
            {!reduced && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
                {[...Array(9)].map((_, i) => (
                  <motion.span
                    key={i}
                    className="absolute h-1 w-1 rounded-full"
                    style={{
                      left: `${8 + ((i * 37) % 86)}%`,
                      background: i % 3 === 0 ? "#fbbf24" : "rgba(255,255,255,0.8)",
                      boxShadow: i % 3 === 0 ? "0 0 6px rgba(251,191,36,0.8)" : "0 0 4px rgba(255,255,255,0.6)",
                    }}
                    initial={{ y: "105%", opacity: 0 }}
                    animate={{ y: "-8%", opacity: [0, 0.9, 0] }}
                    transition={{ duration: 7 + (i % 5), repeat: Infinity, delay: i * 0.8, ease: "linear" }}
                  />
                ))}
              </div>
            )}

            <AnimatePresence mode="wait">
              {/* ---------- FASE 1: ritual de abertura ---------- */}
              {phase === "ritual" && (
                <motion.div
                  key="ritual"
                  className="flex flex-col items-center gap-5"
                  exit={{ opacity: 0, scale: 1.15, filter: "blur(6px)" }}
                  transition={{ duration: 0.45 }}
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.09, 1.02, 1.12],
                      rotateY: [0, 12, -8, 0],
                      filter: [
                        "drop-shadow(0 0 10px rgba(251,191,36,0.25))",
                        "drop-shadow(0 0 26px rgba(251,191,36,0.55))",
                        "drop-shadow(0 0 18px rgba(251,191,36,0.4))",
                        "drop-shadow(0 0 40px rgba(251,191,36,0.8))",
                      ],
                    }}
                    transition={{ duration: RITUAL_MS / 1000, ease: "easeInOut" }}
                    style={{ perspective: 600 }}
                  >
                    <KingdomBadge
                      rarity={badge.rarity}
                      rarityColors={badge.rarityColors}
                      imageUrl={badge.imageUrl}
                      icon={badge.icon}
                      emoji={badge.emoji}
                      size="lg"
                    />
                  </motion.div>
                  <motion.p
                    className="text-sm text-amber-200/80 tracking-widest uppercase"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0.6, 1] }}
                    transition={{ duration: RITUAL_MS / 1000 }}
                  >
                    Abrindo uma palavra…
                  </motion.p>
                </motion.div>
              )}

              {/* ---------- FASE 2: a palavra revelada ---------- */}
              {phase === "reveal" && (
                <motion.div
                  key="reveal"
                  className="flex flex-col items-center gap-4 w-full"
                  initial={reduced ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.div
                    initial={reduced ? false : { scale: 1.4, y: 30 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  >
                    <KingdomBadge
                      rarity={badge.rarity}
                      rarityColors={badge.rarityColors}
                      imageUrl={badge.imageUrl}
                      icon={badge.icon}
                      emoji={badge.emoji}
                      size="sm"
                    />
                  </motion.div>

                  <motion.p
                    className="text-[11px] tracking-[0.25em] uppercase text-amber-300/90"
                    initial={reduced ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25, duration: 0.5 }}
                  >
                    ✦ Uma palavra pra você{firstName ? `, ${firstName}` : ""} ✦
                  </motion.p>

                  {verse ? (
                    <>
                      <motion.blockquote
                        className="font-serif italic text-xl sm:text-2xl leading-relaxed text-white max-w-sm"
                        style={{ fontFamily: 'Georgia, "Times New Roman", serif', textShadow: "0 2px 14px rgba(0,0,0,0.45)" }}
                        initial={reduced ? false : { opacity: 0, y: 18, filter: "blur(4px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        transition={{ delay: 0.45, duration: 0.8, ease: "easeOut" }}
                      >
                        “{verse.text}”
                      </motion.blockquote>
                      <motion.p
                        className="text-sm font-semibold text-amber-300"
                        initial={reduced ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.0, duration: 0.5 }}
                      >
                        — {verse.reference}
                      </motion.p>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-white/60 text-sm py-6">
                      <Loader2 className="h-4 w-4 animate-spin" /> Buscando a palavra…
                    </div>
                  )}

                  {(saved || ordinal) && (
                    <motion.p
                      className="text-[11px] text-emerald-300/85"
                      initial={reduced ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.3, duration: 0.5 }}
                    >
                      {saved && "✓ Guardado no seu diário de bênçãos"}
                      {saved && ordinal && " · "}
                      {ordinal && `✨ ${ordinal}`}
                    </motion.p>
                  )}

                  {verse && (
                    <motion.div
                      className="flex flex-col items-center gap-2 mt-2 w-full"
                      initial={reduced ? false : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.5, duration: 0.5 }}
                    >
                      <Button
                        onClick={generateImage}
                        disabled={generating}
                        className="w-full max-w-[260px] gap-2 !bg-gradient-to-r !from-amber-400 !to-amber-500 !text-amber-950 hover:!from-amber-300 hover:!to-amber-400 rounded-xl font-semibold"
                      >
                        {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                        {generating ? "Criando arte…" : "Compartilhar esta palavra"}
                      </Button>
                      {onShowDetails && (
                        <button
                          type="button"
                          onClick={onShowDetails}
                          className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors py-1"
                        >
                          <BookOpen className="h-3.5 w-3.5" /> Ver detalhes do selo
                        </button>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* ---------- FASE 3: arte pronta pra compartilhar ---------- */}
              {phase === "image" && imageUrl && (
                <motion.div
                  key="image"
                  className="flex flex-col items-center gap-4 w-full"
                  initial={reduced ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <img
                    src={previewUrl || imageUrl}
                    alt={`Arte do versículo ${verse?.reference}`}
                    className="w-full max-w-[240px] rounded-xl border border-amber-500/30 shadow-lg"
                  />
                  <div className="flex gap-2 w-full max-w-[280px]">
                    <Button variant="outline" onClick={downloadImage} className="flex-1 gap-1.5 rounded-xl border-white/20 bg-white/5 text-white hover:bg-white/15 hover:text-white">
                      <Download className="h-4 w-4" /> Baixar
                    </Button>
                    <Button onClick={shareImage} className="flex-1 gap-1.5 rounded-xl !bg-gradient-to-r !from-amber-400 !to-amber-500 !text-amber-950 hover:!from-amber-300 hover:!to-amber-400 font-semibold">
                      <Share2 className="h-4 w-4" /> Compartilhar
                    </Button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPhase("reveal")}
                    className="flex items-center gap-1 text-xs text-white/60 hover:text-white transition-colors"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" /> Voltar à palavra
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SeloRevelacaoModal;
