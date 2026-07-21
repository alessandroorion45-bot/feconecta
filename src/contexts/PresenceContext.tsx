import { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  ChatStatusValue,
  effectiveChatStatus,
  HEARTBEAT_INTERVAL_MS,
} from '@/lib/chatStatus';

const sb = supabase as any;

interface CachedStatus {
  chat_status: string;
  last_active_at: string;
}

interface PresenceContextType {
  /** Status efetivo (já resolvido — considera heartbeat velho) de outro usuário */
  getStatus: (userId: string | undefined | null) => ChatStatusValue;
  /** Pede pro contexto passar a acompanhar esses usuários (popula e mantém o cache atualizado) */
  subscribeToUsers: (userIds: string[]) => void;
  /** Status escolhido pelo próprio usuário (não é o "offline por inatividade") */
  myStatus: ChatStatusValue;
  setMyStatus: (status: ChatStatusValue) => Promise<void>;
  connectedUserIds: string[];
}

const PresenceContext = createContext<PresenceContextType>({
  getStatus: () => 'offline',
  subscribeToUsers: () => {},
  myStatus: 'disponivel',
  setMyStatus: async () => {},
  connectedUserIds: [],
});

export const usePresence = () => useContext(PresenceContext);

/** Heartbeat + status de chat persistidos — resiste a soluços de rede/socket,
 * ao contrário de presença efêmera via canal Realtime (o que causava
 * "aparece offline mas a mensagem chega"). */
export const PresenceProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [cache, setCache] = useState<Record<string, CachedStatus>>({});
  const [myStatus, setMyStatusState] = useState<ChatStatusValue>('disponivel');
  const subscribedIds = useRef<Set<string>>(new Set());
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSubscribed = useCallback(async () => {
    const ids = [...subscribedIds.current];
    if (ids.length === 0) return;
    const { data } = await sb.from('profiles').select('id, chat_status, last_active_at').in('id', ids);
    if (!data) return;
    setCache((prev) => {
      const next = { ...prev };
      for (const row of data as { id: string; chat_status: string; last_active_at: string }[]) {
        next[row.id] = { chat_status: row.chat_status, last_active_at: row.last_active_at };
      }
      return next;
    });
  }, []);

  const subscribeToUsers = useCallback((userIds: string[]) => {
    let changed = false;
    for (const id of userIds) {
      if (id && !subscribedIds.current.has(id)) {
        subscribedIds.current.add(id);
        changed = true;
      }
    }
    if (!changed) return;
    // Junta várias chamadas (ex: vários avatares montando no mesmo tick)
    // numa única busca, em vez de uma query por usuário.
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchSubscribed, 150);
  }, [fetchSubscribed]);

  // Heartbeat: marca "estou ativo agora" — na entrada, ao voltar de outra
  // aba, e a cada minuto. Só o timestamp; o status escolhido não muda.
  useEffect(() => {
    if (!user) return;

    const heartbeat = () => {
      sb.from('profiles').update({ last_active_at: new Date().toISOString() }).eq('id', user.id).then(() => {});
    };
    heartbeat();

    const interval = setInterval(heartbeat, HEARTBEAT_INTERVAL_MS);
    const onVisible = () => { if (!document.hidden) heartbeat(); };
    document.addEventListener('visibilitychange', onVisible);

    // Carrega o status escolhido pelo próprio usuário
    sb.from('profiles').select('chat_status').eq('id', user.id).maybeSingle().then(({ data }: { data: { chat_status: string } | null }) => {
      if (data?.chat_status) setMyStatusState(data.chat_status as ChatStatusValue);
    });

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [user]);

  // Reforça heartbeat/leitura de todo mundo que os componentes pediram pra acompanhar
  useEffect(() => {
    if (!user) return;
    pollRef.current = setInterval(fetchSubscribed, HEARTBEAT_INTERVAL_MS - 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [user, fetchSubscribed]);

  const setMyStatus = useCallback(async (status: ChatStatusValue) => {
    if (!user) return;
    setMyStatusState(status);
    await sb.from('profiles').update({ chat_status: status, last_active_at: new Date().toISOString() }).eq('id', user.id);
    setCache((prev) => ({ ...prev, [user.id]: { chat_status: status, last_active_at: new Date().toISOString() } }));
  }, [user]);

  const getStatus = useCallback((userId: string | undefined | null): ChatStatusValue => {
    if (!userId) return 'offline';
    if (user && userId === user.id) return myStatus;
    const entry = cache[userId];
    if (!entry) return 'offline';
    return effectiveChatStatus(entry.chat_status, entry.last_active_at);
  }, [cache, user, myStatus]);

  const connectedUserIds = Object.keys(cache).filter(
    (id) => effectiveChatStatus(cache[id].chat_status, cache[id].last_active_at) !== 'offline',
  );

  return (
    <PresenceContext.Provider value={{ getStatus, subscribeToUsers, myStatus, setMyStatus, connectedUserIds }}>
      {children}
    </PresenceContext.Provider>
  );
};
