-- =====================================================
-- CONFIGURAR USUÁRIO COMO SUPER_ADMIN
-- =====================================================
-- Email: alessandroibama40@gmail.com
-- Este script garante que você seja super_admin
-- =====================================================

-- 1. Buscar o UUID do usuário pelo email
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Buscar user_id do auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'alessandroibama40@gmail.com';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado com email: alessandroibama40@gmail.com';
  END IF;

  -- Exibir o UUID (para debug)
  RAISE NOTICE 'User UUID: %', v_user_id;

  -- 2. Remover role 'user' antiga (se existir)
  DELETE FROM public.user_roles
  WHERE user_id = v_user_id
    AND role = 'user';

  -- 3. Inserir/atualizar como SUPER_ADMIN
  INSERT INTO public.user_roles (user_id, role, is_active)
  VALUES (v_user_id, 'super_admin', true)
  ON CONFLICT (user_id, role)
  DO UPDATE SET
    is_active = true,
    expires_at = NULL,
    updated_at = NOW();

  -- 4. Verificar se foi criado
  IF EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = v_user_id AND role = 'super_admin' AND is_active = true
  ) THEN
    RAISE NOTICE '✅ SUPER_ADMIN configurado com sucesso!';
  ELSE
    RAISE EXCEPTION '❌ Erro ao configurar SUPER_ADMIN!';
  END IF;

  -- 5. Exibir roles atuais do usuário
  RAISE NOTICE 'Roles atuais:';
  FOR r IN
    SELECT role, is_active, expires_at
    FROM public.user_roles
    WHERE user_id = v_user_id
  LOOP
    RAISE NOTICE '  - Role: %, Ativo: %, Expira: %', r.role, r.is_active, r.expires_at;
  END LOOP;

END $$;

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================
SELECT
  u.email,
  ur.role,
  ur.is_active,
  ur.expires_at,
  ur.created_at
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
WHERE u.email = 'alessandroibama40@gmail.com'
ORDER BY
  CASE ur.role
    WHEN 'super_admin' THEN 1
    WHEN 'admin' THEN 2
    WHEN 'moderator' THEN 3
    WHEN 'vip' THEN 4
    WHEN 'user' THEN 5
  END;
