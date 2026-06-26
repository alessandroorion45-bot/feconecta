// =====================================================
// REAÇÕES EXCLUSIVAS DA REDE DA FÉ
// =====================================================

export interface RedeD aFeReaction {
  id: string;
  emoji: string;
  label: string;
  color: string;
  description: string;
}

export const REDE_DA_FE_REACTIONS: RedeD aFeReaction[] = [
  {
    id: 'amem',
    emoji: '❤️',
    label: 'Amém',
    color: '#EF4444',
    description: 'Concordo com essa mensagem'
  },
  {
    id: 'orei',
    emoji: '🙏',
    label: 'Orei por você',
    color: '#F59E0B',
    description: 'Estou orando por isso'
  },
  {
    id: 'gloria',
    emoji: '🔥',
    label: 'Glória a Deus',
    color: '#F97316',
    description: 'Glória a Deus por isso!'
  },
  {
    id: 'aleluia',
    emoji: '✨',
    label: 'Aleluia',
    color: '#FBBF24',
    description: 'Aleluia! Louvado seja Deus'
  },
  {
    id: 'paz',
    emoji: '🕊️',
    label: 'Paz de Cristo',
    color: '#60A5FA',
    description: 'A paz de Cristo esteja com você'
  },
  {
    id: 'palavra',
    emoji: '📖',
    label: 'Palavra!',
    color: '#8B5CF6',
    description: 'Essa é a Palavra de Deus'
  },
  {
    id: 'fe',
    emoji: '💙',
    label: 'Fé',
    color: '#3B82F6',
    description: 'Tenho fé nisso'
  },
  {
    id: 'esperanca',
    emoji: '🌿',
    label: 'Esperança',
    color: '#10B981',
    description: 'Há esperança em Deus'
  },
  {
    id: 'gratidao',
    emoji: '🤲',
    label: 'Gratidão',
    color: '#EC4899',
    description: 'Grato a Deus por isso'
  },
  {
    id: 'inspirador',
    emoji: '⭐',
    label: 'Inspirador',
    color: '#FBBF24',
    description: 'Essa mensagem me inspirou'
  }
];

// Mapa para acesso rápido
export const REACTIONS_MAP = REDE_DA_FE_REACTIONS.reduce((acc, reaction) => {
  acc[reaction.id] = reaction;
  return acc;
}, {} as Record<string, RedeD aFeReaction>);

// Reação padrão (quick reaction)
export const DEFAULT_REACTION = REDE_DA_FE_REACTIONS[0]; // Amém
