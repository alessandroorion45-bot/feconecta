import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import KingdomBadge, { BadgeRarity, RARITY_STYLES } from "@/components/kingdom-badges/KingdomBadge";
import { fetchGiftVerse as fetchVerseByReference, FetchedVerse } from "@/lib/giftPresentation";
import { seloThemeFor, pickImpactPhrase, fetchMissionStats, MissionStats } from "@/lib/seloPremium";
import { BookOpen, Heart, HandHeart, Gift, Users, Sparkles } from "lucide-react";

export interface SeloPremiumBadge {
  id: string;
  name: string;
  description: string;
  category: string;
  rarity: BadgeRarity | string;
  rarityColors?: { corInicio: string; corFim: string } | null;
  imageUrl?: string | null;
  emoji?: string;
  icon?: React.ReactNode;
  verseReference?: string | null;
  verseText?: string | null;
  usersCount: number;
  /** data em que ESTE usuário conquistou/recebeu, se aplicável */
  unlockedAt?: string | null;
}

interface SeloPremiumModalProps {
  badge: SeloPremiumBadge | null;
  onClose: () => void;
}

const BLESSED_KEY = (badgeId: string) => `selo-blessed-${badgeId}`;

const STAT_ROWS = [
  { key: "estudos_realizados" as const, icon: <BookOpen className="h-4 w-4" />, label: "Estudos realizados" },
  { key: "oracoes_enviadas" as const, icon: <HandHeart className="h-4 w-4" />, label: "Orações enviadas" },
  { key: "presentes_compartilhados" as const, icon: <Gift className="h-4 w-4" />, label: "Presentes compartilhados" },
  { key: "testemunhos_compartilhados" as const, icon: <Heart className="h-4 w-4" />, label: "Testemunhos compartilhados" },
  { key: "membros_ativos" as const, icon: <Users className="h-4 w-4" />, label: "Membros ativos" },
];

const numberFmt = (n: number) => n.toLocaleString("pt-BR");

/**
 * ✨ Experiência premium do Selo — ao clicar, uma pequena liturgia:
 * o selo brilha e cresce, o significado se revela, um versículo real
 * é buscado ao vivo, e a missão por trás do selo ganha números reais.
 */
const SeloPremiumModal = ({ badge, onClose }: SeloPremiumModalProps) => {
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const style = RARITY_STYLES[(badge?.rarity as BadgeRarity) || "common"] || RARITY_STYLES.common;
  const theme = badge ? seloThemeFor(badge.category) : null;

  const [verse, setVerse] = useState<FetchedVerse | null>(null);
  const [verseLoading, setVerseLoading] = useState(true);
  const [typedPhrase, setTypedPhrase] = useState("");
  const [stats, setStats] = useState<MissionStats | null>(null);
  const [isBlessedMoment, setIsBlessedMoment] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (!badge) return;
    setShowContent(false);
    setVerse(null);
    setVerseLoading(true);
    setStats(null);

    // "Momento de Bênção" — só na primeira vez que este selo é aberto neste navegador
    const alreadyBlessed = localStorage.getItem(BLESSED_KEY(badge.id));
    setIsBlessedMoment(!alreadyBlessed);
    if (!alreadyBlessed) localStorage.setItem(BLESSED_KEY(badge.id), "1");

    fetchVerseByReference(badge.verseReference, badge.verseText).then((v) => {
      setVerse(v);
      setVerseLoading(false);
    });
    fetchMissionStats().then(setStats);

    const revealDelay = !alreadyBlessed && !reduced ? 2200 : 0;
    const t = setTimeout(() => setShowContent(true), revealDelay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [badge?.id]);

  // Typewriter na frase de impacto
  useEffect(() => {
    if (!showContent || !theme || !badge) return;
    const phrase = pickImpactPhrase(theme, badge.id);
    if (reduced) {
      setTypedPhrase(phrase);
      return;
    }
    setTypedPhrase("");
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setTypedPhrase(phrase.slice(0, i));
      if (i >= phrase.length) clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, [showContent, theme, badge, reduced]);

  const readChapter = () => {
    if (!verse) return;
    const match = verse.reference.match(/^(.+?)\s+(\d+):(\d+)$/);
    if (!match) return;
    const [, book, chapter] = match;
    const target = `/bible?livro=${encodeURIComponent(book.trim())}&cap=${chapter}`;
    // Fecha primeiro e só navega no próximo tick: fazer as duas coisas no
    // mesmo evento de clique deixa o fechamento do Dialog (restauração de
    // foco do Radix) correndo por cima da troca de página.
    onClose();
    setTimeout(() => navigate(target), 0);
  };

  if (!badge || !theme) return null;

  return (
    <Dialog open={!!badge} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden border-none bg-transparent shadow-2xl max-h-[92vh] [&>button]:text-white/80 [&>button:hover]:text-white [&>button]:z-20">
        <DialogTitle className="sr-only">Selo {badge.name}</DialogTitle>

        <div
          className="relative max-h-[92vh] overflow-y-auto rounded-2xl"
          style={{
            background: "radial-gradient(circle at 50% 0%, rgba(255,255,255,0.07), transparent 55%), linear-gradient(165deg, #171025 0%, #201736 55%, #0f0b18 100%)",
          }}
        >
          {/* partículas douradas sutis */}
          {!reduced && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
              {[...Array(10)].map((_, i) => (
                <motion.span
                  key={i}
                  className="absolute h-1 w-1 rounded-full"
                  style={{ left: `${6 + ((i * 41) % 88)}%`, background: "#fbbf24", boxShadow: "0 0 6px rgba(251,191,36,0.8)" }}
                  initial={{ y: "108%", opacity: 0 }}
                  animate={{ y: "-8%", opacity: [0, 0.8, 0] }}
                  transition={{ duration: 8 + (i % 5), repeat: Infinity, delay: i * 0.7, ease: "linear" }}
                />
              ))}
            </div>
          )}

          <div className="relative flex flex-col items-center text-center px-6 py-9">
            <AnimatePresence mode="wait">
              {!showContent ? (
                // ---------- Momento de Bênção: ritual só na primeira vez ----------
                <motion.div key="ritual" className="flex flex-col items-center gap-5 min-h-[280px] justify-center" exit={{ opacity: 0, scale: 1.1, filter: "blur(6px)" }} transition={{ duration: 0.4 }}>
                  <motion.div
                    animate={{ scale: [0.8, 1.08, 1], filter: ["drop-shadow(0 0 8px rgba(251,191,36,0.2))", "drop-shadow(0 0 30px rgba(251,191,36,0.6))", "drop-shadow(0 0 20px rgba(251,191,36,0.4))"] }}
                    transition={{ duration: 1.4, ease: "easeOut" }}
                  >
                    <KingdomBadge rarity={badge.rarity} rarityColors={badge.rarityColors} imageUrl={badge.imageUrl} icon={badge.icon} emoji={badge.emoji} size="lg" />
                  </motion.div>
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.6 }} className="text-sm text-amber-200/90">
                    Que Deus continue fortalecendo sua caminhada.
                  </motion.p>
                </motion.div>
              ) : (
                // ---------- Conteúdo completo ----------
                <motion.div key="content" className="w-full flex flex-col items-center" initial={reduced ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                  {/* Cabeçalho: selo com glow/halo/partículas (já embutido no KingdomBadge) */}
                  <motion.div initial={reduced ? false : { scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
                    <KingdomBadge rarity={badge.rarity} rarityColors={badge.rarityColors} imageUrl={badge.imageUrl} icon={badge.icon} emoji={badge.emoji} size="lg" />
                  </motion.div>

                  <h2 className="mt-4 text-2xl font-bold text-white" style={{ textShadow: `0 0 18px ${style.glow}` }}>
                    {badge.name}
                  </h2>
                  <div className="flex items-center gap-2 mt-1.5 text-xs">
                    <span className="rounded-full border border-white/15 px-2.5 py-0.5 text-amber-200">{badge.category}</span>
                    <span className="rounded-full border border-white/15 px-2.5 py-0.5 text-white/70">{style.label}</span>
                  </div>
                  {badge.unlockedAt && (
                    <p className="text-[11px] text-white/50 mt-1.5">
                      Conquistado em {new Date(badge.unlockedAt).toLocaleDateString("pt-BR")}
                    </p>
                  )}

                  {/* Frase de impacto (typewriter) */}
                  <p className="mt-4 text-base text-amber-100 font-medium min-h-[1.5em]">
                    {typedPhrase}
                    {typedPhrase.length < (pickImpactPhrase(theme, badge.id)?.length || 0) && <span className="animate-pulse">▍</span>}
                  </p>

                  {/* Versículo ao vivo */}
                  {!verseLoading && verse && (
                    <div className="mt-5 max-w-sm">
                      <p className="text-[11px] tracking-widest uppercase text-amber-200/80 mb-1.5">📖 {verse.reference}</p>
                      <p className="text-sm italic text-white/90 leading-relaxed font-serif">"{verse.text}"</p>
                      <Button size="sm" variant="outline" className="mt-3 gap-1.5 bg-white/5 border-white/15 text-white hover:bg-white/15 hover:text-white" onClick={readChapter}>
                        <BookOpen className="h-3.5 w-3.5" /> Ler capítulo completo
                      </Button>
                    </div>
                  )}

                  {/* Reflexão */}
                  <p className="mt-5 text-sm text-white/75 italic max-w-sm leading-relaxed">{theme.reflection}</p>

                  {/* O que este selo representa */}
                  <div className="mt-5 w-full max-w-sm rounded-xl bg-white/5 border border-white/10 p-4 text-left">
                    <p className="text-xs font-semibold text-amber-200 flex items-center gap-1.5 mb-1.5">🎯 O que este selo representa</p>
                    <p className="text-sm text-white/80 leading-relaxed">{badge.description}</p>
                  </div>

                  {/* Poder Kingdom */}
                  <div className="mt-3 w-full max-w-sm rounded-xl bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-400/20 p-4 text-left">
                    <p className="text-xs font-semibold text-amber-200 flex items-center gap-1.5 mb-1.5">
                      {theme.kingdomPowerIcon} {theme.kingdomPowerTitle}
                    </p>
                    <p className="text-sm text-amber-100/90 leading-relaxed italic">"{theme.kingdomPower}"</p>
                  </div>

                  {/* Progresso da missão */}
                  {stats && (
                    <div className="mt-5 w-full max-w-sm grid grid-cols-2 gap-2">
                      {STAT_ROWS.map((row) => (
                        <div key={row.key} className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                          <span className="text-amber-300">{row.icon}</span>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-white leading-none">{numberFmt(stats[row.key] ?? 0)}</p>
                            <p className="text-[10px] text-white/60 leading-tight truncate">{row.label}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Rodapé */}
                  <div className="mt-6 pt-4 border-t border-white/10 w-full max-w-sm">
                    <p className="text-xs text-white/60 flex items-center justify-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-amber-300" /> Obrigado por fazer parte desta missão.
                    </p>
                    <p className="text-[11px] italic text-white/40 mt-1">"Porque dele, por meio dele e para ele são todas as coisas." — Romanos 11:36</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SeloPremiumModal;
