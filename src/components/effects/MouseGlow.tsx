// =====================================================
// MOUSE GLOW - Efeito premium que segue o cursor
// =====================================================
// Glow circular que acompanha o movimento do mouse
// Cor e intensidade mudam baseado no tema
// =====================================================

import { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

const GLOW_CONFIGS = {
  'default': { color: '99, 102, 241', size: 300, intensity: 0.3 },
  'dark-royal': { color: '168, 85, 247', size: 400, intensity: 0.6 },
  'reino-celestial': { color: '255, 215, 0', size: 350, intensity: 0.4 },
  'nova-jerusalem': { color: '255, 215, 0', size: 380, intensity: 0.5 },
  'trono-gloria': { color: '124, 58, 237', size: 360, intensity: 0.45 },
  'arca-alianca': { color: '217, 119, 6', size: 340, intensity: 0.4 },
  'guerreiro-fe': { color: '220, 38, 38', size: 380, intensity: 0.5 },
  'monte-siao': { color: '59, 130, 246', size: 320, intensity: 0.35 },
  'jardim-eden': { color: '16, 185, 129', size: 340, intensity: 0.4 },
  'diamante-promessa': { color: '56, 189, 248', size: 400, intensity: 0.5 },
};

export const MouseGlow = () => {
  const { currentTheme } = useTheme();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isMoving, setIsMoving] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      setIsMoving(true);

      // Reset timeout
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setIsMoving(false), 100);
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const config = GLOW_CONFIGS[currentTheme?.key as keyof typeof GLOW_CONFIGS] || GLOW_CONFIGS.default;

  return (
    <div
      className="fixed pointer-events-none z-[1] transition-opacity duration-300"
      style={{
        left: mousePos.x,
        top: mousePos.y,
        opacity: isMoving ? config.intensity : 0,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div
        className="rounded-full blur-3xl transition-all duration-200"
        style={{
          width: config.size,
          height: config.size,
          background: `radial-gradient(circle, rgba(${config.color}, ${config.intensity}) 0%, transparent 70%)`,
          transform: isMoving ? 'scale(1)' : 'scale(0.8)',
        }}
      />
    </div>
  );
};
