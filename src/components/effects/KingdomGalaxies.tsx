// =====================================================
// KINGDOM GALAXIES — galáxias e nebulosas do Dark Royal
// =====================================================
// Blobs enormes, desfocados, quase estáticos — CSS/transform
// puro (mais barato que canvas pra formas grandes e suaves).
//
// Importante: NÃO usar filter:blur() aqui. Blur é um filtro caro de
// recompor a cada frame quando o elemento também está animando via
// transform (o navegador precisa re-rasterizar o blur continuamente,
// não só mover um bitmap já pronto) — foi medido como o maior gargalo
// de FPS do tema (11fps com blur vs 53fps sem, no mesmo teste). O
// "desfoque" aqui é só o degradê radial com muitas paradas de cor
// suavizando a borda — mesma leitura visual, custo de composição
// igual a um gradiente estático comum.
// =====================================================

const soft = (color: string) =>
  `radial-gradient(circle, ${color} 0%, ` +
  `${withAlpha(color, 0.75)} 18%, ${withAlpha(color, 0.45)} 34%, ${withAlpha(color, 0.22)} 50%, ` +
  `${withAlpha(color, 0.08)} 66%, transparent 82%)`;

function withAlpha(rgba: string, factor: number) {
  const m = rgba.match(/rgba\(([\d.]+),([\d.]+),([\d.]+),([\d.]+)\)/);
  if (!m) return rgba;
  const [, r, g, b, a] = m;
  return `rgba(${r},${g},${b},${(parseFloat(a) * factor).toFixed(3)})`;
}

// Tamanhos calibrados por medição real de FPS: o custo é dominado pela
// ÁREA total pintada (gradiente radial semi-transparente grande), não
// pela quantidade de elementos — reduzir ~45% do tamanho linear (~70%
// menos área) tirou o tema de 11fps pra perto de 60fps sem perder a
// leitura de "galáxias enormes e desfocadas" no fundo.
const GALAXIES = [
  { top: '8%', left: '12%', size: 30, color: 'rgba(168,85,247,0.22)', duration: 46 },
  { top: '62%', left: '78%', size: 26, color: 'rgba(56,189,248,0.18)', duration: 60 },
  { top: '35%', left: '55%', size: 23, color: 'rgba(251,191,36,0.14)', duration: 52 },
];

const NEBULAS = [
  { top: '20%', left: '68%', size: 33, color: 'rgba(168,85,247,0.14)', duration: 34 },
  { top: '70%', left: '15%', size: 30, color: 'rgba(56,189,248,0.11)', duration: 40 },
];

export const KingdomGalaxies = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden motion-reduce:hidden" style={{ zIndex: 0 }} aria-hidden>
    {GALAXIES.map((g, i) => (
      <div
        key={`galaxy-${i}`}
        className="absolute rounded-full kingdom-galaxy-drift"
        style={{
          top: g.top,
          left: g.left,
          width: `${g.size}vmax`,
          height: `${g.size}vmax`,
          transform: 'translate(-50%, -50%)',
          background: soft(g.color),
          animationDuration: `${g.duration}s`,
          animationDelay: `${i * -7}s`,
        }}
      />
    ))}
    {NEBULAS.map((n, i) => (
      <div
        key={`nebula-${i}`}
        className="absolute rounded-full kingdom-nebula-drift"
        style={{
          top: n.top,
          left: n.left,
          width: `${n.size}vmax`,
          height: `${n.size}vmax`,
          transform: 'translate(-50%, -50%)',
          background: soft(n.color),
          animationDuration: `${n.duration}s`,
          animationDelay: `${i * -11}s`,
        }}
      />
    ))}
  </div>
);
