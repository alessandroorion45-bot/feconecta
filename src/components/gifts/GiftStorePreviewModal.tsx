import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { fetchGiftVerse, FetchedVerse, giftAnimationFor } from "@/lib/giftPresentation";
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
 * Mesma linguagem visual do SeloPremiumModal (versículo ao vivo, moldura
 * com glow, animação de revelação exclusiva do presente), mas sem nada
 * que dependa de uma compra já existir (sem reações/favoritos/thankSlot,
 * que são de GiftPremiumExperience e exigem um purchase_id real).
 */
const GiftStorePreviewModal = ({ product, onClose, onPresentear }: GiftStorePreviewModalProps) => {
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const [verse, setVerse] = useState<FetchedVerse | null>(null);
  const [verseLoading, setVerseLoading] = useState(true);
  const animationKind = product ? giftAnimationFor(product.slug) : null;

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
    // Fecha primeiro e só navega no próximo tick — mesma técnica do
    // SeloPremiumModal, evita a restauração de foco do Radix competir
    // com a troca de página.
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
            background:
              "radial-gradient(circle at 50% 0%, rgba(255,255,255,0.07), transparent 55%), linear-gradient(165deg, #1f1320 0%, #2a1830 55%, #150d1a 100%)",
          }}
        >
          {animationKind && <GiftRevealAnimation kind={animationKind} />}

          <div className="relative flex flex-col items-center text-center px-6 py-8">
            <motion.div
              className="relative mt-1"
              initial={reduced ? false : { scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div
                className="relative rounded-2xl p-[3px] overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, #fda4af, #be123c)",
                  boxShadow: "0 0 24px rgba(244,63,94,0.5), 0 0 60px rgba(244,63,94,0.28)",
                }}
              >
                <div className="relative rounded-xl overflow-hidden bg-black/20 p-2">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.nome} className="h-40 w-40 sm:h-44 sm:w-44 object-contain" />
                  ) : (
                    <div className="h-40 w-40 sm:h-44 sm:w-44 flex items-center justify-center text-7xl">{product.icone || "🎁"}</div>
                  )}

                  {!reduced && (
                    <motion.div
                      className="absolute inset-y-0 w-1/3 pointer-events-none"
                      style={{ background: "linear-gradient(105deg, transparent, rgba(255,255,255,0.35), transparent)" }}
                      initial={{ x: "-140%" }}
                      animate={{ x: "260%" }}
                      transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 4.4, ease: "easeInOut" }}
                    />
                  )}
                </div>
              </div>
            </motion.div>

            <h2 className="mt-4 text-2xl font-bold text-white" style={{ textShadow: "0 0 18px rgba(244,63,94,0.5)" }}>
              {product.nome}
            </h2>
            <p className="text-xs text-rose-200/70 mt-1">🎁 Presente Cristão</p>

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
                <p className="text-[11px] tracking-widest uppercase text-amber-200/80 mb-1.5">📖 {verse.reference}</p>
                <p className="text-sm italic text-white/90 leading-relaxed font-serif">"{verse.text}"</p>
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
