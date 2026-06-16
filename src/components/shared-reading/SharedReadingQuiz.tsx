import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import UserAvatar from '@/components/UserAvatar';
import { Room, Participant, QuizQuestion, QuizAnswer, Reaction } from '@/hooks/useSharedReading';
import { Timer, Check, X, HelpCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ReactionBar } from './ReactionBar';

interface SharedReadingQuizProps {
  room: Room;
  participants: Participant[];
  questions: QuizQuestion[];
  answers: QuizAnswer[];
  currentUserId: string | null;
  onSubmitAnswer: (questionIndex: number, selectedAnswer: string, isCorrect: boolean) => void;
  onShowResults: () => void;
  isHost: boolean;
  reactions: Reaction[];
  onReaction: (reaction: string) => void;
}

export const SharedReadingQuiz = ({
  room,
  participants,
  questions,
  answers,
  currentUserId,
  onSubmitAnswer,
  onShowResults,
  isHost,
  reactions,
  onReaction
}: SharedReadingQuizProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [showFeedback, setShowFeedback] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const myAnswers = answers.filter(a => a.user_id === currentUserId);
  const hasAnsweredCurrent = myAnswers.some(a => a.question_index === currentQuestionIndex);
  const currentAnswer = myAnswers.find(a => a.question_index === currentQuestionIndex);

  // Timer
  useEffect(() => {
    if (hasAnsweredCurrent || showFeedback) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Auto-submit wrong answer on timeout
          handleSubmit('');
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [hasAnsweredCurrent, showFeedback, currentQuestionIndex]);

  // Reset timer when question changes
  useEffect(() => {
    setTimeLeft(60);
    setSelectedAnswer(null);
    setShowFeedback(false);
  }, [currentQuestionIndex]);

  // Check if all participants answered all questions
  const totalExpectedAnswers = participants.length * questions.length;
  const allAnswered = answers.length >= totalExpectedAnswers;

  useEffect(() => {
    if (allAnswered && isHost) {
      setTimeout(() => onShowResults(), 2000);
    }
  }, [allAnswered, isHost]);

  const handleSubmit = (answer: string) => {
    if (hasAnsweredCurrent) return;

    const isCorrect = answer === currentQuestion.correctAnswer;
    onSubmitAnswer(currentQuestionIndex, answer, isCorrect);
    setShowFeedback(true);

    // Move to next question after delay
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      }
    }, 2000);
  };

  // Count answers per participant per question
  const getParticipantStatus = (participantId: string) => {
    const participantAnswers = answers.filter(a => a.user_id === participantId);
    const answeredCurrent = participantAnswers.some(a => a.question_index === currentQuestionIndex);
    return {
      answered: participantAnswers.length,
      answeredCurrent
    };
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-violet-500/20">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-violet-500" />
                Quiz do Capítulo
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Pergunta {currentQuestionIndex + 1} de {questions.length}
              </p>
            </div>
            
            {/* Timer */}
            <motion.div
              key={timeLeft}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-mono text-lg ${
                timeLeft <= 10 
                  ? 'bg-red-500/20 text-red-500' 
                  : timeLeft <= 30 
                    ? 'bg-yellow-500/20 text-yellow-600' 
                    : 'bg-violet-500/20 text-violet-500'
              }`}
            >
              <Timer className="h-5 w-5" />
              {timeLeft}s
            </motion.div>
          </div>

          {/* Progress */}
          <Progress 
            value={(currentQuestionIndex / questions.length) * 100} 
            className="h-2 mt-4" 
          />

          {/* Participant Status */}
          <div className="flex flex-wrap gap-2 mt-4">
            {participants.map((participant) => {
              const status = getParticipantStatus(participant.user_id);
              return (
                <motion.div
                  key={participant.id}
                  animate={{ 
                    scale: status.answeredCurrent ? [1, 1.1, 1] : 1 
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
                    status.answeredCurrent 
                      ? 'bg-violet-500/20 text-violet-700 dark:text-violet-300' 
                      : 'bg-muted animate-pulse'
                  }`}
                >
                  <UserAvatar
                    src={participant.profile?.avatar_url}
                    fallback={participant.profile?.full_name?.[0] || '?'}
                    size="xs"
                  />
                  <span className="max-w-[60px] truncate">
                    {participant.profile?.full_name?.split(' ')[0] || 'Usuário'}
                  </span>
                  {status.answeredCurrent && <Check className="h-3 w-3" />}
                </motion.div>
              );
            })}
          </div>
        </CardHeader>
      </Card>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
        >
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-xl font-medium mb-6 leading-relaxed">
                {currentQuestion.question}
              </h3>

              <div className="grid gap-3">
                {Object.entries(currentQuestion.options).map(([key, value]) => {
                  const isSelected = selectedAnswer === key;
                  const isCorrect = key === currentQuestion.correctAnswer;
                  const showCorrectness = showFeedback || hasAnsweredCurrent;
                  const wasMyAnswer = currentAnswer?.selected_answer === key;

                  let buttonClass = "w-full justify-start text-left h-auto py-4 px-6 ";
                  
                  if (showCorrectness) {
                    if (isCorrect) {
                      buttonClass += "bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-300";
                    } else if (wasMyAnswer && !isCorrect) {
                      buttonClass += "bg-red-500/20 border-red-500 text-red-700 dark:text-red-300";
                    } else {
                      buttonClass += "opacity-50";
                    }
                  } else if (isSelected) {
                    buttonClass += "bg-primary/20 border-primary";
                  }

                  return (
                    <motion.div
                      key={key}
                      whileHover={{ scale: showCorrectness ? 1 : 1.02 }}
                      whileTap={{ scale: showCorrectness ? 1 : 0.98 }}
                    >
                      <Button
                        variant="outline"
                        className={buttonClass}
                        onClick={() => {
                          if (!hasAnsweredCurrent && !showFeedback) {
                            setSelectedAnswer(key);
                          }
                        }}
                        disabled={hasAnsweredCurrent || showFeedback}
                      >
                        <span className="font-bold text-lg mr-3">{key}</span>
                        <span className="flex-1">{value}</span>
                        {showCorrectness && isCorrect && (
                          <Check className="h-5 w-5 text-emerald-500 ml-2" />
                        )}
                        {showCorrectness && wasMyAnswer && !isCorrect && (
                          <X className="h-5 w-5 text-red-500 ml-2" />
                        )}
                      </Button>
                    </motion.div>
                  );
                })}
              </div>

              {/* Submit Button */}
              {!hasAnsweredCurrent && !showFeedback && (
                <Button
                  size="lg"
                  className="w-full mt-6 bg-gradient-to-r from-violet-500 to-purple-600"
                  onClick={() => handleSubmit(selectedAnswer || '')}
                  disabled={!selectedAnswer}
                >
                  Confirmar Resposta
                </Button>
              )}

              {/* Feedback */}
              {showFeedback && currentAnswer && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-6 p-4 rounded-lg ${
                    currentAnswer.is_correct 
                      ? 'bg-emerald-500/20 border border-emerald-500/30' 
                      : 'bg-red-500/20 border border-red-500/30'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {currentAnswer.is_correct ? (
                      <>
                        <Check className="h-5 w-5 text-emerald-500" />
                        <span className="font-medium text-emerald-700 dark:text-emerald-300">
                          Correto! 🎉
                        </span>
                      </>
                    ) : (
                      <>
                        <X className="h-5 w-5 text-red-500" />
                        <span className="font-medium text-red-700 dark:text-red-300">
                          Ops! Resposta incorreta
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {currentQuestion.explanation}
                  </p>
                </motion.div>
              )}

              {/* Waiting for others */}
              {hasAnsweredCurrent && currentQuestionIndex === questions.length - 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-6 text-center py-4"
                >
                  <Sparkles className="h-8 w-8 mx-auto text-violet-500 animate-pulse mb-2" />
                  <p className="text-muted-foreground">
                    Aguardando todos finalizarem o quiz...
                  </p>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Reactions */}
      <ReactionBar reactions={reactions} onReaction={onReaction} participants={participants} />
    </div>
  );
};
