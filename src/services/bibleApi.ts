const BIBLE_API_URL = 'https://bible-api.com';

// Map of book abbreviations to Portuguese names
const bookNames: Record<string, { name: string; chapters: number }> = {
  'GN': { name: 'Gênesis', chapters: 50 },
  'EX': { name: 'Êxodo', chapters: 40 },
  'LV': { name: 'Levítico', chapters: 27 },
  'NM': { name: 'Números', chapters: 36 },
  'DT': { name: 'Deuteronômio', chapters: 34 },
  'JS': { name: 'Josué', chapters: 24 },
  'JZ': { name: 'Juízes', chapters: 21 },
  'RT': { name: 'Rute', chapters: 4 },
  '1SM': { name: '1 Samuel', chapters: 31 },
  '2SM': { name: '2 Samuel', chapters: 24 },
  '1RS': { name: '1 Reis', chapters: 22 },
  '2RS': { name: '2 Reis', chapters: 25 },
  '1CR': { name: '1 Crônicas', chapters: 29 },
  '2CR': { name: '2 Crônicas', chapters: 36 },
  'ED': { name: 'Esdras', chapters: 10 },
  'NE': { name: 'Neemias', chapters: 13 },
  'ET': { name: 'Ester', chapters: 10 },
  'JB': { name: 'Jó', chapters: 42 },
  'SL': { name: 'Salmos', chapters: 150 },
  'PV': { name: 'Provérbios', chapters: 31 },
  'EC': { name: 'Eclesiastes', chapters: 12 },
  'CT': { name: 'Cânticos', chapters: 8 },
  'IS': { name: 'Isaías', chapters: 66 },
  'JR': { name: 'Jeremias', chapters: 52 },
  'LM': { name: 'Lamentações', chapters: 5 },
  'EZ': { name: 'Ezequiel', chapters: 48 },
  'DN': { name: 'Daniel', chapters: 12 },
  'OS': { name: 'Oséias', chapters: 14 },
  'JL': { name: 'Joel', chapters: 3 },
  'AM': { name: 'Amós', chapters: 9 },
  'OB': { name: 'Obadias', chapters: 1 },
  'JN': { name: 'Jonas', chapters: 4 },
  'MQ': { name: 'Miquéias', chapters: 7 },
  'NA': { name: 'Naum', chapters: 3 },
  'HC': { name: 'Habacuque', chapters: 3 },
  'SF': { name: 'Sofonias', chapters: 3 },
  'AG': { name: 'Ageu', chapters: 2 },
  'ZC': { name: 'Zacarias', chapters: 14 },
  'ML': { name: 'Malaquias', chapters: 4 },
  'MT': { name: 'Mateus', chapters: 28 },
  'MC': { name: 'Marcos', chapters: 16 },
  'LC': { name: 'Lucas', chapters: 24 },
  'JO': { name: 'João', chapters: 21 },
  'AT': { name: 'Atos', chapters: 28 },
  'RM': { name: 'Romanos', chapters: 16 },
  '1CO': { name: '1 Coríntios', chapters: 16 },
  '2CO': { name: '2 Coríntios', chapters: 13 },
  'GL': { name: 'Gálatas', chapters: 6 },
  'EF': { name: 'Efésios', chapters: 6 },
  'FP': { name: 'Filipenses', chapters: 4 },
  'CL': { name: 'Colossenses', chapters: 4 },
  '1TS': { name: '1 Tessalonicenses', chapters: 5 },
  '2TS': { name: '2 Tessalonicenses', chapters: 3 },
  '1TM': { name: '1 Timóteo', chapters: 6 },
  '2TM': { name: '2 Timóteo', chapters: 4 },
  'TT': { name: 'Tito', chapters: 3 },
  'FM': { name: 'Filemom', chapters: 1 },
  'HB': { name: 'Hebreus', chapters: 13 },
  'TG': { name: 'Tiago', chapters: 5 },
  '1PE': { name: '1 Pedro', chapters: 5 },
  '2PE': { name: '2 Pedro', chapters: 3 },
  '1JO': { name: '1 João', chapters: 5 },
  '2JO': { name: '2 João', chapters: 1 },
  '3JO': { name: '3 João', chapters: 1 },
  'JD': { name: 'Judas', chapters: 1 },
  'AP': { name: 'Apocalipse', chapters: 22 },
};

export interface BibleBook {
  names: string[];
  abrev: string;
  chapters: number;
  testament: string;
}

export interface BibleVerse {
  verse: string;
  number: number;
}

export interface BibleChapter {
  name: string;
  chapter: number;
  vers: BibleVerse[];
}

const normalizeForApi = (text: string): string => {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '+');
};

export const bibleApi = {
  async getBooks(): Promise<BibleBook[]> {
    const oldTestament = Object.entries(bookNames).slice(0, 39).map(([abrev, info]) => ({
      names: [info.name],
      abrev,
      chapters: info.chapters,
      testament: 'VT'
    }));
    
    const newTestament = Object.entries(bookNames).slice(39).map(([abrev, info]) => ({
      names: [info.name],
      abrev,
      chapters: info.chapters,
      testament: 'NT'
    }));
    
    return [...oldTestament, ...newTestament];
  },

  async getChapter(abbrev: string, chapter: number): Promise<BibleChapter> {
    const bookInfo = bookNames[abbrev];
    if (!bookInfo) {
      throw new Error('Livro não encontrado.');
    }

    const bookName = normalizeForApi(bookInfo.name);
    const url = `${BIBLE_API_URL}/${bookName}+${chapter}?translation=almeida`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Versículo não encontrado. Tente novamente.');
      }
      
      const data = await response.json();
      
      if (!data.text) {
        throw new Error('Versículo não encontrado. Tente novamente.');
      }

      // Parse verses from the text
      const verses: BibleVerse[] = data.verses.map((v: any) => ({
        verse: v.text,
        number: v.verse
      }));

      return {
        name: bookInfo.name,
        chapter: chapter,
        vers: verses
      };
    } catch (error) {
      throw new Error('Versículo não encontrado. Tente novamente.');
    }
  },

  async searchVerse(reference: string): Promise<{ book: string; chapter: number; verse: number; text: string } | null> {
    // Parse reference like "João 3:16" or "1 Coríntios 13:4-7"
    const regex = /^([123]?\s?[A-Za-zÀ-ÿ]+)\s+(\d+):(\d+)(?:-(\d+))?$/;
    const match = reference.trim().match(regex);
    
    if (!match) {
      throw new Error('Formato inválido. Use: Livro Capítulo:Versículo (ex: João 3:16)');
    }

    const [, bookName, chapterStr, verseStart] = match;
    
    // Find book abbreviation
    const bookEntry = Object.entries(bookNames).find(([, info]) => 
      info.name.toLowerCase() === bookName.trim().toLowerCase()
    );
    
    if (!bookEntry) {
      throw new Error('Livro não encontrado.');
    }

    const [abbrev, bookInfo] = bookEntry;
    const chapter = parseInt(chapterStr);
    const verse = parseInt(verseStart);

    const normalizedBook = normalizeForApi(bookInfo.name);
    const url = `${BIBLE_API_URL}/${normalizedBook}+${chapter}:${verse}?translation=almeida`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Versículo não encontrado. Tente novamente.');
      }
      
      const data = await response.json();
      
      if (!data.text) {
        throw new Error('Versículo não encontrado. Tente novamente.');
      }

      return {
        book: bookInfo.name,
        chapter,
        verse,
        text: data.text
      };
    } catch (error) {
      throw new Error('Versículo não encontrado. Tente novamente.');
    }
  },
};
