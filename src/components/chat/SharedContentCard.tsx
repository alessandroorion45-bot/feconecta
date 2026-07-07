import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { BookOpen, Sparkles, GraduationCap, Trophy, Users, Target, HandHeart } from 'lucide-react';
import BibleReferenceModal from '@/components/BibleReferenceModal';

export type SharedMessageType =
  | 'text'
  | 'verse'
  | 'devotional'
  | 'study'
  | 'challenge'
  | 'community'
  | 'campaign'
  | 'prayer';

interface SharedContentCardProps {
  type: SharedMessageType;
  content: Record<string, any>;
  isSent: boolean;
}

const CARD_META: Record<Exclude<SharedMessageType, 'text'>, { icon: typeof BookOpen; label: string; color: string }> = {
  verse: { icon: BookOpen, label: 'Versículo', color: 'from-amber-500 to-orange-500' },
  devotional: { icon: Sparkles, label: 'Devocional', color: 'from-primary to-primary-glow' },
  study: { icon: GraduationCap, label: 'Estudo Bíblico', color: 'from-secondary to-accent' },
  challenge: { icon: Trophy, label: 'Desafio', color: 'from-accent to-secondary' },
  community: { icon: Users, label: 'Comunidade', color: 'from-secondary to-primary' },
  campaign: { icon: Target, label: 'Campanha', color: 'from-primary to-secondary' },
  prayer: { icon: HandHeart, label: 'Pedido de Oração', color: 'from-secondary to-secondary-glow' },
};

const ROUTE_BY_TYPE: Record<Exclude<SharedMessageType, 'text' | 'verse'>, string> = {
  devotional: '/devotional',
  study: '/studies',
  challenge: '/challenges',
  community: '/chat', // comunidades específicas não têm rota genérica previsível aqui
  campaign: '/chat',
  prayer: '/prayers',
};

export const SharedContentCard = ({ type, content, isSent }: SharedContentCardProps) => {
  const navigate = useNavigate();
  const [verseModalOpen, setVerseModalOpen] = useState(false);

  if (type === 'text') return null;

  const meta = CARD_META[type];
  const Icon = meta.icon;

  const handleClick = () => {
    if (type === 'verse') {
      setVerseModalOpen(true);
      return;
    }
    const route = (ROUTE_BY_TYPE as any)[type];
    if (route) navigate(route);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          'flex items-center gap-2.5 w-full rounded-xl p-2.5 mb-2 text-left transition-transform hover:scale-[1.02]',
          isSent ? 'bg-black/10' : 'bg-background/60'
        )}
      >
        <div className={cn('shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center', meta.color)}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wide opacity-70">{meta.label}</p>
          <p className="text-sm font-medium truncate">{content.title || content.reference || 'Ver conteúdo'}</p>
          {content.snippet && (
            <p className="text-xs opacity-70 truncate">{content.snippet}</p>
          )}
        </div>
      </button>

      {type === 'verse' && verseModalOpen && (
        <BibleReferenceModal
          reference={content.reference}
          open={verseModalOpen}
          onOpenChange={setVerseModalOpen}
        />
      )}
    </>
  );
};
