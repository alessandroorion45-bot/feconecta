// =====================================================
// PREMIUM EFFECTS WRAPPER
// =====================================================
// Adiciona efeitos premium baseado no tier do tema.
// Camadas independentes (partículas, atmosfera, glow) —
// nunca tocam no layout, só decoram por cima/por baixo.
// =====================================================

import { ReactNode } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeParticles } from './ThemeParticles';
import { ThemeAtmosphere } from './ThemeAtmosphere';
import { MouseGlow } from './MouseGlow';

interface PremiumEffectsWrapperProps {
  children: ReactNode;
}

export const PremiumEffectsWrapper = ({ children }: PremiumEffectsWrapperProps) => {
  // currentTheme é o objeto Theme — o tier vem direto dele
  // (antes fazia themes[objeto], que dava undefined e desligava tudo)
  const { currentTheme } = useTheme();

  const isPremium = currentTheme?.tier === 'gold' || currentTheme?.tier === 'platinum';
  const isPlatinum = currentTheme?.tier === 'platinum';

  return (
    <>
      {children}

      {/* Atmosfera viva (todos os temas com identidade própria) */}
      <ThemeAtmosphere themeKey={currentTheme?.key || 'default'} />

      {/* Partículas (GOLD e PLATINUM) */}
      {isPremium && <ThemeParticles />}

      {/* Mouse Glow (apenas PLATINUM) */}
      {isPlatinum && <MouseGlow />}
    </>
  );
};
