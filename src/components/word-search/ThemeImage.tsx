import { memo, useMemo, useState, useEffect, useRef } from 'react';
import { BookOpen, Cross, Heart, Sun, Star, Shield, Flame, Waves, Mountain, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ThemeImageProps {
  theme: string;
  words: string[];
}

const THEME_VISUALS: Record<string, { icon: typeof BookOpen; gradient: string; accent: string }> = {
  'Criação e Gênesis': { icon: Sun, gradient: 'from-amber-600/40 to-emerald-700/40', accent: 'text-amber-400' },
  'Salmos e Louvor': { icon: Star, gradient: 'from-indigo-600/40 to-purple-700/40', accent: 'text-purple-400' },
  'Sabedoria e Provérbios': { icon: Crown, gradient: 'from-yellow-600/40 to-orange-700/40', accent: 'text-yellow-400' },
  'Evangelho de Mateus': { icon: Cross, gradient: 'from-sky-600/40 to-blue-700/40', accent: 'text-sky-400' },
  'Evangelho de João': { icon: Heart, gradient: 'from-rose-600/40 to-red-700/40', accent: 'text-rose-400' },
  'Epístola aos Romanos': { icon: Shield, gradient: 'from-emerald-600/40 to-teal-700/40', accent: 'text-emerald-400' },
  'Epístola aos Efésios': { icon: Flame, gradient: 'from-orange-600/40 to-red-700/40', accent: 'text-orange-400' },
  'Epístola aos Hebreus': { icon: Mountain, gradient: 'from-stone-600/40 to-gray-700/40', accent: 'text-stone-400' },
  'Epístola de Tiago': { icon: BookOpen, gradient: 'from-cyan-600/40 to-blue-700/40', accent: 'text-cyan-400' },
  'Apocalipse e Revelação': { icon: Flame, gradient: 'from-red-600/40 to-purple-700/40', accent: 'text-red-400' },
};

const DEFAULT_VISUAL = { icon: BookOpen, gradient: 'from-blue-600/40 to-indigo-700/40', accent: 'text-blue-400' };

const IMAGE_CACHE_PREFIX = 'pv-theme-img-';

const ThemeImage = memo(({ theme, words }: ThemeImageProps) => {
  const visual = THEME_VISUALS[theme] || DEFAULT_VISUAL;
  const Icon = visual.icon;
  const previewWords = useMemo(() => words.slice(0, 3).join(' • '), [words]);
  
  const [aiImageUrl, setAiImageUrl] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const fetchedThemeRef = useRef<string>('');

  useEffect(() => {
    if (!theme || theme === fetchedThemeRef.current) return;
    fetchedThemeRef.current = theme;

    // Check cache first
    const cacheKey = IMAGE_CACHE_PREFIX + theme.replace(/\s+/g, '_');
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      setAiImageUrl(cached);
      setImageLoaded(false);
      return;
    }

    // Generate via AI
    setIsLoadingImage(true);
    setAiImageUrl(null);
    setImageLoaded(false);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    supabase.functions.invoke('generate-theme-image', {
      body: { theme },
    }).then(({ data, error }) => {
      clearTimeout(timeout);
      if (error) {
        console.warn('Theme image generation failed:', error);
        setIsLoadingImage(false);
        return;
      }
      if (data?.imageUrl) {
        setAiImageUrl(data.imageUrl);
        // Cache the base64 image (only if it's not too large - 500KB limit)
        if (data.imageUrl.length < 500000) {
          try {
            localStorage.setItem(cacheKey, data.imageUrl);
          } catch { /* quota exceeded, skip cache */ }
        }
      }
      setIsLoadingImage(false);
    }).catch(() => {
      clearTimeout(timeout);
      setIsLoadingImage(false);
    });

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [theme]);

  return (
    <div className={`pv-theme-image bg-gradient-to-br ${visual.gradient} relative overflow-hidden`}>
      {/* AI Generated Background Image */}
      {aiImageUrl && (
        <img
          src={aiImageUrl}
          alt={theme}
          onLoad={() => setImageLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
            imageLoaded ? 'opacity-60' : 'opacity-0'
          }`}
        />
      )}

      {/* Loading shimmer */}
      {isLoadingImage && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
      )}

      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      <div className="pv-theme-bg-glow" />
      <div className="pv-theme-divine-rays" />
      <div className="pv-theme-cross-bg">✝</div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full">
        <div className={`pv-theme-icon ${visual.accent}`}>
          <Icon className="h-12 w-12 drop-shadow-lg" />
        </div>

        <h2 className="pv-theme-title drop-shadow-lg">{theme}</h2>

        {previewWords && (
          <p className="pv-theme-words drop-shadow-md">{previewWords}...</p>
        )}

        {isLoadingImage && (
          <p className="text-xs text-white/50 mt-1 animate-pulse">✨ Gerando cenário bíblico...</p>
        )}
      </div>
    </div>
  );
});

ThemeImage.displayName = 'ThemeImage';

export default ThemeImage;
