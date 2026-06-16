import React from 'react';
import { cn } from '@/lib/utils';
import UserAvatar from '@/components/UserAvatar';
import { motion } from 'framer-motion';
import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Conversation {
  id: string;
  friendId: string;
  friendName: string;
  friendAvatar?: string | null;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  isOnline?: boolean;
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedId?: string;
  onSelect: (conversation: Conversation) => void;
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
  onSelect
}) => {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] text-center px-4">
        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <span className="text-3xl">💬</span>
        </div>
        <h3 className="font-semibold text-foreground mb-2">Nenhuma conversa ainda</h3>
        <p className="text-sm text-muted-foreground">
          Adicione amigos para começar a conversar!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {conversations.map((conversation, index) => (
        <motion.button
          key={conversation.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
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
                'font-medium truncate',
                conversation.unreadCount > 0 && 'text-foreground'
              )}>
                {conversation.friendName}
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

          {conversation.unreadCount > 0 && (
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
      ))}
    </div>
  );
};
