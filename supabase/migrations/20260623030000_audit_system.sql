-- =====================================================
-- SISTEMA DE AUDITORIA E LOGS
-- =====================================================
-- Registra TODAS as ações administrativas e do sistema
-- Rastreabilidade completa para segurança e compliance
-- =====================================================

-- =====================================================
-- ENUM: Tipos de ações administrativas
-- =====================================================
CREATE TYPE admin_action_type AS ENUM (
  -- Ações de usuários
  'user_warned',
  'user_muted',
  'user_unmuted',
  'user_suspended',
  'user_unsuspended',
  'user_banned',
  'user_unbanned',
  'user_deleted',
  'user_role_granted',
  'user_role_revoked',
  'user_vip_granted',
  'user_vip_revoked',
  'user_theme_granted',

  -- Ações de conteúdo
  'content_approved',
  'content_rejected',
  'content_deleted',
  'content_edited',
  'content_featured',

  -- Ações de moderação
  'report_resolved',
  'report_rejected',

  -- Ações de sistema
  'settings_changed',
  'permission_changed',
  'theme_created',
  'badge_created'
);

-- =====================================================
-- TABELA: Logs administrativos
-- =====================================================
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Quem fez a ação
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_email TEXT NOT NULL,
  admin_role user_role NOT NULL,

  -- O que foi feito
  action admin_action_type NOT NULL,
  entity_type TEXT NOT NULL, -- 'user', 'content', 'report', 'settings'
  entity_id UUID, -- ID da entidade afetada

  -- Detalhes
  description TEXT NOT NULL,
  metadata JSONB, -- Dados adicionais (antes/depois, motivo, etc)

  -- IP e localização (para segurança)
  ip_address INET,
  user_agent TEXT,

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para busca rápida
CREATE INDEX idx_admin_logs_admin_id ON public.admin_logs(admin_id);
CREATE INDEX idx_admin_logs_action ON public.admin_logs(action);
CREATE INDEX idx_admin_logs_entity ON public.admin_logs(entity_type, entity_id);
CREATE INDEX idx_admin_logs_created_at ON public.admin_logs(created_at DESC);
CREATE INDEX idx_admin_logs_metadata ON public.admin_logs USING gin(metadata);

-- =====================================================
-- TABELA: Histórico de ações dos usuários
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Tipo de ação
  action_type TEXT NOT NULL, -- 'login', 'quiz_completed', 'post_created', etc

  -- Detalhes
  details JSONB,

  -- Contexto
  ip_address INET,
  user_agent TEXT,

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_user_activity_user_id ON public.user_activity_log(user_id);
CREATE INDEX idx_user_activity_action ON public.user_activity_log(action_type);
CREATE INDEX idx_user_activity_created_at ON public.user_activity_log(created_at DESC);

-- Particionamento por mês (para performance com grande volume)
-- Nota: Implementar quando necessário, requer PostgreSQL 13+

-- =====================================================
-- TABELA: Histórico de punições
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_punishments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Usuário punido
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Tipo de punição
  punishment_type TEXT NOT NULL, -- 'warning', 'mute', 'suspension', 'ban'

  -- Duração
  duration_minutes INTEGER, -- NULL = permanente
  expires_at TIMESTAMPTZ,

  -- Detalhes
  reason TEXT NOT NULL,
  evidence JSONB, -- Links, screenshots, etc

  -- Admin responsável
  issued_by UUID NOT NULL REFERENCES auth.users(id),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Revogação
  revoked_by UUID REFERENCES auth.users(id),
  revoked_at TIMESTAMPTZ,
  revoke_reason TEXT,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Índices
CREATE INDEX idx_punishments_user_id ON public.user_punishments(user_id);
CREATE INDEX idx_punishments_type ON public.user_punishments(punishment_type);
CREATE INDEX idx_punishments_active ON public.user_punishments(is_active) WHERE is_active = true;
CREATE INDEX idx_punishments_expires ON public.user_punishments(expires_at) WHERE expires_at IS NOT NULL;

-- =====================================================
-- FUNÇÕES: Registrar ações
-- =====================================================

-- Registrar ação administrativa
CREATE OR REPLACE FUNCTION log_admin_action(
  p_admin_id UUID,
  p_action admin_action_type,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_description TEXT,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_email TEXT;
  v_admin_role user_role;
  v_log_id UUID;
BEGIN
  -- Buscar dados do admin
  SELECT au.email, get_highest_role(p_admin_id)
  INTO v_admin_email, v_admin_role
  FROM auth.users au
  WHERE au.id = p_admin_id;

  -- Inserir log
  INSERT INTO public.admin_logs (
    admin_id,
    admin_email,
    admin_role,
    action,
    entity_type,
    entity_id,
    description,
    metadata
  ) VALUES (
    p_admin_id,
    v_admin_email,
    v_admin_role,
    p_action,
    p_entity_type,
    p_entity_id,
    p_description,
    p_metadata
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- Registrar atividade de usuário
CREATE OR REPLACE FUNCTION log_user_activity(
  p_user_id UUID,
  p_action_type TEXT,
  p_details JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.user_activity_log (user_id, action_type, details)
  VALUES (p_user_id, p_action_type, p_details)
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- Aplicar punição
CREATE OR REPLACE FUNCTION apply_punishment(
  p_user_id UUID,
  p_punishment_type TEXT,
  p_reason TEXT,
  p_duration_minutes INTEGER DEFAULT NULL,
  p_evidence JSONB DEFAULT NULL,
  p_issued_by UUID DEFAULT auth.uid()
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_punishment_id UUID;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Verificar se quem está aplicando é admin
  IF NOT is_admin(p_issued_by) THEN
    RAISE EXCEPTION 'Apenas admins podem aplicar punições';
  END IF;

  -- Calcular expiração
  IF p_duration_minutes IS NOT NULL THEN
    v_expires_at := NOW() + (p_duration_minutes || ' minutes')::INTERVAL;
  END IF;

  -- Inserir punição
  INSERT INTO public.user_punishments (
    user_id,
    punishment_type,
    duration_minutes,
    expires_at,
    reason,
    evidence,
    issued_by
  ) VALUES (
    p_user_id,
    p_punishment_type,
    p_duration_minutes,
    v_expires_at,
    p_reason,
    p_evidence,
    p_issued_by
  ) RETURNING id INTO v_punishment_id;

  -- Registrar no log administrativo
  PERFORM log_admin_action(
    p_issued_by,
    ('user_' || p_punishment_type)::admin_action_type,
    'user',
    p_user_id,
    'Aplicada punição: ' || p_punishment_type || ' - ' || p_reason,
    jsonb_build_object(
      'punishment_id', v_punishment_id,
      'duration_minutes', p_duration_minutes,
      'expires_at', v_expires_at
    )
  );

  RETURN v_punishment_id;
END;
$$;

-- Revogar punição
CREATE OR REPLACE FUNCTION revoke_punishment(
  p_punishment_id UUID,
  p_revoke_reason TEXT,
  p_revoked_by UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se quem está revogando é admin
  IF NOT is_admin(p_revoked_by) THEN
    RAISE EXCEPTION 'Apenas admins podem revogar punições';
  END IF;

  -- Atualizar punição
  UPDATE public.user_punishments
  SET
    is_active = false,
    revoked_by = p_revoked_by,
    revoked_at = NOW(),
    revoke_reason = p_revoke_reason
  WHERE id = p_punishment_id
  RETURNING user_id INTO v_user_id;

  -- Registrar no log
  PERFORM log_admin_action(
    p_revoked_by,
    'user_unbanned',
    'user',
    v_user_id,
    'Punição revogada: ' || p_revoke_reason,
    jsonb_build_object('punishment_id', p_punishment_id)
  );

  RETURN TRUE;
END;
$$;

-- Verificar se usuário está punido
CREATE OR REPLACE FUNCTION is_user_punished(
  p_user_id UUID,
  p_punishment_type TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_punishments
    WHERE user_id = p_user_id
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > NOW())
      AND (p_punishment_type IS NULL OR punishment_type = p_punishment_type)
  );
$$;

-- Obter punições ativas do usuário
CREATE OR REPLACE FUNCTION get_active_punishments(p_user_id UUID)
RETURNS TABLE(
  punishment_type TEXT,
  reason TEXT,
  issued_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  remaining_minutes INTEGER
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    punishment_type,
    reason,
    issued_at,
    expires_at,
    CASE
      WHEN expires_at IS NULL THEN NULL
      ELSE EXTRACT(EPOCH FROM (expires_at - NOW())) / 60
    END::INTEGER as remaining_minutes
  FROM public.user_punishments
  WHERE user_id = p_user_id
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
  ORDER BY issued_at DESC;
$$;

-- =====================================================
-- TRIGGER: Auto-expirar punições
-- =====================================================
CREATE OR REPLACE FUNCTION auto_expire_punishments()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.user_punishments
  SET is_active = false
  WHERE is_active = true
    AND expires_at IS NOT NULL
    AND expires_at <= NOW();
END;
$$;

-- Executar a cada hora (configurar via pg_cron ou Edge Function)
-- SELECT cron.schedule('expire-punishments', '0 * * * *', 'SELECT auto_expire_punishments()');

-- =====================================================
-- RLS: Row Level Security
-- =====================================================

ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_punishments ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ver logs administrativos
CREATE POLICY "Admins can view admin logs"
  ON public.admin_logs
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Apenas super_admin pode deletar logs (compliance)
CREATE POLICY "Only super_admin can delete logs"
  ON public.admin_logs
  FOR DELETE
  USING (has_role(auth.uid(), 'super_admin'));

-- Users podem ver sua própria atividade
CREATE POLICY "Users can view own activity"
  ON public.user_activity_log
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins podem ver toda atividade
CREATE POLICY "Admins can view all activity"
  ON public.user_activity_log
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Users podem ver suas próprias punições
CREATE POLICY "Users can view own punishments"
  ON public.user_punishments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins podem ver todas as punições
CREATE POLICY "Admins can view all punishments"
  ON public.user_punishments
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Apenas admins podem modificar punições (via função)
CREATE POLICY "Only admins can modify punishments"
  ON public.user_punishments
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- =====================================================
-- GRANTS
-- =====================================================
GRANT SELECT ON public.admin_logs TO authenticated;
GRANT SELECT ON public.user_activity_log TO authenticated;
GRANT SELECT ON public.user_punishments TO authenticated;

GRANT EXECUTE ON FUNCTION log_admin_action(UUID, admin_action_type, TEXT, UUID, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION log_user_activity(UUID, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION apply_punishment(UUID, TEXT, TEXT, INTEGER, JSONB, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION revoke_punishment(UUID, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_user_punished(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_punishments(UUID) TO authenticated;

-- =====================================================
-- COMENTÁRIOS
-- =====================================================
COMMENT ON TABLE public.admin_logs IS 'Log completo de todas ações administrativas (auditoria)';
COMMENT ON TABLE public.user_activity_log IS 'Log de atividades dos usuários no sistema';
COMMENT ON TABLE public.user_punishments IS 'Histórico de punições aplicadas aos usuários';
COMMENT ON FUNCTION log_admin_action IS 'Registra ação administrativa no log de auditoria';
COMMENT ON FUNCTION apply_punishment IS 'Aplica punição a um usuário (warning, mute, ban, etc)';
COMMENT ON FUNCTION revoke_punishment IS 'Revoga punição ativa de um usuário';
COMMENT ON FUNCTION is_user_punished IS 'Verifica se usuário possui punição ativa';
