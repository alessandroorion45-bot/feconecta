-- ============================================
-- SISTEMA COMPLETO DE MURAL DE GRATIDÃO
-- Conectar ao Supabase com todas as funcionalidades
-- ============================================

-- Criar tabela de posts de gratidão
CREATE TABLE IF NOT EXISTS public.gratitude_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('gratidao', 'testemunho')),
  amens_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de "amens" (likes)
CREATE TABLE IF NOT EXISTS public.gratitude_amens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.gratitude_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Criar tabela de comentários
CREATE TABLE IF NOT EXISTS public.gratitude_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.gratitude_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_gratitude_posts_user ON public.gratitude_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_gratitude_posts_created ON public.gratitude_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gratitude_posts_type ON public.gratitude_posts(type);
CREATE INDEX IF NOT EXISTS idx_gratitude_amens_post ON public.gratitude_amens(post_id);
CREATE INDEX IF NOT EXISTS idx_gratitude_comments_post ON public.gratitude_comments(post_id);

-- Habilitar RLS
ALTER TABLE public.gratitude_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gratitude_amens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gratitude_comments ENABLE ROW LEVEL SECURITY;

-- Políticas para posts
CREATE POLICY "Posts de gratidão são públicos"
  ON public.gratitude_posts
  FOR SELECT
  USING (true);

CREATE POLICY "Usuários podem criar posts"
  ON public.gratitude_posts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem editar seus posts"
  ON public.gratitude_posts
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus posts"
  ON public.gratitude_posts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para amens
CREATE POLICY "Amens são públicos"
  ON public.gratitude_amens
  FOR SELECT
  USING (true);

CREATE POLICY "Usuários podem dar amem"
  ON public.gratitude_amens
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem remover seu amem"
  ON public.gratitude_amens
  FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para comentários
CREATE POLICY "Comentários são públicos"
  ON public.gratitude_comments
  FOR SELECT
  USING (true);

CREATE POLICY "Usuários podem comentar"
  ON public.gratitude_comments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus comentários"
  ON public.gratitude_comments
  FOR DELETE
  USING (auth.uid() = user_id);

-- Função para atualizar contador de amens
CREATE OR REPLACE FUNCTION update_amens_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.gratitude_posts
    SET amens_count = amens_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.gratitude_posts
    SET amens_count = amens_count - 1
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Trigger para atualizar contador
CREATE TRIGGER trigger_update_amens_count
AFTER INSERT OR DELETE ON public.gratitude_amens
FOR EACH ROW
EXECUTE FUNCTION update_amens_count();

-- View para posts com informações do usuário
CREATE OR REPLACE VIEW public.gratitude_posts_with_user AS
SELECT
  p.id,
  p.user_id,
  p.message,
  p.type,
  p.amens_count,
  p.created_at,
  u.email,
  COALESCE(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1)) as author_name
FROM public.gratitude_posts p
LEFT JOIN auth.users u ON p.user_id = u.id
ORDER BY p.created_at DESC;

-- Inserir alguns posts de exemplo
INSERT INTO public.gratitude_posts (user_id, message, type, amens_count, created_at) VALUES
((SELECT id FROM auth.users LIMIT 1), 'Deus curou meu filho que estava internado. Glória a Deus! 🙏', 'testemunho', 24, NOW() - INTERVAL '2 days'),
((SELECT id FROM auth.users LIMIT 1), 'Agradeço a Deus pela aprovação no concurso. Ele é fiel!', 'gratidao', 18, NOW() - INTERVAL '1 day'),
((SELECT id FROM auth.users LIMIT 1), 'Depois de 5 anos de oração, meu marido aceitou Jesus! Aleluia! 🎉', 'testemunho', 45, NOW() - INTERVAL '3 days'),
((SELECT id FROM auth.users LIMIT 1), 'Gratidão por mais um dia de vida e saúde. Cada dia é uma bênção!', 'gratidao', 12, NOW() - INTERVAL '4 days'),
((SELECT id FROM auth.users LIMIT 1), 'Deus restaurou meu casamento. O que era impossível para os homens, Deus fez! ❤️', 'testemunho', 38, NOW() - INTERVAL '5 days');

COMMENT ON TABLE public.gratitude_posts IS 'Sistema completo de Mural de Gratidão conectado ao Supabase';
