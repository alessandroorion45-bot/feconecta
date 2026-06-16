import { useState, useEffect } from 'react';

type TimeOfDay = 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night';

interface BackgroundTheme {
  gradient: string;
  accent: string;
  glow: string;
}

const themes: Record<TimeOfDay, BackgroundTheme> = {
  dawn: {
    gradient: 'from-rose-900/20 via-amber-900/10 to-purple-900/20',
    accent: 'hsl(var(--primary) / 0.3)',
    glow: 'radial-gradient(ellipse at top, rgba(251, 146, 60, 0.1) 0%, transparent 50%)'
  },
  morning: {
    gradient: 'from-sky-900/20 via-amber-900/10 to-blue-900/20',
    accent: 'hsl(var(--primary) / 0.25)',
    glow: 'radial-gradient(ellipse at top, rgba(56, 189, 248, 0.1) 0%, transparent 50%)'
  },
  afternoon: {
    gradient: 'from-blue-900/15 via-cyan-900/10 to-indigo-900/15',
    accent: 'hsl(var(--primary) / 0.2)',
    glow: 'radial-gradient(ellipse at top, rgba(99, 102, 241, 0.08) 0%, transparent 50%)'
  },
  evening: {
    gradient: 'from-orange-900/20 via-rose-900/15 to-purple-900/20',
    accent: 'hsl(var(--primary) / 0.35)',
    glow: 'radial-gradient(ellipse at top, rgba(251, 146, 60, 0.15) 0%, transparent 50%)'
  },
  night: {
    gradient: 'from-slate-900/30 via-indigo-900/20 to-purple-900/30',
    accent: 'hsl(var(--primary) / 0.4)',
    glow: 'radial-gradient(ellipse at top, rgba(139, 92, 246, 0.1) 0%, transparent 50%)'
  }
};

export const useDynamicBackground = () => {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('morning');
  const [theme, setTheme] = useState<BackgroundTheme>(themes.morning);

  useEffect(() => {
    const updateTimeOfDay = () => {
      const hour = new Date().getHours();
      
      let newTimeOfDay: TimeOfDay;
      if (hour >= 5 && hour < 7) {
        newTimeOfDay = 'dawn';
      } else if (hour >= 7 && hour < 12) {
        newTimeOfDay = 'morning';
      } else if (hour >= 12 && hour < 17) {
        newTimeOfDay = 'afternoon';
      } else if (hour >= 17 && hour < 20) {
        newTimeOfDay = 'evening';
      } else {
        newTimeOfDay = 'night';
      }

      setTimeOfDay(newTimeOfDay);
      setTheme(themes[newTimeOfDay]);
    };

    updateTimeOfDay();
    const interval = setInterval(updateTimeOfDay, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  return { timeOfDay, theme };
};
