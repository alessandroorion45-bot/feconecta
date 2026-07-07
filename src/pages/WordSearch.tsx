import { useState, useCallback, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useWordSearchGame, LEVELS, extractKeywords, type SavedGameState } from '@/hooks/useWordSearchGame';
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
import ResumeSessionModal from '@/components/word-search/ResumeSessionModal';
import ChestReveal from '@/components/word-search/ChestReveal';
import FragmentModal from '@/components/word-search/FragmentModal';
import SpiritualTrail from '@/components/word-search/SpiritualTrail';
import WordSearchRanking from '@/components/word-search/WordSearchRanking';
import { useGoldRain, useRevealedBanner, useLevelGlow, useGameSounds, vibrateShort } from '@/components/word-search/GameEffects';
import { WORD_SEARCH_THEMES, getThemeForLevel, type WordSearchTheme } from '@/lib/wordSearchThemes';
import { CHESTS, determineChestTier, rollsFragment, type ChestTier } from '@/lib/wordSearchChests';
import { WORD_SEARCH_ACHIEVEMENTS, evaluateAchievements } from '@/lib/wordSearchAchievements';
import { saveSessionLocal, loadSessionLocal, clearSessionLocal, saveSessionRemote, loadSessionRemote, clearSessionRemote } from '@/lib/wordSearchSession';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useGamification } from '@/hooks/useGamification';
import { useToast } from '@/hooks/use-toast';
import { Home, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const WordSearch = () => {
  const game = useWordSearchGame();
  const { user } = useAuth();
  const { awardXP } = useGamification(user?.id);
  const { toast: shadToast } = useToast();

  const [currentTheme, setCurrentTheme] = useState<WordSearchTheme>(WORD_SEARCH_THEMES[0]);
  const [isPaused, setIsPaused] = useState(false);
  const [profile, setProfile] = useState<{ full_name: string; avatar_url: string | null } | null>(null);
  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const [savedSession, setSavedSession] = useState<SavedGameState | null>(null);
  const [chestOpen, setChestOpen] = useState(false);
  const [chestTier, setChestTier] = useState<ChestTier | null>(null);
  const [chestHasFragment, setChestHasFragment] = useState(false);
  const [fragmentOpen, setFragmentOpen] = useState(false);
  const [trailRefreshKey, setTrailRefreshKey] = useState(0);

  const goldRain = useGoldRain();
  const showBanner = useRevealedBanner();
  const showGlow = useLevelGlow();
  const { playSuccess, playClick, playLevelComplete, playCombo, playChest, playFragment } = useGameSounds();
  const prevFoundRef = useRef(0);
  const prevComboRef = useRef(0);
  const apiWordsCache = useRef<Map<number, string[]>>(new Map());
  const levelCompletedRef = useRef(false);
  const unlockedAchievementsRef = useRef<Set<string>>(new Set());

  // Perfil do usuário (avatar/nome no HUD)
  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).maybeSingle()
      .then(({ data }) => { if (data) setProfile(data); });
  }, [user]);

  // Conquistas já desbloqueadas (evita reconceder)
  useEffect(() => {
    if (!user) return;
    (supabase.from('user_word_search_achievements' as any) as any)
      .select('achievement_key')
      .eq('user_id', user.id)
      .then(({ data }: any) => {
        unlockedAchievementsRef.current = new Set((data || []).map((r: any) => r.achievement_key));
      });
  }, [user]);

  const themeWordsFor = useCallback((theme: WordSearchTheme, min: number, max: number): string[] => {
    return theme.words.filter(w => w.length >= min && w.length <= max);
  }, []);

  const prefetchApiWords = useCallback(async (level: number) => {
    try {
      const { data: chapterData, error } = await supabase.functions.invoke('bible', {
        method: 'GET',
        headers: { 'x-path': `books/gn/chapters/1` },
      });
      if (!error && chapterData?.vers) {
        const allText = chapterData.vers.map((v: any) => v.verse).join(' ');
        const words = extractKeywords(allText, 3, 15, 8);
        if (words.length > 2) apiWordsCache.current.set(level + 1, words);
      }
    } catch { /* silencioso — o banco de temas curado já é suficiente */ }
  }, []);

  const startLevelWithTheme = useCallback((level: number, isRestart = false) => {
    const theme = getThemeForLevel(level);
    setCurrentTheme(theme);
    const levelConfig = LEVELS[Math.min(level - 1, LEVELS.length - 1)];
    const curatedWords = themeWordsFor(theme, levelConfig.wordLengthMin, levelConfig.wordLengthMax);
    const extra = [...curatedWords, ...(apiWordsCache.current.get(level) || [])];

    game.setEndVerse(theme.verseText, theme.verseRef);
    game.startLevel(level, extra);
    prefetchApiWords(level);
    levelCompletedRef.current = false;
    if (isRestart) setIsPaused(false);
  }, [game, themeWordsFor, prefetchApiWords]);

  // Carrega sessão salva (local primeiro, depois remoto) ou começa do zero
  useEffect(() => {
    (async () => {
      const local = loadSessionLocal();
      if (local) {
        setSavedSession(local);
        setResumeModalOpen(true);
        return;
      }
      if (user) {
        const remote = await loadSessionRemote(user.id);
        if (remote) {
          setSavedSession(remote);
          setResumeModalOpen(true);
          return;
        }
      }
      startLevelWithTheme(1);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleContinueSession = useCallback(() => {
    if (!savedSession) return;
    const theme = WORD_SEARCH_THEMES.find(t => t.key === savedSession.themeKey) || getThemeForLevel(savedSession.level);
    setCurrentTheme(theme);
    game.setEndVerse(theme.verseText, theme.verseRef);
    game.restoreSession(savedSession);
    levelCompletedRef.current = false;
    setResumeModalOpen(false);
    toast.success('Progresso restaurado!');
  }, [savedSession, game]);

  const handleRestartFromResume = useCallback(() => {
    clearSessionLocal();
    if (user) clearSessionRemote(user.id);
    setResumeModalOpen(false);
    startLevelWithTheme(savedSession?.level || 1, true);
  }, [savedSession, startLevelWithTheme, user]);

  // Auto-save (local sempre; remoto se logado) — debounced
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (!game.grid.length || game.gameComplete || resumeModalOpen) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const state: SavedGameState = {
        level: game.currentLevel,
        grid: game.grid,
        placements: game.placements,
        foundWords: game.foundWords,
        score: game.score,
        combo: game.combo,
        maxCombo: game.maxCombo,
        timeLeft: game.timeLeft,
        hintsUsed: game.hintsUsed,
        revealedCells: Array.from(game.revealedCells),
        themeKey: currentTheme.key,
        savedAt: Date.now(),
      };
      saveSessionLocal(state);
      if (user) saveSessionRemote(user.id, state);
    }, 1500);

    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [game.grid, game.foundWords, game.score, game.timeLeft, game.combo, game.currentLevel, game.gameComplete, currentTheme.key, user, resumeModalOpen, game.hintsUsed, game.placements, game.maxCombo, game.revealedCells]);

  // Efeitos ao encontrar palavra (som/partículas/combo)
  useEffect(() => {
    const currentFound = game.foundWords.length;
    if (currentFound > prevFoundRef.current && prevFoundRef.current >= 0) {
      const lastWord = game.foundWords[currentFound - 1];
      playSuccess();
      vibrateShort();
      goldRain(20 + Math.min(game.combo, 5) * 4);
      showBanner(lastWord);
    }
    prevFoundRef.current = currentFound;
  }, [game.foundWords, game.combo, playSuccess, goldRain, showBanner]);

  useEffect(() => {
    if (game.combo > prevComboRef.current && game.combo >= 2) {
      playCombo(game.combo);
    }
    prevComboRef.current = game.combo;
  }, [game.combo, playCombo]);

  // Conclusão de nível: XP real, baú, fragmento, conquistas, ranking
  useEffect(() => {
    if (!game.gameComplete || levelCompletedRef.current) return;
    levelCompletedRef.current = true;

    playLevelComplete();
    showGlow();
    goldRain(60);
    clearSessionLocal();
    if (user) clearSessionRemote(user.id);

    const stars = game.timeLeft > 60 ? 3 : game.timeLeft > 30 ? 2 : 1;
    const tier = determineChestTier(stars, game.maxCombo, game.currentLevel);
    const hasFragment = rollsFragment(tier);

    (async () => {
      if (!user) {
        setChestTier(tier);
        setChestHasFragment(hasFragment);
        setTimeout(() => { setChestOpen(true); playChest(); }, 900);
        return;
      }

      // Registrar conclusão (histórico p/ ranking e trilha espiritual)
      await (supabase.from('word_search_level_completions' as any) as any).insert({
        user_id: user.id,
        level: game.currentLevel,
        theme_key: currentTheme.key,
        theme_label: currentTheme.label,
        score: game.score,
        stars,
        max_combo: game.maxCombo,
        words_found_count: game.foundWords.length,
        chest_tier: tier,
      });

      // XP real via gamificação central
      await awardXP('word_search_completed', { level: game.currentLevel, theme: currentTheme.key, score: game.score });

      // Conquistas
      const { data: allCompletions } = await (supabase.from('word_search_level_completions' as any) as any)
        .select('theme_key, words_found_count')
        .eq('user_id', user.id);

      const totalWords = (allCompletions || []).reduce((s: number, r: any) => s + (r.words_found_count || 0), 0);
      const distinctThemes = new Set((allCompletions || []).map((r: any) => r.theme_key).filter(Boolean)).size;

      const newlyEarned = evaluateAchievements({
        isFirstWordEver: totalWords <= game.foundWords.length,
        isFirstLevelEver: (allCompletions || []).length <= 1,
        maxComboThisLevel: game.maxCombo,
        level: game.currentLevel,
        totalWordsFound: totalWords,
        distinctThemesCompleted: distinctThemes,
        chestTier: tier,
        alreadyUnlocked: unlockedAchievementsRef.current,
      });

      for (const key of newlyEarned) {
        unlockedAchievementsRef.current.add(key);
        await (supabase.from('user_word_search_achievements' as any) as any)
          .insert({ user_id: user.id, achievement_key: key })
          .then(() => {});
        const def = WORD_SEARCH_ACHIEVEMENTS.find(a => a.key === key);
        if (def) {
          shadToast({ title: `${def.icon} Conquista: ${def.name}`, description: def.description });
        }
      }

      setTrailRefreshKey(k => k + 1);
      setChestTier(tier);
      setChestHasFragment(hasFragment);
      setTimeout(() => { setChestOpen(true); playChest(); }, 900);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.gameComplete]);

  const handleCloseChest = useCallback(() => {
    setChestOpen(false);
    if (chestHasFragment) {
      setTimeout(() => { setFragmentOpen(true); playFragment(); }, 300);
    }
  }, [chestHasFragment, playFragment]);

  // Pause system
  const handlePause = useCallback(() => {
    setIsPaused(true);
    game.setPaused(true);
  }, [game]);

  const handleResume = useCallback(() => {
    setIsPaused(false);
    game.setPaused(false);
  }, [game]);

  const handleNextLevel = useCallback(() => {
    startLevelWithTheme(game.currentLevel + 1, true);
  }, [game.currentLevel, startLevelWithTheme]);

  const handleRestart = useCallback(() => {
    startLevelWithTheme(game.currentLevel, true);
  }, [game.currentLevel, startLevelWithTheme]);

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
        <title>Palavra Viva – A Jornada Bíblica | Aliança</title>
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
            combo={game.combo}
            userId={user?.id}
            userName={profile?.full_name}
            userAvatar={profile?.avatar_url}
            onPause={handlePause}
          />

          {/* Theme */}
          <ThemeImage
            theme={currentTheme.label}
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

          {/* Trilha espiritual + Ranking */}
          <SpiritualTrail userId={user?.id} refreshKey={trailRefreshKey} />
          <WordSearchRanking userId={user?.id} />

          <p className="pv-disclaimer">
            ✝ Jogo 100% gratuito • Conteúdo bíblico educativo
          </p>
        </main>
      </div>

      {/* Pause menu */}
      <PauseMenu open={isPaused} onResume={handleResume} />

      {/* Resume session */}
      <ResumeSessionModal
        open={resumeModalOpen}
        saved={savedSession}
        onContinue={handleContinueSession}
        onRestart={handleRestartFromResume}
      />

      {/* Complete modal */}
      <GameCompleteModal
        open={game.gameComplete}
        level={game.currentLevel}
        score={game.score}
        verseText={game.verseText}
        verseRef={game.verseRef}
        timeLeft={game.timeLeft}
        maxCombo={game.maxCombo}
        userId={user?.id}
        trailRefreshKey={trailRefreshKey}
        onNextLevel={handleNextLevel}
      />

      {/* Baú + Fragmento */}
      <ChestReveal
        open={chestOpen}
        tier={chestTier}
        xpEarned={chestTier ? CHESTS[chestTier].xpBonus : 0}
        hasFragment={chestHasFragment}
        onClose={handleCloseChest}
      />
      <FragmentModal
        open={fragmentOpen}
        theme={currentTheme}
        onClose={() => setFragmentOpen(false)}
      />
    </div>
  );
};

export default WordSearch;
