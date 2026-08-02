import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, PlayCircle } from "lucide-react";

export interface MediaItem {
  type: "image" | "video";
  url: string;
}

/** Extrai o ID de um link do YouTube (watch, youtu.be, embed, shorts). */
export const ytId = (u: string): string | null => {
  const m = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return m?.[1] || null;
};

/**
 * Carrossel de mídias (imagens + vídeos) que mostra tudo INTEIRO (object-contain)
 * com um fundo desfocado da própria mídia preenchendo — moderno e magnético.
 * Suporta formato 9:16 (vertical) e 16:9 (horizontal).
 */
export function MediaCarousel({
  media,
  aspect,
  rounded = "rounded-none",
}: {
  media: MediaItem[];
  aspect: string;
  rounded?: string;
}) {
  const items = Array.isArray(media) ? media.filter((m) => m?.url) : [];
  const [i, setI] = useState(0);
  const hover = useRef(false);
  // Vídeo precisa de proporção fixa (iframe não tem tamanho próprio).
  // Imagem NÃO usa proporção fixa: o quadro fica com a altura exata da foto,
  // então nunca sobra faixa vazia em cima/embaixo (queixa do usuário).
  const videoRatio = aspect === "16:9" ? "aspect-video" : "aspect-[9/16]";
  const imgCap = aspect === "16:9" ? "max-h-[300px]" : "max-h-[60vh] sm:max-h-[380px]";

  // Autoplay suave entre as mídias (pausa no hover). Não avança em cima de vídeo.
  useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(() => {
      if (hover.current) return;
      setI((p) => {
        if (items[p]?.type === "video") return p; // não pula o vídeo sozinho
        return (p + 1) % items.length;
      });
    }, 4500);
    return () => clearInterval(t);
  }, [items.length]);

  if (items.length === 0) {
    return (
      <div className={`aspect-square ${rounded} w-full flex items-center justify-center bg-gradient-to-br from-muted/40 to-muted/10 text-6xl`}>
        🎁
      </div>
    );
  }

  const idx = Math.min(i, items.length - 1);
  const cur = items[idx];
  const isImg = cur.type === "image";
  const go = (d: number) => setI((p) => (p + d + items.length) % items.length);

  return (
    <div
      className={`relative ${rounded} w-full overflow-hidden bg-muted flex items-center justify-center ${isImg ? "" : videoRatio}`}
      onMouseEnter={() => (hover.current = true)}
      onMouseLeave={() => (hover.current = false)}
    >
      {/* Fundo desfocado da própria mídia — preenche só as laterais, se sobrar */}
      {isImg ? (
        <img src={cur.url} aria-hidden alt="" className="absolute inset-0 h-full w-full object-cover scale-[1.35] blur-3xl opacity-95" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-slate-700/60" aria-hidden />
      )}

      {/* Mídia principal — a IMAGEM define a altura do quadro (sem faixa vazia) */}
      {isImg ? (
        <img
          src={cur.url}
          alt=""
          loading="lazy"
          className={`relative z-[1] block w-auto max-w-full ${imgCap} object-contain`}
        />
      ) : (
        <div className="relative z-[1] h-full w-full flex items-center justify-center">
          {ytId(cur.url) ? (
            <iframe
              src={`https://www.youtube.com/embed/${ytId(cur.url)}`}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Vídeo do produto"
            />
          ) : (
            <video src={cur.url} controls playsInline className="max-h-full max-w-full object-contain" />
          )}
        </div>
      )}

      {/* Selo de vídeo (quando não é iframe) */}
      {cur.type === "video" && !ytId(cur.url) && (
        <span className="pointer-events-none absolute left-2 bottom-2 z-[2] flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[10px] text-white backdrop-blur">
          <PlayCircle className="h-3 w-3" /> vídeo
        </span>
      )}

      {items.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Anterior"
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); go(-1); }}
            className="absolute left-2 top-1/2 z-[3] -translate-y-1/2 grid h-8 w-8 place-items-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/65"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Próximo"
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); go(1); }}
            className="absolute right-2 top-1/2 z-[3] -translate-y-1/2 grid h-8 w-8 place-items-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/65"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute bottom-2 left-1/2 z-[3] -translate-x-1/2 flex gap-1.5">
            {items.map((_, k) => (
              <button
                key={k}
                type="button"
                aria-label={`Mídia ${k + 1}`}
                onClick={(e) => { e.stopPropagation(); e.preventDefault(); setI(k); }}
                className={`h-1.5 rounded-full bg-white transition-all ${k === idx ? "w-5" : "w-1.5 opacity-50"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
