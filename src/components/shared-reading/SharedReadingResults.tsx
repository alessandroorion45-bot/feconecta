import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import UserAvatar from '@/components/UserAvatar';
import { Room, Participant, QuizQuestion, QuizAnswer, Reaction } from '@/hooks/useSharedReading';
import { 
  Trophy, Check, X, ArrowRight, RotateCcw, LogOut, 
  Sparkles, Star, Crown, Medal, PartyPopper 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ReactionBar } from './ReactionBar';

interface SharedReadingResultsProps {
  room: Room;
  participants: Participant[];
  questions: QuizQuestion[];
  answers: QuizAnswer[];
  currentUserId: string | null;
  isHost: boolean;
  onAdvance: () => void;
  onRetry: () => void;
  onLeave: () => void;
  reactions: Reaction[];
  onReaction: (reaction: string) => void;
}

export const SharedReadingResults = ({
  room,
  participants,
  questions,
  answers,
  currentUserId,
  isHost,
  onAdvance,
  onRetry,
  onLeave,
  reactions,
  onReaction
}: SharedReadingResultsProps) => {
  const [showConfetti, setShowConfetti] = useState(false);

  // Calculate results per participant
  const getParticipantResults = (userId: string) => {
    const userAnswers = answers.filter(a => a.user_id === userId);
    const correctCount = userAnswers.filter(a => a.is_correct).length;
    return {
      correct: correctCount,
      wrong: questions.length - correctCount,
      percentage: Math.round((correctCount / questions.length) * 100)
    };
  };

  // Check if everyone got all answers correct
  const everyonePassedPerfectly = participants.every(p => {
    const results = getParticipantResults(p.user_id);
    return results.correct === questions.length;
  });

  // Calculate group stats
  const totalCorrect = answers.filter(a => a.is_correct).length;
  const totalAnswers = answers.length;
  const groupPercentage = Math.round((totalCorrect / totalAnswers) * 100);

  // Rank participants by correct answers
  const rankedParticipants = [...participants].sort((a, b) => {
    const aResults = getParticipantResults(a.user_id);
    const bResults = getParticipantResults(b.user_id);
    return bResults.correct - aResults.correct;
  });

  useEffect(() => {
    if (everyonePassedPerfectly) {
      setShowConfetti(true);
    }
  }, [everyonePassedPerfectly]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Confetti overlay for perfect score */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
          >
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-4xl"
                initial={{
                  x: 0,
                  y: 0,
                  scale: 0,
                  rotate: 0
                }}
                animate={{
                  x: (Math.random() - 0.5) * 600,
                  y: (Math.random() - 0.5) * 600,
                  scale: [0, 1, 0],
                  rotate: Math.random() * 360
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.05,
                  ease: "easeOut"
                }}
              >
                {['🎉', '✨', '🌟', '🙏', '📖', '💫'][i % 6]}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result Header */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
      >
        <Card className={`overflow-hidden ${
          everyonePassedPerfectly 
            ? 'bg-gradient-to-br from-emerald-500/20 via-green-500/10 to-teal-500/20 border-emerald-500/30' 
            : 'bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-red-500/20 border-amber-500/30'
        }`}>
          <CardHeader className="text-center pb-4">
            <motion.div
              animate={everyonePassedPerfectly ? { 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              } : {}}
              transition={{ duration: 0.5, repeat: everyonePassedPerfectly ? 3 : 0 }}
            >
              {everyonePassedPerfectly ? (
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 mx-auto mb-4 shadow-lg shadow-emerald-500/30">
                  <Trophy className="h-12 w-12 text-white" />
                </div>
              ) : (
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 mx-auto mb-4 shadow-lg shadow-amber-500/30">
                  <RotateCcw className="h-12 w-12 text-white" />
                </div>
              )}
            </motion.div>
            
            <CardTitle className="text-2xl">
              {everyonePassedPerfectly 
                ? '🎉 Parabéns! Todos Acertaram!' 
                : '💪 Vamos Refletir Juntos!'}
            </CardTitle>
            
            <p className="text-muted-foreground mt-2">
              {everyonePassedPerfectly 
                ? 'A porta para o próximo capítulo está aberta!' 
                : 'Não desanimem! Releiam o capítulo e tentem novamente.'}
            </p>

            {/* Group Stats */}
            <div className="flex justify-center gap-6 mt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-500">{totalCorrect}</div>
                <div className="text-sm text-muted-foreground">Acertos</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-500">{totalAnswers - totalCorrect}</div>
                <div className="text-sm text-muted-foreground">Erros</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{groupPercentage}%</div>
                <div className="text-sm text-muted-foreground">Grupo</div>
              </div>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Door Animation for advancing */}
      {everyonePassedPerfectly && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <Card className="overflow-hidden bg-gradient-to-r from-violet-500/5 to-purple-500/5 border-violet-500/20">
            <CardContent className="py-8 text-center">
              <motion.div
                className="inline-block"
                animate={{ 
                  rotateY: [0, 10, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="text-6xl mb-4">🚪</div>
              </motion.div>
              <p className="text-lg font-medium bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                Capítulo {room.current_chapter + 1} aguarda vocês!
              </p>
              <Sparkles className="inline h-5 w-5 text-violet-500 animate-pulse ml-2" />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Individual Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Medal className="h-5 w-5 text-amber-500" />
            Resultados Individuais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {rankedParticipants.map((participant, index) => {
              const results = getParticipantResults(participant.user_id);
              const isCurrentUser = participant.user_id === currentUserId;
              const isPerfect = results.correct === questions.length;
              
              return (
                <motion.div
                  key={participant.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center gap-4 p-4 rounded-lg ${
                    isCurrentUser 
                      ? 'bg-primary/10 border border-primary/30' 
                      : 'bg-muted/50'
                  }`}
                >
                  {/* Rank */}
                  <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                    {index === 0 && <Crown className="h-6 w-6 text-yellow-500 fill-yellow-500" />}
                    {index === 1 && <Medal className="h-6 w-6 text-gray-400" />}
                    {index === 2 && <Medal className="h-6 w-6 text-amber-600" />}
                    {index > 2 && <span className="text-lg font-bold text-muted-foreground">{index + 1}</span>}
                  </div>

                  {/* Avatar */}
                  <div className="relative">
                    <UserAvatar
                      src={participant.profile?.avatar_url}
                      fallback={participant.profile?.full_name?.[0] || '?'}
                      size="md"
                    />
                    {isPerfect && (
                      <Star className="absolute -top-1 -right-1 h-4 w-4 text-yellow-500 fill-yellow-500" />
                    )}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {participant.profile?.full_name || 'Usuário'}
                      {isCurrentUser && <span className="text-primary ml-2">(você)</span>}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-sm text-emerald-600">
                        <Check className="h-3 w-3" />
                        {results.correct}
                      </span>
                      <span className="flex items-center gap-1 text-sm text-red-500">
                        <X className="h-3 w-3" />
                        {results.wrong}
                      </span>
                    </div>
                  </div>

                  {/* Score Badge */}
                  <Badge 
                    variant={isPerfect ? "default" : "secondary"}
                    className={isPerfect ? "bg-emerald-500" : ""}
                  >
                    {results.percentage}%
                  </Badge>
                </motion.div>
              );
            })}
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
          everyonePassedPerfectly ? (
            <Button 
              onClick={onAdvance} 
              className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Próximo Capítulo
            </Button>
          ) : (
            <Button 
              onClick={onRetry} 
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reler Capítulo
            </Button>
          )
        )}
      </div>

      {!isHost && (
        <p className="text-center text-sm text-muted-foreground">
          <Sparkles className="inline h-4 w-4 mr-1" />
          Aguardando o anfitrião {everyonePassedPerfectly ? 'avançar' : 'reiniciar'}...
        </p>
      )}
    </div>
  );
};
