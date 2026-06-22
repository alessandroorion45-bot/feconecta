-- =====================================================
-- SISTEMA DE MODERAÇÃO E DENÚNCIAS
-- =====================================================
-- Moderação de conteúdo + sistema de reports
-- =====================================================

-- =====================================================
-- ENUM: Status de moderação
-- =====================================================
CREATE TYPE moderation_status AS ENUM (
  'pending',    -- Aguardando moderação
  'approved',   -- Aprovado
  'rejected',   -- Rejeitado
  'flagged'     -- Sinalizado para revisão
);

-- =====================================================
-- ENUM: Tipos de denúncia
-- =====================================================
CREATE TYPE report_type AS ENUM (
  'spam',
  'offensive_content',
  'harassment',
  'fake_profile',
  'inappropriate_language',
  'religious_attack',
  'other'
);

-- =====================================================
-- TABELA: Denúncias de Usuários
-- =====================================================
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Quem reportou
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,

  -- O que foi reportado
  reported_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_content_type TEXT, -- 'post', 'comment', 'message', 'profile'
  reported_content_id UUID,

  -- Detalhes
  report_type report_type NOT NULL,
  description TEXT NOT NULL,
  evidence JSONB, -- Screenshots, links, etc

  -- Status
  status moderation_status NOT NULL DEFAULT 'pending',

  -- Moderação
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  moderator_notes TEXT,
  action_taken TEXT, -- 'warned', 'muted', 'banned', 'content_removed', 'no_action'

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_reports_status ON public.reports(status);
CREATE INDEX idx_reports_reporter ON public.reports(reporter_id);
CREATE INDEX idx_reports_reported_user ON public.reports(reported_user_id);
CREATE INDEX idx_reports_type ON public.reports(report_type);
CREATE INDEX idx_reports_created ON public.reports(created_at DESC);

-- =====================================================
-- TABELA: Fila de Moderação de Conteúdo
-- =====================================================
CREATE TABLE IF NOT EXISTS public.moderation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Conteúdo
  content_type TEXT NOT NULL, -- 'gratitude_post', 'testimony', 'comment', etc
  content_id UUID NOT NULL,
  content_preview TEXT,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Status
  status moderation_status NOT NULL DEFAULT 'pending',

  -- Auto-flag
  auto_flagged BOOLEAN DEFAULT false,
  flag_reason TEXT,

  -- Moderação
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  moderator_notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_moderation_queue_status ON public.moderation_queue(status);
CREATE INDEX idx_moderation_queue_content ON public.moderation_queue(content_type, content_id);
CREATE INDEX idx_moderation_queue_author ON public.moderation_queue(author_id);
CREATE INDEX idx_moderation_queue_flagged ON public.moderation_queue(auto_flagged) WHERE auto_flagged = true;

-- =====================================================
-- FUNÇÕES: Criar Denúncia
-- =====================================================
CREATE OR REPLACE FUNCTION create_report(
  p_reporter_id UUID,
  p_reported_user_id UUID,
  p_report_type report_type,
  p_description TEXT,
  p_reported_content_type TEXT DEFAULT NULL,
  p_reported_content_id UUID DEFAULT NULL,
  p_evidence JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_report_id UUID;
BEGIN
  -- Inserir denúncia
  INSERT INTO public.reports (
    reporter_id,
    reported_user_id,
    reported_content_type,
    reported_content_id,
    report_type,
    description,
    evidence
  ) VALUES (
    p_reporter_id,
    p_reported_user_id,
    p_reported_content_type,
    p_reported_content_id,
    p_report_type,
    p_description,
    p_evidence
  ) RETURNING id INTO v_report_id;

  -- Registrar log
  PERFORM log_user_activity(
    p_reporter_id,
    'report_created',
    jsonb_build_object(
      'report_id', v_report_id,
      'reported_user_id', p_reported_user_id,
      'type', p_report_type
    )
  );

  RETURN v_report_id;
END;
$$;

-- =====================================================
-- FUNÇÕES: Revisar Denúncia
-- =====================================================
CREATE OR REPLACE FUNCTION review_report(
  p_report_id UUID,
  p_reviewer_id UUID,
  p_status moderation_status,
  p_action_taken TEXT,
  p_moderator_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reported_user_id UUID;
BEGIN
  -- Verificar se revisor é admin
  IF NOT is_admin(p_reviewer_id) THEN
    RAISE EXCEPTION 'Apenas moderadores podem revisar denúncias';
  END IF;

  -- Atualizar denúncia
  UPDATE public.reports
  SET
    status = p_status,
    reviewed_by = p_reviewer_id,
    reviewed_at = NOW(),
    action_taken = p_action_taken,
    moderator_notes = p_moderator_notes,
    updated_at = NOW()
  WHERE id = p_report_id
  RETURNING reported_user_id INTO v_reported_user_id;

  -- Registrar log administrativo
  PERFORM log_admin_action(
    p_reviewer_id,
    'report_resolved',
    'report',
    p_report_id,
    'Denúncia revisada - Ação: ' || p_action_taken,
    jsonb_build_object(
      'status', p_status,
      'action', p_action_taken,
      'reported_user', v_reported_user_id
    )
  );

  RETURN TRUE;
END;
$$;

-- =====================================================
-- FUNÇÕES: Moderar Conteúdo
-- =====================================================
CREATE OR REPLACE FUNCTION moderate_content(
  p_content_type TEXT,
  p_content_id UUID,
  p_moderator_id UUID,
  p_status moderation_status,
  p_moderator_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se moderador é admin
  IF NOT has_permission(p_moderator_id, 'moderation.approve') THEN
    RAISE EXCEPTION 'Sem permissão para moderar conteúdo';
  END IF;

  -- Atualizar na fila de moderação
  UPDATE public.moderation_queue
  SET
    status = p_status,
    reviewed_by = p_moderator_id,
    reviewed_at = NOW(),
    moderator_notes = p_moderator_notes,
    updated_at = NOW()
  WHERE content_type = p_content_type AND content_id = p_content_id;

  -- Se não existir na fila, inserir
  IF NOT FOUND THEN
    INSERT INTO public.moderation_queue (
      content_type,
      content_id,
      status,
      reviewed_by,
      reviewed_at,
      moderator_notes
    ) VALUES (
      p_content_type,
      p_content_id,
      p_status,
      p_moderator_id,
      NOW(),
      p_moderator_notes
    );
  END IF;

  -- Registrar log
  PERFORM log_admin_action(
    p_moderator_id,
    CASE p_status
      WHEN 'approved' THEN 'content_approved'
      WHEN 'rejected' THEN 'content_rejected'
      ELSE 'content_edited'
    END::admin_action_type,
    p_content_type,
    p_content_id,
    'Conteúdo moderado: ' || p_status::TEXT,
    jsonb_build_object('notes', p_moderator_notes)
  );

  RETURN TRUE;
END;
$$;

-- =====================================================
-- VIEWS: Estatísticas de Moderação
-- =====================================================
CREATE OR REPLACE VIEW public.moderation_stats AS
SELECT
  COUNT(*) FILTER (WHERE status = 'pending') as pending_reports,
  COUNT(*) FILTER (WHERE status = 'approved') as approved_reports,
  COUNT(*) FILTER (WHERE status = 'rejected') as rejected_reports,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as reports_last_24h,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as reports_last_week
FROM public.reports;

CREATE OR REPLACE VIEW public.top_reported_users AS
SELECT
  r.reported_user_id,
  u.full_name,
  u.email,
  COUNT(*) as report_count,
  COUNT(*) FILTER (WHERE r.status = 'pending') as pending_count,
  MAX(r.created_at) as last_reported_at
FROM public.reports r
JOIN public.users u ON u.id = r.reported_user_id
GROUP BY r.reported_user_id, u.full_name, u.email
HAVING COUNT(*) >= 3
ORDER BY report_count DESC
LIMIT 50;

-- =====================================================
-- TRIGGER: Atualizar updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_reports_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_reports_updated_at ON public.reports;
CREATE TRIGGER trigger_update_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION update_reports_updated_at();

DROP TRIGGER IF EXISTS trigger_update_moderation_queue_updated_at ON public.moderation_queue;
CREATE TRIGGER trigger_update_moderation_queue_updated_at
  BEFORE UPDATE ON public.moderation_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_reports_updated_at();

-- =====================================================
-- RLS: Row Level Security
-- =====================================================

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_queue ENABLE ROW LEVEL SECURITY;

-- Users podem criar denúncias
CREATE POLICY "Users can create reports"
  ON public.reports
  FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Users podem ver suas próprias denúncias
CREATE POLICY "Users can view own reports"
  ON public.reports
  FOR SELECT
  USING (auth.uid() = reporter_id);

-- Admins podem ver todas as denúncias
CREATE POLICY "Admins can view all reports"
  ON public.reports
  FOR SELECT
  USING (has_permission(auth.uid(), 'reports.view'));

-- Admins podem moderar denúncias
CREATE POLICY "Admins can moderate reports"
  ON public.reports
  FOR UPDATE
  USING (has_permission(auth.uid(), 'reports.resolve'))
  WITH CHECK (has_permission(auth.uid(), 'reports.resolve'));

-- Apenas admins podem ver fila de moderação
CREATE POLICY "Only admins can view moderation queue"
  ON public.moderation_queue
  FOR SELECT
  USING (has_permission(auth.uid(), 'moderation.view'));

-- Apenas admins podem moderar conteúdo
CREATE POLICY "Only admins can moderate content"
  ON public.moderation_queue
  FOR ALL
  USING (has_permission(auth.uid(), 'moderation.approve'))
  WITH CHECK (has_permission(auth.uid(), 'moderation.approve'));

-- =====================================================
-- GRANTS
-- =====================================================
GRANT SELECT, INSERT ON public.reports TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.moderation_queue TO authenticated;
GRANT SELECT ON public.moderation_stats TO authenticated;
GRANT SELECT ON public.top_reported_users TO authenticated;

GRANT EXECUTE ON FUNCTION create_report TO authenticated;
GRANT EXECUTE ON FUNCTION review_report TO authenticated;
GRANT EXECUTE ON FUNCTION moderate_content TO authenticated;

-- =====================================================
-- COMENTÁRIOS
-- =====================================================
COMMENT ON TABLE public.reports IS 'Denúncias de usuários (spam, ofensas, etc)';
COMMENT ON TABLE public.moderation_queue IS 'Fila de moderação de conteúdo';
COMMENT ON FUNCTION create_report IS 'Cria uma denúncia de usuário ou conteúdo';
COMMENT ON FUNCTION review_report IS 'Revisa e resolve uma denúncia (apenas admins)';
COMMENT ON FUNCTION moderate_content IS 'Modera conteúdo (aprovar/rejeitar)';
