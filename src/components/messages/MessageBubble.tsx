import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  Reply,
  Forward,
  Copy,
  Star,
  Trash2,
  Edit3,
  MoreVertical,
  Pin
} from 'lucide-react';
import { Message } from '@/hooks/useChatEngine';
import { ReactionPicker } from './ReactionPicker';
import { REACTIONS_MAP } from '@/lib/constants/reactions';
import { AudioPlayer } from './AudioPlayer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
  showAvatar?: boolean;
  avatarUrl?: string;
  senderName?: string;
  onReact?: (messageId: string, reactionId: string) => void;
  onReply?: (message: Message) => void;
  onForward?: (message: Message) => void;
  onEdit?: (message: Message) => void;
  onDelete?: (messageId: string) => void;
  onCopy?: (content: string) => void;
  onStar?: (messageId: string) => void;
  onPin?: (messageId: string) => void;
  reactions?: Array<{ reaction_id: string; count: number; users: string[] }>;
  hasReacted?: string[];
  isGroupChat?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isMine,
  showAvatar = true,
  avatarUrl,
  senderName,
  onReact,
  onReply,
  onForward,
  onEdit,
  onDelete,
  onCopy,
  onStar,
  onPin,
  reactions = [],
  hasReacted = [],
  isGroupChat = false
}) => {
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [isLongPressed, setIsLongPressed] = useState(false);

  // Status icons
  const StatusIcon = () => {
    if (!isMine) return null;

    switch (message.status) {
      case 'sending':
        return <Clock className="h-3.5 w-3.5 text-gray-400 animate-pulse" />;
      case 'sent':
        return <Check className="h-3.5 w-3.5 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="h-3.5 w-3.5 text-gray-400" />;
      case 'read':
        return <CheckCheck className="h-3.5 w-3.5 text-blue-500" />;
      case 'failed':
        return <AlertCircle className="h-3.5 w-3.5 text-red-500" />;
      default:
        return null;
    }
  };

  // Long press handler
  const handleLongPress = () => {
    setIsLongPressed(true);
    setShowReactionPicker(true);
  };

  let longPressTimer: NodeJS.Timeout;

  const handleTouchStart = () => {
    longPressTimer = setTimeout(handleLongPress, 500);
  };

  const handleTouchEnd = () => {
    clearTimeout(longPressTimer);
  };

  // Quick reaction (tap no ícone)
  const handleQuickReaction = () => {
    if (onReact) {
      onReact(message.id, 'amem'); // Reação padrão: Amém
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className={cn(
        'flex gap-2 group relative',
        isMine ? 'justify-end' : 'justify-start'
      )}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Avatar (para mensagens recebidas em grupos) */}
      {!isMine && showAvatar && isGroupChat && (
        <div className="flex-shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={senderName}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
              {senderName?.[0] || '?'}
            </div>
          )}
        </div>
      )}

      <div className={cn('flex flex-col max-w-[70%]', isMine && 'items-end')}>
        {/* Nome do remetente (apenas em grupos) */}
        {!isMine && isGroupChat && senderName && (
          <span className="text-xs text-muted-foreground mb-1 ml-2">
            {senderName}
          </span>
        )}

        <div className="relative">
          {/* Menu de ações (aparece ao passar o mouse) */}
          <div
            className={cn(
              'absolute top-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity',
              isMine ? 'right-full mr-2' : 'left-full ml-2'
            )}
          >
            {/* Quick reaction */}
            <motion.button
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleQuickReaction}
              className="w-7 h-7 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700"
              title="Reagir (Amém)"
            >
              <span className="text-sm">❤️</span>
            </motion.button>

            {/* More actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-7 h-7 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </motion.button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isMine ? 'end' : 'start'}>
                <DropdownMenuItem onClick={() => onReply?.(message)}>
                  <Reply className="h-4 w-4 mr-2" />
                  Responder
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowReactionPicker(true)}>
                  <span className="mr-2">❤️</span>
                  Reagir
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onForward?.(message)}>
                  <Forward className="h-4 w-4 mr-2" />
                  Encaminhar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onCopy?.(message.content)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStar?.(message.id)}>
                  <Star className="h-4 w-4 mr-2" />
                  {message.is_starred ? 'Remover favorito' : 'Favoritar'}
                </DropdownMenuItem>
                {!isMine && (
                  <DropdownMenuItem onClick={() => onPin?.(message.id)}>
                    <Pin className="h-4 w-4 mr-2" />
                    {message.is_pinned ? 'Desafixar' : 'Fixar'}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {isMine && (
                  <DropdownMenuItem onClick={() => onEdit?.(message)}>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => onDelete?.(message.id)}
                  className="text-red-600 dark:text-red-400"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Deletar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Reaction Picker */}
          {showReactionPicker && (
            <div className="absolute bottom-full mb-2 z-50">
              <ReactionPicker
                isOpen={showReactionPicker}
                onSelect={(reactionId) => {
                  onReact?.(message.id, reactionId);
                  setShowReactionPicker(false);
                }}
                onClose={() => setShowReactionPicker(false)}
                position="top"
              />
            </div>
          )}

          {/* Bolha da mensagem */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className={cn(
              'rounded-2xl px-4 py-2 shadow-sm relative',
              'transition-all duration-200',
              isMine
                ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground'
                : 'bg-white dark:bg-gray-800 text-foreground',
              message.is_pinned && 'ring-2 ring-yellow-400',
              message.is_starred && 'ring-2 ring-blue-400'
            )}
          >
            {/* Badge de mensagem fixada */}
            {message.is_pinned && (
              <div className="absolute -top-2 -left-2 bg-yellow-400 text-yellow-900 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                <Pin className="h-3 w-3" />
                Fixada
              </div>
            )}

            {/* Mensagem respondida (reply) */}
            {message.reply_to_id && (
              <div className="mb-2 pb-2 border-l-2 border-current pl-2 opacity-70">
                <p className="text-xs font-semibold">Respondendo</p>
                <p className="text-xs truncate">Mensagem original aqui...</p>
              </div>
            )}

            {/* Conteúdo da mensagem */}
            {message.type === 'text' && (
              <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                {message.content}
              </p>
            )}

            {message.type === 'audio' && message.media_url && (
              <AudioPlayer
                audioUrl={message.media_url}
                duration={message.media_duration || 0}
                waveform={message.waveform}
              />
            )}

            {message.type === 'image' && message.media_url && (
              <img
                src={message.media_url}
                alt="Imagem"
                className="rounded-lg max-w-full cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => window.open(message.media_url, '_blank')}
              />
            )}

            {message.type === 'sticker' && message.media_url && (
              <img
                src={message.media_url}
                alt="Sticker"
                className="w-32 h-32 object-contain"
              />
            )}

            {message.type === 'verse' && (
              <div className="bg-white/10 rounded-lg p-3 border-l-4 border-yellow-400">
                <p className="text-sm font-serif italic">{message.content}</p>
              </div>
            )}

            {/* Metadata (hora + status) */}
            <div className="flex items-center justify-end gap-1 mt-1">
              {message.edited_at && (
                <span className="text-xs opacity-60 mr-1">(editada)</span>
              )}
              <span className="text-xs opacity-70">
                {formatDistanceToNow(new Date(message.created_at), {
                  addSuffix: true,
                  locale: ptBR
                })}
              </span>
              <StatusIcon />
            </div>
          </motion.div>

          {/* Reações embaixo da mensagem */}
          {reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {reactions.map((reaction) => {
                const reactionData = REACTIONS_MAP[reaction.reaction_id];
                const userReacted = hasReacted.includes(reaction.reaction_id);

                return (
                  <motion.button
                    key={reaction.reaction_id}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onReact?.(message.id, reaction.reaction_id)}
                    className={cn(
                      'flex items-center gap-1 px-2 py-1 rounded-full text-xs',
                      'border transition-all',
                      userReacted
                        ? 'bg-primary/20 border-primary'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    )}
                    style={
                      userReacted
                        ? { borderColor: reactionData.color, backgroundColor: `${reactionData.color}20` }
                        : undefined
                    }
                    title={`${reactionData.label} (${reaction.count})`}
                  >
                    <span>{reactionData.emoji}</span>
                    {reaction.count > 1 && (
                      <span className="font-semibold">{reaction.count}</span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
