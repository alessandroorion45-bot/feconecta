/**
 * FEED UNIFICADO
 *
 * Agrega conteúdo público de várias tabelas em uma única timeline:
 * posts, orações, testemunhos, gratidão, perguntas bíblicas, estudos,
 * devocionais, igrejas, comunidades e leituras em grupo.
 *
 * - Paginação por cursor de data (cada fonte mantém seu próprio cursor)
 * - Score de relevância: recência + boost de amigos + engajamento
 * - Filtros por tipo e por amigos; busca textual server-side (ilike)
 * - Tolerante a tabelas ausentes (Promise.allSettled) — fontes que
 *   falharem são simplesmente ignoradas naquela página
 * - Realtime (INSERT) com debounce nas fontes principais
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { pageCache, CACHE_TTL } from '@/lib/pageCache';
import type { FeedItem, FeedItemType, FeedFilterKey, FeedProfile } from '@/lib/feed/feedTypes';

const PER_SOURCE = 8;

interface SourceState {
  cursor: string | null; // created_at do item mais antigo já carregado
  exhausted: boolean;
}

type SourceMap = Partial<Record<FeedItemType, SourceState>>;

const sb = supabase as any;

// ---------------------------------------------------------------------------
// Fetchers por fonte: recebem cursor/busca e devolvem FeedItem[]
// ---------------------------------------------------------------------------

interface FetchCtx {
  cursor: string | null;
  search: string;
  friendIds: string[] | null; // null = sem filtro de amigos
}

function applyCommon(query: any, ctx: FetchCtx, dateCol = 'created_at', userCol = 'user_id') {
  let q = query.order(dateCol, { ascending: false }).limit(PER_SOURCE);
  if (ctx.cursor) q = q.lt(dateCol, ctx.cursor);
  if (ctx.friendIds) q = q.in(userCol, ctx.friendIds.length ? ctx.friendIds : ['00000000-0000-0000-0000-000000000000']);
  return q;
}

async function fetchPosts(ctx: FetchCtx): Promise<FeedItem[]> {
  let q = sb.from('posts').select('*');
  if (ctx.search) q = q.ilike('content', `%${ctx.search}%`);
  const { data, error } = await applyCommon(q, ctx);
  if (error) throw error;
  return (data || []).map((p: any): FeedItem => ({
    key: `post:${p.id}`,
    type: 'post',
    id: p.id,
    user_id: p.user_id,
    created_at: p.created_at,
    title: null,
    content: p.content || '',
    media_url: p.media_url,
    media_type: p.media_type,
    audio_url: null,
    category: null,
    engagement: (p.likes_count || 0) + (p.comments_count || 0),
    link: '/feed',
    profile: null,
    likes_count: p.likes_count || 0,
    comments_count: p.comments_count || 0,
  }));
}

async function fetchPrayers(ctx: FetchCtx): Promise<FeedItem[]> {
  let q = sb.from('prayers').select('*');
  if (ctx.search) q = q.or(`title.ilike.%${ctx.search}%,description.ilike.%${ctx.search}%`);
  const { data, error } = await applyCommon(q, ctx);
  if (error) throw error;
  return (data || []).map((p: any): FeedItem => ({
    key: `prayer:${p.id}`,
    type: 'prayer',
    id: p.id,
    user_id: p.user_id,
    created_at: p.created_at,
    title: p.title,
    content: p.description || '',
    media_url: null,
    media_type: null,
    audio_url: p.audio_url,
    category: p.category,
    engagement: p.intercessor_count || 0,
    link: '/prayers',
    profile: null,
  }));
}

async function fetchTestimonies(ctx: FetchCtx): Promise<FeedItem[]> {
  let q = sb.from('testimonies').select('*');
  if (ctx.search) q = q.or(`title.ilike.%${ctx.search}%,content.ilike.%${ctx.search}%`);
  const { data, error } = await applyCommon(q, ctx);
  if (error) throw error;
  return (data || []).map((t: any): FeedItem => ({
    key: `testimony:${t.id}`,
    type: 'testimony',
    id: t.id,
    user_id: t.user_id,
    created_at: t.created_at,
    title: t.title,
    content: t.content || '',
    media_url: t.image_url || t.video_url,
    media_type: t.video_url ? 'video' : (t.image_url ? 'image' : null),
    audio_url: t.audio_url,
    category: null,
    engagement: (t.likes_count || 0) + (t.glory_count || 0),
    link: `/testemunho/${t.id}`,
    profile: null,
  }));
}

async function fetchGratitude(ctx: FetchCtx): Promise<FeedItem[]> {
  let q = sb.from('gratitude_posts_with_user').select('*');
  if (ctx.search) q = q.ilike('message', `%${ctx.search}%`);
  const { data, error } = await applyCommon(q, ctx);
  if (error) throw error;
  return (data || []).map((g: any): FeedItem => ({
    key: `gratitude:${g.id}`,
    type: 'gratitude',
    id: g.id,
    user_id: g.user_id,
    created_at: g.created_at,
    title: g.type === 'testemunho' ? 'Testemunho' : null,
    content: g.message || '',
    media_url: null,
    media_type: null,
    audio_url: null,
    category: null,
    engagement: g.amens_count || 0,
    link: '/gratitude',
    profile: null,
    author_name: g.author_name,
  }));
}

async function fetchQuestions(ctx: FetchCtx): Promise<FeedItem[]> {
  let q = sb.from('bible_questions').select('*');
  if (ctx.search) q = q.or(`title.ilike.%${ctx.search}%,body.ilike.%${ctx.search}%`);
  const { data, error } = await applyCommon(q, ctx);
  if (error) throw error;
  return (data || []).map((b: any): FeedItem => ({
    key: `question:${b.id}`,
    type: 'question',
    id: b.id,
    user_id: b.user_id,
    created_at: b.created_at,
    title: b.title,
    content: b.body || '',
    media_url: null,
    media_type: null,
    audio_url: null,
    category: b.category,
    engagement: (b.likes_count || 0) + (b.answers_count || 0),
    link: '/questions',
    profile: null,
  }));
}

async function fetchStudies(ctx: FetchCtx): Promise<FeedItem[]> {
  // Conteúdo publicado por administradores — sem filtro de amigos
  if (ctx.friendIds) return [];
  let q = sb.from('bible_studies').select('id, title, author, description, category, type, created_at, views_count, likes_count');
  if (ctx.search) q = q.or(`title.ilike.%${ctx.search}%,description.ilike.%${ctx.search}%`);
  let query = q.order('created_at', { ascending: false }).limit(PER_SOURCE);
  if (ctx.cursor) query = query.lt('created_at', ctx.cursor);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map((s: any): FeedItem => ({
    key: `study:${s.id}`,
    type: 'study',
    id: s.id,
    user_id: null,
    created_at: s.created_at,
    title: s.title,
    content: s.description || '',
    media_url: null,
    media_type: null,
    audio_url: null,
    category: s.category,
    engagement: (s.likes_count || 0) + Math.floor((s.views_count || 0) / 10),
    link: '/studies',
    profile: null,
    author_name: s.author,
  }));
}

async function fetchDevotionals(ctx: FetchCtx): Promise<FeedItem[]> {
  if (ctx.friendIds) return [];
  const build = (dateCol: string) => {
    let q = sb.from('devotionals').select('*');
    if (ctx.search) q = q.or(`title.ilike.%${ctx.search}%,verse_text.ilike.%${ctx.search}%,verse_reference.ilike.%${ctx.search}%`);
    let query = q.order(dateCol, { ascending: false }).limit(PER_SOURCE);
    if (ctx.cursor) query = query.lt(dateCol, ctx.cursor);
    return query;
  };
  // A coluna "date" pode não existir no remoto — cai para created_at
  let { data, error } = await build('date');
  if (error) ({ data, error } = await build('created_at'));
  if (error) throw error;
  data = (data || []).map((d: any) => ({ ...d, date: d.date || d.created_at }));
  return (data || []).map((d: any): FeedItem => ({
    key: `devotional:${d.id}`,
    type: 'devotional',
    id: d.id,
    user_id: null,
    created_at: d.date,
    title: d.title,
    content: d.verse_text ? `"${d.verse_text}" — ${d.verse_reference}` : (d.reflection || ''),
    media_url: null,
    media_type: null,
    audio_url: null,
    category: d.category,
    engagement: 0,
    link: '/devotional',
    profile: null,
  }));
}

async function fetchChurches(ctx: FetchCtx): Promise<FeedItem[]> {
  let q = sb.from('nearby_churches').select('*').eq('is_active', true);
  if (ctx.search) q = q.or(`name.ilike.%${ctx.search}%,city.ilike.%${ctx.search}%,denomination.ilike.%${ctx.search}%`);
  const { data, error } = await applyCommon(q, ctx);
  if (error) throw error;
  return (data || []).map((c: any): FeedItem => ({
    key: `church:${c.id}`,
    type: 'church',
    id: c.id,
    user_id: c.user_id,
    created_at: c.created_at,
    title: c.name,
    content: [c.denomination, c.city && c.state ? `${c.city} - ${c.state}` : c.city, c.description]
      .filter(Boolean).join(' · '),
    media_url: c.cover_image_url,
    media_type: c.cover_image_url ? 'image' : null,
    audio_url: null,
    category: c.denomination,
    engagement: 0,
    link: '/nearby-churches',
    profile: null,
  }));
}

async function fetchCommunities(ctx: FetchCtx): Promise<FeedItem[]> {
  let q = sb.from('church_communities').select('*').eq('is_active', true);
  if (ctx.search) q = q.or(`name.ilike.%${ctx.search}%,church_name.ilike.%${ctx.search}%,city.ilike.%${ctx.search}%`);
  const { data, error } = await applyCommon(q, ctx, 'created_at', 'created_by');
  if (error) throw error;
  return (data || []).map((c: any): FeedItem => ({
    key: `community:${c.id}`,
    type: 'community',
    id: c.id,
    user_id: c.created_by,
    created_at: c.created_at,
    title: c.name,
    content: [c.church_name, c.city, c.description].filter(Boolean).join(' · '),
    media_url: c.cover_image_url,
    media_type: c.cover_image_url ? 'image' : null,
    audio_url: null,
    category: null,
    engagement: c.member_count || 0,
    link: '/church-community',
    profile: null,
  }));
}

async function fetchReadings(ctx: FetchCtx): Promise<FeedItem[]> {
  let q = sb.from('shared_reading_rooms').select('*').eq('is_public', true);
  if (ctx.search) q = q.ilike('room_name', `%${ctx.search}%`);
  const { data, error } = await applyCommon(q, ctx, 'created_at', 'host_id');
  if (error) throw error;
  return (data || []).map((r: any): FeedItem => ({
    key: `reading:${r.id}`,
    type: 'reading',
    id: r.id,
    user_id: r.host_id,
    created_at: r.created_at,
    title: r.room_name,
    content: `Leitura em grupo: ${String(r.current_book_abbrev || '').toUpperCase()} capítulo ${r.current_chapter} · Código ${r.room_code}`,
    media_url: null,
    media_type: null,
    audio_url: null,
    category: r.status,
    engagement: 0,
    link: '/shared-reading',
    profile: null,
  }));
}

const FETCHERS: Record<FeedItemType, (ctx: FetchCtx) => Promise<FeedItem[]>> = {
  post: fetchPosts,
  prayer: fetchPrayers,
  testimony: fetchTestimonies,
  gratitude: fetchGratitude,
  question: fetchQuestions,
  study: fetchStudies,
  devotional: fetchDevotionals,
  church: fetchChurches,
  community: fetchCommunities,
  reading: fetchReadings,
};

const ALL_TYPES = Object.keys(FETCHERS) as FeedItemType[];

// ---------------------------------------------------------------------------
// Score de relevância: recência é dominante; amigos e engajamento dão boost
// ---------------------------------------------------------------------------

function scoreItem(item: FeedItem, friendSet: Set<string>): number {
  const ageHours = (Date.now() - new Date(item.created_at).getTime()) / 3_600_000;
  let score = -ageHours; // mais recente = maior
  if (item.user_id && friendSet.has(item.user_id)) score += 12; // amigos sobem
  score += Math.min(Math.log2(1 + item.engagement) * 2, 8); // engajamento (limitado)
  return score;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useUnifiedFeed(userId: string | undefined) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState<FeedFilterKey>('all');
  const [search, setSearchState] = useState('');
  const [friendSet, setFriendSet] = useState<Set<string>>(new Set());

  const sourcesRef = useRef<SourceMap>({});
  const itemsRef = useRef<FeedItem[]>([]);
  const friendsRef = useRef<string[]>([]);
  const loadingRef = useRef(false);
  const generationRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  itemsRef.current = items;

  // Amigos (para boost e filtro)
  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data } = await sb
        .from('friendships')
        .select('user_id_1, user_id_2')
        .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`)
        .limit(500);
      const ids = (data || []).map((f: any) => (f.user_id_1 === userId ? f.user_id_2 : f.user_id_1));
      friendsRef.current = ids;
      setFriendSet(new Set(ids));
    })();
  }, [userId]);

  const activeTypes = useCallback((f: FeedFilterKey): FeedItemType[] => {
    if (f === 'all' || f === 'friends') return ALL_TYPES;
    return [f];
  }, []);

  /** Enriquecer com perfis, likes, reações e favoritos */
  const enrich = useCallback(async (batch: FeedItem[]): Promise<FeedItem[]> => {
    if (batch.length === 0) return batch;

    const userIds = [...new Set(batch.map(i => i.user_id).filter(Boolean))] as string[];
    const postIds = batch.filter(i => i.type === 'post').map(i => i.id);
    const itemKeys = batch.map(i => ({ item_type: i.type, item_id: i.id }));

    const [profilesRes, likesRes, reactionsRes, favoritesRes] = await Promise.allSettled([
      userIds.length
        ? sb.from('profiles').select('id, username, full_name, avatar_url').in('id', userIds)
        : Promise.resolve({ data: [] }),
      userId && postIds.length
        ? sb.from('post_likes').select('post_id').eq('user_id', userId).in('post_id', postIds)
        : Promise.resolve({ data: [] }),
      sb.from('feed_reactions')
        .select('item_type, item_id, reaction, user_id')
        .in('item_id', itemKeys.map(k => k.item_id)),
      userId
        ? sb.from('feed_favorites').select('item_type, item_id').eq('user_id', userId)
            .in('item_id', itemKeys.map(k => k.item_id))
        : Promise.resolve({ data: [] }),
    ]);

    const profiles: any[] = profilesRes.status === 'fulfilled' ? (profilesRes.value as any).data || [] : [];
    const likes: any[] = likesRes.status === 'fulfilled' ? (likesRes.value as any).data || [] : [];
    const reactions: any[] = reactionsRes.status === 'fulfilled' ? (reactionsRes.value as any).data || [] : [];
    const favorites: any[] = favoritesRes.status === 'fulfilled' ? (favoritesRes.value as any).data || [] : [];

    const profileMap = new Map<string, FeedProfile>(profiles.map((p: any) => [p.id, p]));
    const likedSet = new Set(likes.map((l: any) => l.post_id));
    const favSet = new Set(favorites.map((f: any) => `${f.item_type}:${f.item_id}`));

    const reactionCounts = new Map<string, Record<string, number>>();
    const myReactions = new Map<string, string>();
    for (const r of reactions) {
      const k = `${r.item_type}:${r.item_id}`;
      const counts = reactionCounts.get(k) || {};
      counts[r.reaction] = (counts[r.reaction] || 0) + 1;
      reactionCounts.set(k, counts);
      if (userId && r.user_id === userId) myReactions.set(k, r.reaction);
    }

    return batch.map(i => ({
      ...i,
      profile: i.user_id ? profileMap.get(i.user_id) || null : null,
      liked_by_me: i.type === 'post' ? likedSet.has(i.id) : undefined,
      saved_by_me: favSet.has(i.key),
      reaction_counts: reactionCounts.get(i.key) || {},
      my_reaction: myReactions.get(i.key) || null,
    }));
  }, [userId]);

  const fetchPage = useCallback(async (reset: boolean, f: FeedFilterKey, q: string) => {
    const generation = reset ? ++generationRef.current : generationRef.current;
    // Reset (troca de filtro/busca) sempre prossegue — o guard de geração
    // descarta resultados da requisição antiga; só loadMore é bloqueado.
    if (!reset && loadingRef.current) return;
    loadingRef.current = true;
    reset ? setLoading(itemsRef.current.length === 0) : setLoadingMore(true);

    try {
      if (reset) sourcesRef.current = {};
      const types = activeTypes(f);
      const friendIds = f === 'friends' ? friendsRef.current : null;

      const active = types.filter(t => !sourcesRef.current[t]?.exhausted);
      const results = await Promise.allSettled(
        active.map(t =>
          FETCHERS[t]({ cursor: sourcesRef.current[t]?.cursor ?? null, search: q.trim(), friendIds })
        )
      );

      if (generation !== generationRef.current) return; // filtro/busca mudou no meio

      let merged: FeedItem[] = [];
      results.forEach((res, idx) => {
        const t = active[idx];
        if (res.status === 'fulfilled') {
          const rows = res.value;
          const prev = sourcesRef.current[t] || { cursor: null, exhausted: false };
          sourcesRef.current[t] = {
            cursor: rows.length ? rows[rows.length - 1].created_at : prev.cursor,
            exhausted: rows.length < PER_SOURCE,
          };
          merged = merged.concat(rows);
        } else {
          // Tabela ausente ou erro: não tenta de novo nesta sessão de filtro
          sourcesRef.current[t] = { cursor: null, exhausted: true };
        }
      });

      const fSet = new Set(friendsRef.current);
      const enriched = await enrich(merged);
      if (generation !== generationRef.current) return;

      setItems(prev => {
        const base = reset ? [] : prev;
        const seen = new Set(base.map(i => i.key));
        const fresh = enriched.filter(i => !seen.has(i.key));
        const next = [...base, ...fresh];
        // Ordena por relevância (recência dominante + amigos + engajamento)
        next.sort((a, b) => scoreItem(b, fSet) - scoreItem(a, fSet));
        return next;
      });

      setHasMore(Object.values(sourcesRef.current).some(s => s && !s.exhausted));

      if (reset && f === 'all' && !q.trim()) {
        pageCache.set('feed:first-page', enriched, CACHE_TTL.FEED);
      }
    } finally {
      loadingRef.current = false;
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeTypes, enrich]);

  // Primeira carga + recarga quando filtro/busca mudam
  useEffect(() => {
    if (!userId) return;

    // Pinta instantâneo do cache enquanto busca dados frescos
    if (filter === 'all' && !search.trim() && itemsRef.current.length === 0) {
      const cached = pageCache.get<FeedItem[]>('feed:first-page');
      if (cached?.length) {
        setItems(cached);
        setLoading(false);
      }
    }

    fetchPage(true, filter, search);
  }, [userId, filter, search, fetchPage]);

  // Realtime: INSERT nas fontes principais, com debounce
  useEffect(() => {
    if (!userId) return;
    const refresh = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => fetchPage(true, filter, search), 2500);
    };
    const channel = supabase
      .channel('unified-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, refresh)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'prayers' }, refresh)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'testimonies' }, refresh)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bible_questions' }, refresh)
      .subscribe();
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
    };
  }, [userId, filter, search, fetchPage]);

  const loadMore = useCallback(() => {
    if (!loadingRef.current && hasMore) fetchPage(false, filter, search);
  }, [fetchPage, filter, search, hasMore]);

  const refresh = useCallback(() => {
    pageCache.clear('feed:first-page');
    fetchPage(true, filter, search);
  }, [fetchPage, filter, search]);

  const setSearch = useCallback((q: string) => setSearchState(q), []);

  /** Atualização otimista de um item já carregado */
  const patchItem = useCallback((key: string, patch: Partial<FeedItem> | ((i: FeedItem) => Partial<FeedItem>)) => {
    setItems(prev => prev.map(i =>
      i.key === key ? { ...i, ...(typeof patch === 'function' ? patch(i) : patch) } : i
    ));
  }, []);

  return {
    items,
    loading,
    loadingMore,
    hasMore,
    filter,
    setFilter,
    search,
    setSearch,
    friendSet,
    loadMore,
    refresh,
    patchItem,
  };
}
