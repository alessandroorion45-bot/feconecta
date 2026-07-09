-- ============================================================
-- FASE 12: Gerenciador de Fotos completo + Gerenciador de Vídeos novo
-- ============================================================
-- Problemas corrigidos nesta migration:
-- 1. admin_all_photos incluía posts de vídeo (media_type='video')
--    junto com fotos — a galeria de fotos mostrava vídeo também.
-- 2. hide_photo era destrutivo: pra 'post' apagava media_url pra
--    sempre (perdia a mídia), pra 'profile_photo' DELETAVA a linha
--    inteira — ou seja "ocultar" já era "excluir" disfarçado, sem
--    volta. Agora usa uma coluna is_hidden reversível de verdade.
-- 3. Não existia nenhuma view de vídeos pro admin gerenciar.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Coluna is_hidden reversível (posts/profile_photos já tinham
--    "hide" fingindo ser "delete" — agora é de verdade reversível)
-- ------------------------------------------------------------
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.profile_photos ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT FALSE;

-- ------------------------------------------------------------
-- 2. admin_all_photos: exclui vídeo, expõe is_hidden/moderation_status
-- ------------------------------------------------------------
DROP VIEW IF EXISTS public.admin_all_photos CASCADE;
CREATE VIEW public.admin_all_photos AS
SELECT * FROM (
  SELECT
    p.id,
    'post'::text AS photo_type,
    p.user_id,
    u.email AS user_email,
    u.full_name AS user_name,
    p.media_url AS photo_url,
    p.content AS caption,
    COALESCE(p.likes_count, 0) AS likes_count,
    COALESCE(p.comments_count, 0) AS comments_count,
    p.created_at,
    (SELECT COUNT(*) FROM public.user_reports ur WHERE ur.content_type = 'post' AND ur.content_id = p.id AND ur.status = 'pending') AS pending_reports,
    (SELECT COUNT(*) FROM public.user_reports ur WHERE ur.content_type = 'post' AND ur.content_id = p.id) AS total_reports,
    p.is_hidden,
    CASE WHEN p.is_hidden THEN 'removed' ELSE NULL END::text AS moderation_status
  FROM public.posts p
  JOIN public.users u ON u.id = p.user_id
  WHERE p.media_url IS NOT NULL AND (p.media_type IS NULL OR p.media_type = 'image')

  UNION ALL

  SELECT
    pp.id,
    'profile_photo'::text AS photo_type,
    pp.user_id,
    u.email AS user_email,
    u.full_name AS user_name,
    pp.photo_url,
    pp.caption,
    COALESCE(pp.likes_count, 0) AS likes_count,
    0 AS comments_count,
    pp.created_at,
    (SELECT COUNT(*) FROM public.user_reports ur WHERE ur.content_type = 'profile_photo' AND ur.content_id = pp.id AND ur.status = 'pending') AS pending_reports,
    (SELECT COUNT(*) FROM public.user_reports ur WHERE ur.content_type = 'profile_photo' AND ur.content_id = pp.id) AS total_reports,
    pp.is_hidden,
    CASE WHEN pp.is_hidden THEN 'removed' ELSE NULL END::text AS moderation_status
  FROM public.profile_photos pp
  JOIN public.users u ON u.id = pp.user_id
) sub
WHERE public.is_admin(auth.uid());

CREATE OR REPLACE VIEW public.admin_recent_photos AS
SELECT * FROM (
  SELECT * FROM public.admin_all_photos
  ORDER BY created_at DESC
  LIMIT 200
) sub;

CREATE OR REPLACE VIEW public.admin_reported_photos AS
SELECT * FROM (
  SELECT * FROM public.admin_all_photos
  WHERE pending_reports > 0
  ORDER BY pending_reports DESC, created_at DESC
) sub;

-- ------------------------------------------------------------
-- 3. Views de vídeos (novo) — une posts de vídeo + public.user_videos
-- ------------------------------------------------------------
DROP VIEW IF EXISTS public.admin_all_videos CASCADE;
CREATE VIEW public.admin_all_videos AS
SELECT * FROM (
  SELECT
    p.id,
    'post_video'::text AS video_type,
    p.user_id,
    u.email AS user_email,
    u.full_name AS user_name,
    p.media_url AS video_url,
    NULL::text AS thumbnail_url,
    p.content AS caption,
    COALESCE(p.likes_count, 0) AS likes_count,
    COALESCE(p.comments_count, 0) AS comments_count,
    NULL::integer AS views_count,
    NULL::integer AS duration_seconds,
    p.created_at,
    (SELECT COUNT(*) FROM public.user_reports ur WHERE ur.content_type = 'post' AND ur.content_id = p.id AND ur.status = 'pending') AS pending_reports,
    (SELECT COUNT(*) FROM public.user_reports ur WHERE ur.content_type = 'post' AND ur.content_id = p.id) AS total_reports,
    p.is_hidden,
    CASE WHEN p.is_hidden THEN 'removed' ELSE NULL END::text AS moderation_status
  FROM public.posts p
  JOIN public.users u ON u.id = p.user_id
  WHERE p.media_url IS NOT NULL AND p.media_type = 'video'

  UNION ALL

  SELECT
    v.id,
    'user_video'::text AS video_type,
    v.user_id,
    u.email AS user_email,
    u.full_name AS user_name,
    v.video_url,
    COALESCE(v.thumbnail_medium_url, v.thumbnail_url) AS thumbnail_url,
    COALESCE(v.title, v.description) AS caption,
    COALESCE(v.likes_count, 0) AS likes_count,
    (SELECT COUNT(*) FROM public.video_comments vc WHERE vc.video_id = v.id) AS comments_count,
    COALESCE(v.views_count, 0) AS views_count,
    COALESCE(v.duration_seconds, v.duration) AS duration_seconds,
    v.created_at,
    (SELECT COUNT(*) FROM public.user_reports ur WHERE ur.content_type = 'user_video' AND ur.content_id = v.id AND ur.status = 'pending') AS pending_reports,
    (SELECT COUNT(*) FROM public.user_reports ur WHERE ur.content_type = 'user_video' AND ur.content_id = v.id) AS total_reports,
    (v.visibility = 'private') AS is_hidden,
    CASE WHEN v.visibility = 'private' THEN 'removed' ELSE NULL END::text AS moderation_status
  FROM public.user_videos v
  JOIN public.users u ON u.id = v.user_id
) sub
WHERE public.is_admin(auth.uid());

CREATE OR REPLACE VIEW public.admin_recent_videos AS
SELECT * FROM (
  SELECT * FROM public.admin_all_videos
  ORDER BY created_at DESC
  LIMIT 200
) sub;

CREATE OR REPLACE VIEW public.admin_reported_videos AS
SELECT * FROM (
  SELECT * FROM public.admin_all_videos
  WHERE pending_reports > 0
  ORDER BY pending_reports DESC, created_at DESC
) sub;

-- ------------------------------------------------------------
-- 4. Lockdown de grants (mesmo padrão da Fase 9 — Supabase concede
--    acesso amplo por padrão em view nova, nunca confiar no default)
-- ------------------------------------------------------------
DO $$
DECLARE
  v_view TEXT;
BEGIN
  FOREACH v_view IN ARRAY ARRAY[
    'admin_all_photos', 'admin_recent_photos', 'admin_reported_photos',
    'admin_all_videos', 'admin_recent_videos', 'admin_reported_videos'
  ]
  LOOP
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated, PUBLIC', v_view);
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated', v_view);
  END LOOP;
END $$;

-- ------------------------------------------------------------
-- 5. hide_photo/delete_photo/approve_photo passam a suportar
--    'user_video', e hide vira reversível de verdade (is_hidden)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.hide_photo(
  p_photo_id UUID,
  p_photo_type TEXT,
  p_admin_id UUID,
  p_reason TEXT DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem executar esta ação';
  END IF;

  PERFORM public.log_admin_action(
    p_admin_id, 'hide_photo', 'Ocultou ' || p_photo_type || COALESCE(': ' || p_reason, ''),
    p_photo_type, p_photo_id
  );

  IF p_photo_type = 'post' OR p_photo_type = 'post_video' THEN
    UPDATE public.posts SET is_hidden = TRUE, updated_at = NOW() WHERE id = p_photo_id;
  ELSIF p_photo_type = 'profile_photo' THEN
    UPDATE public.profile_photos SET is_hidden = TRUE WHERE id = p_photo_id;
  ELSIF p_photo_type = 'user_video' THEN
    UPDATE public.user_videos SET visibility = 'private', updated_at = NOW() WHERE id = p_photo_id;
  END IF;

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_photo(
  p_photo_id UUID,
  p_photo_type TEXT,
  p_admin_id UUID,
  p_reason TEXT DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem executar esta ação';
  END IF;

  PERFORM public.log_admin_action(
    p_admin_id, 'delete_photo', 'Excluiu ' || p_photo_type || ' permanentemente' || COALESCE(': ' || p_reason, ''),
    p_photo_type, p_photo_id
  );

  IF p_photo_type = 'post' OR p_photo_type = 'post_video' THEN
    DELETE FROM public.posts WHERE id = p_photo_id;
  ELSIF p_photo_type = 'profile_photo' THEN
    DELETE FROM public.profile_photos WHERE id = p_photo_id;
  ELSIF p_photo_type = 'user_video' THEN
    DELETE FROM public.user_videos WHERE id = p_photo_id;
  END IF;

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.approve_photo(
  p_photo_id UUID,
  p_photo_type TEXT,
  p_admin_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem executar esta ação';
  END IF;

  PERFORM public.log_admin_action(
    p_admin_id, 'approve_photo', 'Aprovou ' || p_photo_type,
    p_photo_type, p_photo_id
  );

  IF p_photo_type = 'post' OR p_photo_type = 'post_video' THEN
    UPDATE public.posts SET is_hidden = FALSE WHERE id = p_photo_id;
  ELSIF p_photo_type = 'profile_photo' THEN
    UPDATE public.profile_photos SET is_hidden = FALSE WHERE id = p_photo_id;
  ELSIF p_photo_type = 'user_video' THEN
    UPDATE public.user_videos SET visibility = 'public' WHERE id = p_photo_id;
  END IF;

  UPDATE public.user_reports
  SET status = 'reviewed', resolution = 'rejected', resolved_by = p_admin_id, resolved_at = NOW(),
      resolution_notes = COALESCE(resolution_notes, 'Conteúdo aprovado pelo administrador')
  WHERE content_type = p_photo_type AND content_id = p_photo_id AND status = 'pending';

  RETURN TRUE;
END;
$$;

-- ------------------------------------------------------------
-- 6. Realtime em profile_photos (posts/user_reports/user_videos/
--    video_comments já habilitados antes)
-- ------------------------------------------------------------
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.profile_photos;
EXCEPTION WHEN OTHERS THEN
  NULL; -- já era membro da publicação
END $$;

SELECT 'ok' as status;
