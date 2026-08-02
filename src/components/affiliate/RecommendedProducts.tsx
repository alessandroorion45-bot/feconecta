import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Handshake, ExternalLink, Eye, Info } from "lucide-react";
import { MediaCarousel, type MediaItem } from "./MediaCarousel";

export interface AffiliateProduct {
  id: string;
  nome: string;
  affiliate_url: string;
  image_url: string | null;
  categoria: string;
  headline: string | null;
  descricao: string | null;
  cta_text: string;
  badge_label: string;
  click_count: number;
  media: MediaItem[];
  aspect: string;
}

export const AFFILIATE_SELECT =
  "id, nome, affiliate_url, image_url, categoria, headline, descricao, cta_text, badge_label, click_count, media, aspect";

/** Card com leve inclinação 3D seguindo o mouse (magnético, discreto). */
export function TiltCard({ product }: { product: AffiliateProduct }) {
  const ref = useRef<HTMLDivElement>(null);
  const [clicks, setClicks] = useState(product.click_count);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [7, -7]), { stiffness: 200, damping: 18 });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-7, 7]), { stiffness: 200, damping: 18 });

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  const openLink = async () => {
    // Abre JÁ em nova aba (gesto do usuário) pra não perder o rastreio de afiliado.
    const win = window.open(product.affiliate_url, "_blank", "noopener,noreferrer");
    if (!win) window.location.href = product.affiliate_url; // fallback se bloqueou popup
    try {
      const { data } = await supabase.rpc("track_affiliate_click", { p_id: product.id });
      if (typeof data === "number") setClicks(data);
    } catch {
      /* rastreio é best-effort; nunca bloqueia a ida ao parceiro */
    }
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      className="group relative rounded-2xl"
    >
      {/* Glow dourado/roxo na borda */}
      <div className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-br from-amber-400/40 via-fuchsia-500/30 to-amber-500/40 opacity-60 blur-[6px] transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-amber-400/20 bg-card shadow-lg">
        {/* Selo de transparência — SEMPRE visível, nunca escondido */}
        <div className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-medium text-amber-200 backdrop-blur-sm">
          <Handshake className="h-3 w-3" /> {product.badge_label}
        </div>

        {/* Carrossel de mídias (imagens + vídeo), mostra tudo inteiro */}
        <MediaCarousel
          media={product.media?.length ? product.media : product.image_url ? [{ type: "image", url: product.image_url }] : []}
          aspect={product.aspect || "9:16"}
        />

        <div className="flex flex-1 flex-col p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-amber-500">{product.categoria}</span>
          <h3 className="mt-1 text-lg font-bold leading-snug text-foreground">
            {product.headline || product.nome}
          </h3>
          {product.headline && product.headline !== product.nome && (
            <p className="text-xs text-muted-foreground">{product.nome}</p>
          )}
          {product.descricao && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{product.descricao}</p>
          )}

          {/* Prova social só se for real (>0) */}
          {clicks > 0 && (
            <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
              <Eye className="h-3.5 w-3.5" /> {clicks} {clicks === 1 ? "pessoa já viu" : "pessoas já viram"} esta oferta
            </p>
          )}

          <button
            onClick={openLink}
            className="relative mt-4 inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 to-fuchsia-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-transform active:scale-95"
          >
            {/* Pulso sutil e contínuo (não irritante) */}
            <span className="absolute inset-0 -z-0 animate-pulse bg-white/10" />
            <span className="relative z-10 flex items-center gap-2">
              {product.cta_text} <ExternalLink className="h-4 w-4" />
            </span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/** Seção "Recomendados" — só aparece se houver produtos ativos. */
export default function RecommendedProducts() {
  const [products, setProducts] = useState<AffiliateProduct[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase
      .from("affiliate_products")
      .select(AFFILIATE_SELECT)
      .eq("status", "active")
      .order("ordem", { ascending: true })
      .then(({ data }) => {
        setProducts((data as AffiliateProduct[]) || []);
        setLoaded(true);
      });
  }, []);

  if (!loaded || products.length === 0) return null;

  return (
    <section className="my-10 rounded-3xl border border-amber-400/20 bg-gradient-to-b from-amber-500/5 to-transparent p-5 sm:p-7">
      <div className="mb-5 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600">
          <Handshake className="h-3.5 w-3.5" /> Achados da Aliança
        </div>
        <h2 className="mt-2 text-2xl font-bold text-foreground">Achados que separamos pra você</h2>
        <p className="mx-auto mt-1 max-w-xl text-sm text-muted-foreground">
          Boas descobertas de parceiros, escolhidas com carinho. São <strong>links de parceiro</strong> — ao comprar
          por eles, você ajuda a manter o app, <strong>sem custo adicional</strong> pra você.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <TiltCard key={p.id} product={p} />
        ))}
      </div>

      {/* Rodapé de transparência (obrigatório) */}
      <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
        <Info className="h-3 w-3 shrink-0" />
        A Aliança pode receber uma comissão por compras feitas através destes links, sem nenhum custo extra para você.
      </p>
    </section>
  );
}
