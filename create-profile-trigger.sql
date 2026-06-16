-- ============================================
-- TRIGGER: CRIAR PERFIL AUTOMATICAMENTE
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- para criar perfis automaticamente quando um usuário faz login com Google

-- ============================================
-- 1. CRIAR FUNÇÃO PARA LIDAR COM NOVOS USUÁRIOS
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  generated_username TEXT;
  username_exists BOOLEAN;
  counter INTEGER := 0;
BEGIN
  -- Gerar username baseado no email ou nome do Google
  generated_username := COALESCE(
    NEW.raw_user_meta_data->>'user_name',
    NEW.raw_user_meta_data->>'preferred_username',
    LOWER(REPLACE(SPLIT_PART(NEW.email, '@', 1), '.', ''))
  );

  -- Verificar se username já existe e gerar um único
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE username = generated_username || CASE WHEN counter > 0 THEN counter::TEXT ELSE '' END
    ) INTO username_exists;

    IF NOT username_exists THEN
      generated_username := generated_username || CASE WHEN counter > 0 THEN counter::TEXT ELSE '' END;
      EXIT;
    END IF;

    counter := counter + 1;
  END LOOP;

  -- Inserir perfil
  INSERT INTO public.profiles (
    id,
    username,
    full_name,
    avatar_url,
    preferred_language,
    country,
    birth_date
  )
  VALUES (
    NEW.id,
    generated_username,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      SPLIT_PART(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'pt-BR'),
    NEW.raw_user_meta_data->>'country',
    (NEW.raw_user_meta_data->>'birth_date')::DATE
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. CRIAR TRIGGER
-- ============================================

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Criar novo trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 3. VERIFICAR SE O TRIGGER FOI CRIADO
-- ============================================

SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name = 'on_auth_user_created';

-- ============================================
-- 4. TESTAR O TRIGGER (OPCIONAL)
-- ============================================

-- Para testar, você pode criar um usuário de teste via SQL:
-- ATENÇÃO: Execute apenas se quiser testar manualmente

/*
-- Criar usuário de teste
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'teste@example.com',
  crypt('senha123', gen_salt('bf')),
  NOW(),
  '{"full_name": "Usuário Teste", "avatar_url": "https://via.placeholder.com/150"}'::jsonb,
  NOW(),
  NOW()
);

-- Verificar se o perfil foi criado automaticamente
SELECT * FROM profiles ORDER BY created_at DESC LIMIT 1;
*/

-- ============================================
-- 5. POLÍTICA RLS PARA PERFIS
-- ============================================

-- Garantir que usuários podem criar seus próprios perfis
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Garantir que qualquer um pode ver perfis públicos
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- Usuários podem atualizar apenas seu próprio perfil
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- TRIGGER CRIADO COM SUCESSO!
-- ============================================
-- Agora quando um usuário fizer login com Google:
-- 1. O Supabase Auth cria o registro em auth.users
-- 2. O trigger detecta a inserção
-- 3. Automaticamente cria o perfil em public.profiles
-- 4. Username é gerado baseado no email/nome do Google
-- 5. Avatar e nome são importados do Google
