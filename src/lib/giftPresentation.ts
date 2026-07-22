import { supabase } from "@/integrations/supabase/client";

const sb = supabase as any;

// ============================================================
// Raridade → identidade visual do presente
// ============================================================
export type GiftRarity = "comum" | "incomum" | "raro" | "epico" | "lendario" | "exclusivo";

export interface RarityStyle {
  label: string;
  /** cor base do glow/moldura */
  glow: string;
  /** gradiente da moldura (2 tons) */
  rim: [string, string];
  holographic?: boolean;
}

export const GIFT_RARITY_STYLES: Record<GiftRarity, RarityStyle> = {
  comum: { label: "Comum", glow: "rgba(255,255,255,0.55)", rim: ["#f4f4f5", "#a1a1aa"] },
  incomum: { label: "Incomum", glow: "rgba(34,197,94,0.55)", rim: ["#86efac", "#16a34a"] },
  raro: { label: "Raro", glow: "rgba(59,130,246,0.55)", rim: ["#93c5fd", "#2563eb"] },
  epico: { label: "Épico", glow: "rgba(147,51,234,0.6)", rim: ["#d8b4fe", "#7c3aed"] },
  lendario: { label: "Lendário", glow: "rgba(217,119,6,0.65)", rim: ["#fde68a", "#b45309"] },
  exclusivo: { label: "Exclusivo", glow: "rgba(245,208,96,0.75)", rim: ["#fff8dc", "#f5d060"], holographic: true },
};

export const rarityStyle = (r: string | null | undefined): RarityStyle =>
  GIFT_RARITY_STYLES[(r as GiftRarity) || "comum"] || GIFT_RARITY_STYLES.comum;

// ============================================================
// Partícula + mensagem de fechamento por presente (mapeadas por
// palavra-chave do NOME — sem precisar de coluna nova no banco).
// ============================================================
export type ParticleKind = "leaves" | "gold-dust" | "crystals" | "stars" | "light-rays" | "embers" | "wheat" | "notes" | "map-lights" | "hearts" | "sparkles";

interface GiftTheme {
  particle: ParticleKind;
  closingMessage: string;
}

const THEME_BY_KEYWORD: [string, GiftTheme][] = [
  ["oliveira", { particle: "leaves", closingMessage: "Que a paz de Cristo reine em seu coração e fortaleça seus relacionamentos." }],
  ["escudo", { particle: "gold-dust", closingMessage: "Permaneça firme. O Senhor é sua proteção em todos os momentos." }],
  ["cristal", { particle: "crystals", closingMessage: "A fidelidade cultivada hoje refletirá a glória de Deus amanhã." }],
  ["bênção", { particle: "stars", closingMessage: "Abra o coração — as bênçãos de Deus não têm medida." }],
  ["bencao", { particle: "stars", closingMessage: "Abra o coração — as bênçãos de Deus não têm medida." }],
  ["luz do caminho", { particle: "light-rays", closingMessage: "Cada passo se ilumina quando caminhamos com a Palavra." }],
  ["chama", { particle: "embers", closingMessage: "Mesmo na noite mais escura, Deus continua acendendo a esperança." }],
  ["trigo", { particle: "wheat", closingMessage: "O que é semeado com fé sempre gera uma colheita de bênção." }],
  ["trombeta", { particle: "notes", closingMessage: "Celebre com gratidão, pois toda vitória pertence ao Senhor." }],
  ["missionário", { particle: "map-lights", closingMessage: "Onde quer que você vá, a luz de Cristo vai com você." }],
  ["missionario", { particle: "map-lights", closingMessage: "Onde quer que você vá, a luz de Cristo vai com você." }],
  ["globo", { particle: "map-lights", closingMessage: "Onde quer que você vá, a luz de Cristo vai com você." }],
  ["coração", { particle: "hearts", closingMessage: "Um coração grato é um coração que enxerga a Deus em tudo." }],
  ["coracao", { particle: "hearts", closingMessage: "Um coração grato é um coração que enxerga a Deus em tudo." }],
  ["rosa", { particle: "hearts", closingMessage: "Que este gesto floresça em gratidão na sua caminhada." }],
  ["pomba", { particle: "leaves", closingMessage: "A paz de Deus, que excede todo entendimento, guarde seu coração." }],
  ["estrela", { particle: "stars", closingMessage: "A esperança em Deus nunca decepciona — Ele é fiel." }],
  ["coroa", { particle: "gold-dust", closingMessage: "Persevere — uma coroa de vida está reservada para quem ama a Deus." }],
  ["oração", { particle: "sparkles", closingMessage: "Saiba que alguém orou por você hoje. Você não caminha sozinho." }],
  ["oracao", { particle: "sparkles", closingMessage: "Saiba que alguém orou por você hoje. Você não caminha sozinho." }],
  ["mão", { particle: "sparkles", closingMessage: "Um gesto simples que diz: eu estou com você." }],
  ["mao", { particle: "sparkles", closingMessage: "Um gesto simples que diz: eu estou com você." }],
];

export function giftThemeFor(name: string): GiftTheme {
  const n = (name || "").toLowerCase();
  for (const [kw, theme] of THEME_BY_KEYWORD) {
    if (n.includes(kw)) return theme;
  }
  return { particle: "sparkles", closingMessage: "Que este presente fortaleça sua caminhada com Cristo." };
}

/** "comemorativo" libera confete extra ao abrir (vitória/celebração) */
export function isCelebratory(name: string): boolean {
  const n = (name || "").toLowerCase();
  return n.includes("trombeta") || n.includes("vitória") || n.includes("vitoria") || n.includes("coroa");
}

// ============================================================
// Animação de revelação exclusiva por presente — mapeada pelo
// slug (estável, não muda se o nome de exibição mudar). Cobre
// todos os presentes da loja; cada um tem sua própria assinatura
// visual coerente com o significado do presente.
// ============================================================
export type GiftAnimationKind =
  | "petals"
  | "handshake"
  | "heartbeat"
  | "prayer-light"
  | "dove-flight"
  | "star-twinkle"
  | "wheat-harvest"
  | "olive-branch"
  | "flame-ember"
  | "light-path"
  | "trumpet-fanfare"
  | "shield-guard"
  | "globe-lights"
  | "crown-honor"
  | "blessing-box"
  | "crystal-shimmer";

const ANIMATION_BY_SLUG: Record<string, GiftAnimationKind> = {
  "rosa-da-gratidao": "petals",
  "aperto-de-mao-fraterno": "handshake",
  "coracao-de-gratidao": "heartbeat",
  "oracao-por-voce": "prayer-light",
  "pomba-da-paz": "dove-flight",
  "estrela-da-esperanca": "star-twinkle",
  "feixe-de-trigo": "wheat-harvest",
  "ramo-de-oliveira": "olive-branch",
  "chama-da-esperanca": "flame-ember",
  "luz-do-caminho": "light-path",
  "trombeta-da-vitoria": "trumpet-fanfare",
  "escudo-da-fe": "shield-guard",
  "globo-missionario": "globe-lights",
  "coroa-da-honra": "crown-honor",
  "caixa-de-bencaos": "blessing-box",
  "cristal-da-fidelidade": "crystal-shimmer",
};

export function giftAnimationFor(slug: string | null | undefined): GiftAnimationKind | null {
  if (!slug) return null;
  return ANIMATION_BY_SLUG[slug] ?? null;
}

// ============================================================
// Cor primária por presente — usada pra derivar automaticamente o
// glow, o gradiente de fundo e as sombras da modal de preview, sem
// precisar estilizar cada presente na mão. rgb fica separado do hex
// só pra facilitar montar rgba(...) nos estilos inline.
// ============================================================
export interface GiftColorTheme {
  hex: string;
  rgb: string;
}

const DEFAULT_GIFT_COLOR: GiftColorTheme = { hex: "#f43f5e", rgb: "244,63,94" };

const COLOR_BY_SLUG: Record<string, GiftColorTheme> = {
  "rosa-da-gratidao": { hex: "#f43f5e", rgb: "244,63,94" },
  "aperto-de-mao-fraterno": { hex: "#d4930d", rgb: "212,147,13" },
  "coracao-de-gratidao": { hex: "#dc2626", rgb: "220,38,38" },
  "oracao-por-voce": { hex: "#fbbf24", rgb: "251,191,36" },
  "pomba-da-paz": { hex: "#7dd3fc", rgb: "125,211,252" },
  "estrela-da-esperanca": { hex: "#f59e0b", rgb: "245,158,11" },
  "feixe-de-trigo": { hex: "#eab308", rgb: "234,179,8" },
  "ramo-de-oliveira": { hex: "#22c55e", rgb: "34,197,94" },
  "chama-da-esperanca": { hex: "#f97316", rgb: "249,115,22" },
  "luz-do-caminho": { hex: "#fcd34d", rgb: "252,211,77" },
  "trombeta-da-vitoria": { hex: "#f59e0b", rgb: "245,158,11" },
  "escudo-da-fe": { hex: "#60a5fa", rgb: "96,165,250" },
  "globo-missionario": { hex: "#0ea5e9", rgb: "14,165,233" },
  "coroa-da-honra": { hex: "#f59e0b", rgb: "245,158,11" },
  "caixa-de-bencaos": { hex: "#fb7185", rgb: "251,113,133" },
  "cristal-da-fidelidade": { hex: "#38bdf8", rgb: "56,189,248" },
};

export function giftColorFor(slug: string | null | undefined): GiftColorTheme {
  return (slug && COLOR_BY_SLUG[slug]) || DEFAULT_GIFT_COLOR;
}

// ============================================================
// Versículo: busca sempre na Bíblia já importada no Supabase
// (bible_books + bible_verses) — nunca duplica texto bíblico.
// Aceita "Livro Cap:Verso" (ex.: "João 3:16"); ranges como
// "Lamentações 3:22-23" caem no fallback (texto já salvo no produto).
// ============================================================
export interface FetchedVerse {
  reference: string;
  text: string;
}

export async function fetchGiftVerse(
  reference: string | null | undefined,
  fallbackText: string | null | undefined,
): Promise<FetchedVerse | null> {
  if (!reference) return null;

  const match = reference.trim().match(/^(.+?)\s+(\d+):(\d+)$/);
  if (!match) {
    return fallbackText ? { reference, text: fallbackText } : null;
  }
  const [, book, chapterStr, verseStr] = match;
  const chapter = Number(chapterStr);
  const verse = Number(verseStr);

  try {
    const { data: bookRow } = await sb
      .from("bible_books")
      .select("id, name")
      .ilike("name", book.trim())
      .maybeSingle();
    if (bookRow?.id) {
      const { data: verseRow } = await sb
        .from("bible_verses")
        .select("text")
        .eq("book_id", bookRow.id)
        .eq("chapter", chapter)
        .eq("verse", verse)
        .maybeSingle();
      if (verseRow?.text) {
        return { reference: `${bookRow.name} ${chapter}:${verse}`, text: verseRow.text };
      }
    }
  } catch {
    // silencioso — cai no fallback abaixo
  }
  return fallbackText ? { reference, text: fallbackText } : null;
}
