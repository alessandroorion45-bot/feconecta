// =====================================================
// GIFT REVEAL ANIMATION — assinatura visual única por presente
// =====================================================
// Cada um dos 16 presentes da Kingdom Store tem sua própria animação
// de revelação, coerente com o tema/versículo do presente. Reverente,
// não gamificado — sem elementos de "conquista de jogo".
//
// Componente leve (DOM/Framer Motion, sem canvas) pensado pra caber
// em áreas pequenas (preview no modal de compra, tela de sucesso,
// experiência de abertura) — poucos elementos, nada de filter:blur()
// em cima de algo que anima por transform continuamente (lição do
// Kingdom Sky Engine), e respeita prefers-reduced-motion.
// =====================================================

import { motion, useReducedMotion } from "framer-motion";
import { GiftAnimationKind } from "@/lib/giftPresentation";

interface GiftRevealAnimationProps {
  kind: GiftAnimationKind;
  /** chamado uma vez quando a animação de entrada termina — hook pronto
   * pra acoplar um efeito sonoro sutil depois, sem mexer na estrutura */
  onRevealComplete?: () => void;
}

const Petals = () => (
  <>
    {[...Array(8)].map((_, i) => (
      <motion.span
        key={i}
        aria-hidden
        className="absolute top-0"
        style={{
          left: `${8 + ((i * 47) % 84)}%`,
          width: 10,
          height: 10,
          background: "linear-gradient(135deg, #f87171, #be123c)",
          borderRadius: "0 100% 0 100%",
        }}
        initial={{ y: "-10%", opacity: 0, rotate: 0 }}
        animate={{
          y: "115%",
          opacity: [0, 0.9, 0.9, 0],
          rotate: 220 + i * 20,
          x: [0, 10, -8, 6, 0],
        }}
        transition={{ duration: 5 + (i % 3), repeat: Infinity, delay: i * 0.6, ease: "easeInOut" }}
      />
    ))}
  </>
);

const Handshake = () => (
  <>
    <motion.div
      aria-hidden
      className="absolute top-1/2 left-1/2 h-2 w-2 -translate-y-1/2 rounded-full"
      style={{ background: "radial-gradient(circle, #fde68a, #d4930d)" }}
      initial={{ x: "-160%" }}
      animate={{ x: ["-160%", "-6%", "-6%"] }}
      transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 1.2, times: [0, 0.6, 1], ease: "easeOut" }}
    />
    <motion.div
      aria-hidden
      className="absolute top-1/2 left-1/2 h-2 w-2 -translate-y-1/2 rounded-full"
      style={{ background: "radial-gradient(circle, #fde68a, #d4930d)" }}
      initial={{ x: "60%" }}
      animate={{ x: ["60%", "-94%", "-94%"] }}
      transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 1.2, times: [0, 0.6, 1], ease: "easeOut" }}
    />
    {/* anel dourado pulsando no ponto de contato */}
    <motion.div
      aria-hidden
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
      style={{ border: "1.5px solid rgba(212,147,13,0.7)" }}
      initial={{ width: 4, height: 4, opacity: 0 }}
      animate={{ width: [4, 4, 70], height: [4, 4, 70], opacity: [0, 0, 0.7, 0] }}
      transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 1.2, times: [0, 0.6, 0.75, 1], ease: "easeOut" }}
    />
  </>
);

const Heartbeat = () => (
  <>
    <motion.div
      aria-hidden
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl"
      animate={{ scale: [1, 1.18, 1, 1.1, 1] }}
      transition={{ duration: 1.4, repeat: Infinity, times: [0, 0.18, 0.32, 0.46, 0.6], ease: "easeInOut" }}
    >
      ❤️
    </motion.div>
    {[...Array(6)].map((_, i) => (
      <motion.span
        key={i}
        aria-hidden
        className="absolute left-1/2 top-1/2 h-1 w-1 rounded-full"
        style={{ background: "#fbbf24" }}
        initial={{ x: "-50%", y: "20%", opacity: 0 }}
        animate={{ y: "-140%", x: `${-50 + (i % 2 === 0 ? -1 : 1) * (8 + i * 3)}%`, opacity: [0, 0.9, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.4, ease: "easeOut" }}
      />
    ))}
  </>
);

const PrayerLight = () => (
  <>
    {[...Array(3)].map((_, i) => (
      <motion.div
        key={i}
        aria-hidden
        className="absolute top-0 h-full w-6 opacity-0"
        style={{
          left: `${28 + i * 22}%`,
          background: "linear-gradient(180deg, rgba(253,230,138,0.85), transparent)",
        }}
        animate={{ opacity: [0, 0.55, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, delay: i * 0.7, ease: "easeInOut" }}
      />
    ))}
    {[...Array(6)].map((_, i) => (
      <motion.span
        key={`dust-${i}`}
        aria-hidden
        className="absolute bottom-0 h-1 w-1 rounded-full"
        style={{ left: `${15 + ((i * 37) % 70)}%`, background: "#fde68a" }}
        initial={{ y: 0, opacity: 0 }}
        animate={{ y: "-100%", opacity: [0, 0.8, 0] }}
        transition={{ duration: 4 + (i % 3), repeat: Infinity, delay: i * 0.5, ease: "linear" }}
      />
    ))}
  </>
);

const DoveFlight = () => (
  <motion.div
    aria-hidden
    className="absolute text-2xl"
    style={{ top: "55%" }}
    initial={{ x: "-15%", y: 0, opacity: 0 }}
    animate={{ x: "115%", y: [-6, -22, -6], opacity: [0, 1, 1, 0] }}
    transition={{ duration: 3.6, repeat: Infinity, repeatDelay: 1, ease: "easeInOut" }}
  >
    🕊️
  </motion.div>
);

const StarTwinkle = () => {
  // constelação simples: 5 pontos fixos + linhas conectando em sequência
  const points = [
    { x: 20, y: 30 },
    { x: 40, y: 15 },
    { x: 62, y: 28 },
    { x: 78, y: 18 },
    { x: 50, y: 55 },
  ];
  return (
    <>
      <svg className="absolute inset-0 h-full w-full" aria-hidden>
        {points.slice(0, -1).map((p, i) => {
          const next = points[i + 1];
          return (
            <motion.line
              key={i}
              x1={`${p.x}%`}
              y1={`${p.y}%`}
              x2={`${next.x}%`}
              y2={`${next.y}%`}
              stroke="rgba(251,191,36,0.5)"
              strokeWidth={1}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: [0, 1, 1, 0], opacity: [0, 0.8, 0.8, 0] }}
              transition={{ duration: 5, repeat: Infinity, delay: i * 0.35, ease: "easeInOut" }}
            />
          );
        })}
      </svg>
      {points.map((p, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="absolute h-1.5 w-1.5 rounded-full"
          style={{ left: `${p.x}%`, top: `${p.y}%`, background: "#fde68a", boxShadow: "0 0 6px rgba(253,230,138,0.9)" }}
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.3, 0.8] }}
          transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.3, ease: "easeInOut" }}
        />
      ))}
    </>
  );
};

const WheatHarvest = () => (
  <>
    {[...Array(3)].map((_, i) => (
      <motion.div
        key={i}
        aria-hidden
        className="absolute bottom-[20%] text-2xl"
        style={{ left: `${30 + i * 20}%` }}
        animate={{ rotate: [-4, 4, -4] }}
        transition={{ duration: 3 + i * 0.4, repeat: Infinity, delay: i * 0.3, ease: "easeInOut" }}
      >
        🌾
      </motion.div>
    ))}
    {[...Array(6)].map((_, i) => (
      <motion.span
        key={`grain-${i}`}
        aria-hidden
        className="absolute top-0 h-1 w-1 rounded-full"
        style={{ left: `${20 + ((i * 13) % 70)}%`, background: "#eab308" }}
        initial={{ y: "-10%", opacity: 0 }}
        animate={{ y: "110%", opacity: [0, 0.9, 0] }}
        transition={{ duration: 3.5 + (i % 3), repeat: Infinity, delay: i * 0.5, ease: "linear" }}
      />
    ))}
  </>
);

const OliveBranch = () => (
  <>
    <motion.div
      aria-hidden
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
      style={{ width: 60, height: 60, background: "radial-gradient(circle, rgba(134,239,172,0.35), transparent 70%)" }}
      animate={{ scale: [0.8, 1.15, 0.8], opacity: [0.4, 0.7, 0.4] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
    />
    {[...Array(5)].map((_, i) => (
      <motion.span
        key={i}
        aria-hidden
        className="absolute text-lg"
        style={{ left: `${20 + i * 15}%`, top: `${40 + (i % 2 === 0 ? -8 : 8)}%` }}
        animate={{ rotate: [0, i % 2 === 0 ? 10 : -10, 0], y: [0, -3, 0] }}
        transition={{ duration: 2.8, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
      >
        🌿
      </motion.span>
    ))}
  </>
);

const FlameEmber = () => (
  <>
    <motion.div
      aria-hidden
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl"
      animate={{ scale: [1, 1.1, 0.95, 1.08, 1], rotate: [0, -3, 2, -2, 0] }}
      transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
    >
      🔥
    </motion.div>
    {[...Array(6)].map((_, i) => (
      <motion.span
        key={i}
        aria-hidden
        className="absolute bottom-[38%] h-1 w-1 rounded-full"
        style={{ left: `${44 + ((i * 7) % 14) - 7}%`, background: "#fb923c" }}
        initial={{ y: 0, opacity: 0 }}
        animate={{ y: "-160%", x: [0, (i % 2 === 0 ? 1 : -1) * 8], opacity: [0, 0.9, 0] }}
        transition={{ duration: 2.2 + (i % 3) * 0.4, repeat: Infinity, delay: i * 0.35, ease: "easeOut" }}
      />
    ))}
  </>
);

const LightPath = () => (
  <>
    <div
      aria-hidden
      className="absolute inset-x-0 bottom-[38%] h-px"
      style={{ background: "linear-gradient(90deg, transparent, rgba(253,230,138,0.6), transparent)" }}
    />
    {[...Array(5)].map((_, i) => (
      <motion.span
        key={i}
        aria-hidden
        className="absolute bottom-[36%] h-1.5 w-1.5 rounded-full"
        style={{ left: `${10 + i * 18}%`, background: "#fde68a", boxShadow: "0 0 8px rgba(253,230,138,0.9)" }}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: [0, 1, 0.3], scale: [0.6, 1.2, 0.9] }}
        transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }}
      />
    ))}
  </>
);

const TrumpetFanfare = () => (
  <>
    <motion.div
      aria-hidden
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl"
      animate={{ rotate: [0, -8, 0], scale: [1, 1.08, 1] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
    >
      🎺
    </motion.div>
    {[...Array(3)].map((_, i) => (
      <motion.div
        key={i}
        aria-hidden
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ border: "1.5px solid rgba(251,191,36,0.6)" }}
        initial={{ width: 10, height: 10, opacity: 0 }}
        animate={{ width: [10, 90], height: [10, 90], opacity: [0, 0.6, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.6, ease: "easeOut" }}
      />
    ))}
  </>
);

const ShieldGuard = () => (
  <>
    <motion.div
      aria-hidden
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl"
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
    >
      🛡️
    </motion.div>
    <motion.div
      aria-hidden
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
      style={{ border: "1.5px solid rgba(212,175,55,0.55)" }}
      initial={{ width: 20, height: 20, opacity: 0.6 }}
      animate={{ width: [20, 80, 20], height: [20, 80, 20], opacity: [0.6, 0, 0.6] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    />
  </>
);

const GlobeLights = () => (
  <>
    <motion.div
      aria-hidden
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl"
      animate={{ rotate: 360 }}
      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
    >
      🌍
    </motion.div>
    {[...Array(4)].map((_, i) => (
      <motion.span
        key={i}
        aria-hidden
        className="absolute h-1 w-1 rounded-full"
        style={{ left: `${25 + ((i * 17) % 55)}%`, top: `${30 + ((i * 23) % 40)}%`, background: "#fde68a" }}
        animate={{ opacity: [0, 1, 0], scale: [0.6, 1.4, 0.6] }}
        transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.5, ease: "easeInOut" }}
      />
    ))}
  </>
);

const CrownHonor = () => (
  <>
    <motion.div
      aria-hidden
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl"
      initial={{ y: -14, opacity: 0 }}
      animate={{ y: [-14, 0, 0], opacity: [0, 1, 1] }}
      transition={{ duration: 2.6, repeat: Infinity, times: [0, 0.4, 1], ease: "easeOut" }}
    >
      👑
    </motion.div>
    {[...Array(6)].map((_, i) => (
      <motion.span
        key={i}
        aria-hidden
        className="absolute left-1/2 top-1/2 h-1 w-1 rounded-full"
        style={{ background: "#fde68a" }}
        initial={{ x: "-50%", y: "-50%", opacity: 0 }}
        animate={{
          x: `${-50 + Math.cos(i * 1.05) * 40}%`,
          y: `${-50 + Math.sin(i * 1.05) * 40}%`,
          opacity: [0, 0.9, 0],
        }}
        transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.3, ease: "easeOut" }}
      />
    ))}
  </>
);

const BlessingBox = () => (
  <>
    <motion.div
      aria-hidden
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl"
      animate={{ rotate: [0, -4, 4, 0] }}
      transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
    >
      🎁
    </motion.div>
    {[...Array(6)].map((_, i) => (
      <motion.span
        key={i}
        aria-hidden
        className="absolute left-1/2 top-1/2 h-1 w-1 rounded-full"
        style={{ background: "#fde68a" }}
        initial={{ x: "-50%", y: "-20%", opacity: 0 }}
        animate={{ y: "-140%", x: `${-50 + (i % 2 === 0 ? -1 : 1) * (10 + i * 4)}%`, opacity: [0, 0.9, 0] }}
        transition={{ duration: 2.6, repeat: Infinity, delay: i * 0.4, ease: "easeOut" }}
      />
    ))}
  </>
);

const CrystalShimmer = () => (
  <>
    <motion.div
      aria-hidden
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl"
      animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.06, 1] }}
      transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
    >
      💎
    </motion.div>
    {[...Array(4)].map((_, i) => (
      <motion.div
        key={i}
        aria-hidden
        className="absolute top-0 h-full w-4 opacity-0"
        style={{ left: `${30 + i * 15}%`, background: "linear-gradient(180deg, rgba(191,219,254,0.5), transparent)" }}
        animate={{ opacity: [0, 0.5, 0] }}
        transition={{ duration: 2.6, repeat: Infinity, delay: i * 0.5, ease: "easeInOut" }}
      />
    ))}
  </>
);

const RENDERERS: Record<GiftAnimationKind, () => JSX.Element> = {
  petals: Petals,
  handshake: Handshake,
  heartbeat: Heartbeat,
  "prayer-light": PrayerLight,
  "dove-flight": DoveFlight,
  "star-twinkle": StarTwinkle,
  "wheat-harvest": WheatHarvest,
  "olive-branch": OliveBranch,
  "flame-ember": FlameEmber,
  "light-path": LightPath,
  "trumpet-fanfare": TrumpetFanfare,
  "shield-guard": ShieldGuard,
  "globe-lights": GlobeLights,
  "crown-honor": CrownHonor,
  "blessing-box": BlessingBox,
  "crystal-shimmer": CrystalShimmer,
};

export const GiftRevealAnimation = ({ kind, onRevealComplete }: GiftRevealAnimationProps) => {
  const reduced = useReducedMotion();

  if (reduced) {
    // acessibilidade: nada de movimento contínuo — só um fade simples
    return (
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(circle at 50% 40%, rgba(253,230,138,0.15), transparent 70%)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        onAnimationComplete={onRevealComplete}
        aria-hidden
      />
    );
  }

  const Renderer = RENDERERS[kind];
  return (
    <motion.div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      onAnimationComplete={onRevealComplete}
      aria-hidden
    >
      <Renderer />
    </motion.div>
  );
};

export default GiftRevealAnimation;
