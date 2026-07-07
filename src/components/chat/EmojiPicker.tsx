import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Smile } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  disabled?: boolean;
}

const EMOJI_CATEGORIES: { label: string; icon: string; emojis: string[] }[] = [
  {
    label: 'Fé',
    icon: '🙏',
    emojis: ['🙏', '✝️', '📖', '🕊️', '⛪', '👑', '🔥', '✨', '🌟', '💫', '🙌', '🎶'],
  },
  {
    label: 'Rostos',
    icon: '😊',
    emojis: ['😊', '😄', '😁', '🥹', '😢', '😭', '🥲', '😍', '🤗', '🙂', '😌', '🤔'],
  },
  {
    label: 'Corações',
    icon: '❤️',
    emojis: ['❤️', '💙', '💛', '💚', '💜', '🧡', '🤍', '💕', '💞', '💖', '💗', '💝'],
  },
  {
    label: 'Gestos',
    icon: '👏',
    emojis: ['👏', '👍', '🤝', '💪', '🙋', '🤲', '✌️', '🫶', '👋', '🤞', '👆', '🫡'],
  },
  {
    label: 'Natureza',
    icon: '🌿',
    emojis: ['🌿', '🌳', '🌸', '🌻', '🌈', '☀️', '🌙', '⭐', '🌊', '🕊️', '🍇', '🌾'],
  },
];

export const EmojiPicker = ({ onSelect, disabled }: EmojiPickerProps) => {
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled}
          className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50"
        >
          <Smile className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <div className="flex border-b border-border">
          {EMOJI_CATEGORIES.map((cat, index) => (
            <button
              key={cat.label}
              type="button"
              onClick={() => setActiveCategory(index)}
              className={cn(
                'flex-1 py-2 text-lg transition-colors hover:bg-muted/50',
                activeCategory === index && 'bg-muted'
              )}
              title={cat.label}
            >
              {cat.icon}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-6 gap-1 p-2 max-h-48 overflow-y-auto">
          {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                onSelect(emoji);
                setOpen(false);
              }}
              className="flex items-center justify-center h-9 w-9 text-xl rounded-lg hover:bg-muted transition-colors hover:scale-125"
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
