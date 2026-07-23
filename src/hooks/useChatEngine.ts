import { useEffect, useRef, useState, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// =====================================================
// TYPES
// =====================================================

export type MessageType =
  | 'text' | 'audio' | 'image' | 'video' | 'document'
  | 'verse' | 'prayer' | 'testimony' | 'event' | 'poll'
  | 'location' | 'contact' | 'sticker';

export type MessageStatus =
  | 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export type ConversationType =
  | 'private' | 'group' | 'community' | 'channel';

export type ParticipantRole =
  | 'owner' | 'admin' | 'moderator' | 'member' | 'visitor';

export type PresenceStatus =
  | 'online' | 'away' | 'busy' | 'praying' | 'offline' | 'invisible';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id?: string;

  type: MessageType;
  content: string;

  // Mídia
  media_url?: string;
  media_type?: string;
  media_size?: number;
  media_duration?: number;
  media_thumbnail?: string;
  waveform?: number[];

  // Metadata
  mentions?: string[];
  hashtags?: string[];
  link_preview?: any;

  // Referências
  reply_to_id?: string;
  forwarded_from_id?: string;

  // Status
  status: MessageStatus;
  is_read: boolean;
  is_pinned: boolean;
  is_starred: boolean;

  // Timestamps
  created_at: string;
  edited_at?: string;
  deleted_at?: string;
  scheduled_for?: string;
  expires_at?: string;
}

export interface Conversation {
  id: string;
  type: ConversationType;

  name?: string;
  description?: string;
  avatar_url?: string;

  participant_1_id?: string;
  participant_2_id?: string;

  settings: {
    is_muted: boolean;
    notifications: string;
    theme: string;
  };

  created_at: string;
  updated_at: string;
  last_message_at?: string;

  // Dados adicionais (JOIN)
  last_message?: string;
  unread_count?: number;
  other_user?: {
    id: string;
    full_name: string;
    avatar_url?: string;
    is_online?: boolean;
  };
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  role: ParticipantRole;
  permissions: {
    can_send_messages: boolean;
    can_send_media: boolean;
    can_add_members: boolean;
    can_pin_messages: boolean;
    can_delete_messages: boolean;
  };
  last_read_message_id?: string;
  last_read_at?: string;
  unread_count: number;
  joined_at: string;
  left_at?: string;
}

export interface TypingIndicator {
  conversation_id: string;
  user_id: string;
  user_name: string;
  is_typing: boolean;
  is_recording: boolean;
}

// =====================================================
// HOOK PRINCIPAL
// =====================================================

export const useChatEngine = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<ConversationParticipant[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);

  // Refs
  const channelRef = useRef<RealtimeChannel | null>(null);
  const presenceChannelRef = useRef<RealtimeChannel | null>(null);
  const messageQueueRef = useRef<Message[]>([]);

  // =====================================================
  // REALTIME - WebSocket Manager
  // =====================================================

  const setupRealtimeSubscription = useCallback(() => {
    if (!user) return;

    // Limpar subscrição anterior
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    console.log('[ChatEngine] Iniciando subscrição Realtime...');

    const channel = supabase
      .channel(`chat-engine-${user.id}`, {
        config: {
          broadcast: { self: false },
          presence: { key: user.id }
        }
      })

      // Nova mensagem — sem `filter`: or(...) não é sintaxe válida de
      // Realtime; a RLS de messages já limita a entrega ao próprio usuário
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const newMessage = payload.new as Message;
          console.log('[ChatEngine] Nova mensagem:', newMessage.id);

          // Adicionar à lista se for da conversa atual
          if (selectedConversation && newMessage.conversation_id === selectedConversation.id) {
            setMessages(prev => {
              if (prev.some(m => m.id === newMessage.id)) return prev;
              return [...prev, newMessage];
            });
          }

          // Atualizar lista de conversas
          loadConversations();
        }
      )

      // Mensagem atualizada (editada, deletada, etc)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const updatedMessage = payload.new as Message;
          console.log('[ChatEngine] Mensagem atualizada:', updatedMessage.id);

          setMessages(prev => prev.map(m =>
            m.id === updatedMessage.id ? updatedMessage : m
          ));
        }
      )

      // Status de leitura
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_receipts'
        },
        (payload) => {
          console.log('[ChatEngine] Novo receipt:', payload.new);
          // Atualizar status visual das mensagens
          loadMessages(selectedConversation?.id);
        }
      )

      // Typing indicators
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_indicators'
        },
        async (payload) => {
          if (payload.eventType === 'DELETE') {
            setTypingUsers(prev => prev.filter(t =>
              t.user_id !== (payload.old as any).user_id
            ));
          } else {
            const indicator = payload.new as any;

            // Buscar nome do usuário
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', indicator.user_id)
              .single();

            setTypingUsers(prev => {
              const filtered = prev.filter(t => t.user_id !== indicator.user_id);
              if (indicator.is_typing || indicator.is_recording) {
                return [...filtered, {
                  ...indicator,
                  user_name: profile?.full_name || 'Usuário'
                }];
              }
              return filtered;
            });
          }
        }
      )

      .subscribe((status) => {
        console.log('[ChatEngine] Status da subscrição:', status);
      });

    channelRef.current = channel;
  }, [user, selectedConversation, conversations]);

  // =====================================================
  // PRESENCE - Online/Offline
  // =====================================================

  const setupPresence = useCallback(() => {
    if (!user) return;

    if (presenceChannelRef.current) {
      supabase.removeChannel(presenceChannelRef.current);
    }

    const presenceChannel = supabase.channel('global-presence', {
      config: { presence: { key: user.id } }
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const online = new Set(Object.keys(state));
        setOnlineUsers(online);
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        setOnlineUsers(prev => new Set([...prev, key]));
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(key);
          return newSet;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: user.id,
            online_at: new Date().toISOString()
          });
        }
      });

    presenceChannelRef.current = presenceChannel;
  }, [user]);

  // =====================================================
  // CONVERSATIONS - Carregar lista
  // =====================================================

  const loadConversations = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);

    try {
      // Buscar conversas privadas
      const { data: privateConvs, error: privateError } = await supabase
        .from('conversations')
        .select(`
          *,
          messages (
            content,
            created_at
          )
        `)
        .eq('type', 'private')
        .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`)
        .is('deleted_at', null)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (privateError) throw privateError;

      // Buscar conversas de grupos/comunidades
      const { data: participantConvs, error: participantError } = await supabase
        .from('conversation_participants')
        .select(`
          *,
          conversations (*)
        `)
        .eq('user_id', user.id)
        .is('left_at', null);

      if (participantError) throw participantError;

      // Combinar e enriquecer dados
      const allConvs: Conversation[] = [];

      // Processar conversas privadas
      if (privateConvs) {
        for (const conv of privateConvs) {
          const otherId = conv.participant_1_id === user.id
            ? conv.participant_2_id
            : conv.participant_1_id;

          // Buscar perfil do outro usuário
          const { data: otherProfile } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('id', otherId)
            .single();

          // Buscar contador não lido
          const { data: participant } = await supabase
            .from('conversation_participants')
            .select('unread_count')
            .eq('conversation_id', conv.id)
            .eq('user_id', user.id)
            .single();

          allConvs.push({
            ...conv,
            other_user: otherProfile ? {
              id: otherProfile.id,
              full_name: otherProfile.full_name,
              avatar_url: otherProfile.avatar_url,
              is_online: onlineUsers.has(otherProfile.id)
            } : undefined,
            unread_count: participant?.unread_count || 0,
            last_message: (conv.messages as any)?.[0]?.content
          });
        }
      }

      // Processar grupos/comunidades
      if (participantConvs) {
        for (const pc of participantConvs) {
          const conv = (pc as any).conversations;
          if (!conv) continue;

          allConvs.push({
            ...conv,
            unread_count: pc.unread_count || 0
          });
        }
      }

      // Ordenar por última mensagem
      allConvs.sort((a, b) => {
        const dateA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
        const dateB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
        return dateB - dateA;
      });

      setConversations(allConvs);
    } catch (error) {
      console.error('[ChatEngine] Erro ao carregar conversas:', error);
      toast({
        title: '❌ Erro ao carregar conversas',
        description: 'Tente novamente',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, onlineUsers, toast]);

  // =====================================================
  // MESSAGES - Carregar mensagens
  // =====================================================

  const loadMessages = useCallback(async (
    conversationId?: string,
    limit: number = 50,
    before?: string
  ) => {
    if (!conversationId) return;

    setIsLoading(true);

    try {
      let query = supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (before) {
        query = query.lt('created_at', before);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        const reversed = [...data].reverse();

        if (before) {
          setMessages(prev => [...reversed, ...prev]);
        } else {
          setMessages(reversed);
        }

        setHasMoreMessages(data.length === limit);
      }
    } catch (error) {
      console.error('[ChatEngine] Erro ao carregar mensagens:', error);
      toast({
        title: '❌ Erro ao carregar mensagens',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // =====================================================
  // SEND MESSAGE
  // =====================================================

  const sendMessage = useCallback(async (
    content: string,
    type: MessageType = 'text',
    metadata?: Partial<Message>
  ) => {
    if (!user || !selectedConversation) return;

    setIsSending(true);

    // Criar mensagem otimista
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: selectedConversation.id,
      sender_id: user.id,
      type,
      content,
      status: 'sending',
      is_read: false,
      is_pinned: false,
      is_starred: false,
      created_at: new Date().toISOString(),
      ...metadata
    };

    // Adicionar à lista imediatamente (UI otimista)
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: user.id,
          receiver_id: selectedConversation.type === 'private'
            ? selectedConversation.other_user?.id
            : undefined,
          type,
          content,
          ...metadata
        })
        .select()
        .single();

      if (error) throw error;

      // Substituir mensagem temporária pela real
      setMessages(prev => prev.map(m =>
        m.id === optimisticMessage.id ? data : m
      ));

      return data;
    } catch (error) {
      console.error('[ChatEngine] Erro ao enviar mensagem:', error);

      // Marcar como falha
      setMessages(prev => prev.map(m =>
        m.id === optimisticMessage.id
          ? { ...m, status: 'failed' as MessageStatus }
          : m
      ));

      toast({
        title: '❌ Falha ao enviar mensagem',
        description: 'Toque para tentar novamente',
        variant: 'destructive'
      });
    } finally {
      setIsSending(false);
    }
  }, [user, selectedConversation, toast]);

  // =====================================================
  // GET OR CREATE PRIVATE CONVERSATION
  // =====================================================

  const getOrCreatePrivateConversation = useCallback(async (otherUserId: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .rpc('get_or_create_private_conversation', {
          other_user_id: otherUserId
        });

      if (error) throw error;

      // Carregar conversa completa
      const { data: conv } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', data)
        .single();

      if (conv) {
        // Adicionar às conversas se não existe
        setConversations(prev => {
          if (prev.some(c => c.id === conv.id)) return prev;
          return [conv, ...prev];
        });

        return conv;
      }

      return null;
    } catch (error) {
      console.error('[ChatEngine] Erro ao criar conversa:', error);
      return null;
    }
  }, [user]);

  // =====================================================
  // MARK AS READ
  // =====================================================

  const markAsRead = useCallback(async (conversationId: string, messageId: string) => {
    if (!user) return;

    try {
      await supabase.rpc('mark_messages_as_read', {
        conv_id: conversationId,
        up_to_message_id: messageId
      });

      // Atualizar contador local
      setConversations(prev => prev.map(c =>
        c.id === conversationId ? { ...c, unread_count: 0 } : c
      ));
    } catch (error) {
      console.error('[ChatEngine] Erro ao marcar como lido:', error);
    }
  }, [user]);

  // =====================================================
  // TYPING INDICATOR
  // =====================================================

  const setTypingStatus = useCallback(async (
    conversationId: string,
    isTyping: boolean,
    isRecording: boolean = false
  ) => {
    if (!user) return;

    try {
      if (isTyping || isRecording) {
        await supabase
          .from('typing_indicators')
          .upsert({
            conversation_id: conversationId,
            user_id: user.id,
            is_typing: isTyping,
            is_recording: isRecording,
            expires_at: new Date(Date.now() + 10000).toISOString()
          });
      } else {
        await supabase
          .from('typing_indicators')
          .delete()
          .eq('conversation_id', conversationId)
          .eq('user_id', user.id);
      }
    } catch (error) {
      console.error('[ChatEngine] Erro no typing indicator:', error);
    }
  }, [user]);

  // =====================================================
  // EFFECTS
  // =====================================================

  // Setup inicial
  useEffect(() => {
    if (user) {
      loadConversations();
      setupRealtimeSubscription();
      setupPresence();
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (presenceChannelRef.current) {
        supabase.removeChannel(presenceChannelRef.current);
      }
    };
  }, [user]);

  // Carregar mensagens ao selecionar conversa
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);

      // Marcar como lido após 1 segundo
      const timer = setTimeout(() => {
        if (messages.length > 0) {
          const lastMessage = messages[messages.length - 1];
          markAsRead(selectedConversation.id, lastMessage.id);
        }
      }, 1000);

      return () => clearTimeout(timer);
    } else {
      setMessages([]);
    }
  }, [selectedConversation]);

  // =====================================================
  // RETURN
  // =====================================================

  return {
    // State
    conversations,
    selectedConversation,
    messages,
    participants,
    typingUsers,
    onlineUsers,

    // Flags
    isLoading,
    isSending,
    hasMoreMessages,

    // Actions
    setSelectedConversation,
    loadConversations,
    loadMessages,
    sendMessage,
    getOrCreatePrivateConversation,
    markAsRead,
    setTypingStatus
  };
};
