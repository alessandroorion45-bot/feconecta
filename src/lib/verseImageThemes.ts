// =====================================================
// TEMAS PREMIUM PARA COMPARTILHAMENTO DE VERSÍCULOS
// =====================================================

export interface VerseImageTheme {
  id: string;
  name: string;
  description: string;
  gradientStart: string;
  gradientMid: string;
  gradientEnd: string;
  textColor: string;
  secondaryTextColor: string;
  accentColor: string;
  glowColor: string;
  borderColor: string;
  decorationStyle: 'stars' | 'particles' | 'rays' | 'waves' | 'geometric' | 'floral' | 'crystals' | 'mountains';
  fontFamily: string;
  fontWeight: number;
}

export const VERSE_IMAGE_THEMES: VerseImageTheme[] = [
  {
    id: 'dark-royal',
    name: 'Dark Royal',
    description: 'Preto absoluto com glow roxo e tipografia premium',
    gradientStart: '#000000',
    gradientMid: '#1a0033',
    gradientEnd: '#000000',
    textColor: '#ffffff',
    secondaryTextColor: '#b8b8ff',
    accentColor: '#8b5cf6',
    glowColor: '#a855f7',
    borderColor: '#8b5cf6',
    decorationStyle: 'stars',
    fontFamily: 'serif',
    fontWeight: 700,
  },
  {
    id: 'reino-celestial',
    name: 'Reino Celestial',
    description: 'Branco, dourado e luz celestial',
    gradientStart: '#ffffff',
    gradientMid: '#fef3c7',
    gradientEnd: '#fffbeb',
    textColor: '#78350f',
    secondaryTextColor: '#92400e',
    accentColor: '#f59e0b',
    glowColor: '#fbbf24',
    borderColor: '#d97706',
    decorationStyle: 'rays',
    fontFamily: 'serif',
    fontWeight: 600,
  },
  {
    id: 'nova-jerusalem',
    name: 'Nova Jerusalém',
    description: 'Cristais, dourado e brilho eterno',
    gradientStart: '#ecfdf5',
    gradientMid: '#fef3c7',
    gradientEnd: '#ede9fe',
    textColor: '#065f46',
    secondaryTextColor: '#047857',
    accentColor: '#10b981',
    glowColor: '#34d399',
    borderColor: '#059669',
    decorationStyle: 'crystals',
    fontFamily: 'serif',
    fontWeight: 700,
  },
  {
    id: 'trono-gloria',
    name: 'Trono da Glória',
    description: 'Roxo imperial com majestade divina',
    gradientStart: '#1e1b4b',
    gradientMid: '#5b21b6',
    gradientEnd: '#312e81',
    textColor: '#f3e8ff',
    secondaryTextColor: '#e9d5ff',
    accentColor: '#a855f7',
    glowColor: '#c084fc',
    borderColor: '#9333ea',
    decorationStyle: 'geometric',
    fontFamily: 'serif',
    fontWeight: 800,
  },
  {
    id: 'jardim-eden',
    name: 'Jardim do Éden',
    description: 'Natureza, verde e vida abundante',
    gradientStart: '#064e3b',
    gradientMid: '#059669',
    gradientEnd: '#047857',
    textColor: '#ecfdf5',
    secondaryTextColor: '#d1fae5',
    accentColor: '#10b981',
    glowColor: '#34d399',
    borderColor: '#6ee7b7',
    decorationStyle: 'floral',
    fontFamily: 'serif',
    fontWeight: 600,
  },
  {
    id: 'monte-siao',
    name: 'Monte Sião',
    description: 'Montanhas, força e firmeza',
    gradientStart: '#1c1917',
    gradientMid: '#57534e',
    gradientEnd: '#292524',
    textColor: '#fafaf9',
    secondaryTextColor: '#e7e5e4',
    accentColor: '#78716c',
    glowColor: '#a8a29e',
    borderColor: '#d6d3d1',
    decorationStyle: 'mountains',
    fontFamily: 'serif',
    fontWeight: 700,
  },
  {
    id: 'diamante-promessa',
    name: 'Diamante da Promessa',
    description: 'Cristal, glass e pureza',
    gradientStart: '#f0f9ff',
    gradientMid: '#e0f2fe',
    gradientEnd: '#bae6fd',
    textColor: '#0c4a6e',
    secondaryTextColor: '#075985',
    accentColor: '#0ea5e9',
    glowColor: '#38bdf8',
    borderColor: '#7dd3fc',
    decorationStyle: 'crystals',
    fontFamily: 'serif',
    fontWeight: 600,
  },
  {
    id: 'fogo-pentecostes',
    name: 'Fogo de Pentecostes',
    description: 'Chamas, poder e avivamento',
    gradientStart: '#7f1d1d',
    gradientMid: '#dc2626',
    gradientEnd: '#991b1b',
    textColor: '#fef2f2',
    secondaryTextColor: '#fee2e2',
    accentColor: '#f97316',
    glowColor: '#fb923c',
    borderColor: '#fdba74',
    decorationStyle: 'particles',
    fontFamily: 'serif',
    fontWeight: 800,
  },
];

export const getThemeById = (id: string): VerseImageTheme => {
  return VERSE_IMAGE_THEMES.find(t => t.id === id) || VERSE_IMAGE_THEMES[0];
};
