import { supabase } from "@/integrations/supabase/client";

const sb = supabase as any;

/**
 * Pools temáticos de versículos para a Revelação dos Selos.
 * O texto oficial vem da Bíblia Almeida já importada no Supabase
 * (bible_books + bible_verses); o `fallback` só entra se a busca falhar,
 * pra revelação nunca quebrar.
 */
export interface RevealVerseRef {
  book: string;
  chapter: number;
  verse: number;
  fallback: string;
}

export interface RevealedVerse {
  reference: string;
  text: string;
}

const POOLS: Record<string, RevealVerseRef[]> = {
  parceria: [
    { book: "Filipenses", chapter: 1, verse: 3, fallback: "Dou graças ao meu Deus todas as vezes que me lembro de vós." },
    { book: "Filipenses", chapter: 4, verse: 17, fallback: "Não que procure dádivas, mas procuro o fruto que aumente a vossa conta." },
    { book: "2 Coríntios", chapter: 9, verse: 7, fallback: "Cada um contribua segundo propôs no seu coração; não com tristeza, ou por necessidade; porque Deus ama ao que dá com alegria." },
    { book: "Provérbios", chapter: 11, verse: 25, fallback: "A alma generosa prosperará, e aquele que atende também será atendido." },
    { book: "Lucas", chapter: 6, verse: 38, fallback: "Dai, e ser-vos-á dado; boa medida, recalcada, sacudida e transbordando vos darão." },
    { book: "Mateus", chapter: 6, verse: 21, fallback: "Porque onde estiver o vosso tesouro, aí estará também o vosso coração." },
    { book: "Eclesiastes", chapter: 4, verse: 9, fallback: "Melhor é serem dois do que um, porque têm melhor paga do seu trabalho." },
    { book: "Hebreus", chapter: 13, verse: 16, fallback: "E não vos esqueçais da beneficência e comunicação, porque com tais sacrifícios Deus se agrada." },
  ],
  gratidao: [
    { book: "Salmos", chapter: 100, verse: 4, fallback: "Entrai pelas portas dele com gratidão, e em seus átrios com louvor; louvai-o, e bendizei o seu nome." },
    { book: "1 Tessalonicenses", chapter: 5, verse: 18, fallback: "Em tudo dai graças, porque esta é a vontade de Deus em Cristo Jesus para convosco." },
    { book: "Salmos", chapter: 103, verse: 2, fallback: "Bendize, ó minha alma, ao Senhor, e não te esqueças de nenhum de seus benefícios." },
    { book: "Colossenses", chapter: 3, verse: 17, fallback: "E, quanto fizerdes por palavras ou por obras, fazei tudo em nome do Senhor Jesus, dando por ele graças a Deus Pai." },
    { book: "Salmos", chapter: 118, verse: 24, fallback: "Este é o dia que fez o Senhor; regozijemo-nos, e alegremo-nos nele." },
    { book: "Tiago", chapter: 1, verse: 17, fallback: "Toda a boa dádiva e todo o dom perfeito vem do alto, descendo do Pai das luzes." },
  ],
  proposito: [
    { book: "Jeremias", chapter: 29, verse: 11, fallback: "Porque eu bem sei os pensamentos que tenho a vosso respeito, diz o Senhor; pensamentos de paz, e não de mal, para vos dar o fim que esperais." },
    { book: "Provérbios", chapter: 16, verse: 3, fallback: "Confia ao Senhor as tuas obras, e teus pensamentos serão estabelecidos." },
    { book: "Salmos", chapter: 37, verse: 5, fallback: "Entrega o teu caminho ao Senhor; confia nele, e ele o fará." },
    { book: "Efésios", chapter: 2, verse: 10, fallback: "Porque somos feitura sua, criados em Cristo Jesus para as boas obras, as quais Deus preparou para que andássemos nelas." },
    { book: "Salmos", chapter: 119, verse: 105, fallback: "Lâmpada para os meus pés é tua palavra, e luz para o meu caminho." },
    { book: "Josué", chapter: 1, verse: 9, fallback: "Não to mandei eu? Esforça-te, e tem bom ânimo; não temas, nem te espantes; porque o Senhor teu Deus é contigo, por onde quer que andares." },
  ],
  fe: [
    { book: "Hebreus", chapter: 11, verse: 1, fallback: "Ora, a fé é o firme fundamento das coisas que se esperam, e a prova das coisas que se não vêem." },
    { book: "Salmos", chapter: 23, verse: 1, fallback: "O Senhor é o meu pastor, nada me faltará." },
    { book: "Isaías", chapter: 41, verse: 10, fallback: "Não temas, porque eu sou contigo; não te assombres, porque eu sou o teu Deus; eu te esforço, e te ajudo, e te sustento com a destra da minha justiça." },
    { book: "Filipenses", chapter: 4, verse: 13, fallback: "Posso todas as coisas em Cristo que me fortalece." },
    { book: "Salmos", chapter: 46, verse: 1, fallback: "Deus é o nosso refúgio e fortaleza, socorro bem presente na angústia." },
    { book: "Romanos", chapter: 8, verse: 28, fallback: "E sabemos que todas as coisas contribuem juntamente para o bem daqueles que amam a Deus." },
    { book: "Provérbios", chapter: 3, verse: 5, fallback: "Confia no Senhor de todo o teu coração, e não te estribes no teu próprio entendimento." },
  ],
  comunidade: [
    { book: "Salmos", chapter: 133, verse: 1, fallback: "Oh! quão bom e quão suave é que os irmãos vivam em união." },
    { book: "Mateus", chapter: 18, verse: 20, fallback: "Porque, onde estiverem dois ou três reunidos em meu nome, aí estou eu no meio deles." },
    { book: "Gálatas", chapter: 6, verse: 2, fallback: "Levai as cargas uns dos outros, e assim cumprireis a lei de Cristo." },
    { book: "João", chapter: 13, verse: 34, fallback: "Um novo mandamento vos dou: Que vos ameis uns aos outros; como eu vos amei a vós, que também vós uns aos outros vos ameis." },
    { book: "1 Pedro", chapter: 4, verse: 10, fallback: "Cada um administre aos outros o dom como o recebeu, como bons despenseiros da multiforme graça de Deus." },
    { book: "Eclesiastes", chapter: 4, verse: 12, fallback: "E, se alguém prevalecer contra um, os dois lhe resistirão; e o cordão de três dobras não se quebra tão depressa." },
  ],
};

/** Palavras-chave → tema (avaliadas contra a categoria do selo, minúscula) */
const THEME_KEYWORDS: [string, string][] = [
  ["apoi", "parceria"],
  ["parceir", "parceria"],
  ["doa", "parceria"],
  ["generos", "parceria"],
  ["gratid", "gratidao"],
  ["presente", "gratidao"],
  ["comunidade", "comunidade"],
  ["igreja", "comunidade"],
  ["amizade", "comunidade"],
  ["célula", "comunidade"],
  ["celula", "comunidade"],
  ["estudo", "proposito"],
  ["bíblia", "proposito"],
  ["biblia", "proposito"],
  ["jornada", "proposito"],
  ["propósito", "proposito"],
  ["proposito", "proposito"],
];

export function themeForCategory(category: string | null | undefined): string {
  const cat = (category || "").toLowerCase();
  for (const [kw, theme] of THEME_KEYWORDS) {
    if (cat.includes(kw)) return theme;
  }
  return "fe";
}

function poolForTheme(theme: string): RevealVerseRef[] {
  const pool = POOLS[theme];
  return pool && pool.length > 0 ? pool : POOLS.fe;
}

const formatRef = (r: RevealVerseRef) => `${r.book} ${r.chapter}:${r.verse}`;

/**
 * Sorteia um versículo do pool do tema, evitando os já revelados
 * (quando todos já foram vistos, volta a sortear entre todos).
 */
export function drawVerseRef(theme: string, alreadyRevealed: string[]): RevealVerseRef {
  const pool = poolForTheme(theme);
  const unseen = pool.filter((r) => !alreadyRevealed.includes(formatRef(r)));
  const candidates = unseen.length > 0 ? unseen : pool;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/** Busca o texto oficial na Bíblia Almeida importada; cai no fallback se não achar. */
export async function fetchVerseText(ref: RevealVerseRef): Promise<RevealedVerse> {
  try {
    const { data: book } = await sb
      .from("bible_books")
      .select("id, name")
      .ilike("name", ref.book)
      .maybeSingle();
    if (book?.id) {
      const { data: verse } = await sb
        .from("bible_verses")
        .select("text")
        .eq("book_id", book.id)
        .eq("chapter", ref.chapter)
        .eq("verse", ref.verse)
        .maybeSingle();
      if (verse?.text) {
        return { reference: `${book.name} ${ref.chapter}:${ref.verse}`, text: verse.text };
      }
    }
  } catch {
    // silencioso — a revelação nunca deve quebrar por causa da busca
  }
  return { reference: formatRef(ref), text: ref.fallback };
}
