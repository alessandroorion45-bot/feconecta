// =====================================================
// PREMIUM EFFECTS WRAPPER
// =====================================================
// Adiciona efeitos premium baseado no tier do tema
// =====================================================

import { ReactNode } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeParticles } from './ThemeParticles';
import { MouseGlow } from './MouseGlow';
import { themes } from '@/lib/themes';

interface PremiumEffectsWrapperProps {
  children: ReactNode;
}

export const PremiumEffectsWrapper = ({ children }: PremiumEffectsWrapperProps) => {
  const { currentTheme } = useTheme();
  const theme = themes[currentTheme];

  // Habilitar efeitos premium para temas GOLD e PLATINUM
  const isPremium = theme?.tier === 'gold' || theme?.tier === 'platinum';
  const isPlatinum = theme?.tier === 'platinum';

  return (
    <>
      {children}

      {/* Partículas (GOLD e PLATINUM) */}
      {isPremium && <ThemeParticles />}

      {/* Mouse Glow (apenas PLATINUM) */}
      {isPlatinum && <MouseGlow />}
    </>
  );
};
