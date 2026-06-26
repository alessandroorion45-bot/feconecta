import { useEffect, useRef, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  is_read: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  media_url?: string;
  media_type?: 'image' | 'audio' | 'video' | 'document';
}

interface UseChatWebSocketOptions {
  userId: string | null;
  onNewMessage: (message: Message) => void;
  onConversationUpdate: () => void;
}

/**
 * Gerenciador centralizado de WebSocket para mensagens
 * Evita múltiplas subscrições e vazamento de memória
 */
export const useChatWebSocket = ({
  userId,
  onNewMessage,
  onConversationUpdate
}: UseChatWebSocketOptions) => {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isSubscribedRef = useRef(false);

  // Cleanup de timer de debounce
  const clearDebounce = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  // Atualizar conversas com debounce
  const triggerConversationUpdate = useCallback(() => {
    clearDebounce();
    debounceTimerRef.current = setTimeout(() => {
      onConversationUpdate();
    }, 500);
  }, [onConversationUpdate, clearDebounce]);

  useEffect(() => {
    // Não subscrever se não houver usuário
    if (!userId) {
      return;
    }

    // Prevenir múltiplas subscrições
    if (isSubscribedRef.current && channelRef.current) {
      console.log('[WebSocket] Já existe uma subscrição ativa, reutilizando...');
      return;
    }

    console.log('[WebSocket] Criando nova subscrição para usuário:', userId);

    // Criar canal único por usuário
    const channel = supabase
      .channel(`chat-messages-${userId}`, {
        config: {
          broadcast: { self: false },
          presence: { key: userId }
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `or(sender_id.eq.${userId},receiver_id.eq.${userId})`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          console.log('[WebSocket] Nova mensagem recebida:', newMessage.id);

          // Notificar nova mensagem
          onNewMessage(newMessage);

          // Atualizar lista de conversas (com debounce)
          triggerConversationUpdate();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `or(sender_id.eq.${userId},receiver_id.eq.${userId})`
        },
        (payload) => {
          const updatedMessage = payload.new as Message;
          console.log('[WebSocket] Mensagem atualizada:', updatedMessage.id);

          // Atualizar mensagem (status, is_read, etc)
          onNewMessage(updatedMessage);
        }
      )
      .subscribe((status) => {
        console.log('[WebSocket] Status da subscrição:', status);
        if (status === 'SUBSCRIBED') {
          isSubscribedRef.current = true;
        }
      });

    channelRef.current = channel;

    // Cleanup ao desmontar
    return () => {
      console.log('[WebSocket] Limpando subscrição...');
      clearDebounce();

      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      isSubscribedRef.current = false;
    };
  }, [userId, onNewMessage, triggerConversationUpdate, clearDebounce]);

  return {
    isConnected: isSubscribedRef.current,
    channel: channelRef.current
  };
};
