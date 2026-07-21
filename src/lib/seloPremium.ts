import { supabase } from "@/integrations/supabase/client";

const sb = supabase as any;

// ============================================================
// Conteúdo curado por categoria — frase de impacto, reflexão e
// "Poder Kingdom" (mensagem inspiradora, nunca vantagem funcional).
// ============================================================
export interface SeloThemeContent {
  impactPhrases: string[];
  reflection: string;
  kingdomPowerIcon: string;
  kingdomPowerTitle: string;
  kingdomPower: string;
}

const DEFAULT_THEME: SeloThemeContent = {
  impactPhrases: [
    "✨ Você faz parte desta missão.",
    "✨ Cada gesto de amor alcança vidas.",
    "✨ Deus usa pessoas comuns para realizar obras extraordinárias.",
  ],
  reflection:
    "Cada passo dado com fé se soma a uma obra maior. O que parece pequeno aos nossos olhos, nas mãos de Deus, alcança vidas que nunca saberemos os nomes — mas Ele conhece cada uma delas.",
  kingdomPowerIcon: "👑",
  kingdomPowerTitle: "Poder Kingdom",
  kingdomPower: "Grandes missões são construídas por pequenos gestos feitos com amor.",
};

const THEME_BY_CATEGORY: Record<string, SeloThemeContent> = {
  "Apoiadores": {
    impactPhrases: [
      "✨ Seu apoio fortalece uma missão que alcança milhares.",
      "✨ Cada contribuição mantém a Palavra acessível a todos.",
      "✨ Você ajuda a sustentar um espaço de fé e comunhão.",
    ],
    reflection:
      "A generosidade é uma forma prática de demonstrar amor ao próximo. Cada contribuição feita com alegria fortalece uma obra que continua anunciando o Evangelho a quem precisa ouvir.",
    kingdomPowerIcon: "🛡️",
    kingdomPowerTitle: "Poder Kingdom",
    kingdomPower: "A sua fidelidade fortalece uma obra que continuará anunciando Cristo.",
  },
  "Doações": {
    impactPhrases: [
      "✨ Deus ama quem doa com alegria.",
      "✨ O que sai da sua mão, Deus multiplica.",
      "✨ Sua semente hoje é colheita de vidas amanhã.",
    ],
    reflection:
      "Doar não é apenas dar recursos — é participar de uma obra maior que você. Cada oferta plantada com fé se torna alimento espiritual para alguém que você talvez nunca conheça neste lado da eternidade.",
    kingdomPowerIcon: "🌾",
    kingdomPowerTitle: "Poder Kingdom",
    kingdomPower: "O que é semeado em amor nunca volta vazio.",
  },
  "Comunidade": {
    impactPhrases: [
      "✨ Juntos somos mais fortes na fé.",
      "✨ A comunhão fortalece quem caminha ao seu lado.",
      "✨ Ninguém foi feito pra caminhar sozinho.",
    ],
    reflection:
      "A fé cristã floresce em comunidade. Ao se envolver com os irmãos, você não apenas recebe — você se torna parte do sustento espiritual de quem está ao seu redor.",
    kingdomPowerIcon: "🤝",
    kingdomPowerTitle: "Poder Kingdom",
    kingdomPower: "Onde dois ou três se reúnem em seu nome, Ele está no meio.",
  },
  "Devocional": {
    impactPhrases: [
      "✨ A constância no altar forma o caráter.",
      "✨ Cada momento com Deus renova suas forças.",
      "✨ A intimidade diária muda a caminhada inteira.",
    ],
    reflection:
      "O hábito de buscar a Deus todos os dias não é sobre perfeição, é sobre persistência. Cada momento de devoção fortalece uma caminhada que ninguém mais vê — mas Deus vê e honra.",
    kingdomPowerIcon: "🕊️",
    kingdomPowerTitle: "Poder Kingdom",
    kingdomPower: "Quem busca a Deus todos os dias colhe paz em todas as estações.",
  },
  "Especiais": {
    impactPhrases: [
      "✨ Este momento é único na sua caminhada.",
      "✨ Deus marca tempos especiais na vida de quem O serve.",
      "✨ Alguns selos contam histórias que só o céu registra por completo.",
    ],
    reflection:
      "Há momentos que Deus separa como marcos — não por serem grandes aos olhos humanos, mas por representarem fidelidade em um tempo específico da sua caminhada com Ele.",
    kingdomPowerIcon: "✨",
    kingdomPowerTitle: "Poder Kingdom",
    kingdomPower: "Cada marco de fidelidade é lembrado por Aquele que tudo vê.",
  },
  "Estudos": {
    impactPhrases: [
      "✨ Quem estuda a Palavra se transforma por dentro.",
      "✨ Cada capítulo lido planta uma semente de sabedoria.",
      "✨ A Palavra é lâmpada pros seus pés, luz pro seu caminho.",
    ],
    reflection:
      "Estudar as Escrituras não é acumular conhecimento — é permitir que a Palavra molde a mente e o coração. Cada capítulo lido é um passo mais perto de conhecer Aquele que a inspirou.",
    kingdomPowerIcon: "📖",
    kingdomPowerTitle: "Poder Kingdom",
    kingdomPower: "Quem se alimenta da Palavra cresce firme, mesmo em tempos de tempestade.",
  },
  "Evangelismo": {
    impactPhrases: [
      "✨ Cada vida alcançada é uma vitória do Reino.",
      "✨ Você é parte de como o Evangelho chega a alguém.",
      "✨ Compartilhar a fé é multiplicar esperança.",
    ],
    reflection:
      "Levar a Palavra a outra pessoa é um dos gestos mais eternos que existem — tudo o mais passa, mas uma vida tocada pelo Evangelho carrega fruto que nunca se apaga.",
    kingdomPowerIcon: "🔥",
    kingdomPowerTitle: "Poder Kingdom",
    kingdomPower: "Quem permanece firme hoje ajuda milhares de pessoas a encontrarem esperança amanhã.",
  },
  "Liderança": {
    impactPhrases: [
      "✨ Servir com excelência é a marca de quem lidera pelo exemplo.",
      "✨ Grandes líderes constroem obras que continuam depois deles.",
      "✨ Liderar no Reino é servir primeiro.",
    ],
    reflection:
      "Liderança cristã não se mede por posição, mas por serviço. Cada gesto de cuidado com quem está ao seu redor edifica uma obra que continuará frutificando muito além do seu alcance.",
    kingdomPowerIcon: "👑",
    kingdomPowerTitle: "Poder Kingdom",
    kingdomPower: "Sobre esta pedra edificarei — toda construção começa com alguém disposto a servir primeiro.",
  },
  "Nível": {
    impactPhrases: [
      "✨ Cada nível é fruto de constância e fé.",
      "✨ Você está crescendo um passo de cada vez.",
      "✨ Perseverança é a marca de quem chega longe.",
    ],
    reflection:
      "O crescimento espiritual raramente acontece de uma vez — é construído dia após dia, com pequenas escolhas de fidelidade que, somadas, revelam um caráter formado por Deus.",
    kingdomPowerIcon: "📈",
    kingdomPowerTitle: "Poder Kingdom",
    kingdomPower: "Quem persevera na jornada colhe um caráter que o tempo não apaga.",
  },
  "Quiz": {
    impactPhrases: [
      "✨ Conhecer a Palavra é o primeiro passo pra vivê-la.",
      "✨ Cada acerto é sinal de uma mente que busca a Deus.",
      "✨ Aprender com alegria também é adoração.",
    ],
    reflection:
      "Testar o próprio conhecimento das Escrituras, com humildade e alegria, é uma forma de manter viva a curiosidade pela Palavra — e curiosidade genuína sempre abre espaço pra mais fé.",
    kingdomPowerIcon: "🧠",
    kingdomPowerTitle: "Poder Kingdom",
    kingdomPower: "A sabedoria começa no temor do Senhor — e cresce em quem busca aprender.",
  },
  "Sequência": {
    impactPhrases: [
      "✨ A constância revela o que o coração realmente valoriza.",
      "✨ Cada dia fiel é um tijolo numa caminhada sólida.",
      "✨ Persistir é um ato de fé silencioso e poderoso.",
    ],
    reflection:
      "Manter uma sequência de fidelidade não é sobre nunca falhar — é sobre voltar, dia após dia, com o coração disposto. Deus honra a constância mais do que a perfeição.",
    kingdomPowerIcon: "🔥",
    kingdomPowerTitle: "Poder Kingdom",
    kingdomPower: "Quem semeia com constância, mesmo devagar, colhe uma fé enraizada.",
  },
};

export function seloThemeFor(category: string | null | undefined): SeloThemeContent {
  if (!category) return DEFAULT_THEME;
  return THEME_BY_CATEGORY[category] || DEFAULT_THEME;
}

export function pickImpactPhrase(theme: SeloThemeContent, seed: string): string {
  const idx = Math.abs(hashString(seed)) % theme.impactPhrases.length;
  return theme.impactPhrases[idx];
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

// ============================================================
// Estatísticas reais da missão (nunca fabricadas) — uma única
// busca reaproveitada por todos os selos numa mesma sessão.
// ============================================================
export interface MissionStats {
  estudos_realizados: number;
  oracoes_enviadas: number;
  presentes_compartilhados: number;
  testemunhos_compartilhados: number;
  membros_ativos: number;
}

let missionStatsCache: MissionStats | null = null;

export async function fetchMissionStats(): Promise<MissionStats | null> {
  if (missionStatsCache) return missionStatsCache;
  try {
    const { data, error } = await sb.rpc("get_kingdom_mission_stats");
    if (error || !data) return null;
    missionStatsCache = data as MissionStats;
    return missionStatsCache;
  } catch {
    return null;
  }
}
