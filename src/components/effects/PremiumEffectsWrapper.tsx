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

  const isPlatinum = currentTheme?.tier === 'platinum';
  // "Kingdom Cosmos Royal": o Dark Royal ganha seu próprio motor de
  // céu (estrelas/cadentes/galáxias) em vez das partículas genéricas.
  const isKingdomCosmos = currentTheme?.key === 'dark-royal';
  // Cada tema pago tem sua própria "partícula viva" (assinatura de
  // movimento em PARTICLE_CONFIGS) — só o tema Padrão (gratuito) fica
  // sem partículas, pra manter uma diferença clara entre grátis e pago.
  const hasLivingParticles = currentTheme?.key !== 'default' && !isKingdomCosmos;

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

      {/* Partículas vivas — todo tema pago, cada um com sua assinatura própria */}
      {hasLivingParticles && <ThemeParticles />}

      {/* Mouse Glow (apenas PLATINUM) */}
      {isPlatinum && <MouseGlow />}
    </>
  );
};
