import React from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import UserAvatar from '@/components/UserAvatar';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MoreVertical, Pin, PinOff, Bell, BellOff, Trash2, ShieldBan, Sparkles } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface Conversation {
  id: string;
  friendId: string;
  friendName: string;
  friendAvatar?: string | null;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  isOnline?: boolean;
  isPinned?: boolean;
  isMuted?: boolean;
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedId?: string;
  onSelect: (conversation: Conversation) => void;
  onTogglePin?: (conversation: Conversation) => void;
  onToggleMute?: (conversation: Conversation) => void;
  onClearHistory?: (conversation: Conversation) => void;
  onBlock?: (conversation: Conversation) => void;
}

const formatMessageTime = (dateString: string) => {
  const date = new Date(dateString);

  if (isToday(date)) {
    return format(date, 'HH:mm', { locale: ptBR });
  }

  if (isYesterday(date)) {
    return 'Ontem';
  }

  return format(date, 'dd/MM', { locale: ptBR });
};

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedId,
  onSelect,
  onTogglePin,
  onToggleMute,
  onClearHistory,
  onBlock,
}) => {
  const navigate = useNavigate();

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[420px] text-center px-6">
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-5"
        >
          <span className="text-4xl">💬</span>
        </motion.div>
        <h3 className="font-semibold text-lg text-foreground mb-2 flex items-center gap-1.5">
          Sua comunidade começa aqui
        </h3>
        <p className="text-sm text-muted-foreground max-w-[260px] mb-5">
          Converse com irmãos da fé, compartilhe pedidos de oração, testemunhos e palavras de encorajamento.
        </p>
        <Button onClick={() => navigate('/friends')} className="gap-1.5 rounded-full">
          <Sparkles className="h-4 w-4" />
          Encontrar irmãos
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {conversations.map((conversation, index) => (
        <div key={conversation.id} className="relative group">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(index, 10) * 0.03 }}
            onClick={() => onSelect(conversation)}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
              'hover:bg-muted/50',
              selectedId === conversation.id && 'bg-primary/10 hover:bg-primary/15'
            )}
          >
            <div className="relative flex-shrink-0">
              <UserAvatar
                src={conversation.friendAvatar}
                fallback={conversation.friendName[0]}
                size="md"
              />
              {conversation.isOnline && (
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
              )}
            </div>

            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center justify-between mb-0.5">
                <span className={cn(
                  'font-medium truncate flex items-center gap-1',
                  conversation.unreadCount > 0 && 'text-foreground'
                )}>
                  {conversation.isPinned && <Pin className="h-3 w-3 text-primary shrink-0 fill-primary" />}
                  {conversation.friendName}
                  {conversation.isMuted && <BellOff className="h-3 w-3 text-muted-foreground shrink-0" />}
                </span>
                {conversation.lastMessageTime && (
                  <span className={cn(
                    'text-xs flex-shrink-0 ml-2',
                    conversation.unreadCount > 0
                      ? 'text-primary font-medium'
                      : 'text-muted-foreground'
                  )}>
                    {formatMessageTime(conversation.lastMessageTime)}
                  </span>
                )}
              </div>

              {conversation.lastMessage && (
                <p className={cn(
                  'text-sm truncate',
                  conversation.unreadCount > 0
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground'
                )}>
                  {conversation.lastMessage}
                </p>
              )}
            </div>

            {conversation.unreadCount > 0 && !conversation.isMuted && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={cn(
                  'flex-shrink-0 min-w-[20px] h-5 px-1.5',
                  'flex items-center justify-center',
                  'text-xs font-bold text-primary-foreground',
                  'bg-primary rounded-full'
                )}
              >
                {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
              </motion.span>
            )}
          </motion.button>

          {(onTogglePin || onToggleMute || onClearHistory || onBlock) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  onClick={(e) => e.stopPropagation()}
                  className={cn(
                    'absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100',
                    'transition-opacity h-7 w-7 flex items-center justify-center rounded-full',
                    'bg-background/90 backdrop-blur-sm shadow border border-border'
                  )}
                >
                  <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onTogglePin && (
                  <DropdownMenuItem onClick={() => onTogglePin(conversation)}>
                    {conversation.isPinned ? <PinOff className="h-3.5 w-3.5 mr-2" /> : <Pin className="h-3.5 w-3.5 mr-2" />}
                    {conversation.isPinned ? 'Desafixar' : 'Fixar conversa'}
                  </DropdownMenuItem>
                )}
                {onToggleMute && (
                  <DropdownMenuItem onClick={() => onToggleMute(conversation)}>
                    {conversation.isMuted ? <Bell className="h-3.5 w-3.5 mr-2" /> : <BellOff className="h-3.5 w-3.5 mr-2" />}
                    {conversation.isMuted ? 'Ativar notificações' : 'Silenciar'}
                  </DropdownMenuItem>
                )}
                {onClearHistory && (
                  <DropdownMenuItem onClick={() => onClearHistory(conversation)}>
                    <Trash2 className="h-3.5 w-3.5 mr-2" /> Limpar histórico
                  </DropdownMenuItem>
                )}
                {onBlock && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onBlock(conversation)} className="text-destructive">
                      <ShieldBan className="h-3.5 w-3.5 mr-2" /> Bloquear
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      ))}
    </div>
  );
};
