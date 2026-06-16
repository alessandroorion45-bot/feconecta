import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Check, CheckCheck, Heart, ThumbsUp, Star, Laugh, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChatAudioPlayer } from './ChatAudioPlayer';
import UserAvatar from '@/components/UserAvatar';

interface Reaction {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

interface ChatBubbleProps {
  message: string;
  timestamp: string;
  isSent: boolean;
  isRead?: boolean;
  status?: 'sent' | 'delivered' | 'read';
  reactions?: Reaction[];
  onReact?: (emoji: string) => void;
  bubbleStyle?: 'modern' | 'classic' | 'minimal';
  mediaUrl?: string;
  mediaType?: 'image' | 'audio' | 'video';
  senderAvatar?: string | null;
  senderName?: string;
}

const reactionEmojis = [
  { emoji: '❤️', icon: Heart, label: 'Amor' },
  { emoji: '👍', icon: ThumbsUp, label: 'Curtir' },
  { emoji: '⭐', icon: Star, label: 'Especial' },
  { emoji: '😂', icon: Laugh, label: 'Engraçado' },
  { emoji: '✨', icon: Sparkles, label: 'Brilhante' }
];

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  timestamp,
  isSent,
  isRead = false,
  status = 'sent',
  reactions = [],
  onReact,
  bubbleStyle = 'modern',
  mediaUrl,
  mediaType,
  senderAvatar,
  senderName
}) => {
  const [showReactions, setShowReactions] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const getBubbleStyles = () => {
    const baseStyles = 'relative max-w-[80%] px-4 py-2.5 rounded-2xl shadow-lg transition-all duration-300';
    
    if (isSent) {
      return cn(
        baseStyles,
        bubbleStyle === 'modern' && 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-br-md',
        bubbleStyle === 'classic' && 'bg-primary text-primary-foreground rounded-br-none',
        bubbleStyle === 'minimal' && 'bg-primary/90 text-primary-foreground rounded-br-sm',
        isHovered && 'scale-[1.02] shadow-xl'
      );
    }
    
    return cn(
      baseStyles,
      bubbleStyle === 'modern' && 'bg-gradient-to-br from-muted to-muted/80 text-foreground rounded-bl-md',
      bubbleStyle === 'classic' && 'bg-muted text-foreground rounded-bl-none',
      bubbleStyle === 'minimal' && 'bg-muted/90 text-foreground rounded-bl-sm',
      isHovered && 'scale-[1.02] shadow-xl'
    );
  };

  const formattedTime = format(new Date(timestamp), 'HH:mm', { locale: ptBR });

  const hasOnlyMedia = mediaUrl && !message.trim();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        type: 'spring', 
        stiffness: 500, 
        damping: 30,
        mass: 0.8
      }}
      className={cn(
        'flex flex-col gap-1 mb-3',
        isSent ? 'items-end' : 'items-start'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowReactions(false);
      }}
    >
      {/* Row with avatar + bubble */}
      <div className={cn(
        'flex items-end gap-2 max-w-full',
        isSent ? 'flex-row-reverse' : 'flex-row'
      )}>
        {/* Avatar */}
        <div className="shrink-0 mb-1">
          <UserAvatar
            src={senderAvatar}
            fallback={senderName || '?'}
            size="xs"
            className="shadow-md"
          />
        </div>

        <div className="relative group min-w-0">
        <motion.div
          className={cn(
            getBubbleStyles(),
            hasOnlyMedia && 'p-2'
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowReactions(!showReactions)}
        >
          {/* Glow effect */}
          <div className={cn(
            'absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300',
            isSent ? 'bg-primary/20' : 'bg-muted/30',
            isHovered && 'opacity-100 blur-xl -z-10'
          )} />
          
          {/* Media content */}
          {mediaUrl && mediaType === 'image' && (
            <div className="mb-2 -mx-2 -mt-1">
              <motion.img
                src={mediaUrl}
                alt="Shared image"
                className={cn(
                  'rounded-xl max-w-[280px] w-full object-cover cursor-pointer',
                  !imageLoaded && 'h-40 bg-muted/50 animate-pulse'
                )}
                onLoad={() => setImageLoaded(true)}
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(mediaUrl, '_blank');
                }}
                whileHover={{ scale: 1.02 }}
              />
            </div>
          )}
          
          {mediaUrl && mediaType === 'audio' && (
            <div className="mb-2 -mx-1">
              <ChatAudioPlayer src={mediaUrl} />
            </div>
          )}

          {/* Text content */}
          {message && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {message}
            </p>
          )}
          
          <div className={cn(
            'flex items-center gap-1.5 mt-1',
            isSent ? 'justify-end' : 'justify-start'
          )}>
            <span className={cn(
              'text-[10px] opacity-70',
              isSent ? 'text-primary-foreground/70' : 'text-muted-foreground'
            )}>
              {formattedTime}
            </span>
            
            {isSent && (
              <span className="text-primary-foreground/70">
                {status === 'read' || isRead ? (
                  <CheckCheck className="h-3.5 w-3.5 text-sky-300" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
              </span>
            )}
          </div>
        </motion.div>

        {/* Reaction picker */}
        <AnimatePresence>
          {showReactions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className={cn(
                'absolute z-10 flex gap-1 p-1.5 rounded-full bg-card/95 backdrop-blur-sm shadow-xl border border-border',
                isSent ? 'right-0 -top-12' : 'left-0 -top-12'
              )}
            >
              {reactionEmojis.map((reaction, index) => (
                <motion.button
                  key={reaction.emoji}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.3 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onReact?.(reaction.emoji);
                    setShowReactions(false);
                  }}
                  className="p-1.5 hover:bg-muted rounded-full transition-colors"
                  title={reaction.label}
                >
                  <span className="text-lg">{reaction.emoji}</span>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>

      {/* Reactions display */}
      {reactions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            'flex gap-1 px-2',
            isSent ? 'justify-end' : 'justify-start'
          )}
        >
          {reactions.map((reaction, index) => (
            <motion.span
              key={index}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs',
                'bg-card/80 backdrop-blur-sm border border-border shadow-sm',
                reaction.hasReacted && 'ring-1 ring-primary'
              )}
            >
              <span>{reaction.emoji}</span>
              {reaction.count > 1 && (
                <span className="text-muted-foreground">{reaction.count}</span>
              )}
            </motion.span>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};
