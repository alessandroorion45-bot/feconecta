import { useState, useEffect, useRef, useCallback } from 'react';
import { Timer, BookOpen, Clock, X, ChevronUp, ChevronDown, Play, Pause, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ReadingStats {
  totalSeconds: number;
  totalSessions: number;
  lastReadingAt: string | null;
}

interface TimerState {
  sessionSeconds: number;
  isRunning: boolean;
  isPaused: boolean;
  sessionId: string | null;
  startTimestamp: number | null;
  pausedAt: number | null;
}

interface FloatingReadingTimerProps {
  bookAbbrev?: string;
  chapter?: number;
}

const STORAGE_KEY = 'bible_reading_timer_state';

const FloatingReadingTimer = ({ bookAbbrev, chapter }: FloatingReadingTimerProps) => {
  const { toast } = useToast();
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [stats, setStats] = useState<ReadingStats>({ totalSeconds: 0, totalSessions: 0, lastReadingAt: null });
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimestampRef = useRef<number | null>(null);

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
    } else if (mins > 0) {
      return `${mins}m ${secs.toString().padStart(2, '0')}s`;
    }
    return `${secs}s`;
  };

  const formatTotalTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Save state to localStorage
  const saveState = useCallback(() => {
    const state: TimerState = {
      sessionSeconds,
      isRunning,
      isPaused,
      sessionId,
      startTimestamp: startTimestampRef.current,
      pausedAt: isPaused ? Date.now() : null,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [sessionSeconds, isRunning, isPaused, sessionId]);

  // Restore state from localStorage
  const restoreState = useCallback(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const state: TimerState = JSON.parse(savedState);
        
        if (state.sessionId) {
          setSessionId(state.sessionId);
          
          if (state.isPaused) {
            // Restore paused state
            setSessionSeconds(state.sessionSeconds);
            setIsPaused(true);
            setIsRunning(false);
          } else if (state.isRunning && state.startTimestamp) {
            // Calculate elapsed time since start
            const elapsed = Math.floor((Date.now() - state.startTimestamp) / 1000);
            setSessionSeconds(elapsed);
            setIsRunning(true);
            setIsPaused(false);
            startTimestampRef.current = state.startTimestamp;
          }
          return true;
        }
      } catch (e) {
        console.error('Failed to restore timer state:', e);
      }
    }
    return false;
  }, []);

  const loadStats = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('bible_reading_stats')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setStats({
        totalSeconds: data.total_reading_seconds,
        totalSessions: data.total_sessions,
        lastReadingAt: data.last_reading_at,
      });
    }
  }, []);

  const startSession = useCallback(() => {
    // Iniciar timer IMEDIATAMENTE para resposta instantânea
    const now = Date.now();
    setIsRunning(true);
    setIsPaused(false);
    setSessionSeconds(0);
    startTimestampRef.current = now;

    // Salvar no banco em background (não bloqueia o timer)
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('bible_reading_sessions')
          .insert({
            user_id: user.id,
            book_abbrev: bookAbbrev,
            chapter: chapter,
          })
          .select()
          .single();

        if (data && !error) {
          setSessionId(data.id);
        }
      } catch (e) {
        console.error('Failed to create session:', e);
      }
    })();
  }, [bookAbbrev, chapter]);

  const pauseTimer = useCallback(() => {
    setIsRunning(false);
    setIsPaused(true);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    saveState();
    toast({
      title: "⏸️ Leitura pausada",
      description: "Continue quando estiver pronto!",
    });
  }, [saveState, toast]);

  const resumeTimer = useCallback(() => {
    // Atualizar estado IMEDIATAMENTE
    const now = Date.now();
    startTimestampRef.current = now - (sessionSeconds * 1000);
    setIsRunning(true);
    setIsPaused(false);
    
    // Toast em seguida (não bloqueia)
    toast({
      title: "▶️ Continuando leitura",
      description: "Continue sua jornada espiritual!",
    });
  }, [sessionSeconds, toast]);

  const endSession = useCallback(async (showFeedback = true) => {
    if (!sessionId) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const duration = sessionSeconds;

    await supabase
      .from('bible_reading_sessions')
      .update({
        ended_at: new Date().toISOString(),
        duration_seconds: duration,
      })
      .eq('id', sessionId);

    const { data: existingStats } = await supabase
      .from('bible_reading_stats')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (existingStats) {
      await supabase
        .from('bible_reading_stats')
        .update({
          total_reading_seconds: existingStats.total_reading_seconds + duration,
          total_sessions: existingStats.total_sessions + 1,
          last_reading_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
    } else {
      await supabase
        .from('bible_reading_stats')
        .insert({
          user_id: user.id,
          total_reading_seconds: duration,
          total_sessions: 1,
          last_reading_at: new Date().toISOString(),
        });
    }

    setIsRunning(false);
    setIsPaused(false);
    setSessionId(null);
    setSessionSeconds(0);
    startTimestampRef.current = null;
    localStorage.removeItem(STORAGE_KEY);
    
    if (showFeedback && duration >= 60) {
      const messages = [
        "🙏 Que Deus abençoe sua leitura! Continue firme na fé!",
        "✨ Excelente! A Palavra de Deus está transformando sua vida!",
        "🌟 Parabéns pela dedicação! O Senhor se alegra com você!",
        "💪 Continue assim! Cada versículo lido fortalece sua alma!",
        "❤️ Que benção! Sua jornada espiritual está florescendo!",
      ];
      toast({
        title: "Leitura concluída!",
        description: messages[Math.floor(Math.random() * messages.length)],
      });
    }

    loadStats();
  }, [sessionId, sessionSeconds, toast, loadStats]);

  // Timer effect
  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setSessionSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused]);

  // Save state periodically (otimizado: 30s em vez de 5s)
  useEffect(() => {
    if (isRunning || isPaused) {
      const saveInterval = setInterval(saveState, 30000); // 30 segundos - reduz 84% das escritas
      return () => clearInterval(saveInterval);
    }
  }, [isRunning, isPaused, saveState]);

  // Load stats on mount and restore state (but do NOT auto-start)
  useEffect(() => {
    const checkUserAndLoad = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        loadStats();
        // Only restore if there was an active session
        restoreState();
        // Do NOT auto-start - wait for user to click "Iniciar"
      }
    };
    
    checkUserAndLoad();
  }, [loadStats, restoreState]);

  // Handle page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveState();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveState]);

  if (!isVisible) return null;

  return (
    <div 
      className={cn(
        "fixed bottom-4 right-4 z-50 transition-all duration-300",
        "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground",
        "rounded-2xl shadow-lg shadow-primary/20",
        isMinimized ? "w-auto" : "w-80"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-primary-foreground/20">
        <div className="flex items-center gap-2">
          <div className={cn(
            "p-1.5 rounded-full transition-colors",
            isRunning && "bg-green-500/30 animate-pulse",
            isPaused && "bg-yellow-500/30",
            !isRunning && !isPaused && "bg-primary-foreground/20"
          )}>
            <Timer className="h-4 w-4" />
          </div>
          {!isMinimized && (
            <span className="font-medium text-sm">Cronômetro de Leitura</span>
          )}
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={() => {
              endSession();
              setIsVisible(false);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="p-4 space-y-4">
          {/* Session Timer */}
          <div className="text-center">
            <p className="text-xs opacity-80 mb-1">Sessão Atual</p>
            <p className="text-3xl font-bold tracking-wider">
              {formatTime(sessionSeconds)}
            </p>
            <div className={cn(
              "inline-flex items-center gap-1.5 mt-2 px-2 py-1 rounded-full text-xs font-medium",
              isRunning && "bg-green-500/30 text-green-100",
              isPaused && "bg-yellow-500/30 text-yellow-100",
              !isRunning && !isPaused && "bg-primary-foreground/20"
            )}>
              <span className={cn(
                "w-2 h-2 rounded-full",
                isRunning && "bg-green-400 animate-pulse",
                isPaused && "bg-yellow-400",
                !isRunning && !isPaused && "bg-primary-foreground/50"
              )} />
              {isRunning ? "Lendo..." : isPaused ? "Pausado" : "Pronto para iniciar"}
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex justify-center gap-2">
            {isPaused ? (
              <Button
                variant="secondary"
                size="sm"
                className="gap-2"
                onClick={resumeTimer}
              >
                <Play className="h-4 w-4" />
                Continuar
              </Button>
            ) : isRunning ? (
              <Button
                variant="secondary"
                size="sm"
                className="gap-2"
                onClick={pauseTimer}
              >
                <Pause className="h-4 w-4" />
                Pausar
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                className="gap-2"
                onClick={startSession}
              >
                <Play className="h-4 w-4" />
                Iniciar
              </Button>
            )}
            {(isRunning || isPaused) && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/20"
                onClick={() => endSession(true)}
              >
                <Square className="h-4 w-4" />
                Finalizar
              </Button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-primary-foreground/10 rounded-xl p-3 text-center">
              <Clock className="h-4 w-4 mx-auto mb-1 opacity-80" />
              <p className="text-lg font-semibold">{formatTotalTime(stats.totalSeconds)}</p>
              <p className="text-xs opacity-70">Tempo Total</p>
            </div>
            <div className="bg-primary-foreground/10 rounded-xl p-3 text-center">
              <BookOpen className="h-4 w-4 mx-auto mb-1 opacity-80" />
              <p className="text-lg font-semibold">{stats.totalSessions}</p>
              <p className="text-xs opacity-70">Sessões</p>
            </div>
          </div>
        </div>
      )}

      {/* Minimized view */}
      {isMinimized && (
        <div className="px-4 pb-3 pt-1 flex items-center gap-2">
          <p className="text-xl font-bold">
            {formatTime(sessionSeconds)}
          </p>
          {isPaused && (
            <span className="text-xs bg-yellow-400/30 px-2 py-0.5 rounded-full">Pausado</span>
          )}
        </div>
      )}
    </div>
  );
};

export default FloatingReadingTimer;