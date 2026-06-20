-- Migration: Criar índices para melhorar performance
-- Data: 2026-06-20
-- Objetivo: Resolver timeout de 30s na query de perfil

-- CRÍTICO: Índice explícito na tabela profiles
-- Impacto: Reduzir query de 30s para <100ms
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);

-- OTIMIZAÇÃO: Índices em foreign keys de tabelas relacionadas
-- Impacto: Acelerar queries de fotos, vídeos, badges e depoimentos

-- Índice para profile_photos (usado em ProfilePhotos component)
CREATE INDEX IF NOT EXISTS idx_profile_photos_user_id ON public.profile_photos(user_id);

-- Índice para user_videos (usado em ProfileVideos component)
CREATE INDEX IF NOT EXISTS idx_user_videos_user_id ON public.user_videos(user_id);

-- Índice para user_badges (usado em Profile component)
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);

-- Índice para friend_testimonials (usado em FriendTestimonials component)
CREATE INDEX IF NOT EXISTS idx_friend_testimonials_recipient_id ON public.friend_testimonials(recipient_id);
CREATE INDEX IF NOT EXISTS idx_friend_testimonials_author_id ON public.friend_testimonials(author_id);

-- Índice composto para queries comuns em posts
CREATE INDEX IF NOT EXISTS idx_posts_user_created ON public.posts(user_id, created_at DESC);

-- Índice para prayer_comments
CREATE INDEX IF NOT EXISTS idx_prayer_comments_prayer_id ON public.prayer_comments(prayer_id);

-- ANÁLISE: Verificar se índices foram criados corretamente
-- Execute após a migration:
-- SELECT tablename, indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname;
