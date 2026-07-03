import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface Testimony {
  id: string;
  title: string;
  content: string;
  glory_count: number;
  likes_count: number;
  user_id: string;
  created_at: string;
  audio_url?: string | null;
  profiles: {
    username: string;
    full_name: string;
    avatar_url: string;
  } | null;
  user_liked?: boolean;
  user_gloried?: boolean;
  comments_count?: number;
  isNew?: boolean; // Flag para destacar testemunhos recém-chegados
}

export function useTestimonies(userId?: string) {
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const loadingRef = useRef(false);

  const loadTestimonies = useCallback(async (showToastOnError = true) => {
    if (loadingRef.current) return; // Prevenir chamadas simultâneas
    loadingRef.current = true;

    try {
      console.log('[useTestimonies] Carregando testemunhos...');

      const { data, error } = await supabase
        .from("testimonies")
        .select(`
          *,
          profiles:user_id (username, full_name, avatar_url)
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error('[useTestimonies] ❌ ERRO ao carregar:', error);
        if (showToastOnError) {
          toast({
            title: "Erro ao carregar testemunhos",
            description: error.message,
            variant: "destructive",
          });
        }
        return;
      }

      console.log('[useTestimonies] ✅ Testemunhos carregados:', data?.length || 0);

      if (data) {
        const testimonyIds = data.map((t) => t.id);

        // Buscar contagens em paralelo
        const [likesResult, gloriesResult, commentsResult] = await Promise.all([
          supabase.from("testimony_likes").select("testimony_id").in("testimony_id", testimonyIds),
          supabase.from("testimony_glories").select("testimony_id").in("testimony_id", testimonyIds),
          supabase.from("testimony_comments").select("testimony_id").in("testimony_id", testimonyIds),
        ]);

        // Contar ocorrências
        const likesCount: Record<string, number> = {};
        const gloriesCount: Record<string, number> = {};
        const commentsCount: Record<string, number> = {};

        likesResult.data?.forEach((l) => {
          likesCount[l.testimony_id] = (likesCount[l.testimony_id] || 0) + 1;
        });
        gloriesResult.data?.forEach((g) => {
          gloriesCount[g.testimony_id] = (gloriesCount[g.testimony_id] || 0) + 1;
        });
        commentsResult.data?.forEach((c) => {
          commentsCount[c.testimony_id] = (commentsCount[c.testimony_id] || 0) + 1;
        });

        let testimoniesWithStatus = data.map((t) => ({
          ...t,
          likes_count: likesCount[t.id] || 0,
          glory_count: gloriesCount[t.id] || 0,
          comments_count: commentsCount[t.id] || 0,
        }));

        if (userId) {
          // Buscar interações do usuário
          const [userLikesResult, userGloriesResult] = await Promise.all([
            supabase.from("testimony_likes").select("testimony_id").eq("user_id", userId),
            supabase.from("testimony_glories").select("testimony_id").eq("user_id", userId),
          ]);

          const likedIds = new Set(userLikesResult.data?.map((l) => l.testimony_id) || []);
          const gloriedIds = new Set(userGloriesResult.data?.map((g) => g.testimony_id) || []);

          testimoniesWithStatus = testimoniesWithStatus.map((t) => ({
            ...t,
            user_liked: likedIds.has(t.id),
            user_gloried: gloriedIds.has(t.id),
          }));
        }

        setTestimonies(testimoniesWithStatus);
      }
    } catch (err) {
      console.error('[useTestimonies] Erro inesperado:', err);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [userId, toast]);

  // Atualização otimista: adicionar novo testemunho no topo
  const addOptimisticTestimony = useCallback((testimony: Testimony) => {
    setTestimonies((prev) => [{...testimony, isNew: true}, ...prev]);

    // Remover flag "isNew" após 3 segundos
    setTimeout(() => {
      setTestimonies((prev) =>
        prev.map((t) => t.id === testimony.id ? {...t, isNew: false} : t)
      );
    }, 3000);
  }, []);

  // Setup Realtime subscription
  useEffect(() => {
    // Carregar dados iniciais
    loadTestimonies(true);

    // Setup Realtime channel
    console.log('[useTestimonies] Configurando Realtime...');

    const channel = supabase
      .channel('testimonies-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'testimonies',
        },
        async (payload) => {
          console.log('[useTestimonies] 🔔 Novo testemunho recebido via Realtime:', payload);

          // Buscar dados completos do testemunho (com profile)
          const { data: newTestimony } = await supabase
            .from('testimonies')
            .select(`
              *,
              profiles:user_id (username, full_name, avatar_url)
            `)
            .eq('id', payload.new.id)
            .single();

          if (newTestimony) {
            const fullTestimony: Testimony = {
              ...newTestimony,
              likes_count: 0,
              glory_count: 0,
              comments_count: 0,
              isNew: true,
            };

            addOptimisticTestimony(fullTestimony);

            toast({
              title: "Novo testemunho! 🙌",
              description: `${newTestimony.profiles?.full_name || 'Alguém'} compartilhou: "${newTestimony.title}"`,
              duration: 4000,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'testimonies',
        },
        (payload) => {
          console.log('[useTestimonies] 📝 Testemunho atualizado:', payload);
          // Atualizar testemunho na lista
          setTestimonies((prev) =>
            prev.map((t) => (t.id === payload.new.id ? {...t, ...payload.new} : t))
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'testimonies',
        },
        (payload) => {
          console.log('[useTestimonies] 🗑️ Testemunho deletado:', payload);
          // Remover testemunho da lista
          setTestimonies((prev) => prev.filter((t) => t.id !== payload.old.id));
        }
      )
      .subscribe((status) => {
        console.log('[useTestimonies] Realtime status:', status);
      });

    channelRef.current = channel;

    // Cleanup
    return () => {
      console.log('[useTestimonies] Limpando subscription...');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId]); // userId como dependência estável

  return {
    testimonies,
    loading,
    loadTestimonies,
    addOptimisticTestimony,
  };
}
