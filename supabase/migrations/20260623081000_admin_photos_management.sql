-- =====================================================
-- GERENCIADOR DE FOTOS - ADMIN PANEL
-- =====================================================
-- View consolidada de todas as fotos da plataforma
-- Inclui posts, profile_photos e outras mídias
-- =====================================================

-- =====================================================
-- VIEW: Todas as fotos da plataforma (consolidada)
-- =====================================================
CREATE OR REPLACE VIEW admin_all_photos AS
-- Fotos de posts do feed
SELECT
  p.id,
  'post' as photo_type,
  p.user_id,
  u.email as user_email,
  prof.full_name as user_name,
  p.media_url as photo_url,
  p.content as caption,
  p.likes_count,
  p.comments_count,
  p.created_at,
  p.updated_at,
  -- Denúncias
  (SELECT COUNT(*) FROM reports WHERE reported_content_type = 'post' AND reported_content_id = p.id AND status = 'pending') as pending_reports,
  -- Status de moderação
  (SELECT status FROM moderation_queue WHERE content_type = 'post' AND content_id = p.id ORDER BY created_at DESC LIMIT 1) as moderation_status
FROM posts p
INNER JOIN auth.users u ON u.id = p.user_id
LEFT JOIN profiles prof ON prof.user_id = p.user_id
WHERE p.media_type = 'image' AND p.media_url IS NOT NULL

UNION ALL

-- Fotos de perfil
SELECT
  pp.id,
  'profile_photo' as photo_type,
  pp.user_id,
  u.email as user_email,
  prof.full_name as user_name,
  pp.photo_url,
  pp.caption,
  pp.likes_count,
  0 as comments_count,
  pp.created_at,
  pp.updated_at,
  (SELECT COUNT(*) FROM reports WHERE reported_content_type = 'profile_photo' AND reported_content_id = pp.id AND status = 'pending') as pending_reports,
  (SELECT status FROM moderation_queue WHERE content_type = 'profile_photo' AND content_id = pp.id ORDER BY created_at DESC LIMIT 1) as moderation_status
FROM profile_photos pp
INNER JOIN auth.users u ON u.id = pp.user_id
LEFT JOIN profiles prof ON prof.user_id = pp.user_id

UNION ALL

-- Posts de gratidão (se tiverem mídia futuramente)
SELECT
  gp.id,
  'gratitude_post' as photo_type,
  gp.user_id,
  u.email as user_email,
  prof.full_name as user_name,
  NULL as photo_url, -- Gratitude posts não têm foto por padrão
  gp.message as caption,
  gp.amens_count as likes_count,
  0 as comments_count,
  gp.created_at,
  gp.updated_at,
  (SELECT COUNT(*) FROM reports WHERE reported_content_type = 'gratitude_post' AND reported_content_id = gp.id AND status = 'pending') as pending_reports,
  (SELECT status FROM moderation_queue WHERE content_type = 'gratitude_post' AND content_id = gp.id ORDER BY created_at DESC LIMIT 1) as moderation_status
FROM gratitude_posts gp
INNER JOIN auth.users u ON u.id = gp.user_id
LEFT JOIN profiles prof ON prof.user_id = gp.user_id
WHERE gp.type = 'testemunho' -- Apenas testemunhos

ORDER BY created_at DESC;

-- =====================================================
-- VIEW: Fotos recentes (últimas 24h)
-- =====================================================
CREATE OR REPLACE VIEW admin_recent_photos AS
SELECT * FROM admin_all_photos
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- =====================================================
-- VIEW: Fotos denunciadas
-- =====================================================
CREATE OR REPLACE VIEW admin_reported_photos AS
SELECT * FROM admin_all_photos
WHERE pending_reports > 0
ORDER BY pending_reports DESC, created_at DESC;

-- =====================================================
-- FUNCTION: Ocultar foto (soft delete)
-- =====================================================
CREATE OR REPLACE FUNCTION hide_photo(
  p_photo_id UUID,
  p_photo_type TEXT,
  p_admin_id UUID,
  p_reason TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Registrar log
  PERFORM log_admin_action(
    p_admin_id,
    'hide_photo',
    'Ocultou foto ' || p_photo_type,
    'photo',
    p_photo_id,
    jsonb_build_object('reason', p_reason, 'photo_type', p_photo_type)
  );

  -- Ocultar baseado no tipo
  IF p_photo_type = 'post' THEN
    UPDATE posts SET media_url = NULL, updated_at = NOW() WHERE id = p_photo_id RETURNING user_id INTO v_user_id;
  ELSIF p_photo_type = 'profile_photo' THEN
    DELETE FROM profile_photos WHERE id = p_photo_id RETURNING user_id INTO v_user_id;
  ELSIF p_photo_type = 'gratitude_post' THEN
    -- Gratitude posts não têm foto, mas podem ser ocultados
    UPDATE gratitude_posts SET message = '[CONTEÚDO REMOVIDO]', updated_at = NOW() WHERE id = p_photo_id RETURNING user_id INTO v_user_id;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Excluir foto permanentemente
-- =====================================================
CREATE OR REPLACE FUNCTION delete_photo(
  p_photo_id UUID,
  p_photo_type TEXT,
  p_admin_id UUID,
  p_reason TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
  -- Registrar log
  PERFORM log_admin_action(
    p_admin_id,
    'delete_photo',
    'Excluiu foto ' || p_photo_type || ' permanentemente',
    'photo',
    p_photo_id,
    jsonb_build_object('reason', p_reason, 'photo_type', p_photo_type)
  );

  -- Excluir baseado no tipo
  IF p_photo_type = 'post' THEN
    DELETE FROM posts WHERE id = p_photo_id;
  ELSIF p_photo_type = 'profile_photo' THEN
    DELETE FROM profile_photos WHERE id = p_photo_id;
  ELSIF p_photo_type = 'gratitude_post' THEN
    DELETE FROM gratitude_posts WHERE id = p_photo_id;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Aprovar foto na fila de moderação
-- =====================================================
CREATE OR REPLACE FUNCTION approve_photo(
  p_photo_id UUID,
  p_photo_type TEXT,
  p_admin_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  -- Atualizar fila de moderação
  UPDATE moderation_queue
  SET
    status = 'approved',
    reviewed_by = p_admin_id,
    reviewed_at = NOW()
  WHERE content_id = p_photo_id AND content_type = p_photo_type;

  -- Registrar log
  PERFORM log_admin_action(
    p_admin_id,
    'approve_photo',
    'Aprovou foto ' || p_photo_type,
    'photo',
    p_photo_id,
    jsonb_build_object('photo_type', p_photo_type)
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANT: Permissões
-- =====================================================
GRANT SELECT ON admin_all_photos TO authenticated;
GRANT SELECT ON admin_recent_photos TO authenticated;
GRANT SELECT ON admin_reported_photos TO authenticated;

-- =====================================================
-- COMENTÁRIOS
-- =====================================================
COMMENT ON VIEW admin_all_photos IS 'View consolidada de todas as fotos da plataforma para gerenciamento administrativo';
COMMENT ON VIEW admin_recent_photos IS 'Fotos enviadas nas últimas 24 horas';
COMMENT ON VIEW admin_reported_photos IS 'Fotos com denúncias pendentes';
COMMENT ON FUNCTION hide_photo IS 'Oculta uma foto (soft delete) e registra log administrativo';
COMMENT ON FUNCTION delete_photo IS 'Exclui permanentemente uma foto e registra log';
COMMENT ON FUNCTION approve_photo IS 'Aprova uma foto na fila de moderação';
