import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TypingStatus {
  odId: string;
  isTyping: boolean;
  userId: string;
}

export const useTypingIndicator = (conversationId: string | null, userId: string | null) => {
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Set typing status
  const setTyping = useCallback((isTyping: boolean) => {
    if (!channelRef.current || !userId || !conversationId) return;

    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId, isTyping, odId: conversationId }
    });
  }, [userId, conversationId]);

  // Start typing - call this when user starts typing
  const startTyping = useCallback(() => {
    setTyping(true);

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Auto-stop after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
    }, 3000);
  }, [setTyping]);

  // Stop typing - call this when message is sent
  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setTyping(false);
  }, [setTyping]);

  // Subscribe to typing events
  const subscribeToTyping = useCallback((
    onTypingChange: (status: TypingStatus) => void
  ) => {
    if (!conversationId || !userId) return () => {};

    const channelName = `typing-${conversationId}`;
    
    channelRef.current = supabase
      .channel(channelName)
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        // Don't show own typing status
        if (payload.userId !== userId) {
          onTypingChange(payload as TypingStatus);
        }
      })
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [conversationId, userId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  return {
    startTyping,
    stopTyping,
    subscribeToTyping
  };
};
