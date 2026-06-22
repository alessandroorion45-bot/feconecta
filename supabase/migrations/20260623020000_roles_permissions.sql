-- =====================================================
-- SISTEMA DE ROLES E PERMISSÕES
-- =====================================================
-- Roles: super_admin, admin, moderator, vip, user
-- Controle granular de permissões por funcionalidade
-- =====================================================

-- =====================================================
-- ENUM: Tipos de roles
-- =====================================================
CREATE TYPE user_role AS ENUM (
  'super_admin',  -- Fundador - acesso total
  'admin',        -- Administrador - gestão completa
  'moderator',    -- Moderador - apenas moderação
  'vip',          -- VIP - benefícios premium
  'user'          -- Usuário comum
);

-- =====================================================
-- TABELA: Roles dos usuários
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'user',
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- NULL = permanente
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_user_role UNIQUE(user_id, role)
);

-- Índices
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);
CREATE INDEX idx_user_roles_active ON public.user_roles(is_active) WHERE is_active = true;

-- =====================================================
-- TABELA: Permissões granulares
-- =====================================================
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL, -- 'admin', 'moderation', 'content', 'users'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Inserir permissões padrão
INSERT INTO public.permissions (name, description, category) VALUES
  -- Admin
  ('admin.dashboard.view', 'Ver dashboard administrativo', 'admin'),
  ('admin.settings.edit', 'Editar configurações da plataforma', 'admin'),
  ('admin.analytics.view', 'Ver analytics completo', 'admin'),

  -- Usuários
  ('users.view', 'Ver lista de usuários', 'users'),
  ('users.edit', 'Editar dados de usuários', 'users'),
  ('users.ban', 'Banir/suspender usuários', 'users'),
  ('users.delete', 'Deletar usuários permanentemente', 'users'),
  ('users.grant_vip', 'Conceder VIP para usuários', 'users'),

  -- Moderação
  ('moderation.view', 'Ver fila de moderação', 'moderation'),
  ('moderation.approve', 'Aprovar conteúdo', 'moderation'),
  ('moderation.reject', 'Rejeitar/remover conteúdo', 'moderation'),
  ('moderation.warn', 'Advertir usuários', 'moderation'),

  -- Denúncias
  ('reports.view', 'Ver denúncias', 'moderation'),
  ('reports.resolve', 'Resolver denúncias', 'moderation'),

  -- Conteúdo
  ('content.edit', 'Editar qualquer conteúdo', 'content'),
  ('content.delete', 'Deletar qualquer conteúdo', 'content'),
  ('content.feature', 'Destacar conteúdo na home', 'content'),

  -- Temas
  ('themes.grant', 'Conceder temas premium', 'content'),
  ('themes.create', 'Criar novos temas', 'content')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- TABELA: Permissões por Role
-- =====================================================
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role NOT NULL,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_role_permission UNIQUE(role, permission_id)
);

-- Índices
CREATE INDEX idx_role_permissions_role ON public.role_permissions(role);
CREATE INDEX idx_role_permissions_permission ON public.role_permissions(permission_id);

-- =====================================================
-- CONFIGURAR PERMISSÕES POR ROLE
-- =====================================================

-- SUPER_ADMIN: Todas as permissões
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'super_admin', id FROM public.permissions
ON CONFLICT DO NOTHING;

-- ADMIN: Quase todas (exceto delete permanente)
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'admin', id FROM public.permissions
WHERE name != 'users.delete'
ON CONFLICT DO NOTHING;

-- MODERATOR: Apenas moderação e denúncias
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'moderator', id FROM public.permissions
WHERE category IN ('moderation')
ON CONFLICT DO NOTHING;

-- =====================================================
-- FUNÇÕES: Verificar permissões
-- =====================================================

-- Verificar se usuário tem role específica
CREATE OR REPLACE FUNCTION has_role(user_id UUID, required_role user_role)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_roles.user_id = $1
      AND user_roles.role = $2
      AND user_roles.is_active = true
      AND (user_roles.expires_at IS NULL OR user_roles.expires_at > NOW())
  );
$$;

-- Verificar se usuário tem permissão específica
CREATE OR REPLACE FUNCTION has_permission(user_id UUID, permission_name TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role = ur.role
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = $1
      AND p.name = $2
      AND ur.is_active = true
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
  );
$$;

-- Verificar se usuário é admin (qualquer tipo)
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_roles.user_id = $1
      AND user_roles.role IN ('super_admin', 'admin', 'moderator')
      AND user_roles.is_active = true
      AND (user_roles.expires_at IS NULL OR user_roles.expires_at > NOW())
  );
$$;

-- Obter role mais alto do usuário
CREATE OR REPLACE FUNCTION get_highest_role(user_id UUID)
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_roles.user_id = $1
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
  ORDER BY
    CASE role
      WHEN 'super_admin' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'moderator' THEN 3
      WHEN 'vip' THEN 4
      WHEN 'user' THEN 5
    END
  LIMIT 1;
$$;

-- Listar permissões do usuário
CREATE OR REPLACE FUNCTION get_user_permissions(input_user_id UUID)
RETURNS TABLE(permission_name TEXT, permission_description TEXT)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT DISTINCT p.name, p.description
  FROM public.user_roles ur
  JOIN public.role_permissions rp ON rp.role = ur.role
  JOIN public.permissions p ON p.id = rp.permission_id
  WHERE ur.user_id = input_user_id
    AND ur.is_active = true
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
  ORDER BY p.name;
$$;

-- =====================================================
-- TRIGGER: Atualizar updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_user_roles_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_user_roles_updated_at ON public.user_roles;
CREATE TRIGGER trigger_update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_roles_updated_at();

-- =====================================================
-- TRIGGER: Auto-assign role 'user' para novos usuários
-- =====================================================
CREATE OR REPLACE FUNCTION assign_default_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_assign_default_user_role ON public.users;
CREATE TRIGGER trigger_assign_default_user_role
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION assign_default_user_role();

-- =====================================================
-- RLS: Row Level Security
-- =====================================================

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Users podem ver suas próprias roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins podem ver todas as roles
CREATE POLICY "Admins can view all roles"
  ON public.user_roles
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Apenas super_admin pode modificar roles
CREATE POLICY "Only super_admin can modify roles"
  ON public.user_roles
  FOR ALL
  USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- Todos podem ver permissões (transparência)
CREATE POLICY "Everyone can view permissions"
  ON public.permissions
  FOR SELECT
  USING (true);

-- Todos podem ver role_permissions (transparência)
CREATE POLICY "Everyone can view role_permissions"
  ON public.role_permissions
  FOR SELECT
  USING (true);

-- =====================================================
-- GRANTS
-- =====================================================
GRANT SELECT ON public.user_roles TO authenticated;
GRANT SELECT ON public.permissions TO authenticated;
GRANT SELECT ON public.role_permissions TO authenticated;

GRANT EXECUTE ON FUNCTION has_role(UUID, user_role) TO authenticated;
GRANT EXECUTE ON FUNCTION has_permission(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_highest_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_permissions(UUID) TO authenticated;

-- =====================================================
-- COMENTÁRIOS
-- =====================================================
COMMENT ON TABLE public.user_roles IS 'Roles atribuídas aos usuários (super_admin, admin, moderator, vip, user)';
COMMENT ON TABLE public.permissions IS 'Permissões granulares do sistema';
COMMENT ON TABLE public.role_permissions IS 'Mapeamento de permissões por role';
COMMENT ON FUNCTION has_role(UUID, user_role) IS 'Verifica se usuário possui role específica';
COMMENT ON FUNCTION has_permission(UUID, TEXT) IS 'Verifica se usuário possui permissão específica';
COMMENT ON FUNCTION is_admin(UUID) IS 'Verifica se usuário é admin (qualquer nível)';
COMMENT ON FUNCTION get_highest_role(UUID) IS 'Retorna a role mais alta do usuário';
COMMENT ON FUNCTION get_user_permissions(UUID) IS 'Lista todas as permissões do usuário';
