import { useState, useEffect } from 'react';
import { useSharedReading, QuizQuestion } from '@/hooks/useSharedReading';
import { SharedReadingWaiting } from './SharedReadingWaiting';
import { SharedReadingText } from './SharedReadingText';
import { SharedReadingQuiz } from './SharedReadingQuiz';
import { SharedReadingResults } from './SharedReadingResults';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface SharedReadingRoomProps {
  roomId: string;
  onLeave: () => void;
}

export const SharedReadingRoom = ({ roomId, onLeave }: SharedReadingRoomProps) => {
  const {
    room,
    participants,
    answers,
    reactions,
    loading,
    currentUserId,
    markFinishedReading,
    saveReflection,
    updateRoomStatus,
    setQuizQuestions,
    submitAnswer,
    addReaction,
    advanceToNextChapter,
    retryChapter,
    leaveRoom
  } = useSharedReading(roomId);

  const [generatingQuiz, setGeneratingQuiz] = useState(false);

  const handleLeave = async () => {
    await leaveRoom();
    onLeave();
  };

  const isHost = room?.host_id === currentUserId;
  const currentParticipant = participants.find(p => p.user_id === currentUserId);
  const allFinishedReading = participants.length > 0 && participants.every(p => p.finished_reading);

  // Auto-trigger quiz generation when all finish reading (host only)
  useEffect(() => {
    if (isHost && allFinishedReading && room?.status === 'reading' && !generatingQuiz) {
      handleGenerateQuiz();
    }
  }, [allFinishedReading, isHost, room?.status]);

  const handleGenerateQuiz = async () => {
    if (!room || generatingQuiz) return;
    
    setGeneratingQuiz(true);
    try {
      // Fetch chapter text
      const { bibleApi } = await import('@/services/bibleApi');
      const chapter = await bibleApi.getChapter(room.current_book_abbrev, room.current_chapter);
      const verseTexts = chapter.vers.map(v => `${v.number}. ${v.verse}`).join('\n');

      // Call edge function to generate quiz
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-quiz-questions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
          },
          body: JSON.stringify({
            bookName: chapter.name,
            chapter: room.current_chapter,
            verseTexts
          })
        }
      );

      const data = await response.json();
      
      if (data.questions && data.questions.length > 0) {
        await setQuizQuestions(data.questions);
      }
    } catch (error) {
      console.error('Error generating quiz:', error);
    } finally {
      setGeneratingQuiz(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Sala não encontrada</p>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={room.status}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        {room.status === 'waiting' && (
          <SharedReadingWaiting
            room={room}
            participants={participants}
            isHost={isHost}
            onStartReading={() => updateRoomStatus('reading')}
            onLeave={handleLeave}
            reactions={reactions}
            onReaction={addReaction}
          />
        )}

        {room.status === 'reading' && (
          <SharedReadingText
            room={room}
            participants={participants}
            currentParticipant={currentParticipant}
            onFinishReading={markFinishedReading}
            generatingQuiz={generatingQuiz}
            reactions={reactions}
            onReaction={addReaction}
            onLeave={handleLeave}
          />
        )}

        {room.status === 'quiz' && room.quiz_questions && (
          <SharedReadingQuiz
            room={room}
            participants={participants}
            questions={room.quiz_questions}
            answers={answers}
            currentUserId={currentUserId}
            onSubmitAnswer={submitAnswer}
            onShowResults={() => updateRoomStatus('results')}
            isHost={isHost}
            reactions={reactions}
            onReaction={addReaction}
          />
        )}

        {room.status === 'results' && (
          <SharedReadingResults
            room={room}
            participants={participants}
            questions={room.quiz_questions || []}
            answers={answers}
            currentUserId={currentUserId}
            isHost={isHost}
            onAdvance={advanceToNextChapter}
            onRetry={retryChapter}
            onLeave={handleLeave}
            reactions={reactions}
            onReaction={addReaction}
            onSaveReflection={saveReflection}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
};
