import { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type PresenceStatus = 'online' | 'away' | 'offline';

interface PresenceState {
  user_id: string;
  status: 'online' | 'away';
  online_at: string;
}

interface PresenceContextType {
  getStatus: (userId: string | undefined | null) => PresenceStatus;
  connectedUserIds: string[];
}

const PresenceContext = createContext<PresenceContextType>({
  getStatus: () => 'offline',
  connectedUserIds: [],
});

export const usePresence = () => useContext(PresenceContext);

export const PresenceProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [presenceMap, setPresenceMap] = useState<Record<string, PresenceState>>({});
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!user) {
      setPresenceMap({});
      return;
    }

    const channel = supabase.channel('online-presence', {
      config: { presence: { key: user.id } },
    });
    channelRef.current = channel;

    const trackStatus = (status: 'online' | 'away') => {
      channel.track({ user_id: user.id, status, online_at: new Date().toISOString() });
    };

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresenceState>();
        const next: Record<string, PresenceState> = {};
        for (const key of Object.keys(state)) {
          const entries = state[key];
          if (entries?.[0]) next[key] = entries[0];
        }
        setPresenceMap(next);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          trackStatus(document.hidden ? 'away' : 'online');
        }
      });

    const handleVisibility = () => trackStatus(document.hidden ? 'away' : 'online');
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [user]);

  const getStatus = useCallback((userId: string | undefined | null): PresenceStatus => {
    if (!userId) return 'offline';
    const entry = presenceMap[userId];
    return entry?.status ?? 'offline';
  }, [presenceMap]);

  return (
    <PresenceContext.Provider value={{ getStatus, connectedUserIds: Object.keys(presenceMap) }}>
      {children}
    </PresenceContext.Provider>
  );
};
