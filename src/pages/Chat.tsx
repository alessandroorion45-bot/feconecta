import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatSettingsSheet } from '@/components/chat/ChatSettingsSheet';
import { ConversationList } from '@/components/chat/ConversationList';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import type { SharedMessageType } from '@/components/chat/SharedContentCard';
import { useChatSounds } from '@/hooks/useChatSounds';
import { useDynamicBackground } from '@/hooks/useDynamicBackground';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { useChatWebSocket } from '@/hooks/useChatWebSocket';
import { useAuth } from '@/contexts/AuthContext';
import { usePresence } from '@/contexts/PresenceContext';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Search, Sparkles, Pin, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'react-router-dom';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  is_read: boolean;
  status: string;
  media_url?: string | null;
  media_type?: 'image' | 'audio' | 'video' | null;
  message_type?: SharedMessageType;
  shared_content?: Record<string, any> | null;
}

interface Conversation {
  id: string;
  friendId: string;
  friendName: string;
  friendAvatar?: string | null;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  isOnline?: boolean;
  isPinned?: boolean;
  isMuted?: boolean;
}

interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

interface ConvSettings {
  is_pinned: boolean;
  is_muted: boolean;
  cleared_at: string | null;
  pinned_message_id: string | null;
}

interface Reaction {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

const MESSAGES_PAGE_SIZE = 50;

const Chat = () => {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const location = useLocation();
  const { preferences, playSound, updatePreferences } = useChatSounds();
  const { theme: dynamicTheme, timeOfDay } = useDynamicBackground();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [friendIsTyping, setFriendIsTyping] = useState(false);
  const { connectedUserIds } = usePresence();
  const onlineUsers = useMemo(() => new Set(connectedUserIds), [connectedUserIds]);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [conversationsLoaded, setConversationsLoaded] = useState(false);
  const [convSettings, setConvSettings] = useState<Record<string, ConvSettings>>({});
  const [reactionsByMessage, setReactionsByMessage] = useState<Record<string, Reaction[]>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const selectedConvRef = useRef<Conversation | null>(null);
  const messagesRef = useRef<Message[]>([]);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Keep refs in sync with state
  useEffect(() => {
    selectedConvRef.current = selectedConversation;
  }, [selectedConversation]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Load current user profile
  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setUserProfile(data);
      });
  }, [user]);

  // Gerenciador centralizado de WebSocket (evita subscrições duplicadas)
  const handleNewMessage = useCallback((newMessage: Message) => {
    const conv = selectedConvRef.current;

    // Se é mensagem da conversa atual, adicionar à lista
    if (conv &&
        (newMessage.sender_id === conv.friendId ||
         newMessage.receiver_id === conv.friendId)) {
      setMessages(prev => {
        // Evitar duplicatas
        if (prev.some(m => m.id === newMessage.id)) return prev;
        return [...prev, newMessage];
      });

      // Tocar som apenas se recebeu mensagem (não enviou)
      if (newMessage.sender_id !== user?.id) {
        playSound('receive');
      }
    }
  }, [user, playSound]);

  const handleConversationUpdate = useCallback(() => {
    loadConversations();
  }, []);

  // Hook centralizado de WebSocket
  useChatWebSocket({
    userId: user?.id || null,
    onNewMessage: handleNewMessage,
    onConversationUpdate: handleConversationUpdate
  });

  // Realtime de reações (INSERT/DELETE) para a conversa aberta
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`message-reactions-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'message_reactions' },
        (payload) => {
          const messageId = (payload.new as any)?.message_id || (payload.old as any)?.message_id;
          if (!messageId) return;
          if (!messagesRef.current.some(m => m.id === messageId)) return;
          loadReactionsFor([messageId]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadReactionsFor]);

  // Load conversations on mount
  useEffect(() => {
    if (!user) return;
    loadConversations();
  }, [user]);

  // Abrir conversa automaticamente quando navegado via popup de perfil (state.openFriendId)
  useEffect(() => {
    const openFriendId = (location.state as any)?.openFriendId;
    if (!openFriendId || conversations.length === 0) return;
    const conv = conversations.find(c => c.friendId === openFriendId);
    if (conv) setSelectedConversation(conv);
  }, [location.state, conversations]);

  // Typing indicator
  const { startTyping, stopTyping, subscribeToTyping } = useTypingIndicator(
    selectedConversation?.friendId || null,
    user?.id || null
  );

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.friendId);
      setFriendIsTyping(false);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!selectedConversation || !user) return;

    const unsubscribe = subscribeToTyping((status) => {
      if (status.userId === selectedConversation.friendId) {
        setFriendIsTyping(status.isTyping);
      }
    });

    return unsubscribe;
  }, [selectedConversation, user, subscribeToTyping]);

  const loadConvSettings = useCallback(async (): Promise<Record<string, ConvSettings>> => {
    if (!user) return {};
    const { data } = await (supabase.from('chat_conversation_settings' as any) as any)
      .select('friend_id, is_pinned, is_muted, cleared_at, pinned_message_id')
      .eq('user_id', user.id);

    const map: Record<string, ConvSettings> = {};
    (data || []).forEach((row: any) => {
      map[row.friend_id] = {
        is_pinned: row.is_pinned,
        is_muted: row.is_muted,
        cleared_at: row.cleared_at,
        pinned_message_id: row.pinned_message_id,
      };
    });
    setConvSettings(map);
    return map;
  }, [user]);

  const loadConversations = useCallback(async () => {
    if (!user) return;

    try {
      // 1. Get friendships
      const { data: friendships } = await supabase
        .from('friendships')
        .select('user_id_1, user_id_2')
        .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`)
        .limit(200);

      if (!friendships || friendships.length === 0) {
        setConversations([]);
        setConversationsLoaded(true);
        return;
      }

      let friendIds = friendships.map(f =>
        f.user_id_1 === user.id ? f.user_id_2 : f.user_id_1
      );

      // 1b. Excluir usuários bloqueados (nas duas direções)
      const { data: blocks } = await supabase
        .from('blocked_users')
        .select('blocker_id, blocked_id')
        .or(`blocker_id.eq.${user.id},blocked_id.eq.${user.id}`);

      if (blocks && blocks.length > 0) {
        const blockedIds = new Set(
          blocks.map(b => (b.blocker_id === user.id ? b.blocked_id : b.blocker_id))
        );
        friendIds = friendIds.filter(id => !blockedIds.has(id));
      }

      if (friendIds.length === 0) {
        setConversations([]);
        setConversationsLoaded(true);
        return;
      }

      const settingsMap = await loadConvSettings();

      // 2. Get profiles + unread counts in parallel (NOT per-friend)
      const [profilesResult, unreadResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', friendIds),
        supabase
          .from('messages')
          .select('sender_id', { count: 'exact' })
          .eq('receiver_id', user.id)
          .eq('is_read', false)
          .in('sender_id', friendIds)
      ]);

      const profiles = profilesResult.data || [];

      // Build unread count map from grouped results
      const unreadByFriend = new Map<string, number>();
      if (unreadResult.data) {
        for (const msg of unreadResult.data) {
          unreadByFriend.set(msg.sender_id, (unreadByFriend.get(msg.sender_id) || 0) + 1);
        }
      }

      // 3. Get latest messages - fetch recent messages involving user, then pick latest per friend
      const { data: recentMessages } = await supabase
        .from('messages')
        .select('id, content, created_at, sender_id, receiver_id')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(200);

      const latestByFriend = new Map<string, { content: string; created_at: string }>();
      if (recentMessages) {
        for (const msg of recentMessages) {
          const friendId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
          if (friendIds.includes(friendId) && !latestByFriend.has(friendId)) {
            latestByFriend.set(friendId, { content: msg.content, created_at: msg.created_at });
          }
        }
      }

      const conversationData: Conversation[] = profiles.map((profile: Profile) => {
        const latest = latestByFriend.get(profile.id);
        const settings = settingsMap[profile.id];
        return {
          id: profile.id,
          friendId: profile.id,
          friendName: profile.full_name,
          friendAvatar: profile.avatar_url,
          lastMessage: latest?.content,
          lastMessageTime: latest?.created_at,
          unreadCount: unreadByFriend.get(profile.id) || 0,
          isOnline: onlineUsers.has(profile.id),
          isPinned: settings?.is_pinned || false,
          isMuted: settings?.is_muted || false,
        };
      });

      conversationData.sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        if (!a.lastMessageTime) return 1;
        if (!b.lastMessageTime) return -1;
        return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
      });

      setConversations(conversationData);
      setConversationsLoaded(true);
    } catch (error) {
      console.error('Error loading conversations:', error);
      setConversationsLoaded(true);
    }
  }, [user, loadConvSettings]);

  // Re-map online status when onlineUsers changes
  useEffect(() => {
    setConversations(prev => prev.map(c => ({
      ...c,
      isOnline: onlineUsers.has(c.friendId)
    })));
  }, [onlineUsers]);

  const loadReactionsFor = useCallback(async (messageIds: string[]) => {
    if (!user || messageIds.length === 0) return;
    const { data } = await supabase
      .from('message_reactions')
      .select('message_id, user_id, reaction')
      .in('message_id', messageIds);

    setReactionsByMessage(prev => {
      const next = { ...prev };
      // Limpa reações antigas dessas mensagens antes de recontar
      messageIds.forEach(id => { next[id] = []; });

      const grouped = new Map<string, Map<string, { count: number; hasReacted: boolean }>>();
      (data || []).forEach((row: any) => {
        if (!grouped.has(row.message_id)) grouped.set(row.message_id, new Map());
        const emojiMap = grouped.get(row.message_id)!;
        const entry = emojiMap.get(row.reaction) || { count: 0, hasReacted: false };
        entry.count += 1;
        if (row.user_id === user.id) entry.hasReacted = true;
        emojiMap.set(row.reaction, entry);
      });

      grouped.forEach((emojiMap, messageId) => {
        next[messageId] = Array.from(emojiMap.entries()).map(([emoji, v]) => ({
          emoji,
          count: v.count,
          hasReacted: v.hasReacted,
        }));
      });

      return next;
    });
  }, [user]);

  const loadMessages = useCallback(async (friendId: string, before?: string) => {
    if (!user) return;

    const clearedAt = convSettings[friendId]?.cleared_at;

    let query = supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(MESSAGES_PAGE_SIZE);

    if (clearedAt) {
      query = query.gt('created_at', clearedAt);
    }

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data } = await query;

    if (data) {
      const reversed = data.reverse();
      if (before) {
        setMessages(prev => [...reversed, ...prev]);
      } else {
        setMessages(reversed);
      }
      setHasMoreMessages(data.length === MESSAGES_PAGE_SIZE);
      loadReactionsFor(reversed.map(m => m.id));
    }

    // Mark messages as read (only on initial load, not on load-more)
    if (!before) {
      supabase
        .from('messages')
        .update({ is_read: true })
        .eq('sender_id', friendId)
        .eq('receiver_id', user.id)
        .eq('is_read', false)
        .then(() => {});
    }
  }, [user, convSettings, loadReactionsFor]);

  const loadOlderMessages = useCallback(async () => {
    if (!selectedConversation || !hasMoreMessages || loadingMore || messages.length === 0) return;
    setLoadingMore(true);
    await loadMessages(selectedConversation.friendId, messages[0].created_at);
    setLoadingMore(false);
  }, [selectedConversation, hasMoreMessages, loadingMore, messages, loadMessages]);

  const sendMessage = useCallback(async (
    content: string,
    mediaUrl?: string,
    mediaType?: 'image' | 'audio'
  ) => {
    if (!user || !selectedConversation) return;

    stopTyping();

    const { error } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        receiver_id: selectedConversation.friendId,
        content,
        status: 'sent',
        media_url: mediaUrl || null,
        media_type: mediaType || null,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: 'Erro ao enviar mensagem',
        description: 'Tente novamente',
        variant: 'destructive'
      });
      return;
    }

    playSound('send');
  }, [user, selectedConversation, stopTyping, playSound, toast]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!user) return;

    const existing = reactionsByMessage[messageId]?.find(r => r.emoji === emoji && r.hasReacted);

    if (existing) {
      await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .eq('reaction', emoji);
    } else {
      await supabase
        .from('message_reactions')
        .upsert({
          message_id: messageId,
          user_id: user.id,
          reaction: emoji
        }, { onConflict: 'message_id,user_id,reaction' });
    }

    loadReactionsFor([messageId]);
  }, [user, reactionsByMessage, loadReactionsFor]);

  const handleDeleteMessage = useCallback(async (messageId: string) => {
    await supabase.rpc('soft_delete_message' as any, { message_id: messageId });
    setMessages(prev => prev.filter(m => m.id !== messageId));
  }, []);

  const upsertConvSettings = useCallback(async (friendId: string, updates: Partial<ConvSettings>) => {
    if (!user) return;
    const current = convSettings[friendId] || {
      is_pinned: false, is_muted: false, cleared_at: null, pinned_message_id: null
    };
    const next = { ...current, ...updates };

    setConvSettings(prev => ({ ...prev, [friendId]: next }));

    await (supabase.from('chat_conversation_settings' as any) as any).upsert({
      user_id: user.id,
      friend_id: friendId,
      ...next,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,friend_id' });

    loadConversations();
  }, [user, convSettings, loadConversations]);

  const handleTogglePin = useCallback((conv: Conversation) => {
    upsertConvSettings(conv.friendId, { is_pinned: !conv.isPinned });
  }, [upsertConvSettings]);

  const handleToggleMute = useCallback((conv: Conversation) => {
    upsertConvSettings(conv.friendId, { is_muted: !conv.isMuted });
  }, [upsertConvSettings]);

  const handleClearHistory = useCallback((conv: Conversation) => {
    upsertConvSettings(conv.friendId, { cleared_at: new Date().toISOString() });
    if (selectedConversation?.friendId === conv.friendId) {
      setMessages([]);
    }
    toast({ title: 'Histórico limpo', description: `Suas mensagens com ${conv.friendName} foram ocultadas da sua tela.` });
  }, [upsertConvSettings, selectedConversation, toast]);

  const handleBlock = useCallback(async (friendId: string) => {
    if (!user) return;
    const { error } = await supabase.from('blocked_users').insert({
      blocker_id: user.id,
      blocked_id: friendId,
    });
    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível bloquear.', variant: 'destructive' });
      return;
    }
    toast({ title: 'Usuário bloqueado' });
    if (selectedConversation?.friendId === friendId) {
      setSelectedConversation(null);
    }
    loadConversations();
  }, [user, selectedConversation, toast, loadConversations]);

  const handlePinMessage = useCallback((messageId: string) => {
    if (!selectedConversation) return;
    const current = convSettings[selectedConversation.friendId]?.pinned_message_id;
    upsertConvSettings(selectedConversation.friendId, {
      pinned_message_id: current === messageId ? null : messageId,
    });
  }, [selectedConversation, convSettings, upsertConvSettings]);

  const scrollToMessage = useCallback((messageId: string) => {
    messageRefs.current[messageId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  const pinnedMessageId = selectedConversation ? convSettings[selectedConversation.friendId]?.pinned_message_id : null;
  const pinnedMessage = pinnedMessageId ? messages.find(m => m.id === pinnedMessageId) : null;

  const filteredConversations = useMemo(() =>
    conversations.filter(c =>
      c.friendName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.lastMessage || '').toLowerCase().includes(searchQuery.toLowerCase())
    ), [conversations, searchQuery]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <Header />

      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'rounded-2xl overflow-hidden shadow-2xl',
            'bg-card/50 backdrop-blur-xl border border-border',
            'h-[calc(100vh-140px)] sm:h-[calc(100vh-180px)] min-h-[500px]'
          )}
        >
          <div className="flex h-full overflow-hidden">
            {/* Sidebar */}
            <div className={cn(
              'w-full md:w-80 lg:w-96 border-r border-border flex flex-col flex-shrink-0',
              selectedConversation && 'hidden md:flex'
            )}>
              {/* Sidebar Header */}
              <div className="p-3 sm:p-4 border-b border-border">
                <div className="flex items-center justify-between mb-3">
                  <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Mensagens
                    <Sparkles className="h-4 w-4 text-amber-500" />
                  </h1>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar conversas ou mensagens..."
                    className="pl-9 bg-muted/50 border-0"
                  />
                </div>
              </div>

              {/* Conversations */}
              <ScrollArea className="flex-1">
                {!conversationsLoaded ? (
                  <div className="flex items-center justify-center py-12">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full"
                    />
                  </div>
                ) : (
                  <ConversationList
                    conversations={filteredConversations}
                    selectedId={selectedConversation?.id}
                    onSelect={setSelectedConversation}
                    onTogglePin={handleTogglePin}
                    onToggleMute={handleToggleMute}
                    onClearHistory={handleClearHistory}
                    onBlock={(conv) => handleBlock(conv.friendId)}
                  />
                )}
              </ScrollArea>
            </div>

            {/* Chat Area */}
            <div className={cn(
              'flex-1 flex flex-col min-w-0',
              !selectedConversation && 'hidden md:flex'
            )}>
              <AnimatePresence mode="wait">
                {selectedConversation ? (
                  <motion.div
                    key="chat"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col h-full"
                  >
                    <ChatHeader
                      friendId={selectedConversation.friendId}
                      currentUserId={user?.id || ''}
                      name={selectedConversation.friendName}
                      avatarUrl={selectedConversation.friendAvatar}
                      isOnline={onlineUsers.has(selectedConversation.friendId)}
                      isMuted={convSettings[selectedConversation.friendId]?.is_muted}
                      onBack={() => setSelectedConversation(null)}
                      onSettingsClick={() => setSettingsOpen(true)}
                      onBlock={() => handleBlock(selectedConversation.friendId)}
                      onToggleMute={() => handleToggleMute(selectedConversation)}
                      onClearHistory={() => handleClearHistory(selectedConversation)}
                    />

                    {/* Pinned message banner */}
                    {pinnedMessage && (
                      <button
                        onClick={() => scrollToMessage(pinnedMessage.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary/10 border-b border-border text-left hover:bg-primary/15 transition-colors"
                      >
                        <Pin className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="text-xs text-muted-foreground truncate flex-1">
                          {pinnedMessage.content || 'Mensagem fixada'}
                        </span>
                        <X
                          className="h-3.5 w-3.5 text-muted-foreground shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePinMessage(pinnedMessage.id);
                          }}
                        />
                      </button>
                    )}

                    {/* Messages Area */}
                    <div
                      className={cn(
                        'flex-1 overflow-hidden relative min-h-0',
                        `bg-gradient-to-b ${dynamicTheme.gradient}`
                      )}
                      style={{ backgroundImage: dynamicTheme.glow }}
                    >
                      <ScrollArea ref={scrollAreaRef} className="h-full">
                        <div className="px-3 sm:px-4 py-4 space-y-1">
                          {/* Load more button */}
                          {hasMoreMessages && (
                            <div className="flex justify-center pb-2">
                              <button
                                onClick={loadOlderMessages}
                                disabled={loadingMore}
                                className="text-xs text-primary hover:underline disabled:opacity-50"
                              >
                                {loadingMore ? 'Carregando...' : 'Carregar mensagens anteriores'}
                              </button>
                            </div>
                          )}

                          {messages.map((message) => {
                            const isSent = message.sender_id === user?.id;
                            return (
                              <div key={message.id} ref={(el) => { messageRefs.current[message.id] = el; }}>
                                <ChatBubble
                                  message={message.content}
                                  timestamp={message.created_at}
                                  isSent={isSent}
                                  isRead={message.is_read}
                                  status={message.status as 'sent' | 'delivered' | 'read'}
                                  bubbleStyle={preferences.bubble_style as 'modern' | 'classic' | 'minimal'}
                                  reactions={reactionsByMessage[message.id] || []}
                                  onReact={(emoji) => handleReaction(message.id, emoji)}
                                  mediaUrl={message.media_url || undefined}
                                  mediaType={(message.media_type as 'image' | 'audio' | 'video') || undefined}
                                  messageType={message.message_type}
                                  sharedContent={message.shared_content}
                                  senderAvatar={isSent ? (userProfile?.avatar_url || user?.user_metadata?.avatar_url) : selectedConversation.friendAvatar}
                                  senderName={isSent ? 'Você' : selectedConversation.friendName}
                                  isPinned={pinnedMessageId === message.id}
                                  onPin={() => handlePinMessage(message.id)}
                                  onDelete={isSent ? () => handleDeleteMessage(message.id) : undefined}
                                />
                              </div>
                            );
                          })}

                          <AnimatePresence>
                            {friendIsTyping && (
                              <TypingIndicator name={selectedConversation.friendName} />
                            )}
                          </AnimatePresence>

                          <div ref={messagesEndRef} />
                        </div>
                      </ScrollArea>
                    </div>

                    <ChatInput
                      onSend={sendMessage}
                      onTyping={startTyping}
                      placeholder={`Mensagem para ${selectedConversation.friendName}...`}
                      userId={user?.id}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col items-center justify-center text-center px-4"
                  >
                    <motion.div
                      animate={{
                        scale: [1, 1.05, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: 'easeInOut'
                      }}
                      className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-6"
                    >
                      <MessageSquare className="h-12 w-12 text-primary" />
                    </motion.div>
                    <h2 className="text-xl font-semibold mb-2">Bem-vindo ao Chat</h2>
                    <p className="text-muted-foreground max-w-sm">
                      Selecione uma conversa para começar a trocar mensagens com seus amigos em fé ✨
                    </p>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="text-xs text-muted-foreground/50 mt-4"
                    >
                      Período do dia: {timeOfDay === 'dawn' ? '🌅 Amanhecer' :
                                       timeOfDay === 'morning' ? '☀️ Manhã' :
                                       timeOfDay === 'afternoon' ? '🌤️ Tarde' :
                                       timeOfDay === 'evening' ? '🌆 Entardecer' : '🌙 Noite'}
                    </motion.p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </main>

      <ChatSettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        preferences={preferences}
        onUpdatePreferences={updatePreferences}
      />
    </div>
  );
};

export default Chat;
