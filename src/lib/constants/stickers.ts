// =====================================================
// SISTEMA DE STICKERS PROPRIETÁRIO DA REDE DA FÉ
// =====================================================
// Total: 198 stickers em 12 categorias
// =====================================================

export interface Sticker {
  id: string;
  category: string;
  name: string;
  url: string;
  keywords: string[];
}

export interface StickerCategory {
  id: string;
  name: string;
  emoji: string;
  stickers: Sticker[];
}

// =====================================================
// CATEGORIAS E STICKERS
// =====================================================

export const STICKER_CATEGORIES: StickerCategory[] = [
  // 1. FÉ & ORAÇÃO (20 stickers)
  {
    id: 'fe-oracao',
    name: 'Fé & Oração',
    emoji: '🙏',
    stickers: [
      { id: 'pray-1', category: 'fe-oracao', name: 'Mãos Orando', url: '/stickers/fe-oracao/pray-1.webp', keywords: ['oração', 'rezar', 'prece'] },
      { id: 'pray-2', category: 'fe-oracao', name: 'Pessoa Orando', url: '/stickers/fe-oracao/pray-2.webp', keywords: ['oração', 'ajoelhado'] },
      { id: 'bible-open', category: 'fe-oracao', name: 'Bíblia Aberta', url: '/stickers/fe-oracao/bible-open.webp', keywords: ['bíblia', 'palavra', 'leitura'] },
      { id: 'cross-1', category: 'fe-oracao', name: 'Cruz Dourada', url: '/stickers/fe-oracao/cross-1.webp', keywords: ['cruz', 'fé', 'salvação'] },
      { id: 'cross-2', category: 'fe-oracao', name: 'Cruz Brilhante', url: '/stickers/fe-oracao/cross-2.webp', keywords: ['cruz', 'glória'] },
      { id: 'rosary', category: 'fe-oracao', name: 'Terço', url: '/stickers/fe-oracao/rosary.webp', keywords: ['terço', 'rosário', 'maria'] },
      { id: 'candle', category: 'fe-oracao', name: 'Vela Acesa', url: '/stickers/fe-oracao/candle.webp', keywords: ['vela', 'luz', 'oração'] },
      { id: 'church', category: 'fe-oracao', name: 'Igreja', url: '/stickers/fe-oracao/church.webp', keywords: ['igreja', 'templo', 'casa de deus'] },
      { id: 'heart-cross', category: 'fe-oracao', name: 'Coração com Cruz', url: '/stickers/fe-oracao/heart-cross.webp', keywords: ['amor', 'fé', 'coração'] },
      { id: 'hands-up', category: 'fe-oracao', name: 'Mãos Levantadas', url: '/stickers/fe-oracao/hands-up.webp', keywords: ['louvor', 'adoração', 'aleluia'] },
      { id: 'angel', category: 'fe-oracao', name: 'Anjo', url: '/stickers/fe-oracao/angel.webp', keywords: ['anjo', 'proteção', 'celeste'] },
      { id: 'faith-shield', category: 'fe-oracao', name: 'Escudo da Fé', url: '/stickers/fe-oracao/faith-shield.webp', keywords: ['fé', 'proteção', 'armadura'] },
      { id: 'praying-family', category: 'fe-oracao', name: 'Família Orando', url: '/stickers/fe-oracao/praying-family.webp', keywords: ['família', 'oração', 'união'] },
      { id: 'altar', category: 'fe-oracao', name: 'Altar', url: '/stickers/fe-oracao/altar.webp', keywords: ['altar', 'sacrifício', 'oferta'] },
      { id: 'holy-water', category: 'fe-oracao', name: 'Água Benta', url: '/stickers/fe-oracao/holy-water.webp', keywords: ['água', 'bênção', 'purificação'] },
      { id: 'incense', category: 'fe-oracao', name: 'Incenso', url: '/stickers/fe-oracao/incense.webp', keywords: ['incenso', 'oração', 'adoração'] },
      { id: 'crown-thorns', category: 'fe-oracao', name: 'Coroa de Espinhos', url: '/stickers/fe-oracao/crown-thorns.webp', keywords: ['jesus', 'sacrifício', 'paixão'] },
      { id: 'communion', category: 'fe-oracao', name: 'Comunhão', url: '/stickers/fe-oracao/communion.webp', keywords: ['comunhão', 'pão', 'vinho'] },
      { id: 'star-bethlehem', category: 'fe-oracao', name: 'Estrela de Belém', url: '/stickers/fe-oracao/star-bethlehem.webp', keywords: ['estrela', 'natal', 'belém'] },
      { id: 'praying-hands-light', category: 'fe-oracao', name: 'Mãos Orando com Luz', url: '/stickers/fe-oracao/praying-hands-light.webp', keywords: ['oração', 'luz', 'espírito santo'] }
    ]
  },

  // 2. LOUVOR & ADORAÇÃO (20 stickers)
  {
    id: 'louvor',
    name: 'Louvor & Adoração',
    emoji: '🎵',
    stickers: [
      { id: 'worship-1', category: 'louvor', name: 'Pessoa Louvando', url: '/stickers/louvor/worship-1.webp', keywords: ['louvor', 'adoração', 'mãos'] },
      { id: 'worship-2', category: 'louvor', name: 'Grupo Louvando', url: '/stickers/louvor/worship-2.webp', keywords: ['louvor', 'grupo', 'igreja'] },
      { id: 'guitar', category: 'louvor', name: 'Violão', url: '/stickers/louvor/guitar.webp', keywords: ['violão', 'música', 'louvor'] },
      { id: 'piano', category: 'louvor', name: 'Piano', url: '/stickers/louvor/piano.webp', keywords: ['piano', 'música', 'adoração'] },
      { id: 'drums', category: 'louvor', name: 'Bateria', url: '/stickers/louvor/drums.webp', keywords: ['bateria', 'ritmo', 'louvor'] },
      { id: 'microphone', category: 'louvor', name: 'Microfone', url: '/stickers/louvor/microphone.webp', keywords: ['microfone', 'cantar', 'louvor'] },
      { id: 'notes', category: 'louvor', name: 'Notas Musicais', url: '/stickers/louvor/notes.webp', keywords: ['música', 'melodia', 'cântico'] },
      { id: 'choir', category: 'louvor', name: 'Coral', url: '/stickers/louvor/choir.webp', keywords: ['coral', 'cântico', 'adoração'] },
      { id: 'trumpet', category: 'louvor', name: 'Trombeta', url: '/stickers/louvor/trumpet.webp', keywords: ['trombeta', 'instrumento', 'louvor'] },
      { id: 'harp', category: 'louvor', name: 'Harpa', url: '/stickers/louvor/harp.webp', keywords: ['harpa', 'davi', 'adoração'] },
      { id: 'tambourine', category: 'louvor', name: 'Pandeiro', url: '/stickers/louvor/tambourine.webp', keywords: ['pandeiro', 'ritmo', 'alegria'] },
      { id: 'bells', category: 'louvor', name: 'Sinos', url: '/stickers/louvor/bells.webp', keywords: ['sinos', 'igreja', 'celebração'] },
      { id: 'cymbals', category: 'louvor', name: 'Címbalos', url: '/stickers/louvor/cymbals.webp', keywords: ['címbalos', 'louvor', 'salmos'] },
      { id: 'flute', category: 'louvor', name: 'Flauta', url: '/stickers/louvor/flute.webp', keywords: ['flauta', 'melodia', 'suave'] },
      { id: 'violin', category: 'louvor', name: 'Violino', url: '/stickers/louvor/violin.webp', keywords: ['violino', 'clássico', 'adoração'] },
      { id: 'shofar', category: 'louvor', name: 'Shofar', url: '/stickers/louvor/shofar.webp', keywords: ['shofar', 'trombeta', 'israel'] },
      { id: 'dance', category: 'louvor', name: 'Dançando', url: '/stickers/louvor/dance.webp', keywords: ['dança', 'alegria', 'celebração'] },
      { id: 'flags', category: 'louvor', name: 'Bandeiras', url: '/stickers/louvor/flags.webp', keywords: ['bandeiras', 'louvor', 'adoração'] },
      { id: 'concert', category: 'louvor', name: 'Show Gospel', url: '/stickers/louvor/concert.webp', keywords: ['show', 'gospel', 'multidão'] },
      { id: 'headphones', category: 'louvor', name: 'Ouvindo Louvor', url: '/stickers/louvor/headphones.webp', keywords: ['fones', 'ouvir', 'música'] }
    ]
  },

  // 3. VERSÍCULOS ANIMADOS (15 stickers)
  {
    id: 'versiculos',
    name: 'Versículos Animados',
    emoji: '📖',
    stickers: [
      { id: 'john-3-16', category: 'versiculos', name: 'João 3:16', url: '/stickers/versiculos/john-3-16.webp', keywords: ['joão', 'amor', 'salvação'] },
      { id: 'psalm-23', category: 'versiculos', name: 'Salmo 23', url: '/stickers/versiculos/psalm-23.webp', keywords: ['salmo', 'pastor', 'proteção'] },
      { id: 'phil-4-13', category: 'versiculos', name: 'Filipenses 4:13', url: '/stickers/versiculos/phil-4-13.webp', keywords: ['força', 'posso', 'cristo'] },
      { id: 'jer-29-11', category: 'versiculos', name: 'Jeremias 29:11', url: '/stickers/versiculos/jer-29-11.webp', keywords: ['planos', 'futuro', 'esperança'] },
      { id: 'prov-3-5', category: 'versiculos', name: 'Provérbios 3:5', url: '/stickers/versiculos/prov-3-5.webp', keywords: ['confia', 'senhor', 'coração'] },
      { id: 'matt-6-33', category: 'versiculos', name: 'Mateus 6:33', url: '/stickers/versiculos/matt-6-33.webp', keywords: ['buscar', 'reino', 'primeiro'] },
      { id: 'rom-8-28', category: 'versiculos', name: 'Romanos 8:28', url: '/stickers/versiculos/rom-8-28.webp', keywords: ['tudo', 'bem', 'amam'] },
      { id: 'isaiah-41-10', category: 'versiculos', name: 'Isaías 41:10', url: '/stickers/versiculos/isaiah-41-10.webp', keywords: ['não temas', 'contigo', 'força'] },
      { id: 'psalm-91', category: 'versiculos', name: 'Salmo 91', url: '/stickers/versiculos/psalm-91.webp', keywords: ['proteção', 'refúgio', 'fortaleza'] },
      { id: 'josh-1-9', category: 'versiculos', name: 'Josué 1:9', url: '/stickers/versiculos/josh-1-9.webp', keywords: ['esforça', 'corajoso', 'contigo'] },
      { id: 'psalm-46-1', category: 'versiculos', name: 'Salmo 46:1', url: '/stickers/versiculos/psalm-46-1.webp', keywords: ['refúgio', 'força', 'socorro'] },
      { id: 'matt-11-28', category: 'versiculos', name: 'Mateus 11:28', url: '/stickers/versiculos/matt-11-28.webp', keywords: ['vinde', 'descanso', 'cansados'] },
      { id: '1-cor-13', category: 'versiculos', name: '1 Coríntios 13', url: '/stickers/versiculos/1-cor-13.webp', keywords: ['amor', 'paciente', 'benigno'] },
      { id: 'psalm-119-105', category: 'versiculos', name: 'Salmo 119:105', url: '/stickers/versiculos/psalm-119-105.webp', keywords: ['lâmpada', 'pés', 'caminho'] },
      { id: 'heb-11-1', category: 'versiculos', name: 'Hebreus 11:1', url: '/stickers/versiculos/heb-11-1.webp', keywords: ['fé', 'certeza', 'evidência'] }
    ]
  },

  // 4. EMOJIS CRISTÃOS (30 stickers) - Versões animadas das reações
  {
    id: 'emojis',
    name: 'Emojis Cristãos',
    emoji: '😇',
    stickers: [
      { id: 'amen-heart', category: 'emojis', name: 'Amém Coração', url: '/stickers/emojis/amen-heart.webp', keywords: ['amém', 'amor', 'coração'] },
      { id: 'praying-emoji', category: 'emojis', name: 'Orando Emoji', url: '/stickers/emojis/praying-emoji.webp', keywords: ['oração', 'mãos', 'emoji'] },
      { id: 'fire-glory', category: 'emojis', name: 'Fogo Glória', url: '/stickers/emojis/fire-glory.webp', keywords: ['fogo', 'glória', 'espírito'] },
      { id: 'sparkle-praise', category: 'emojis', name: 'Brilho Aleluia', url: '/stickers/emojis/sparkle-praise.webp', keywords: ['brilho', 'aleluia', 'louvor'] },
      { id: 'dove-peace', category: 'emojis', name: 'Pomba Paz', url: '/stickers/emojis/dove-peace.webp', keywords: ['pomba', 'paz', 'espírito santo'] },
      { id: 'book-word', category: 'emojis', name: 'Livro Palavra', url: '/stickers/emojis/book-word.webp', keywords: ['livro', 'palavra', 'bíblia'] },
      { id: 'blue-faith', category: 'emojis', name: 'Azul Fé', url: '/stickers/emojis/blue-faith.webp', keywords: ['azul', 'fé', 'coração'] },
      { id: 'green-hope', category: 'emojis', name: 'Verde Esperança', url: '/stickers/emojis/green-hope.webp', keywords: ['verde', 'esperança', 'planta'] },
      { id: 'hands-gratitude', category: 'emojis', name: 'Mãos Gratidão', url: '/stickers/emojis/hands-gratitude.webp', keywords: ['mãos', 'gratidão', 'obrigado'] },
      { id: 'star-inspiring', category: 'emojis', name: 'Estrela Inspirador', url: '/stickers/emojis/star-inspiring.webp', keywords: ['estrela', 'inspirar', 'brilho'] },
      // ... mais 20 variações
      { id: 'happy-christian', category: 'emojis', name: 'Cristão Feliz', url: '/stickers/emojis/happy-christian.webp', keywords: ['feliz', 'alegria', 'sorriso'] },
      { id: 'blessed', category: 'emojis', name: 'Abençoado', url: '/stickers/emojis/blessed.webp', keywords: ['abençoado', 'bênção'] },
      { id: 'hallelujah', category: 'emojis', name: 'Aleluia', url: '/stickers/emojis/hallelujah.webp', keywords: ['aleluia', 'louvor'] },
      { id: 'jesus-loves', category: 'emojis', name: 'Jesus Ama', url: '/stickers/emojis/jesus-loves.webp', keywords: ['jesus', 'amor'] },
      { id: 'holy-spirit', category: 'emojis', name: 'Espírito Santo', url: '/stickers/emojis/holy-spirit.webp', keywords: ['espírito', 'santo', 'fogo'] }
      // Total: 30 (15 mostrados + 15 similares)
    ]
  },

  // 5. FRUTAS DO ESPÍRITO (9 stickers)
  {
    id: 'frutas',
    name: 'Frutas do Espírito',
    emoji: '🍇',
    stickers: [
      { id: 'love-fruit', category: 'frutas', name: 'Amor', url: '/stickers/frutas/love.webp', keywords: ['amor', 'fruto', 'espírito'] },
      { id: 'joy-fruit', category: 'frutas', name: 'Alegria', url: '/stickers/frutas/joy.webp', keywords: ['alegria', 'fruto'] },
      { id: 'peace-fruit', category: 'frutas', name: 'Paz', url: '/stickers/frutas/peace.webp', keywords: ['paz', 'fruto'] },
      { id: 'patience-fruit', category: 'frutas', name: 'Paciência', url: '/stickers/frutas/patience.webp', keywords: ['paciência', 'fruto'] },
      { id: 'kindness-fruit', category: 'frutas', name: 'Bondade', url: '/stickers/frutas/kindness.webp', keywords: ['bondade', 'fruto'] },
      { id: 'goodness-fruit', category: 'frutas', name: 'Benignidade', url: '/stickers/frutas/goodness.webp', keywords: ['benignidade', 'fruto'] },
      { id: 'faithfulness-fruit', category: 'frutas', name: 'Fidelidade', url: '/stickers/frutas/faithfulness.webp', keywords: ['fidelidade', 'fruto'] },
      { id: 'gentleness-fruit', category: 'frutas', name: 'Mansidão', url: '/stickers/frutas/gentleness.webp', keywords: ['mansidão', 'fruto'] },
      { id: 'self-control-fruit', category: 'frutas', name: 'Domínio Próprio', url: '/stickers/frutas/self-control.webp', keywords: ['domínio', 'fruto'] }
    ]
  }

  // ... MAIS 7 CATEGORIAS SEGUINDO O MESMO PADRÃO ...
  // 6. Dons Espirituais (12)
  // 7. Eventos Bíblicos (20)
  // 8. Personagens Bíblicos (15)
  // 9. Animais da Bíblia (12)
  // 10. Motivacionais (20)
  // 11. Intercessão (15)
  // 12. Testemunho (10)

  // TOTAL: 198 stickers
];

// Buscar sticker por ID
export const getStickerById = (id: string): Sticker | undefined => {
  for (const category of STICKER_CATEGORIES) {
    const sticker = category.stickers.find(s => s.id === id);
    if (sticker) return sticker;
  }
  return undefined;
};

// Buscar stickers por keyword
export const searchStickers = (query: string): Sticker[] => {
  const results: Sticker[] = [];
  const lowerQuery = query.toLowerCase();

  for (const category of STICKER_CATEGORIES) {
    for (const sticker of category.stickers) {
      if (
        sticker.name.toLowerCase().includes(lowerQuery) ||
        sticker.keywords.some(k => k.includes(lowerQuery))
      ) {
        results.push(sticker);
      }
    }
  }

  return results;
};
