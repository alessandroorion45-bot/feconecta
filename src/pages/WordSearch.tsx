import { useState, useCallback, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useWordSearchGame, LEVELS, extractKeywords } from '@/hooks/useWordSearchGame';
import wordSearchBg from '@/assets/word-search-bg.jpg';
import WordSearchGrid from '@/components/word-search/WordSearchGrid';
import WordListPanel from '@/components/word-search/WordListPanel';
import GameCompleteModal from '@/components/word-search/GameCompleteModal';
import GameTopBar from '@/components/word-search/GameTopBar';
import VerseDisplay from '@/components/word-search/VerseDisplay';
import GameTools from '@/components/word-search/GameTools';
import ThemeImage from '@/components/word-search/ThemeImage';
import PauseMenu from '@/components/word-search/PauseMenu';
import FloatingParticles from '@/components/word-search/FloatingParticles';
import { useGoldRain, useRevealedBanner, useLevelGlow, useGameSounds, vibrateShort } from '@/components/word-search/GameEffects';
import { supabase } from '@/integrations/supabase/client';
import { Home, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const LEVEL_VERSES = [
  { text: 'No princípio criou Deus os céus e a terra.', ref: 'Gênesis 1:1' },
  { text: 'O Senhor é o meu pastor, nada me faltará.', ref: 'Salmos 23:1' },
  { text: 'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito.', ref: 'João 3:16' },
  { text: 'Tudo posso naquele que me fortalece.', ref: 'Filipenses 4:13' },
  { text: 'Eu sou o caminho, a verdade e a vida.', ref: 'João 14:6' },
  { text: 'Buscai primeiro o reino de Deus e a sua justiça.', ref: 'Mateus 6:33' },
  { text: 'O amor é paciente, o amor é bondoso.', ref: '1 Coríntios 13:4' },
  { text: 'Lâmpada para os meus pés é a tua palavra, e luz para o meu caminho.', ref: 'Salmos 119:105' },
  { text: 'Confiai no Senhor de todo o vosso coração.', ref: 'Provérbios 3:5' },
  { text: 'O Senhor é a minha luz e a minha salvação; a quem temerei?', ref: 'Salmos 27:1' },
  { text: 'Sede fortes e corajosos. Não temais.', ref: 'Deuteronômio 31:6' },
  { text: 'Em tudo dai graças, porque esta é a vontade de Deus.', ref: '1 Tessalonicenses 5:18' },
  { text: 'O Senhor peleja por vós, e vós vos calareis.', ref: 'Êxodo 14:14' },
  { text: 'Eis que estou convosco todos os dias, até à consumação dos séculos.', ref: 'Mateus 28:20' },
  { text: 'A fé é o firme fundamento das coisas que se esperam.', ref: 'Hebreus 11:1' },
];

const BOOK_THEMES: Record<string, string> = {
  gn: 'Criação e Gênesis', ex: 'Êxodo e Libertação', lv: 'Leis e Levítico',
  nm: 'Números e Jornada', dt: 'Deuteronômio', js: 'Josué e Conquista',
  jz: 'Juízes de Israel', rt: 'Rute e Fidelidade', '1sm': 'Samuel e os Reis',
  '2sm': 'Davi e o Reino', sl: 'Salmos e Louvor', pv: 'Sabedoria e Provérbios',
  ec: 'Eclesiastes', ct: 'Cânticos', is: 'Isaías Profeta',
  jr: 'Jeremias', ez: 'Ezequiel', dn: 'Daniel',
  mt: 'Evangelho de Mateus', mc: 'Evangelho de Marcos',
  lc: 'Evangelho de Lucas', jo: 'Evangelho de João',
  at: 'Atos dos Apóstolos', rm: 'Epístola aos Romanos',
  '1co': 'Coríntios', '2co': 'Coríntios', gl: 'Gálatas',
  ef: 'Epístola aos Efésios', fp: 'Filipenses', cl: 'Colossenses',
  hb: 'Epístola aos Hebreus', tg: 'Epístola de Tiago',
  ap: 'Apocalipse e Revelação',
};

const BOOKS = Object.keys(BOOK_THEMES);
const SAVE_KEY = 'pv-saved-progress';

const WordSearch = () => {
  const game = useWordSearchGame();
  const [currentTheme, setCurrentTheme] = useState('Jornada Bíblica');
  const [isPaused, setIsPaused] = useState(false);

  const goldRain = useGoldRain();
  const showBanner = useRevealedBanner();
  const showGlow = useLevelGlow();
  const { playSuccess, playClick, playLevelComplete } = useGameSounds();
  const prevFoundRef = useRef(0);
  const apiWordsCache = useRef<Map<number, string[]>>(new Map());

  const startLevelInstant = useCallback((level: number) => {
    const randomBook = BOOKS[level % BOOKS.length];
    setCurrentTheme(BOOK_THEMES[randomBook] || 'Jornada Bíblica');
    const verseIdx = (level - 1) % LEVEL_VERSES.length;
    game.setEndVerse(LEVEL_VERSES[verseIdx].text, LEVEL_VERSES[verseIdx].ref);
    game.startLevel(level);
    prefetchApiWords(level);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const prefetchApiWords = useCallback(async (currentLevel: number) => {
    try {
      const bookIdx = (currentLevel + 1) % BOOKS.length;
      const randomBook = BOOKS[bookIdx];
      const randomChapter = Math.floor(Math.random() * 5) + 1;
      const { data: chapterData, error } = await supabase.functions.invoke('bible', {
        method: 'GET',
        headers: { 'x-path': `books/${randomBook}/chapters/${randomChapter}` },
      });
      if (!error && chapterData?.vers) {
        const allText = chapterData.vers.map((v: any) => v.verse).join(' ');
        const words = extractKeywords(allText, 3, 15, 20);
        if (words.length > 3) {
          apiWordsCache.current.set(currentLevel + 1, words);
        }
      }
    } catch { /* silent */ }
  }, []);

  const startLevel = useCallback((level: number) => {
    const cachedWords = apiWordsCache.current.get(level);
    const randomBook = BOOKS[level % BOOKS.length];
    setCurrentTheme(BOOK_THEMES[randomBook] || 'Jornada Bíblica');
    const verseIdx = (level - 1) % LEVEL_VERSES.length;
    game.setEndVerse(LEVEL_VERSES[verseIdx].text, LEVEL_VERSES[verseIdx].ref);
    game.startLevel(level, cachedWords);
    prefetchApiWords(level);
    setIsPaused(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefetchApiWords]);

  // Load saved or start fresh
  useEffect(() => {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.level) {
          startLevelInstant(data.level);
          toast.success('Progresso restaurado!');
          localStorage.removeItem(SAVE_KEY);
          return;
        }
      } catch { /* ignore */ }
    }
    startLevelInstant(1);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Effects on found words
  useEffect(() => {
    const currentFound = game.foundWords.length;
    if (currentFound > prevFoundRef.current && prevFoundRef.current >= 0) {
      const lastWord = game.foundWords[currentFound - 1];
      playSuccess();
      vibrateShort();
      goldRain(25);
      showBanner(lastWord);
    }
    prevFoundRef.current = currentFound;
  }, [game.foundWords, playSuccess, goldRain, showBanner]);

  useEffect(() => {
    if (game.gameComplete) {
      playLevelComplete();
      showGlow();
      goldRain(60);
    }
  }, [game.gameComplete, playLevelComplete, showGlow, goldRain]);

  // Pause system
  const handlePause = useCallback(() => {
    setIsPaused(true);
    game.setPaused(true);
  }, [game]);

  const handleResume = useCallback(() => {
    setIsPaused(false);
    game.setPaused(false);
  }, [game]);

  const handleSave = useCallback(() => {
    const saveData = {
      level: game.currentLevel,
      score: game.score,
      foundWords: game.foundWords,
      timeLeft: game.timeLeft,
      savedAt: Date.now(),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    toast.success('Progresso salvo!');
  }, [game]);

  const handleNextLevel = useCallback(() => {
    startLevel(game.currentLevel + 1);
  }, [game.currentLevel, startLevel]);

  const handleRestart = useCallback(() => {
    startLevel(game.currentLevel);
  }, [game.currentLevel, startLevel]);

  const handleCellPointerDown = useCallback((row: number, col: number) => {
    playClick();
    game.startSelecting(row, col);
  }, [game, playClick]);

  const handleCellPointerEnter = useCallback((row: number, col: number) => {
    if (game.isSelecting) {
      game.handleCellSelect(row, col);
    }
  }, [game]);

  const levelConfig = LEVELS[Math.min(game.currentLevel - 1, LEVELS.length - 1)];

  return (
    <div className="palavra-viva-wrapper" style={{ backgroundImage: `url(${wordSearchBg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
      <div className="palavra-viva-bg-overlay" />
      <Helmet>
        <title>Palavra Viva – A Jornada Bíblica | Rede da Fé</title>
        <meta name="description" content="Jogo de caça-palavras cristão interativo e educativo. Encontre palavras bíblicas e aprenda versículos. 100% gratuito." />
      </Helmet>

      <FloatingParticles />

      <div className="palavra-viva-layout">
        <main className="palavra-viva-main pv-main-full">
          {/* Navigation */}
          <div className="pv-nav-strip">
            <Link to="/" className="pv-nav-link">
              <Home className="h-4 w-4" />
              <span>Início</span>
            </Link>
            <button onClick={handleRestart} className="pv-nav-link">
              <RotateCcw className="h-4 w-4" />
              <span>Reiniciar</span>
            </button>
          </div>

          {/* Top bar */}
          <GameTopBar
            level={game.currentLevel}
            levelLabel={levelConfig.label}
            score={game.score}
            timeLeft={game.timeLeft}
            timerFrozen={game.timerFrozen}
            foundCount={game.foundWords.length}
            totalCount={game.placements.length}
            onPause={handlePause}
          />

          {/* Theme */}
          <ThemeImage
            theme={currentTheme}
            words={game.placements.map(p => p.word)}
          />

          {/* Word list */}
          <WordListPanel placements={game.placements} />

          {/* Grid */}
          <div className="flex justify-center mt-4">
            <WordSearchGrid
              grid={game.grid}
              selectedCells={game.selectedCells}
              foundWords={game.foundWords}
              placements={game.placements}
              revealedCells={game.revealedCells}
              isSelecting={game.isSelecting}
              isPaused={isPaused}
              onCellPointerDown={handleCellPointerDown}
              onCellPointerEnter={handleCellPointerEnter}
              onPointerUp={game.endSelection}
            />
          </div>

          {/* Tools */}
          <GameTools
            onUseHint={game.useHint}
            onRevealLetter={game.revealLetter}
          />

          {/* Verse */}
          <VerseDisplay verseText={game.verseText} verseRef={game.verseRef} />

          <p className="pv-disclaimer">
            ✝ Jogo 100% gratuito • Conteúdo bíblico educativo
          </p>
        </main>
      </div>

      {/* Pause menu */}
      <PauseMenu
        open={isPaused}
        onResume={handleResume}
        onSave={handleSave}
      />

      {/* Complete modal */}
      <GameCompleteModal
        open={game.gameComplete}
        level={game.currentLevel}
        score={game.score}
        verseText={game.verseText}
        verseRef={game.verseRef}
        timeLeft={game.timeLeft}
        onNextLevel={handleNextLevel}
      />
    </div>
  );
};

export default WordSearch;
