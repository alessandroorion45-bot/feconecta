import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import UserAvatar from '@/components/UserAvatar';
import { Room, Participant, Reaction } from '@/hooks/useSharedReading';
import { bibleApi, BibleChapter } from '@/services/bibleApi';
import { Check, Loader2, BookOpen, LogOut, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { ReactionBar } from './ReactionBar';

interface SharedReadingTextProps {
  room: Room;
  participants: Participant[];
  currentParticipant?: Participant;
  onFinishReading: () => void;
  generatingQuiz: boolean;
  reactions: Reaction[];
  onReaction: (reaction: string) => void;
  onLeave: () => void;
}

export const SharedReadingText = ({
  room,
  participants,
  currentParticipant,
  onFinishReading,
  generatingQuiz,
  reactions,
  onReaction,
  onLeave
}: SharedReadingTextProps) => {
  const [chapter, setChapter] = useState<BibleChapter | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadChapter = async () => {
      setLoading(true);
      try {
        const chapterData = await bibleApi.getChapter(room.current_book_abbrev, room.current_chapter);
        setChapter(chapterData);
      } catch (error) {
        console.error('Error loading chapter:', error);
      }
      setLoading(false);
    };
    loadChapter();
  }, [room.current_book_abbrev, room.current_chapter]);

  const finishedCount = participants.filter(p => p.finished_reading).length;
  const progressPercentage = (finishedCount / participants.length) * 100;
  const allFinished = participants.every(p => p.finished_reading);
  const hasFinishedReading = currentParticipant?.finished_reading;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-emerald-500" />
                {chapter?.name || 'Carregando...'} {room.current_chapter}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Leia o capítulo e clique em "Terminei de ler" quando estiver pronto
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onLeave}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progresso do grupo</span>
              <span className="font-medium">{finishedCount}/{participants.length} prontos</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* Participant Status */}
          <div className="flex flex-wrap gap-2 mt-4">
            {participants.map((participant) => (
              <motion.div
                key={participant.id}
                initial={{ scale: 0.8 }}
                animate={{ 
                  scale: participant.finished_reading ? [1, 1.1, 1] : 1 
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
                  participant.finished_reading 
                    ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' 
                    : 'bg-muted'
                }`}
              >
                <UserAvatar
                  src={participant.profile?.avatar_url}
                  fallback={participant.profile?.full_name?.[0] || '?'}
                  size="xs"
                />
                <span className="max-w-[80px] truncate">
                  {participant.profile?.full_name?.split(' ')[0] || 'Usuário'}
                </span>
                {participant.finished_reading && (
                  <Check className="h-4 w-4 text-emerald-500" />
                )}
              </motion.div>
            ))}
          </div>
        </CardHeader>
      </Card>

      {/* Bible Text */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <ScrollArea className="h-[400px] p-6">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : chapter ? (
              <div className="prose prose-lg dark:prose-invert max-w-none">
                {chapter.vers.map((verse, index) => (
                  <motion.p
                    key={verse.number}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="mb-3 leading-relaxed"
                  >
                    <span className="text-primary font-bold mr-2">{verse.number}</span>
                    {verse.verse}
                  </motion.p>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">
                Erro ao carregar o capítulo
              </p>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Reactions */}
      <ReactionBar reactions={reactions} onReaction={onReaction} participants={participants} />

      {/* Action Button */}
      {generatingQuiz ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-6"
        >
          <div className="inline-flex items-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
            <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
            <div className="text-left">
              <p className="font-medium">Gerando quiz...</p>
              <p className="text-sm text-muted-foreground">
                Preparando perguntas sobre o capítulo
              </p>
            </div>
          </div>
        </motion.div>
      ) : allFinished ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-6"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
            <Sparkles className="h-5 w-5 animate-pulse" />
            <span className="font-medium">Todos prontos! Preparando o quiz...</span>
          </div>
        </motion.div>
      ) : (
        <Button
          size="lg"
          className={`w-full text-lg py-6 ${
            hasFinishedReading
              ? 'bg-emerald-500 hover:bg-emerald-600'
              : 'bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90'
          }`}
          onClick={onFinishReading}
          disabled={hasFinishedReading}
        >
          {hasFinishedReading ? (
            <>
              <Check className="h-5 w-5 mr-2" />
              Aguardando os outros participantes...
            </>
          ) : (
            <>
              <BookOpen className="h-5 w-5 mr-2" />
              Terminei de Ler
            </>
          )}
        </Button>
      )}
    </div>
  );
};
