-- =====================================================
-- SISTEMA DE NOTIFICAÇÕES ADMINISTRATIVAS
-- =====================================================
-- Envio em massa, templates, histórico
-- =====================================================

-- =====================================================
-- TABELA: Notificações enviadas pelo admin
-- =====================================================
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Admin que enviou
  sent_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  sent_by_email TEXT NOT NULL,

  -- Conteúdo
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL, -- 'info', 'success', 'warning', 'announcement'

  -- Targeting
  target_audience TEXT NOT NULL, -- 'all', 'vip', 'new_users', 'active_users', 'specific'
  target_user_ids UUID[], -- Quando target_audience = 'specific'

  -- Estatísticas
  total_sent INTEGER DEFAULT 0,
  total_delivered INTEGER DEFAULT 0,
  total_read INTEGER DEFAULT 0,

  -- Metadata
  scheduled_for TIMESTAMPTZ, -- NULL = enviar imediatamente
  sent_at TIMESTAMPTZ,
  metadata JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_admin_notifications_sent_by ON public.admin_notifications(sent_by, created_at DESC);
CREATE INDEX idx_admin_notifications_audience ON public.admin_notifications(target_audience);
CREATE INDEX idx_admin_notifications_sent_at ON public.admin_notifications(sent_at DESC);

-- =====================================================
-- TABELA: Templates de notificações
-- =====================================================
CREATE TABLE IF NOT EXISTS public.notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Template
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL DEFAULT 'info',

  -- Variáveis disponíveis (placeholders)
  variables TEXT[], -- Ex: ['user_name', 'xp_total', 'theme_name']

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_notification_templates_active ON public.notification_templates(is_active) WHERE is_active = true;

-- Inserir templates padrão
INSERT INTO public.notification_templates (name, description, title, message, notification_type, variables) VALUES
  (
    'welcome_vip',
    'Boas-vindas para novos VIPs',
    '👑 Bem-vindo ao VIP!',
    'Olá {{user_name}}! Você agora é VIP e tem acesso a todos os temas premium, 2x XP e muito mais!',
    'success',
    ARRAY['user_name']
  ),
  (
    'new_theme_available',
    'Novo tema premium lançado',
    '🎨 Novo Tema Disponível!',
    'Um novo tema chamado "{{theme_name}}" está disponível na Galeria! Confira agora.',
    'announcement',
    ARRAY['theme_name']
  ),
  (
    'maintenance_warning',
    'Aviso de manutenção',
    '⚠️ Manutenção Programada',
    'A plataforma passará por manutenção em {{date}}. O acesso pode ficar temporariamente indisponível.',
    'warning',
    ARRAY['date']
  ),
  (
    'achievement_unlocked',
    'Nova conquista desbloqueada',
    '🏆 Conquista Desbloqueada!',
    'Parabéns {{user_name}}! Você desbloqueou a conquista "{{achievement_name}}" e ganhou {{xp}} XP!',
    'success',
    ARRAY['user_name', 'achievement_name', 'xp']
  ),
  (
    'content_warning',
    'Advertência de conteúdo',
    '⚠️ Advertência',
    'Olá {{user_name}}, seu conteúdo "{{content}}" violou nossas diretrizes. Por favor, revise nossos termos de uso.',
    'warning',
    ARRAY['user_name', 'content']
  );

-- =====================================================
-- FUNCTION: Enviar notificação em massa
-- =====================================================
CREATE OR REPLACE FUNCTION send_mass_notification(
  p_admin_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_notification_type TEXT,
  p_target_audience TEXT,
  p_target_user_ids UUID[] DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
  v_admin_email TEXT;
  v_user_ids UUID[];
  v_user_id UUID;
  v_total_sent INTEGER := 0;
BEGIN
  -- Buscar email do admin
  SELECT email INTO v_admin_email FROM auth.users WHERE id = p_admin_id;

  -- Criar registro da notificação
  INSERT INTO admin_notifications (
    sent_by,
    sent_by_email,
    title,
    message,
    notification_type,
    target_audience,
    target_user_ids,
    sent_at
  ) VALUES (
    p_admin_id,
    v_admin_email,
    p_title,
    p_message,
    p_notification_type,
    p_target_audience,
    p_target_user_ids,
    NOW()
  ) RETURNING id INTO v_notification_id;

  -- Determinar lista de usuários baseado no targeting
  IF p_target_audience = 'all' THEN
    SELECT ARRAY_AGG(id) INTO v_user_ids FROM auth.users;
  ELSIF p_target_audience = 'vip' THEN
    SELECT ARRAY_AGG(user_id) INTO v_user_ids FROM vip_subscriptions WHERE is_active = true;
  ELSIF p_target_audience = 'new_users' THEN
    SELECT ARRAY_AGG(id) INTO v_user_ids FROM auth.users WHERE created_at >= NOW() - INTERVAL '7 days';
  ELSIF p_target_audience = 'active_users' THEN
    SELECT ARRAY_AGG(user_id) INTO v_user_ids FROM users WHERE last_seen_at >= NOW() - INTERVAL '7 days';
  ELSIF p_target_audience = 'specific' THEN
    v_user_ids := p_target_user_ids;
  END IF;

  -- Enviar notificação para cada usuário
  IF v_user_ids IS NOT NULL THEN
    FOREACH v_user_id IN ARRAY v_user_ids
    LOOP
      -- Inserir na tabela de notificações do usuário (se existir)
      -- Assumindo que existe uma tabela 'notifications' para notificações de usuários
      BEGIN
        INSERT INTO notifications (
          user_id,
          title,
          message,
          type,
          metadata
        ) VALUES (
          v_user_id,
          p_title,
          p_message,
          p_notification_type,
          jsonb_build_object('admin_notification_id', v_notification_id)
        );
        v_total_sent := v_total_sent + 1;
      EXCEPTION WHEN OTHERS THEN
        -- Continuar mesmo se falhar para um usuário
        NULL;
      END;
    END LOOP;
  END IF;

  -- Atualizar total enviado
  UPDATE admin_notifications SET total_sent = v_total_sent WHERE id = v_notification_id;

  -- Registrar log
  PERFORM log_admin_action(
    p_admin_id,
    'send_notification',
    'Enviou notificação em massa: ' || p_title,
    'notification',
    v_notification_id,
    jsonb_build_object(
      'target_audience', p_target_audience,
      'total_sent', v_total_sent
    )
  );

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- VIEW: Histórico de notificações enviadas
-- =====================================================
CREATE OR REPLACE VIEW admin_notifications_history AS
SELECT
  n.id,
  n.sent_by,
  n.sent_by_email,
  n.title,
  n.message,
  n.notification_type,
  n.target_audience,
  n.total_sent,
  n.total_delivered,
  n.total_read,
  n.sent_at,
  n.created_at,
  -- Taxa de leitura
  CASE
    WHEN n.total_sent > 0 THEN ROUND((n.total_read::NUMERIC / n.total_sent) * 100, 2)
    ELSE 0
  END as read_rate_percent
FROM admin_notifications n
ORDER BY n.created_at DESC;

-- =====================================================
-- RLS: Permissões
-- =====================================================
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view notifications"
  ON admin_notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin', 'moderator')
      AND is_active = true
    )
  );

CREATE POLICY "Admins can create notifications"
  ON admin_notifications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
      AND is_active = true
    )
  );

CREATE POLICY "Admins can view templates"
  ON notification_templates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin', 'moderator')
      AND is_active = true
    )
  );

CREATE POLICY "Admins can manage templates"
  ON notification_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
      AND is_active = true
    )
  );

-- =====================================================
-- GRANT: Permissões
-- =====================================================
GRANT SELECT ON admin_notifications_history TO authenticated;

-- =====================================================
-- COMENTÁRIOS
-- =====================================================
COMMENT ON TABLE admin_notifications IS 'Histórico de notificações em massa enviadas por administradores';
COMMENT ON TABLE notification_templates IS 'Templates reutilizáveis para notificações';
COMMENT ON FUNCTION send_mass_notification IS 'Envia notificação em massa para grupo de usuários';
COMMENT ON VIEW admin_notifications_history IS 'Histórico de notificações com estatísticas de leitura';
