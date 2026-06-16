import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ReadingStats {
  totalSeconds: number;
  totalSessions: number;
  lastReadingAt: string | null;
}

export const useReadingTimer = (bookAbbrev?: string, chapter?: number) => {
  const { toast } = useToast();
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [stats, setStats] = useState<ReadingStats>({ totalSeconds: 0, totalSessions: 0, lastReadingAt: null });
  const [sessionId, setSessionId] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  // Load user stats
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

  // Start a new reading session
  const startSession = useCallback(async () => {
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
      startTimeRef.current = new Date();
      setIsRunning(true);
    }
  }, [bookAbbrev, chapter]);

  // End current session and save
  const endSession = useCallback(async () => {
    if (!sessionId || !isRunning) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const duration = sessionSeconds;

    // Update session
    await supabase
      .from('bible_reading_sessions')
      .update({
        ended_at: new Date().toISOString(),
        duration_seconds: duration,
      })
      .eq('id', sessionId);

    // Update or create stats
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
    setSessionId(null);
    
    // Show motivational feedback
    if (duration >= 60) {
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
  }, [sessionId, sessionSeconds, isRunning, toast, loadStats]);

  // Timer effect
  useEffect(() => {
    if (isRunning) {
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
  }, [isRunning]);

  // Auto-start on mount, auto-end on unmount
  useEffect(() => {
    const checkUserAndStart = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        loadStats();
        startSession();
      }
    };
    
    checkUserAndStart();

    return () => {
      // Will be handled by beforeunload or manual call
    };
  }, []);

  // Handle page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (sessionId && sessionSeconds > 0) {
        // Use sendBeacon for reliable data sending on page close
        const payload = JSON.stringify({
          sessionId,
          duration: sessionSeconds,
        });
        navigator.sendBeacon?.('/api/end-session', payload);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [sessionId, sessionSeconds]);

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    } else if (mins > 0) {
      return `${mins}m ${secs}s`;
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

  return {
    sessionSeconds,
    isRunning,
    stats,
    formatTime,
    formatTotalTime,
    startSession,
    endSession,
    loadStats,
  };
};
