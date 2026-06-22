-- =====================================================
-- SISTEMA DE IDs ÚNICOS
-- =====================================================
-- Cada usuário recebe um ID único no formato ID-000001
-- Usado para: Ranking, Pesquisa, Moderação, Convites, VIP
-- =====================================================

-- Adicionar coluna user_id_number na tabela users
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS user_id_number INTEGER;

-- Criar sequence para auto-increment
CREATE SEQUENCE IF NOT EXISTS user_id_sequence START 1;

-- Atualizar usuários existentes com IDs sequenciais
UPDATE public.users
SET user_id_number = nextval('user_id_sequence')
WHERE user_id_number IS NULL;

-- Tornar a coluna NOT NULL e UNIQUE
ALTER TABLE public.users
ALTER COLUMN user_id_number SET NOT NULL,
ADD CONSTRAINT user_id_number_unique UNIQUE (user_id_number);

-- Criar índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_users_id_number ON public.users(user_id_number);

-- =====================================================
-- FUNÇÃO: Gerar ID formatado (ID-000001)
-- =====================================================
CREATE OR REPLACE FUNCTION get_formatted_user_id(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  id_number INTEGER;
BEGIN
  SELECT user_id_number INTO id_number
  FROM public.users
  WHERE id = user_id;

  IF id_number IS NULL THEN
    RETURN NULL;
  END IF;

  -- Formatar: ID-000001 (6 dígitos com zeros à esquerda)
  RETURN 'ID-' || LPAD(id_number::TEXT, 6, '0');
END;
$$;

-- =====================================================
-- FUNÇÃO: Buscar usuário por ID formatado
-- =====================================================
CREATE OR REPLACE FUNCTION find_user_by_formatted_id(formatted_id TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  id_number INTEGER;
  user_uuid UUID;
BEGIN
  -- Extrair número do formato ID-000001
  id_number := SUBSTRING(formatted_id FROM 'ID-(\d+)')::INTEGER;

  IF id_number IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT id INTO user_uuid
  FROM public.users
  WHERE user_id_number = id_number;

  RETURN user_uuid;
END;
$$;

-- =====================================================
-- TRIGGER: Auto-assign ID number para novos usuários
-- =====================================================
CREATE OR REPLACE FUNCTION assign_user_id_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.user_id_number IS NULL THEN
    NEW.user_id_number := nextval('user_id_sequence');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_assign_user_id_number ON public.users;
CREATE TRIGGER trigger_assign_user_id_number
  BEFORE INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION assign_user_id_number();

-- =====================================================
-- VIEW: Users com ID formatado
-- =====================================================
CREATE OR REPLACE VIEW public.users_with_formatted_id AS
SELECT
  u.*,
  'ID-' || LPAD(u.user_id_number::TEXT, 6, '0') as formatted_id
FROM public.users u;

-- Comentários
COMMENT ON COLUMN public.users.user_id_number IS 'Número sequencial único do usuário (para ID-XXXXXX)';
COMMENT ON FUNCTION get_formatted_user_id(UUID) IS 'Retorna ID formatado no padrão ID-000001';
COMMENT ON FUNCTION find_user_by_formatted_id(TEXT) IS 'Busca UUID do usuário pelo ID formatado';
COMMENT ON VIEW public.users_with_formatted_id IS 'View de usuários com ID formatado incluído';

-- =====================================================
-- RLS: Permitir leitura de IDs formatados
-- =====================================================
ALTER VIEW public.users_with_formatted_id SET (security_invoker = true);

-- Grants
GRANT SELECT ON public.users_with_formatted_id TO authenticated;
GRANT EXECUTE ON FUNCTION get_formatted_user_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION find_user_by_formatted_id(TEXT) TO authenticated;
