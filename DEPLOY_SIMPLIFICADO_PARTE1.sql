-- =====================================================
-- PARTE 1: CRIAR TABELAS BÁSICAS
-- =====================================================
-- Execute esta parte PRIMEIRO
-- Tempo estimado: ~10 segundos
-- =====================================================

-- Tabela: admin_logs
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL,
  admin_email TEXT NOT NULL,
  action_type TEXT NOT NULL,
  action_description TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  target_details JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON public.admin_logs(admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON public.admin_logs(created_at DESC);

-- Tabela: banned_words
CREATE TABLE IF NOT EXISTS public.banned_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT NOT NULL UNIQUE,
  severity TEXT NOT NULL DEFAULT 'medium',
  auto_action TEXT NOT NULL DEFAULT 'flag',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Inserir palavras padrão
INSERT INTO public.banned_words (word, severity, auto_action)
VALUES
  ('spam', 'medium', 'flag'),
  ('scam', 'high', 'hide'),
  ('phishing', 'critical', 'reject')
ON CONFLICT (word) DO NOTHING;

-- Tabela: admin_notifications
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sent_by UUID NOT NULL,
  sent_by_email TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  target_audience TEXT NOT NULL,
  total_sent INTEGER DEFAULT 0,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela: notification_templates
CREATE TABLE IF NOT EXISTS public.notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL DEFAULT 'info',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Inserir templates padrão
INSERT INTO public.notification_templates (name, title, message, notification_type)
VALUES
  ('welcome_vip', '👑 Bem-vindo ao VIP!', 'Você agora é VIP!', 'success'),
  ('new_theme', '🎨 Novo Tema!', 'Novo tema disponível!', 'announcement')
ON CONFLICT (name) DO NOTHING;

-- Verificar criação
SELECT
  'Tabelas criadas com sucesso!' as status,
  (SELECT COUNT(*) FROM banned_words) as palavras_proibidas,
  (SELECT COUNT(*) FROM notification_templates) as templates;
