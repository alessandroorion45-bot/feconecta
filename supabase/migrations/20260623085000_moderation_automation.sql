-- =====================================================
-- AUTOMAÇÕES DE MODERAÇÃO
-- =====================================================
-- Auto-flag, filtros de palavras, regras automáticas
-- =====================================================

-- =====================================================
-- TABELA: Palavras proibidas / filtradas
-- =====================================================
CREATE TABLE IF NOT EXISTS public.banned_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Palavra ou padrão
  word TEXT NOT NULL UNIQUE,
  pattern TEXT, -- Regex pattern (opcional)

  -- Severidade
  severity TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'

  -- Ação automática
  auto_action TEXT NOT NULL DEFAULT 'flag', -- 'flag', 'hide', 'reject', 'warn_user'

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_banned_words_active ON public.banned_words(is_active) WHERE is_active = true;
CREATE INDEX idx_banned_words_severity ON public.banned_words(severity);

-- Inserir palavras proibidas padrão
INSERT INTO public.banned_words (word, severity, auto_action) VALUES
  ('spam', 'medium', 'flag'),
  ('scam', 'high', 'hide'),
  ('hack', 'high', 'flag'),
  ('malware', 'critical', 'reject'),
  ('phishing', 'critical', 'reject');

-- =====================================================
-- TABELA: Regras de moderação automática
-- =====================================================
CREATE TABLE IF NOT EXISTS public.moderation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Regra
  name TEXT NOT NULL,
  description TEXT,

  -- Trigger condition
  trigger_type TEXT NOT NULL, -- 'report_count', 'banned_word', 'spam_pattern', 'multiple_posts'
  trigger_value JSONB NOT NULL, -- Configuração do trigger

  -- Ação automática
  action_type TEXT NOT NULL, -- 'flag', 'hide', 'suspend_user', 'ban_user', 'notify_admin'
  action_params JSONB, -- Parâmetros da ação

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER DEFAULT 0, -- Ordem de execução

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_moderation_rules_active ON public.moderation_rules(is_active) WHERE is_active = true;
CREATE INDEX idx_moderation_rules_priority ON public.moderation_rules(priority DESC);

-- Inserir regras padrão
INSERT INTO public.moderation_rules (name, description, trigger_type, trigger_value, action_type, action_params, priority) VALUES
  (
    'Auto-ban após 3 denúncias',
    'Usuário é automaticamente banido após receber 3 denúncias aprovadas',
    'report_count',
    '{"threshold": 3, "status": "approved"}'::jsonb,
    'ban_user',
    '{"reason": "Banimento automático: 3 denúncias aprovadas"}'::jsonb,
    100
  ),
  (
    'Auto-suspender após 5 advertências',
    'Usuário é suspenso por 7 dias após 5 advertências',
    'report_count',
    '{"threshold": 5, "punishment_type": "warning"}'::jsonb,
    'suspend_user',
    '{"duration_days": 7, "reason": "Suspensão automática: 5 advertências"}'::jsonb,
    90
  ),
  (
    'Ocultar conteúdo com palavra proibida crítica',
    'Oculta automaticamente conteúdo com palavras de severidade crítica',
    'banned_word',
    '{"severity": "critical"}'::jsonb,
    'hide',
    '{}'::jsonb,
    80
  );

-- =====================================================
-- TABELA: Log de ações automáticas
-- =====================================================
CREATE TABLE IF NOT EXISTS public.auto_moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Regra aplicada
  rule_id UUID REFERENCES public.moderation_rules(id),
  rule_name TEXT NOT NULL,

  -- Alvo
  target_type TEXT NOT NULL, -- 'user', 'post', 'comment', 'photo'
  target_id UUID NOT NULL,

  -- Ação executada
  action_taken TEXT NOT NULL,
  action_result JSONB,

  -- Trigger que causou
  trigger_reason TEXT,
  trigger_data JSONB,

  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_auto_moderation_logs_target ON public.auto_moderation_logs(target_type, target_id);
CREATE INDEX idx_auto_moderation_logs_rule ON public.auto_moderation_logs(rule_id);
CREATE INDEX idx_auto_moderation_logs_executed ON public.auto_moderation_logs(executed_at DESC);

-- =====================================================
-- FUNCTION: Verificar palavras proibidas em texto
-- =====================================================
CREATE OR REPLACE FUNCTION check_banned_words(p_text TEXT)
RETURNS TABLE(word TEXT, severity TEXT, auto_action TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    bw.word,
    bw.severity,
    bw.auto_action
  FROM banned_words bw
  WHERE bw.is_active = true
  AND (
    LOWER(p_text) LIKE '%' || LOWER(bw.word) || '%'
    OR (bw.pattern IS NOT NULL AND p_text ~* bw.pattern)
  )
  ORDER BY
    CASE bw.severity
      WHEN 'critical' THEN 1
      WHEN 'high' THEN 2
      WHEN 'medium' THEN 3
      WHEN 'low' THEN 4
    END;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Aplicar regras de moderação automática
-- =====================================================
CREATE OR REPLACE FUNCTION apply_moderation_rules(
  p_target_type TEXT,
  p_target_id UUID,
  p_content TEXT DEFAULT NULL
) RETURNS TABLE(rule_applied TEXT, action_taken TEXT) AS $$
DECLARE
  v_rule RECORD;
  v_user_id UUID;
  v_report_count INTEGER;
  v_warning_count INTEGER;
  v_banned_words RECORD;
BEGIN
  -- Verificar palavras proibidas no conteúdo
  IF p_content IS NOT NULL THEN
    FOR v_banned_words IN
      SELECT * FROM check_banned_words(p_content) WHERE severity IN ('critical', 'high')
    LOOP
      -- Registrar log
      INSERT INTO auto_moderation_logs (
        rule_id,
        rule_name,
        target_type,
        target_id,
        action_taken,
        trigger_reason,
        trigger_data
      ) VALUES (
        NULL,
        'Palavra proibida detectada',
        p_target_type,
        p_target_id,
        v_banned_words.auto_action,
        'banned_word',
        jsonb_build_object('word', v_banned_words.word, 'severity', v_banned_words.severity)
      );

      RETURN QUERY SELECT 'Palavra proibida: ' || v_banned_words.word, v_banned_words.auto_action;
    END LOOP;
  END IF;

  -- Verificar regras baseadas em contagem de denúncias
  IF p_target_type = 'user' THEN
    v_user_id := p_target_id;

    -- Contar denúncias aprovadas
    SELECT COUNT(*)
    INTO v_report_count
    FROM reports
    WHERE reported_user_id = v_user_id AND status = 'approved';

    -- Contar advertências
    SELECT COUNT(*)
    INTO v_warning_count
    FROM user_punishments
    WHERE user_id = v_user_id AND punishment_type = 'warning' AND is_active = true;

    -- Aplicar regras
    FOR v_rule IN
      SELECT * FROM moderation_rules
      WHERE is_active = true
      AND trigger_type IN ('report_count')
      ORDER BY priority DESC
    LOOP
      IF v_rule.trigger_type = 'report_count' THEN
        IF (v_rule.trigger_value->>'punishment_type') IS NULL
           AND v_report_count >= (v_rule.trigger_value->>'threshold')::INTEGER THEN
          -- Executar ação
          -- (Aqui você pode chamar outras functions como ban_user, suspend_user, etc.)

          -- Registrar log
          INSERT INTO auto_moderation_logs (
            rule_id,
            rule_name,
            target_type,
            target_id,
            action_taken,
            trigger_reason,
            trigger_data
          ) VALUES (
            v_rule.id,
            v_rule.name,
            'user',
            v_user_id,
            v_rule.action_type,
            'report_threshold_exceeded',
            jsonb_build_object('report_count', v_report_count, 'threshold', v_rule.trigger_value->>'threshold')
          );

          RETURN QUERY SELECT v_rule.name, v_rule.action_type;
        END IF;
      END IF;
    END LOOP;
  END IF;

  RETURN;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER: Auto-moderação ao criar post
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_auto_moderate_post() RETURNS TRIGGER AS $$
BEGIN
  -- Verificar conteúdo
  PERFORM apply_moderation_rules('post', NEW.id, NEW.content);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_moderate_posts
  AFTER INSERT ON posts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_auto_moderate_post();

-- =====================================================
-- RLS: Permissões
-- =====================================================
ALTER TABLE banned_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_moderation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage banned words"
  ON banned_words FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin', 'moderator')
      AND is_active = true
    )
  );

CREATE POLICY "Admins can manage moderation rules"
  ON moderation_rules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
      AND is_active = true
    )
  );

CREATE POLICY "Admins can view auto moderation logs"
  ON auto_moderation_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin', 'moderator')
      AND is_active = true
    )
  );

-- =====================================================
-- GRANT: Permissões
-- =====================================================
GRANT ALL ON banned_words TO authenticated;
GRANT ALL ON moderation_rules TO authenticated;
GRANT SELECT ON auto_moderation_logs TO authenticated;

-- =====================================================
-- COMENTÁRIOS
-- =====================================================
COMMENT ON TABLE banned_words IS 'Lista de palavras proibidas e padrões de spam';
COMMENT ON TABLE moderation_rules IS 'Regras de moderação automática com triggers e ações';
COMMENT ON TABLE auto_moderation_logs IS 'Log de todas as ações automáticas de moderação executadas';
COMMENT ON FUNCTION check_banned_words IS 'Verifica se um texto contém palavras proibidas';
COMMENT ON FUNCTION apply_moderation_rules IS 'Aplica regras de moderação automática a um alvo';
