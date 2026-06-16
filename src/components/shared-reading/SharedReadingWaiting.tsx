import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import UserAvatar from '@/components/UserAvatar';
import { Room, Participant, Reaction } from '@/hooks/useSharedReading';
import { Users, Copy, Play, LogOut, Crown, Sparkles, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { ReactionBar } from './ReactionBar';

interface SharedReadingWaitingProps {
  room: Room;
  participants: Participant[];
  isHost: boolean;
  onStartReading: () => void;
  onLeave: () => void;
  reactions: Reaction[];
  onReaction: (reaction: string) => void;
}

export const SharedReadingWaiting = ({
  room,
  participants,
  isHost,
  onStartReading,
  onLeave,
  reactions,
  onReaction
}: SharedReadingWaitingProps) => {
  const { toast } = useToast();

  const copyRoomCode = () => {
    navigator.clipboard.writeText(room.room_code);
    toast({ title: 'Código copiado!', description: room.room_code });
  };

  const copyRoomLink = () => {
    const link = `${window.location.origin}/shared-reading?code=${room.room_code}`;
    navigator.clipboard.writeText(link);
    toast({ title: 'Link copiado!', description: 'Compartilhe com seus irmãos na fé' });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Room Header */}
      <Card className="bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 border-primary/20 overflow-hidden">
        <CardHeader className="text-center relative">
          <motion.div
            className="absolute -top-4 -left-4 w-24 h-24 bg-primary/20 rounded-full blur-xl"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <motion.div
            className="absolute -bottom-4 -right-4 w-32 h-32 bg-accent/20 rounded-full blur-xl"
            animate={{ scale: [1.2, 1, 1.2] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          
          <CardTitle className="text-2xl relative z-10 flex items-center justify-center gap-2">
            <BookOpen className="h-6 w-6" />
            {room.room_name}
          </CardTitle>
          <CardDescription className="relative z-10">
            {isHost 
              ? "Você pode iniciar a leitura quando quiser. Deus fala mesmo quando somos poucos." 
              : "Aguardando início pelo criador da sala."
            }
          </CardDescription>
          
          {/* Room Code */}
          <div className="mt-4 relative z-10">
            <p className="text-sm text-muted-foreground mb-2">Código da Sala</p>
            <div className="flex gap-2 justify-center flex-wrap">
              <Button
                variant="outline"
                size="lg"
                onClick={copyRoomCode}
                className="font-mono text-2xl tracking-widest px-6"
              >
                {room.room_code}
                <Copy className="ml-3 h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Chapter Info */}
          <Badge variant="secondary" className="mt-4 relative z-10">
            📖 {room.current_book_abbrev.toUpperCase()} Capítulo {room.current_chapter}
          </Badge>
        </CardHeader>
      </Card>

      {/* Spiritual Message for Host */}
      {isHost && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-4 bg-primary/5 rounded-lg border border-primary/20"
        >
          <p className="text-sm text-primary italic">
            "Onde dois ou três estiverem reunidos em meu nome, ali estou no meio deles." — Mateus 18:20
          </p>
        </motion.div>
      )}

      {/* Participants */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Participantes ({participants.length}/{room.max_participants})
          </CardTitle>
          <CardDescription>
            {isHost 
              ? `Inicie com ${participants.length} participante${participants.length > 1 ? 's' : ''} ou aguarde mais irmãos.`
              : "Aguardando o anfitrião iniciar a leitura..."
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {participants.map((participant, index) => (
              <motion.div
                key={participant.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50"
              >
                <div className="relative">
                  <UserAvatar
                    src={participant.profile?.avatar_url}
                    fallback={participant.profile?.full_name?.[0] || '?'}
                    size="md"
                  />
                  {participant.is_host && (
                    <Crown className="absolute -top-1 -right-1 h-4 w-4 text-secondary fill-secondary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-sm">
                    {participant.profile?.full_name || 'Usuário'}
                  </p>
                  {participant.is_host && (
                    <Badge variant="outline" className="text-xs border-secondary text-secondary">
                      <Crown className="h-3 w-3 mr-1" />
                      Anfitrião
                    </Badge>
                  )}
                </div>
              </motion.div>
            ))}

            {/* Empty slots */}
            {Array.from({ length: room.max_participants - participants.length }).map((_, i) => (
              <motion.div
                key={`empty-${i}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: (participants.length + i) * 0.1 }}
                className="flex items-center justify-center p-3 rounded-lg border-2 border-dashed border-muted-foreground/20 text-muted-foreground/50"
              >
                <Users className="h-5 w-5" />
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reactions */}
      <ReactionBar reactions={reactions} onReaction={onReaction} participants={participants} />

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onLeave} className="flex-1">
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
        
        {isHost && (
          <Button 
            onClick={onStartReading} 
            className="flex-1"
            disabled={participants.length < 1}
          >
            <Play className="h-4 w-4 mr-2" />
            Iniciar Leitura ({participants.length} {participants.length === 1 ? 'participante' : 'participantes'})
          </Button>
        )}
      </div>

      {!isHost && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-sm text-muted-foreground"
        >
          <Sparkles className="inline h-4 w-4 mr-1 text-secondary" />
          Aguardando o anfitrião iniciar a leitura...
        </motion.p>
      )}
    </div>
  );
};
