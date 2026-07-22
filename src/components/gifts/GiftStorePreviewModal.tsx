import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { fetchGiftVerse, FetchedVerse, giftAnimationFor, giftColorFor } from "@/lib/giftPresentation";
import { useCardTilt } from "@/hooks/useCardTilt";
import GiftRevealAnimation from "./GiftRevealAnimation";
import { Gift, BookOpen } from "lucide-react";

export interface GiftStorePreviewProduct {
  id: string;
  nome: string;
  slug: string;
  descricao: string | null;
  verse_reference: string | null;
  verse_text: string | null;
  icone: string | null;
  image_url: string | null;
  preco: number;
  estoque: number | null;
  limitado: boolean;
}

interface GiftStorePreviewModalProps {
  product: GiftStorePreviewProduct | null;
  onClose: () => void;
  onPresentear: (product: GiftStorePreviewProduct) => void;
}

const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/**
 * Preview "magnético" ao clicar num presente da loja — antes da compra.
 * A arte sangra quase até a borda como uma carta colecionável premium
 * (foil), com tilt 3D que segue o mouse, glow pulsante na cor do
 * presente (derivada automaticamente via giftColorFor) e revelação do
 * versículo palavra por palavra. Sem nada que dependa de uma compra já
 * existir (isso é GiftPremiumExperience, pra presente já recebido).
 */
const GiftStorePreviewModal = ({ product, onClose, onPresentear }: GiftStorePreviewModalProps) => {
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const { ref: tiltRef, tilt, onMouseMove, onMouseLeave } = useCardTilt(9);
  const [verse, setVerse] = useState<FetchedVerse | null>(null);
  const [verseLoading, setVerseLoading] = useState(true);

  const animationKind = product ? giftAnimationFor(product.slug) : null;
  const theme = product ? giftColorFor(product.slug) : giftColorFor(null);

  useEffect(() => {
    if (!product) return;
    setVerse(null);
    setVerseLoading(true);
    fetchGiftVerse(product.verse_reference, product.verse_text).then((v) => {
      setVerse(v);
      setVerseLoading(false);
    });
  }, [product?.id, product?.verse_reference, product?.verse_text]);

  const readChapter = () => {
    if (!verse) return;
    const match = verse.reference.match(/^(.+?)\s+(\d+):(\d+)$/);
    if (!match) return;
    const [, book, chapter] = match;
    const target = `/bible?livro=${encodeURIComponent(book.trim())}&cap=${chapter}`;
    // Fecha primeiro e só navega no próximo tick — evita a restauração
    // de foco do Radix competir com a troca de página.
    onClose();
    setTimeout(() => navigate(target), 0);
  };

  if (!product) return null;
  const soldOut = product.limitado && product.estoque !== null && product.estoque <= 0;

  return (
    <Dialog open={!!product} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-none bg-transparent shadow-2xl max-h-[92vh] [&>button]:text-white/80 [&>button:hover]:text-white [&>button]:z-20">
        <DialogTitle className="sr-only">{product.nome}</DialogTitle>

        <div
          className="relative max-h-[92vh] overflow-y-auto rounded-2xl"
          style={{
            background: `radial-gradient(circle at 50% 8%, rgba(${theme.rgb},0.18), transparent 55%), linear-gradient(165deg, #120f14 0%, #1a1420 55%, #0d0b10 100%)`,
          }}
        >
          <div className="relative flex flex-col items-center text-center px-6 pt-9 pb-8">
            {/* Card colecionável: glow pulsante + tilt 3D + foil */}
            <motion.div
              className="relative"
              style={{ perspective: 1000 }}
              initial={reduced ? false : { opacity: 0, scale: 0.72, rotateX: -22, y: 26 }}
              animate={{ opacity: 1, scale: 1, rotateX: 0, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* glow respirando atrás do card */}
              <motion.div
                aria-hidden
                className="absolute -inset-6 -z-10 rounded-[2rem]"
                style={{ background: `radial-gradient(circle, rgba(${theme.rgb},0.55), transparent 70%)`, filter: "blur(26px)" }}
                animate={reduced ? { opacity: 0.5 } : { scale: [1, 1.06, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={reduced ? undefined : { duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />

              <div
                ref={tiltRef}
                onMouseMove={onMouseMove}
                onMouseLeave={onMouseLeave}
                className="relative"
                style={{ perspective: 1000 }}
              >
                <motion.div
                  className="relative w-[74vw] max-w-[270px] sm:max-w-[290px] aspect-[2/3] rounded-2xl overflow-hidden"
                  style={{
                    transformStyle: "preserve-3d",
                    border: `1.5px solid rgba(${theme.rgb},0.55)`,
                    boxShadow: `0 0 30px rgba(${theme.rgb},0.45), 0 18px 40px -12px rgba(0,0,0,0.6)`,
                  }}
                  animate={{ rotateX: tilt.rotateX, rotateY: tilt.rotateY }}
                  transition={{ type: "spring", stiffness: 280, damping: 22 }}
                >
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.nome} className="h-full w-full object-cover" draggable={false} />
                  ) : (
                    <div
                      className="h-full w-full flex items-center justify-center text-8xl"
                      style={{ background: `radial-gradient(circle, rgba(${theme.rgb},0.25), #120f14 75%)` }}
                    >
                      {product.icone || "🎁"}
                    </div>
                  )}

                  {/* animação de revelação exclusiva do presente, por cima da arte */}
                  {animationKind && <GiftRevealAnimation kind={animationKind} />}

                  {/* varredura de brilho ambiente (idle) */}
                  {!reduced && (
                    <motion.div
                      aria-hidden
                      className="absolute inset-y-0 w-1/3 pointer-events-none"
                      style={{ background: "linear-gradient(105deg, transparent, rgba(255,255,255,0.28), transparent)" }}
                      initial={{ x: "-140%" }}
                      animate={{ x: "260%" }}
                      transition={{ duration: 1.7, repeat: Infinity, repeatDelay: 4.6, ease: "easeInOut" }}
                    />
                  )}

                  {/* brilho foil reativo ao mouse */}
                  <div
                    aria-hidden
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255,255,255,0.55), transparent 60%)`,
                      opacity: tilt.glareOpacity,
                      mixBlendMode: "overlay",
                      transition: "opacity 0.25s ease-out",
                    }}
                  />

                  {/* vinheta sutil pra reforçar a leitura como "carta" */}
                  <div
                    aria-hidden
                    className="absolute inset-0 pointer-events-none rounded-2xl"
                    style={{ boxShadow: "inset 0 0 40px rgba(0,0,0,0.45)" }}
                  />
                </motion.div>
              </div>
            </motion.div>

            <h2 className="mt-5 text-2xl font-bold text-white" style={{ textShadow: `0 0 18px rgba(${theme.rgb},0.5)` }}>
              {product.nome}
            </h2>
            <p className="text-xs mt-1" style={{ color: `rgba(${theme.rgb},0.85)` }}>
              🎁 Presente Cristão
            </p>

            {product.descricao && (
              <p className="mt-3 text-sm text-white/80 max-w-sm leading-relaxed">{product.descricao}</p>
            )}

            {!verseLoading && verse && (
              <motion.div
                className="mt-5 max-w-sm"
                initial={reduced ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <p className="text-[11px] tracking-widest uppercase mb-1.5" style={{ color: `rgba(${theme.rgb},0.9)` }}>
                  📖 {verse.reference}
                </p>
                <p className="text-sm italic text-white/90 leading-relaxed font-serif">
                  "
                  {verse.text.split(" ").map((word, i) => (
                    <motion.span
                      key={i}
                      initial={reduced ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: reduced ? 0 : i * 0.045, duration: 0.3 }}
                      className="inline-block mr-1"
                    >
                      {word}
                    </motion.span>
                  ))}
                  "
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 gap-1.5 bg-white/5 border-white/15 text-white hover:bg-white/15 hover:text-white"
                  onClick={readChapter}
                >
                  <BookOpen className="h-3.5 w-3.5" /> Ler capítulo completo
                </Button>
              </motion.div>
            )}

            <div className="mt-6 text-xl font-bold text-white">{formatBRL(product.preco)}</div>

            <Button
              size="lg"
              disabled={soldOut}
              className="mt-4 w-full max-w-sm gap-2 !bg-gradient-to-r !from-rose-500 !via-pink-500 !to-rose-600 text-white hover:opacity-90"
              onClick={() => onPresentear(product)}
            >
              <Gift className="h-4 w-4" /> {soldOut ? "Esgotado" : "Presentear"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GiftStorePreviewModal;
