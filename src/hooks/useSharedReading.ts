import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Room {
  id: string;
  host_id: string;
  room_code: string;
  room_name: string;
  is_public: boolean;
  current_book_abbrev: string;
  current_chapter: number;
  max_participants: number;
  status: 'waiting' | 'reading' | 'quiz' | 'results';
  quiz_questions: QuizQuestion[] | null;
  created_at: string;
}

export interface Participant {
  id: string;
  room_id: string;
  user_id: string;
  is_host: boolean;
  finished_reading: boolean;
  total_points: number;
  joined_at: string;
  profile?: {
    full_name: string;
    username: string;
    avatar_url: string | null;
  };
}

export interface QuizQuestion {
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: string;
  explanation: string;
}

export interface QuizAnswer {
  id: string;
  room_id: string;
  user_id: string;
  chapter: number;
  question_index: number;
  selected_answer: string;
  is_correct: boolean;
}

export interface Reaction {
  id: string;
  room_id: string;
  user_id: string;
  reaction: string;
  created_at: string;
}

export const useSharedReading = (roomId?: string) => {
  const { toast } = useToast();
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getUser();
  }, []);

  // Generate unique room code
  const generateRoomCode = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Create a new room
  const createRoom = async (roomName: string, isPublic: boolean, bookAbbrev: string, chapter: number) => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      console.error('[SharedReading] Auth error ou user não autenticado:', authError);
      toast({
        title: '🔒 Login necessário',
        description: 'Você precisa estar logado para criar uma sala',
        variant: 'destructive',
      });
      return null;
    }

    const activeUserId = user.id;

    const roomCode = generateRoomCode();

    console.log('[SharedReading] Criando sala:', {
      host_id: activeUserId,
      room_code: roomCode,
      room_name: roomName,
      book: bookAbbrev,
      chapter,
    });

    const { data: roomData, error: roomError } = await supabase
      .from('shared_reading_rooms')
      .insert({
        host_id: activeUserId,
        room_code: roomCode,
        room_name: roomName,
        is_public: isPublic,
        current_book_abbrev: bookAbbrev,
        current_chapter: chapter,
        status: 'waiting'
      })
      .select()
      .single();

    if (roomError) {
      console.error('[SharedReading] Erro ao criar sala:', roomError);
      toast({
        title: '❌ Erro ao criar sala',
        description: roomError.message || 'Verifique sua conexão e tente novamente',
        variant: 'destructive',
      });
      return null;
    }

    console.log('[SharedReading] Sala criada:', roomData);

    // Add host as participant
    const { error: participantError } = await supabase
      .from('shared_reading_participants')
      .insert({
        room_id: roomData.id,
        user_id: activeUserId,
        is_host: true
      });

    if (participantError) {
      console.error('[SharedReading] Erro ao adicionar host como participante:', participantError);
      // Continuar mesmo com erro (a sala foi criada)
    }

    console.log('[SharedReading] Host adicionado como participante');

    toast({
      title: '✅ Sala criada com sucesso!',
      description: `Código de acesso: ${roomCode} - Compartilhe com seus amigos (+5 XP)`,
      className: 'bg-green-50 border-green-200',
    });

    return roomData;
  };

  // Join room by code
  const joinRoomByCode = async (code: string) => {
    if (!currentUserId) {
      toast({ title: 'Erro', description: 'Você precisa estar logado', variant: 'destructive' });
      return null;
    }

    const { data: roomData, error: roomError } = await supabase
      .from('shared_reading_rooms')
      .select('*')
      .eq('room_code', code.toUpperCase())
      .single();

    if (roomError || !roomData) {
      toast({ title: 'Erro', description: 'Sala não encontrada', variant: 'destructive' });
      return null;
    }

    // Check participant count
    const { count } = await supabase
      .from('shared_reading_participants')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', roomData.id);

    if (count && count >= roomData.max_participants) {
      toast({ title: 'Sala cheia', description: 'Esta sala já atingiu o limite de 7 participantes', variant: 'destructive' });
      return null;
    }

    // Check if already a participant
    const { data: existingParticipant } = await supabase
      .from('shared_reading_participants')
      .select('*')
      .eq('room_id', roomData.id)
      .eq('user_id', currentUserId)
      .single();

    if (!existingParticipant) {
      await supabase
        .from('shared_reading_participants')
        .insert({
          room_id: roomData.id,
          user_id: currentUserId,
          is_host: false
        });
    }

    toast({ title: 'Bem-vindo!', description: `Você entrou na sala "${roomData.room_name}"` });
    return roomData;
  };

  // Load room data
  const loadRoomData = useCallback(async () => {
    if (!roomId) return;

    setLoading(true);

    // Load room
    const { data: roomData } = await supabase
      .from('shared_reading_rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (roomData) {
      // Parse quiz_questions JSON if exists
      const parsedRoom: Room = {
        ...roomData,
        status: roomData.status as Room['status'],
        quiz_questions: roomData.quiz_questions as unknown as QuizQuestion[] | null
      };
      setRoom(parsedRoom);
    }

    // Load participants with profiles
    const { data: participantsData } = await supabase
      .from('shared_reading_participants')
      .select(`
        *,
        profile:profiles!shared_reading_participants_user_id_fkey(
          full_name,
          username,
          avatar_url
        )
      `)
      .eq('room_id', roomId);

    if (participantsData) {
      // Handle the profile join - it returns an object, not an array
      const formattedParticipants = participantsData.map((p: any) => ({
        ...p,
        profile: p.profile || null
      }));
      setParticipants(formattedParticipants);
    }

    // Load answers for current chapter
    if (roomData) {
      const { data: answersData } = await supabase
        .from('shared_reading_quiz_answers')
        .select('*')
        .eq('room_id', roomId)
        .eq('chapter', roomData.current_chapter);

      if (answersData) {
        setAnswers(answersData);
      }
    }

    // Load recent reactions
    const { data: reactionsData } = await supabase
      .from('shared_reading_reactions')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (reactionsData) {
      setReactions(reactionsData);
    }

    setLoading(false);
  }, [roomId]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!roomId) return;

    loadRoomData();

    const newChannel = supabase
      .channel(`shared_reading_${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shared_reading_rooms', filter: `id=eq.${roomId}` },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setRoom(payload.new as Room);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shared_reading_participants', filter: `room_id=eq.${roomId}` },
        () => {
          loadRoomData();
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'shared_reading_quiz_answers', filter: `room_id=eq.${roomId}` },
        (payload) => {
          setAnswers(prev => [...prev, payload.new as QuizAnswer]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'shared_reading_reactions', filter: `room_id=eq.${roomId}` },
        (payload) => {
          setReactions(prev => [payload.new as Reaction, ...prev.slice(0, 19)]);
        }
      )
      .subscribe();

    setChannel(newChannel);

    return () => {
      supabase.removeChannel(newChannel);
    };
  }, [roomId, loadRoomData]);

  // Mark reading as finished
  const markFinishedReading = async () => {
    if (!roomId || !currentUserId) return;

    await supabase
      .from('shared_reading_participants')
      .update({ finished_reading: true })
      .eq('room_id', roomId)
      .eq('user_id', currentUserId);
  };

  // Update room status (host only)
  const updateRoomStatus = async (status: Room['status']) => {
    if (!roomId || !currentUserId || room?.host_id !== currentUserId) return;

    await supabase
      .from('shared_reading_rooms')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', roomId);
  };

  // Set quiz questions (host only)
  const setQuizQuestions = async (questions: QuizQuestion[]) => {
    if (!roomId || !currentUserId || room?.host_id !== currentUserId) return;

    await supabase
      .from('shared_reading_rooms')
      .update({ 
        quiz_questions: questions as any,
        status: 'quiz',
        updated_at: new Date().toISOString()
      })
      .eq('id', roomId);
  };

  // Submit quiz answer
  const submitAnswer = async (questionIndex: number, selectedAnswer: string, isCorrect: boolean) => {
    if (!roomId || !currentUserId || !room) return;

    await supabase
      .from('shared_reading_quiz_answers')
      .upsert({
        room_id: roomId,
        user_id: currentUserId,
        chapter: room.current_chapter,
        question_index: questionIndex,
        selected_answer: selectedAnswer,
        is_correct: isCorrect
      }, {
        onConflict: 'room_id,user_id,chapter,question_index'
      });
  };

  // Add reaction
  const addReaction = async (reaction: string) => {
    if (!roomId || !currentUserId) return;

    await supabase
      .from('shared_reading_reactions')
      .insert({
        room_id: roomId,
        user_id: currentUserId,
        reaction
      });
  };

  // Advance to next chapter (host only)
  const advanceToNextChapter = async () => {
    if (!roomId || !currentUserId || room?.host_id !== currentUserId) return;

    // Award points/stats to all participants
    for (const participant of participants) {
      await supabase.rpc('increment_chapters_completed', { p_user_id: participant.user_id });
      
      // Add points to participant
      await supabase
        .from('shared_reading_participants')
        .update({ total_points: participant.total_points + 10 })
        .eq('id', participant.id);
    }

    // Increment sessions hosted for the host
    await supabase.rpc('increment_sessions_hosted', { p_user_id: currentUserId });

    // Reset participants' finished_reading status
    await supabase
      .from('shared_reading_participants')
      .update({ finished_reading: false })
      .eq('room_id', roomId);

    // Update room
    await supabase
      .from('shared_reading_rooms')
      .update({
        current_chapter: (room?.current_chapter || 1) + 1,
        status: 'reading',
        quiz_questions: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', roomId);
  };

  // Retry chapter (host only)
  const retryChapter = async () => {
    if (!roomId || !currentUserId || room?.host_id !== currentUserId) return;

    // Reset participants' finished_reading status
    await supabase
      .from('shared_reading_participants')
      .update({ finished_reading: false })
      .eq('room_id', roomId);

    // Update room status back to reading
    await supabase
      .from('shared_reading_rooms')
      .update({
        status: 'reading',
        quiz_questions: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', roomId);

    // Clear answers for this chapter
    await supabase
      .from('shared_reading_quiz_answers')
      .delete()
      .eq('room_id', roomId)
      .eq('chapter', room?.current_chapter || 1);
  };

  // Leave room
  const leaveRoom = async () => {
    if (!roomId || !currentUserId) return;

    await supabase
      .from('shared_reading_participants')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', currentUserId);
  };

  // Get public rooms
  const getPublicRooms = async () => {
    const { data } = await supabase
      .from('shared_reading_rooms')
      .select(`
        *,
        participant_count:shared_reading_participants(count)
      `)
      .eq('is_public', true)
      .eq('status', 'waiting')
      .order('created_at', { ascending: false })
      .limit(20);

    return data || [];
  };

  return {
    room,
    participants,
    answers,
    reactions,
    loading,
    currentUserId,
    createRoom,
    joinRoomByCode,
    markFinishedReading,
    updateRoomStatus,
    setQuizQuestions,
    submitAnswer,
    addReaction,
    advanceToNextChapter,
    retryChapter,
    leaveRoom,
    getPublicRooms,
    loadRoomData
  };
};
