-- ============================================================
-- FASE 13: sistema de denúncia em toda publicação/comentário do app
-- ============================================================
-- 1. Impede denúncia duplicada (mesma pessoa, mesmo conteúdo) — antes
--    não existia nenhum constraint, dava pra denunciar a mesma coisa
--    infinitas vezes.
-- 2. get_reported_content(): função única que busca o conteúdo real
--    (texto/mídia/autor) de QUALQUER tipo denunciado, pro admin ver a
--    publicação completa antes de decidir — hoje o painel só mostra o
--    texto que o denunciante digitou, nunca o conteúdo original.
-- ============================================================

-- Índice único parcial: um usuário só pode denunciar o mesmo conteúdo
-- uma vez (novas denúncias de conteúdo sem content_id, ex. denúncia
-- de perfil, continuam permitidas sem essa trava).
DROP INDEX IF EXISTS public.uniq_report_per_content;
CREATE UNIQUE INDEX uniq_report_per_content
  ON public.user_reports (reporter_id, content_type, content_id)
  WHERE content_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.get_reported_content(
  p_content_type TEXT,
  p_content_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem executar esta ação';
  END IF;

  IF p_content_id IS NULL THEN
    RETURN NULL;
  END IF;

  CASE p_content_type
    WHEN 'post', 'post_video' THEN
      SELECT jsonb_build_object(
        'text', p.content, 'media_url', p.media_url, 'media_type', p.media_type,
        'author_name', u.full_name, 'author_email', u.email,
        'created_at', p.created_at, 'is_hidden', p.is_hidden
      ) INTO v_result
      FROM public.posts p JOIN public.users u ON u.id = p.user_id
      WHERE p.id = p_content_id;

    WHEN 'profile_photo' THEN
      SELECT jsonb_build_object(
        'text', pp.caption, 'media_url', pp.photo_url, 'media_type', 'image',
        'author_name', u.full_name, 'author_email', u.email,
        'created_at', pp.created_at, 'is_hidden', pp.is_hidden
      ) INTO v_result
      FROM public.profile_photos pp JOIN public.users u ON u.id = pp.user_id
      WHERE pp.id = p_content_id;

    WHEN 'user_video' THEN
      SELECT jsonb_build_object(
        'text', COALESCE(v.title, v.description), 'media_url', v.video_url, 'media_type', 'video',
        'author_name', u.full_name, 'author_email', u.email,
        'created_at', v.created_at, 'is_hidden', (v.visibility = 'private')
      ) INTO v_result
      FROM public.user_videos v JOIN public.users u ON u.id = v.user_id
      WHERE v.id = p_content_id;

    WHEN 'prayer' THEN
      SELECT jsonb_build_object(
        'text', pr.title || E'\n\n' || pr.description, 'media_url', pr.audio_url, 'media_type', 'audio',
        'author_name', u.full_name, 'author_email', u.email,
        'created_at', pr.created_at, 'is_hidden', false
      ) INTO v_result
      FROM public.prayers pr JOIN public.users u ON u.id = pr.user_id
      WHERE pr.id = p_content_id;

    WHEN 'testimony' THEN
      SELECT jsonb_build_object(
        'text', COALESCE(t.title || E'\n\n', '') || t.content,
        'media_url', COALESCE(t.image_url, t.video_url, t.audio_url),
        'media_type', CASE WHEN t.image_url IS NOT NULL THEN 'image' WHEN t.video_url IS NOT NULL THEN 'video' WHEN t.audio_url IS NOT NULL THEN 'audio' ELSE NULL END,
        'author_name', u.full_name, 'author_email', u.email,
        'created_at', t.created_at, 'is_hidden', false
      ) INTO v_result
      FROM public.testimonies t JOIN public.users u ON u.id = t.user_id
      WHERE t.id = p_content_id;

    WHEN 'question' THEN
      SELECT jsonb_build_object(
        'text', bq.title || E'\n\n' || bq.body, 'media_url', NULL, 'media_type', NULL,
        'author_name', u.full_name, 'author_email', u.email,
        'created_at', bq.created_at, 'is_hidden', false
      ) INTO v_result
      FROM public.bible_questions bq JOIN public.users u ON u.id = bq.user_id
      WHERE bq.id = p_content_id;

    WHEN 'question_answer' THEN
      SELECT jsonb_build_object(
        'text', qa.content, 'media_url', NULL, 'media_type', NULL,
        'author_name', u.full_name, 'author_email', u.email,
        'created_at', qa.created_at, 'is_hidden', false
      ) INTO v_result
      FROM public.bible_question_answers qa JOIN public.users u ON u.id = qa.user_id
      WHERE qa.id = p_content_id;

    WHEN 'post_comment' THEN
      SELECT jsonb_build_object(
        'text', pc.content, 'media_url', NULL, 'media_type', NULL,
        'author_name', u.full_name, 'author_email', u.email,
        'created_at', pc.created_at, 'is_hidden', false
      ) INTO v_result
      FROM public.post_comments pc JOIN public.users u ON u.id = pc.user_id
      WHERE pc.id = p_content_id;

    WHEN 'prayer_comment' THEN
      SELECT jsonb_build_object(
        'text', pc.content, 'media_url', NULL, 'media_type', NULL,
        'author_name', u.full_name, 'author_email', u.email,
        'created_at', pc.created_at, 'is_hidden', false
      ) INTO v_result
      FROM public.prayer_comments pc JOIN public.users u ON u.id = pc.user_id
      WHERE pc.id = p_content_id;

    WHEN 'testimony_comment' THEN
      SELECT jsonb_build_object(
        'text', tc.content, 'media_url', NULL, 'media_type', NULL,
        'author_name', u.full_name, 'author_email', u.email,
        'created_at', tc.created_at, 'is_hidden', false
      ) INTO v_result
      FROM public.testimony_comments tc JOIN public.users u ON u.id = tc.user_id
      WHERE tc.id = p_content_id;

    WHEN 'verse_comment' THEN
      SELECT jsonb_build_object(
        'text', vc.comment_text, 'media_url', NULL, 'media_type', NULL,
        'author_name', u.full_name, 'author_email', u.email,
        'created_at', vc.created_at, 'is_hidden', COALESCE(vc.is_hidden, false)
      ) INTO v_result
      FROM public.verse_comments vc JOIN public.users u ON u.id = vc.user_id
      WHERE vc.id = p_content_id;

    ELSE
      v_result := NULL;
  END CASE;

  RETURN v_result;
END;
$$;

-- ------------------------------------------------------------
-- Estende hide_photo/delete_photo/approve_photo pra cobrir os novos
-- tipos de conteúdo denunciável (oração, depoimento, pergunta,
-- resposta, comentário de post/oração/depoimento/versículo) — antes
-- só sabiam mexer em post/profile_photo/user_video. "Ocultar" só é
-- oferecido pra tipos que já têm coluna is_hidden real; os demais só
-- têm "Excluir" (ação sempre disponível, em qualquer tabela).
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
  ELSIF p_photo_type = 'verse_comment' THEN
    UPDATE public.verse_comments SET is_hidden = TRUE, updated_at = NOW() WHERE id = p_photo_id;
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
  ELSIF p_photo_type = 'prayer' THEN
    DELETE FROM public.prayers WHERE id = p_photo_id;
  ELSIF p_photo_type = 'testimony' THEN
    DELETE FROM public.testimonies WHERE id = p_photo_id;
  ELSIF p_photo_type = 'question' THEN
    DELETE FROM public.bible_questions WHERE id = p_photo_id;
  ELSIF p_photo_type = 'question_answer' THEN
    DELETE FROM public.bible_question_answers WHERE id = p_photo_id;
  ELSIF p_photo_type = 'post_comment' THEN
    DELETE FROM public.post_comments WHERE id = p_photo_id;
  ELSIF p_photo_type = 'prayer_comment' THEN
    DELETE FROM public.prayer_comments WHERE id = p_photo_id;
  ELSIF p_photo_type = 'testimony_comment' THEN
    DELETE FROM public.testimony_comments WHERE id = p_photo_id;
  ELSIF p_photo_type = 'verse_comment' THEN
    DELETE FROM public.verse_comments WHERE id = p_photo_id;
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
  ELSIF p_photo_type = 'verse_comment' THEN
    UPDATE public.verse_comments SET is_hidden = FALSE WHERE id = p_photo_id;
  END IF;

  UPDATE public.user_reports
  SET status = 'reviewed', resolution = 'rejected', resolved_by = p_admin_id, resolved_at = NOW(),
      resolution_notes = COALESCE(resolution_notes, 'Conteúdo aprovado pelo administrador')
  WHERE content_type = p_photo_type AND content_id = p_photo_id AND status = 'pending';

  RETURN TRUE;
END;
$$;

SELECT 'ok' as status;
