import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ArrowLeft, MoreVertical, Settings, User, BellOff, Bell, ShieldBan, Flag, Trash2 } from 'lucide-react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ReportUserModal } from '@/components/ReportUserModal';
import { ChatStatusValue, chatStatusConfig } from '@/lib/chatStatus';

interface ChatHeaderProps {
  friendId: string;
  currentUserId: string;
  name: string;
  avatarUrl?: string | null;
  /** @deprecated use `status` */
  isOnline?: boolean;
  status?: ChatStatusValue;
  lastSeen?: string;
  isMuted?: boolean;
  onBack?: () => void;
  onSettingsClick?: () => void;
  onBlock?: () => void;
  onToggleMute?: () => void;
  onClearHistory?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  friendId,
  currentUserId,
  name,
  avatarUrl,
  isOnline = false,
  status,
  lastSeen,
  isMuted = false,
  onBack,
  onSettingsClick,
  onBlock,
  onToggleMute,
  onClearHistory
}) => {
  const navigate = useNavigate();
  const [blockConfirmOpen, setBlockConfirmOpen] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

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
      <div className="flex items-center gap-3 min-w-0">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-9 w-9 rounded-full shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}

        <button
          type="button"
          onClick={() => navigate(`/profile/${friendId}`)}
          className="flex items-center gap-3 min-w-0 text-left"
        >
          <div className="relative shrink-0">
            <UserAvatar src={avatarUrl} fallback={name[0]} size="md" />
            {(status ? status !== 'offline' : isOnline) && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card ${status ? chatStatusConfig(status).dotClass : 'bg-green-500'}`}
              />
            )}
          </div>

          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-foreground truncate">{name}</span>
            <span className="text-xs text-muted-foreground">
              {status ? (
                <span className={chatStatusConfig(status).textClass}>
                  {chatStatusConfig(status).emoji} {chatStatusConfig(status).label}
                </span>
              ) : isOnline ? (
                <span className="text-green-500">Online</span>
              ) : lastSeen ? (
                `Visto por último: ${lastSeen}`
              ) : (
                'Offline'
              )}
            </span>
          </div>
        </button>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {isMuted && <BellOff className="h-4 w-4 text-muted-foreground" />}

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
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => navigate(`/profile/${friendId}`)}>
              <User className="h-4 w-4 mr-2" />
              Ver Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onSettingsClick}>
              <Settings className="h-4 w-4 mr-2" />
              Configurações do Chat
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onToggleMute}>
              {isMuted ? <Bell className="h-4 w-4 mr-2" /> : <BellOff className="h-4 w-4 mr-2" />}
              {isMuted ? 'Ativar notificações' : 'Silenciar conversa'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setClearConfirmOpen(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar histórico
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setReportOpen(true)}>
              <Flag className="h-4 w-4 mr-2" />
              Denunciar Usuário
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setBlockConfirmOpen(true)} className="text-destructive">
              <ShieldBan className="h-4 w-4 mr-2" />
              Bloquear Usuário
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={blockConfirmOpen} onOpenChange={setBlockConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bloquear {name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Vocês não poderão mais trocar mensagens. Você pode desbloquear depois em Configurações do Perfil.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onBlock?.();
                setBlockConfirmOpen(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Bloquear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={clearConfirmOpen} onOpenChange={setClearConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar histórico?</AlertDialogTitle>
            <AlertDialogDescription>
              As mensagens somem apenas da sua tela — {name} continua vendo o histórico normalmente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onClearHistory?.();
                setClearConfirmOpen(false);
              }}
            >
              Limpar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ReportUserModal
        open={reportOpen}
        onOpenChange={setReportOpen}
        reportedUserId={friendId}
        reportedUserName={name}
        currentUserId={currentUserId}
      />
    </motion.div>
  );
};
