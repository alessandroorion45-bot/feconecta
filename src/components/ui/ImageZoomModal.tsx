import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

interface ImageZoomModalProps {
  src?: string;
  alt?: string;
  open: boolean;
  onClose: () => void;
  /** Fundo temático opaco atrás da imagem (evita o xadrez de transparência). */
  backdropStyle?: CSSProperties;
  /** Mostra a imagem recortada em círculo (pra selos redondos — corta os cantos). */
  circular?: boolean;
  /** Cor da moldura/glow no modo circular (raridade do selo). */
  ringColor?: string;
}

// Fundo padrão: azul-marinho profundo opaco (imagens transparentes ficam
// bonitas em cima, sem o xadrez de transparência).
const DEFAULT_BACKDROP: CSSProperties = {
  background: "radial-gradient(120% 100% at 50% 40%, #16223f 0%, #0a0f1e 55%, #05070f 100%)",
};

/**
 * Visualizador de imagem em tela cheia com zoom pra ler detalhes.
 * - Celular: pinça (2 dedos) pra zoom, arrasta pra mover, toque duplo alterna.
 * - Desktop: roda do mouse, +/−, duplo clique, arrastar.
 */
export function ImageZoomModal({ src, alt, open, onClose, backdropStyle, circular, ringColor = "#ffd76a" }: ImageZoomModalProps) {
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinch = useRef<{ dist: number; scale: number } | null>(null);
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const animating = pointers.current.size === 0;

  useEffect(() => {
    if (open) { setScale(1); setPos({ x: 0, y: 0 }); }
  }, [open, src]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !src) return null;

  const clamp = (s: number) => Math.min(5, Math.max(1, s));
  const setZoom = (next: number) => {
    const s = clamp(next);
    setScale(s);
    if (s === 1) setPos({ x: 0, y: 0 });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), scale };
      drag.current = null;
    } else if (pointers.current.size === 1 && scale > 1) {
      drag.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y };
    }
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      setZoom(pinch.current.scale * (dist / pinch.current.dist));
    } else if (pointers.current.size === 1 && drag.current && scale > 1) {
      setPos({ x: drag.current.px + (e.clientX - drag.current.x), y: drag.current.py + (e.clientY - drag.current.y) });
    }
  };
  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 0) drag.current = null;
  };

  const btn = "rounded-full bg-white/12 hover:bg-white/25 text-white p-2.5 backdrop-blur-sm transition-colors";

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center touch-none select-none"
      style={backdropStyle || DEFAULT_BACKDROP}
      onClick={onClose}
    >
      <div className="absolute top-3 right-3 flex gap-2 z-10" onClick={(e) => e.stopPropagation()}>
        <button aria-label="Diminuir zoom" onClick={() => setZoom(scale - 0.5)} className={btn}><ZoomOut className="h-5 w-5" /></button>
        <button aria-label="Aumentar zoom" onClick={() => setZoom(scale + 0.5)} className={btn}><ZoomIn className="h-5 w-5" /></button>
        <button aria-label="Resetar" onClick={() => { setScale(1); setPos({ x: 0, y: 0 }); }} className={btn}><RotateCcw className="h-5 w-5" /></button>
        <button aria-label="Fechar" onClick={onClose} className={btn}><X className="h-5 w-5" /></button>
      </div>

      {circular ? (
        <div
          className="relative rounded-full overflow-hidden"
          style={{
            width: "min(86vw, 86vh)",
            height: "min(86vw, 86vh)",
            boxShadow: `0 0 0 4px ${ringColor}, 0 0 70px ${ringColor}, 0 0 140px ${ringColor}55`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={src}
            alt={alt || "Selo"}
            onDoubleClick={() => setZoom(scale > 1 ? 1 : 2.5)}
            onWheel={(e) => setZoom(scale - e.deltaY * 0.0025)}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            draggable={false}
            style={{
              transform: `translate(${pos.x}px, ${pos.y}px) scale(${1.06 * scale})`,
              cursor: scale > 1 ? "grab" : "zoom-in",
              transition: animating ? "transform 0.15s ease-out" : "none",
            }}
            className="w-full h-full object-cover"
          />
          {/* profundidade premium: leve sombra interna na borda */}
          <span className="pointer-events-none absolute inset-0 rounded-full" style={{ boxShadow: "inset 0 0 55px rgba(0,0,0,0.4)" }} />
        </div>
      ) : (
        <img
          src={src}
          alt={alt || "Imagem"}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={() => setZoom(scale > 1 ? 1 : 2.5)}
          onWheel={(e) => setZoom(scale - e.deltaY * 0.0025)}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          draggable={false}
          style={{
            transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
            cursor: scale > 1 ? "grab" : "zoom-in",
            transition: animating ? "transform 0.15s ease-out" : "none",
          }}
          className="max-h-[88vh] max-w-[92vw] object-contain rounded-xl shadow-2xl"
        />
      )}

      <p className="absolute bottom-4 left-0 right-0 text-center text-white/60 text-xs px-4" onClick={(e) => e.stopPropagation()}>
        Belisque com 2 dedos ou use + / − para dar zoom · toque duplo alterna · arraste para mover
      </p>
    </div>,
    document.body,
  );
}

export default ImageZoomModal;
