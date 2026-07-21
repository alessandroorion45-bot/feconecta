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
import { KingdomSkyEngine } from './KingdomSkyEngine';
import { KingdomGalaxies } from './KingdomGalaxies';
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
  // "Kingdom Cosmos Royal": o Dark Royal ganha seu próprio motor de
  // céu (estrelas/cadentes/galáxias) em vez das partículas genéricas.
  const isKingdomCosmos = currentTheme?.key === 'dark-royal';

  return (
    <>
      {children}

      {isKingdomCosmos ? (
        <>
          <KingdomGalaxies />
          <KingdomSkyEngine />
        </>
      ) : (
        // Atmosfera viva genérica (demais temas com identidade própria)
        <ThemeAtmosphere themeKey={currentTheme?.key || 'default'} />
      )}

      {/* Partículas (GOLD e PLATINUM) — Dark Royal já tem o Sky Engine */}
      {isPremium && !isKingdomCosmos && <ThemeParticles />}

      {/* Mouse Glow (apenas PLATINUM) */}
      {isPlatinum && <MouseGlow />}
    </>
  );
};
