-- ============================================================
-- PAINEL ADMIN — FASE 8 (URGENTE): corrige colunas faltando em
-- banned_words/moderation_rules que podem estar QUEBRANDO A CRIAÇÃO
-- DE POSTS EM TODO O APP.
-- ============================================================
-- Achado: check_banned_words() e apply_moderation_rules() (criadas
-- na Fase 1) referenciam bw.pattern, bw.auto_action, v_rule.priority,
-- v_rule.trigger_value — mas a tabela banned_words real só tem
-- (id, word, severity, is_active, created_at) e moderation_rules só
-- tem (id, name, trigger_type, action_type, is_active, created_at).
--
-- check_banned_words() roda em TODO INSERT em posts (via trigger
-- auto_moderate_posts) e faz "SELECT bw.auto_action ... WHERE ...
-- bw.pattern ..." — se essas colunas não existem, é erro de SQL
-- ("column does not exist"), que aborta a transação inteira do
-- INSERT. Ou seja, criar um post pode estar falhando pra qualquer
-- usuário do app, não só no admin.
--
-- Fix: adicionar as colunas que faltam (idempotente, ADD COLUMN IF
-- NOT EXISTS) em vez de reescrever as funções — preserva o design
-- já pensado (regras configuráveis com threshold em JSON).
-- Idempotente: seguro rodar mais de uma vez.
-- ============================================================

ALTER TABLE public.banned_words
  ADD COLUMN IF NOT EXISTS pattern TEXT,
  ADD COLUMN IF NOT EXISTS auto_action TEXT NOT NULL DEFAULT 'flag',
  ADD COLUMN IF NOT EXISTS created_by UUID,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.moderation_rules
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS trigger_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS action_params JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS priority INTEGER NOT NULL DEFAULT 0;

-- Garante as 3 regras padrão com trigger_value preenchido (a coluna
-- é nova, então qualquer linha já existente está com '{}' — sem o
-- threshold, a regra nunca dispara. Corrige por nome.)
UPDATE public.moderation_rules
SET trigger_value = '{"threshold": 3, "status": "approved"}'::jsonb,
    action_params = '{"reason": "Banimento automático: 3 denúncias aprovadas"}'::jsonb,
    priority = 100,
    description = COALESCE(description, 'Usuário é automaticamente banido após receber 3 denúncias aprovadas')
WHERE name = 'Auto-ban após 3 denúncias';

UPDATE public.moderation_rules
SET trigger_value = '{"threshold": 5, "punishment_type": "warning"}'::jsonb,
    action_params = '{"duration_days": 7, "reason": "Suspensão automática: 5 advertências"}'::jsonb,
    priority = 90,
    description = COALESCE(description, 'Usuário é suspenso por 7 dias após 5 advertências')
WHERE name = 'Auto-suspender após 5 advertências';

UPDATE public.moderation_rules
SET trigger_value = '{"severity": "critical"}'::jsonb,
    priority = 80,
    description = COALESCE(description, 'Oculta automaticamente conteúdo com palavras de severidade crítica')
WHERE name = 'Ocultar conteúdo com palavra proibida crítica';

-- Se as 3 regras padrão não existem ainda, cria agora
INSERT INTO public.moderation_rules (name, description, trigger_type, trigger_value, action_type, action_params, priority)
SELECT 'Auto-ban após 3 denúncias', 'Usuário é automaticamente banido após receber 3 denúncias aprovadas', 'report_count',
  '{"threshold": 3, "status": "approved"}'::jsonb, 'ban_user',
  '{"reason": "Banimento automático: 3 denúncias aprovadas"}'::jsonb, 100
WHERE NOT EXISTS (SELECT 1 FROM public.moderation_rules WHERE name = 'Auto-ban após 3 denúncias');

INSERT INTO public.moderation_rules (name, description, trigger_type, trigger_value, action_type, action_params, priority)
SELECT 'Auto-suspender após 5 advertências', 'Usuário é suspenso por 7 dias após 5 advertências', 'report_count',
  '{"threshold": 5, "punishment_type": "warning"}'::jsonb, 'suspend_user',
  '{"duration_days": 7, "reason": "Suspensão automática: 5 advertências"}'::jsonb, 90
WHERE NOT EXISTS (SELECT 1 FROM public.moderation_rules WHERE name = 'Auto-suspender após 5 advertências');

INSERT INTO public.moderation_rules (name, description, trigger_type, trigger_value, action_type, priority)
SELECT 'Ocultar conteúdo com palavra proibida crítica', 'Oculta automaticamente conteúdo com palavras de severidade crítica', 'banned_word',
  '{"severity": "critical"}'::jsonb, 'hide', 80
WHERE NOT EXISTS (SELECT 1 FROM public.moderation_rules WHERE name = 'Ocultar conteúdo com palavra proibida crítica');

-- ============================================================
-- Teste seguro (roda em transação e desfaz — não grava nada):
-- confirma que check_banned_words já não quebra mais.
-- ============================================================
BEGIN;
SELECT * FROM public.check_banned_words('teste de spam e phishing');
ROLLBACK;

SELECT 'ok' as status;
