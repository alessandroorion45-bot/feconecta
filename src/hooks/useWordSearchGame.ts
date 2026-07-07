import { useState, useCallback, useRef, useEffect } from 'react';

// ========== Types ==========
export interface WordPlacement {
  word: string;
  startRow: number;
  startCol: number;
  direction: [number, number];
  found: boolean;
}

export interface CellPosition {
  row: number;
  col: number;
}

export interface GameLevel {
  level: number;
  gridSize: number;
  wordLengthMin: number;
  wordLengthMax: number;
  label: string;
}

// ========== Constants ==========
export const LEVELS: GameLevel[] = [
  { level: 1, gridSize: 8, wordLengthMin: 3, wordLengthMax: 5, label: 'Palavras curtas' },
  { level: 2, gridSize: 9, wordLengthMin: 4, wordLengthMax: 6, label: 'Palavras médias' },
  { level: 3, gridSize: 10, wordLengthMin: 5, wordLengthMax: 7, label: 'Palavras maiores' },
  { level: 4, gridSize: 11, wordLengthMin: 4, wordLengthMax: 8, label: 'Desafio misto' },
  { level: 5, gridSize: 12, wordLengthMin: 4, wordLengthMax: 10, label: 'Jornada bíblica' },
  { level: 6, gridSize: 12, wordLengthMin: 5, wordLengthMax: 12, label: 'Desafio avançado' },
  { level: 7, gridSize: 13, wordLengthMin: 4, wordLengthMax: 13, label: 'Mestre bíblico' },
  { level: 8, gridSize: 14, wordLengthMin: 4, wordLengthMax: 15, label: 'Desafio supremo' },
];

// Rótulos ciclantes para níveis além dos 8 iniciais (progressão infinita)
const ENDLESS_LABELS = [
  'Peregrino da Fé', 'Guardião da Palavra', 'Sábio das Escrituras', 'Guerreiro Espiritual',
  'Discípulo Fiel', 'Mestre da Aliança', 'Servo Dedicado', 'Vencedor em Cristo',
  'Embaixador do Reino', 'Atalaia da Verdade', 'Semeador Incansável', 'Vaso de Honra',
];

export const MAX_LEVEL = 500;

/**
 * Config de nível para qualquer número de nível (1 a MAX_LEVEL).
 * Níveis 1-8 usam exatamente os tiers fixos originais (intocados).
 * A partir do nível 9, a mesma curva de dificuldade continua crescendo
 * gradualmente (grade maior, palavras mais longas) em vez de estagnar.
 */
export const getLevelConfig = (level: number): GameLevel => {
  const clamped = Math.max(1, Math.min(level, MAX_LEVEL));
  if (clamped <= LEVELS.length) return LEVELS[clamped - 1];

  const tier = clamped - LEVELS.length; // 1, 2, 3...
  const gridSize = Math.min(14 + Math.floor(tier / 8), 20);
  const wordLengthMin = Math.min(4 + Math.floor(tier / 40), 6);
  const wordLengthMax = Math.min(15 + Math.floor(tier / 20), 18);
  const label = ENDLESS_LABELS[tier % ENDLESS_LABELS.length];

  return { level: clamped, gridSize, wordLengthMin, wordLengthMax, label };
};

// ========== Biblical words pool (fallback) ==========
const BIBLICAL_WORDS_POOL = [
  // 3-5 letters
  'AMOR', 'DEUS', 'VIDA', 'CRUZ', 'FIEL', 'REIS', 'ATOS', 'JOSE', 'MANA', 'RUTE',
  'ARCA', 'EDEN', 'ANJO', 'MESA', 'POVO', 'JUIZ', 'LEIS', 'VOTO', 'FOGO', 'AGUA',
  'PAUL', 'ABEL', 'CAIM', 'SARA', 'LEVI', 'JOEL', 'AMOS', 'NAUM', 'DAVI', 'RAIZ',
  'PENA', 'VIDE', 'MURO', 'SINO', 'ROSA', 'FATO', 'CURA', 'OBRA', 'FOME', 'SEDE',
  'OURO', 'LUTA', 'NOME', 'SIAO', 'MACA', 'FUGA', 'NOITE', 'TERRA', 'PEDRA', 'PORTA',
  'CAMPO', 'FORTE', 'TRONO', 'SANTO', 'JUSTO', 'SERVO', 'VERBO', 'CANTO', 'PACTO',
  // 6-7 letters
  'CRISTO', 'ESPADA', 'TEMPLO', 'GRACIA', 'PROFETA', 'OVELHA', 'JOSUE',
  'SAMUEL', 'DANIEL', 'ISAIAS', 'SALMOS', 'MARCOS', 'MATEUS',
  'GENESIS', 'BATISMO', 'MILAGRE', 'PASCOA', 'SANGUE', 'ESPIRITO',
  'PRAZER', 'CAMELO', 'COLUNA', 'DESERTO', 'DILUVIO', 'EXILIO', 'JARDIM',
  'LAGRIMA', 'MOISÉS', 'OFERTA', 'PALMEIRA', 'QUERUBIM', 'TRIBOS',
  'VIUVA', 'ZEBEDEU', 'LEVITA', 'FARISEU', 'NAZARE', 'BELÉM', 'GALATA',
  // 8+ letters
  'SALVACAO', 'APOCALIPSE', 'EVANGELHO', 'SABEDORIA', 'OBEDIENCIA',
  'DISCIPULO', 'JERUSALEM', 'APOSTOLOS', 'PROVERBIOS', 'REVELACAO',
  'CORDEIRO', 'ORACAO', 'PROMESSA', 'ALIANCA', 'VERDADE', 'JUSTICIA',
  'REDENCAO', 'SACRIFICIO', 'RESSURREICAO', 'COMUNHAO', 'SANTIDADE',
  'BENDICAO', 'MISERICORDIA', 'ESPERANCA', 'COMPAIXAO', 'FIDELIDADE',
  'TENTACAO', 'ADORACAO', 'PROFECIA', 'ETERNIDADE', 'LIBERTACAO',
  'PEREGRINACAO', 'TABERNÁCULO', 'MANDAMENTO', 'TESTEMUNHO',
  'ARREPENDIMENTO', 'PERSEVERANCA', 'RESURREICAO', 'PROVIDENCIA',
];

// ========== Directions for word placement ==========
const DIRECTIONS: [number, number][] = [
  [0, 1],   // horizontal right
  [1, 0],   // vertical down
  [1, 1],   // diagonal down-right
  [-1, 1],  // diagonal up-right
  [0, -1],  // horizontal left
  [-1, 0],  // vertical up
  [-1, -1], // diagonal up-left
  [1, -1],  // diagonal down-left
];

// ========== Helper: normalize text for grid ==========
const normalizeWord = (word: string): string => {
  return word
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^A-Z]/g, ''); // only letters
};

// ========== Helper: extract keywords from Bible text ==========
export const extractKeywords = (text: string, minLen: number, maxLen: number, count: number): string[] => {
  const stopWords = new Set([
    'QUE', 'COM', 'NAO', 'POR', 'UMA', 'DOS', 'DAS', 'NOS', 'NAS', 'FOI', 'SUA',
    'SEU', 'ELE', 'ELA', 'MAS', 'TEM', 'SAO', 'ERA', 'SER', 'TER', 'HAV', 'EST',
    'PARA', 'COMO', 'MAIS', 'SEUS', 'SUAS', 'PELO', 'PELA', 'ELES', 'ELAS', 'VOCE',
    'DELE', 'DELA', 'ISSO', 'ESTE', 'ESTA', 'TODO', 'TODA', 'CADA', 'DEUS',
    'SOBRE', 'PORQUE', 'QUANDO', 'SENHOR', 'DISSE', 'TERRA', 'TODOS', 'ENTRE',
    'MUITO', 'DEPOIS', 'ANTES', 'AINDA', 'MESMO', 'ONDE', 'AQUI', 'TAMBEM',
  ]);

  const words = text.split(/\s+/)
    .map(w => normalizeWord(w))
    .filter(w => w.length >= minLen && w.length <= maxLen && !stopWords.has(w));

  // unique words
  const unique = [...new Set(words)];
  // shuffle and take required count
  const shuffled = unique.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

// ========== Grid generation ==========
const canPlaceWord = (
  grid: string[][],
  word: string,
  startRow: number,
  startCol: number,
  dir: [number, number],
  gridSize: number
): boolean => {
  for (let i = 0; i < word.length; i++) {
    const r = startRow + dir[0] * i;
    const c = startCol + dir[1] * i;
    if (r < 0 || r >= gridSize || c < 0 || c >= gridSize) return false;
    if (grid[r][c] !== '' && grid[r][c] !== word[i]) return false;
  }
  return true;
};

const placeWord = (
  grid: string[][],
  word: string,
  startRow: number,
  startCol: number,
  dir: [number, number]
): void => {
  for (let i = 0; i < word.length; i++) {
    grid[startRow + dir[0] * i][startCol + dir[1] * i] = word[i];
  }
};

export const generateGrid = (
  words: string[],
  gridSize: number
): { grid: string[][]; placements: WordPlacement[] } => {
  const grid: string[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(''));
  const placements: WordPlacement[] = [];
  const normalizedWords = words.map(w => normalizeWord(w)).filter(w => w.length > 0 && w.length <= gridSize);

  for (const word of normalizedWords) {
    let placed = false;
    const shuffledDirs = [...DIRECTIONS].sort(() => Math.random() - 0.5);

    for (let attempt = 0; attempt < 100 && !placed; attempt++) {
      const dir = shuffledDirs[attempt % shuffledDirs.length];
      const startRow = Math.floor(Math.random() * gridSize);
      const startCol = Math.floor(Math.random() * gridSize);

      if (canPlaceWord(grid, word, startRow, startCol, dir, gridSize)) {
        placeWord(grid, word, startRow, startCol, dir);
        placements.push({ word, startRow, startCol, direction: dir, found: false });
        placed = true;
      }
    }
  }

  // Fill empty cells with random letters
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (grid[r][c] === '') {
        grid[r][c] = alphabet[Math.floor(Math.random() * alphabet.length)];
      }
    }
  }

  return { grid, placements };
};

// ========== Get words for a specific level ==========
// Simple seeded random for consistent level generation
const seededRandom = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
};

const getWordsForLevel = (level: GameLevel, levelNumber: number, extraWords?: string[]): string[] => {
  const rng = seededRandom(levelNumber * 7919); // unique seed per level
  let pool: string[] = [];

  if (extraWords && extraWords.length > 0) {
    pool = extraWords.filter(w => {
      const norm = normalizeWord(w);
      return norm.length >= level.wordLengthMin && norm.length <= level.wordLengthMax;
    });
  }

  // Supplement from fallback pool
  if (pool.length < 6) {
    const fallback = BIBLICAL_WORDS_POOL.filter(w => {
      const norm = normalizeWord(w);
      return norm.length >= level.wordLengthMin && norm.length <= level.wordLengthMax && !pool.includes(w);
    }).sort(() => rng() - 0.5);
    pool = [...pool, ...fallback];
  }

  // Pick words based on level difficulty (5-10 words)
  const wordCount = Math.min(5 + Math.floor(levelNumber / 10), 10);
  return [...new Set(pool)].sort(() => rng() - 0.5).slice(0, wordCount);
};

// ========== Combo ==========
const COMBO_WINDOW_MS = 8000; // janela para manter o combo vivo
const COMBO_BONUS_PER_STEP = 5; // XP/pontos extra por nível de combo

export interface SavedGameState {
  level: number;
  grid: string[][];
  placements: WordPlacement[];
  foundWords: string[];
  score: number;
  combo: number;
  maxCombo: number;
  timeLeft: number;
  hintsUsed: number;
  revealedCells: string[];
  themeKey?: string;
  savedAt: number;
}

// ========== Main hook ==========
export const useWordSearchGame = () => {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [grid, setGrid] = useState<string[][]>([]);
  const [placements, setPlacements] = useState<WordPlacement[]>([]);
  const [selectedCells, setSelectedCells] = useState<CellPosition[]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [verseText, setVerseText] = useState('');
  const [verseRef, setVerseRef] = useState('');
  const [isSelecting, setIsSelecting] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerFrozen, setTimerFrozen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const [revealedCells, setRevealedCells] = useState<Set<string>>(new Set());
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [lastFoundWord, setLastFoundWord] = useState<{ word: string; placement: WordPlacement; comboAt: number } | null>(null);
  const lastFoundAtRef = useRef<number>(0);

  const [isPaused, setIsPaused] = useState(false);

  const setPaused = useCallback((paused: boolean) => {
    setIsPaused(paused);
  }, []);

  // Timer
  useEffect(() => {
    if (timeLeft > 0 && !gameComplete && !timerFrozen && !isPaused) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [timeLeft, gameComplete, timerFrozen, isPaused]);

  // Start new game for a level
  const startLevel = useCallback((level: number, extraWords?: string[]) => {
    const levelConfig = getLevelConfig(level);
    const words = getWordsForLevel(levelConfig, level, extraWords);
    const { grid: newGrid, placements: newPlacements } = generateGrid(words, levelConfig.gridSize);

    setCurrentLevel(level);
    setGrid(newGrid);
    setPlacements(newPlacements);
    setSelectedCells([]);
    setFoundWords([]);
    setGameComplete(false);
    setHintsUsed(0);
    setRevealedCells(new Set());
    setTimeLeft(levelConfig.gridSize * 15); // seconds based on grid size
    setTimerFrozen(false);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setLastFoundWord(null);
    lastFoundAtRef.current = 0;
  }, []);

  /** Restaura uma sessão salva EXATAMENTE como estava (mesmo grid), sem regenerar nada. */
  const restoreSession = useCallback((saved: SavedGameState) => {
    setCurrentLevel(saved.level);
    setGrid(saved.grid);
    setPlacements(saved.placements);
    setSelectedCells([]);
    setFoundWords(saved.foundWords);
    setGameComplete(false);
    setHintsUsed(saved.hintsUsed);
    setRevealedCells(new Set(saved.revealedCells));
    setTimeLeft(saved.timeLeft);
    setTimerFrozen(false);
    setScore(saved.score);
    setCombo(saved.combo);
    setMaxCombo(saved.maxCombo);
    setLastFoundWord(null);
    lastFoundAtRef.current = 0;
  }, []);

  // Handle cell selection
  const handleCellSelect = useCallback((row: number, col: number) => {
    setSelectedCells(prev => {
      const alreadySelected = prev.some(c => c.row === row && c.col === col);
      if (alreadySelected) return prev;
      return [...prev, { row, col }];
    });
  }, []);

  // Start selecting
  const startSelecting = useCallback((row: number, col: number) => {
    setIsSelecting(true);
    setSelectedCells([{ row, col }]);
  }, []);

  // End selection and check for word match
  const endSelection = useCallback(() => {
    setIsSelecting(false);

    if (selectedCells.length < 2) {
      setSelectedCells([]);
      return;
    }

    // Build the selected word
    const selectedWord = selectedCells.map(c => grid[c.row]?.[c.col] || '').join('');
    const reversedWord = [...selectedCells].reverse().map(c => grid[c.row]?.[c.col] || '').join('');

    // Check against placements
    let matchedPlacement: WordPlacement | null = null;
    for (const p of placements) {
      if (!p.found && (p.word === selectedWord || p.word === reversedWord)) {
        matchedPlacement = p;
        break;
      }
    }

    if (matchedPlacement) {
      // Word found!
      const updatedPlacements = placements.map(p =>
        p.word === matchedPlacement!.word ? { ...p, found: true } : p
      );
      setPlacements(updatedPlacements);
      setFoundWords(prev => [...prev, matchedPlacement!.word]);

      // Combo: se encontrou dentro da janela de tempo, incrementa; senão reinicia
      const now = Date.now();
      const withinCombo = lastFoundAtRef.current > 0 && (now - lastFoundAtRef.current) <= COMBO_WINDOW_MS;
      lastFoundAtRef.current = now;

      setCombo(prev => {
        const next = withinCombo ? prev + 1 : 1;
        setMaxCombo(m => Math.max(m, next));
        setLastFoundWord({ word: matchedPlacement!.word, placement: matchedPlacement!, comboAt: next });

        const comboBonus = next > 1 ? (next - 1) * COMBO_BONUS_PER_STEP : 0;
        setScore(s => s + matchedPlacement!.word.length * 10 + comboBonus);

        return next;
      });

      // Check if all words found
      if (updatedPlacements.every(p => p.found)) {
        setGameComplete(true);
        setScore(prev => prev + timeLeft * 2);
      }
    }

    setSelectedCells([]);
  }, [selectedCells, grid, placements, currentLevel, timeLeft]);

  // Use hint (free)
  const useHint = useCallback(() => {
    const unfound = placements.filter(p => !p.found);
    if (unfound.length === 0) return false;

    const target = unfound[Math.floor(Math.random() * unfound.length)];
    const key = `${target.startRow}-${target.startCol}`;
    setRevealedCells(prev => new Set([...prev, key]));
    setHintsUsed(prev => prev + 1);
    return true;
  }, [placements]);

  // Reveal letter (free)
  const revealLetter = useCallback(() => {
    const unfound = placements.filter(p => !p.found);
    if (unfound.length === 0) return false;

    const target = unfound[Math.floor(Math.random() * unfound.length)];
    const letterIndex = Math.floor(Math.random() * target.word.length);
    const r = target.startRow + target.direction[0] * letterIndex;
    const c = target.startCol + target.direction[1] * letterIndex;
    const key = `${r}-${c}`;

    setRevealedCells(prev => new Set([...prev, key]));
    return true;
  }, [placements]);

  // Set verse for end-of-level display
  const setEndVerse = useCallback((text: string, ref: string) => {
    setVerseText(text);
    setVerseRef(ref);
  }, []);

  return {
    // State
    currentLevel,
    grid,
    placements,
    selectedCells,
    foundWords,
    score,
    gameComplete,
    verseText,
    verseRef,
    isSelecting,
    hintsUsed,
    timeLeft,
    timerFrozen,
    revealedCells,
    isPaused,
    combo,
    maxCombo,
    lastFoundWord,
    // Actions
    startLevel,
    restoreSession,
    setPaused,
    handleCellSelect,
    startSelecting,
    endSelection,
    useHint,
    revealLetter,
    setEndVerse,
  };
};
