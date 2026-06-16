import React from 'react';
import { cn } from '@/lib/utils';
import { ArrowLeft, MoreVertical, Phone, Video, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UserAvatar from '@/components/UserAvatar';
import { motion } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

interface ChatHeaderProps {
  name: string;
  avatarUrl?: string | null;
  isOnline?: boolean;
  lastSeen?: string;
  onBack?: () => void;
  onSettingsClick?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  name,
  avatarUrl,
  isOnline = false,
  lastSeen,
  onBack,
  onSettingsClick
}) => {
  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={cn(
        'flex items-center justify-between gap-3 px-4 py-3',
        'bg-card/80 backdrop-blur-lg border-b border-border',
        'sticky top-0 z-10'
      )}
    >
      <div className="flex items-center gap-3">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-9 w-9 rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}

        <div className="relative">
          <UserAvatar
            src={avatarUrl}
            fallback={name[0]}
            size="md"
          />
          {isOnline && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-card"
            />
          )}
        </div>

        <div className="flex flex-col">
          <span className="font-semibold text-foreground">{name}</span>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-muted-foreground"
          >
            {isOnline ? (
              <span className="text-green-500">Online</span>
            ) : lastSeen ? (
              `Visto por último: ${lastSeen}`
            ) : (
              'Offline'
            )}
          </motion.span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
        >
          <Phone className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
        >
          <Video className="h-5 w-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
            >
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={onSettingsClick}>
              <Settings className="h-4 w-4 mr-2" />
              Configurações do Chat
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              Bloquear Usuário
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
};
