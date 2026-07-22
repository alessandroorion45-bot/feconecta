import { useCallback, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

export interface CardTiltState {
  rotateX: number;
  rotateY: number;
  /** posição do brilho (foil), em % do container */
  glareX: number;
  glareY: number;
  glareOpacity: number;
}

const RESTING: CardTiltState = { rotateX: 0, rotateY: 0, glareX: 50, glareY: 50, glareOpacity: 0 };

/**
 * Tilt 3D + brilho "foil" que segue o mouse, no estilo de uma carta
 * colecionável premium. Isolado como hook pra poder ser reaproveitado
 * em outros cards do app (perfil, feed) além da loja de presentes.
 *
 * Só reage a mouse (desktop) — em touch/mobile o card fica na posição
 * de repouso (sem tilt), que é intencional: tilt por giroscópio/touch
 * tende a ficar "nervoso" e não vale o custo de implementar e testar
 * bem num primeiro momento. prefers-reduced-motion também mantém o
 * card parado, como fallback elegante.
 */
export function useCardTilt(maxTiltDeg = 10) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [tilt, setTilt] = useState<CardTiltState>(RESTING);

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (reduced || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      setTilt({
        rotateX: (0.5 - py) * maxTiltDeg * 2,
        rotateY: (px - 0.5) * maxTiltDeg * 2,
        glareX: px * 100,
        glareY: py * 100,
        glareOpacity: 0.35,
      });
    },
    [reduced, maxTiltDeg],
  );

  const onMouseLeave = useCallback(() => setTilt(RESTING), []);

  return { ref, tilt: reduced ? RESTING : tilt, onMouseMove, onMouseLeave, reduced };
}
