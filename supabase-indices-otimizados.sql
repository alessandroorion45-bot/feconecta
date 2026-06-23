-- =====================================================
-- CORREÇÕES DE PERFORMANCE - ÍNDICES E OTIMIZAÇÕES
-- =====================================================
-- Resolve: Timeout de 10s nas queries
-- Ganho esperado: -70% tempo de query

-- =====================================================
-- 1. ÍNDICES FALTANTES (CRÍTICO!)
-- =====================================================

-- user_activities (query de perfil que está dando timeout!)
CREATE INDEX IF NOT EXISTS idx_user_activities_user_created 
ON public.user_activities(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_activities_type 
ON public.user_activities(activity_type);

CREATE INDEX IF NOT EXISTS idx_user_activities_user_type 
ON public.user_activities(user_id, activity_type);

-- admin_logs
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_created 
ON public.admin_logs(admin_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_logs_action 
ON public.admin_logs(action_type);

-- users (busca por email)
CREATE INDEX IF NOT EXISTS idx_users_email 
ON public.users(email);

CREATE INDEX IF NOT EXISTS idx_users_created 
ON public.users(created_at DESC);

-- user_roles (usado em is_admin e has_permission)
CREATE INDEX IF NOT EXISTS idx_user_roles_active 
ON public.user_roles(user_id, is_active) WHERE is_active = true;

-- =====================================================
-- 2. OTIMIZAR FUNÇÃO has_permission (RLS LENTA!)
-- =====================================================

-- Marcar como STABLE em vez de VOLATILE
-- Isso permite que o PostgreSQL cache o resultado
CREATE OR REPLACE FUNCTION has_permission(p_user_id UUID, p_permission TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE  -- MUDANÇA CRÍTICA: era VOLATILE, agora é STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role = ur.role
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = p_user_id
      AND ur.is_active = true
      AND p.permission_name = p_permission
  );
$$;

-- =====================================================
-- 3. OTIMIZAR FUNÇÃO is_admin (RLS LENTA!)
-- =====================================================

CREATE OR REPLACE FUNCTION is_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE  -- MUDANÇA CRÍTICA: permite cache
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = p_user_id
      AND role IN ('super_admin', 'admin', 'moderator')
      AND is_active = true
  );
$$;

-- =====================================================
-- 4. ANÁLISE DE TABELAS (ATUALIZAR ESTATÍSTICAS)
-- =====================================================

-- Atualizar estatísticas para o query planner
ANALYZE public.users;
ANALYZE public.user_activities;
ANALYZE public.user_roles;
ANALYZE public.admin_logs;
ANALYZE public.vip_subscriptions;
ANALYZE public.user_themes;

-- =====================================================
-- 5. VACUUM (LIMPAR TABELAS)
-- =====================================================

-- Limpar e otimizar tabelas
VACUUM ANALYZE public.user_activities;
VACUUM ANALYZE public.admin_logs;

-- =====================================================
-- SUCCESS! Índices e otimizações criados!
-- =====================================================
