import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMediaUpload } from './ChatMediaUpload';
import { EmojiPicker } from './EmojiPicker';

interface ChatInputProps {
  onSend: (message: string, mediaUrl?: string, mediaType?: 'image' | 'audio') => void;
  onTyping?: () => void;
  disabled?: boolean;
  placeholder?: string;
  userId?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onTyping,
  disabled = false,
  placeholder = 'Digite sua mensagem...',
  userId
}) => {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [pendingMedia, setPendingMedia] = useState<{ url: string; type: 'image' | 'audio' } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleSend = () => {
    if ((message.trim() || pendingMedia) && !disabled) {
      onSend(message.trim(), pendingMedia?.url, pendingMedia?.type);
      setMessage('');
      setPendingMedia(null);
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    setIsTyping(e.target.value.length > 0);
    
    // Trigger typing indicator
    if (e.target.value.length > 0) {
      onTyping?.();
    }
  };

  const handleMediaUpload = (url: string, type: 'image' | 'audio') => {
    setPendingMedia({ url, type });
  };

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setMessage((prev) => prev + emoji);
      return;
    }
    const start = textarea.selectionStart ?? message.length;
    const end = textarea.selectionEnd ?? message.length;
    const next = message.slice(0, start) + emoji + message.slice(end);
    setMessage(next);
    setIsTyping(true);
    onTyping?.();
    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + emoji.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={cn(
        'relative flex flex-col gap-2 p-3 bg-card/80 backdrop-blur-lg border-t border-border',
        'transition-all duration-300',
        isFocused && 'bg-card'
      )}
    >
      {/* Pending media preview */}
      <AnimatePresence>
        {pendingMedia && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 px-2"
          >
            {pendingMedia.type === 'image' ? (
              <div className="relative">
                <img
                  src={pendingMedia.url}
                  alt="Preview"
                  className="h-16 w-16 rounded-lg object-cover"
                />
                <button
                  onClick={() => setPendingMedia(null)}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-white text-xs flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
                <span className="text-sm">🎵 Áudio anexado</span>
                <button
                  onClick={() => setPendingMedia(null)}
                  className="text-destructive text-sm"
                >
                  ×
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-end gap-2">
        {/* Glow effect when focused */}
        <AnimatePresence>
          {isFocused && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none"
            />
          )}
        </AnimatePresence>

        <div className="flex gap-1">
          <EmojiPicker onSelect={handleEmojiSelect} disabled={disabled} />

          {userId && (
            <ChatMediaUpload
              userId={userId}
              onMediaUpload={handleMediaUpload}
              disabled={disabled}
            />
          )}
        </div>

        <div className="relative flex-1">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={cn(
              'min-h-[44px] max-h-[120px] resize-none py-3 px-4',
              'rounded-2xl bg-muted/50 border-0',
              'focus-visible:ring-1 focus-visible:ring-primary/50',
              'transition-all duration-300',
              isFocused && 'bg-muted'
            )}
          />
          
          {/* Typing indicator dots */}
          <AnimatePresence>
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-0.5"
              >
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="w-1 h-1 rounded-full bg-primary/50"
                    animate={{ y: [0, -3, 0] }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      delay: i * 0.1
                    }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.div
          key="send"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          <Button
            onClick={handleSend}
            disabled={disabled || (!message.trim() && !pendingMedia)}
            size="icon"
            className={cn(
              'h-10 w-10 rounded-full',
              'bg-gradient-to-br from-primary to-primary/80',
              'hover:from-primary/90 hover:to-primary/70',
              'shadow-lg hover:shadow-xl hover:shadow-primary/25',
              'transition-all duration-300',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <Send className="h-4 w-4" />
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
};
