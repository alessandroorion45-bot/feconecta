-- Criar tabela de versículos favoritos
CREATE TABLE public.favorite_verses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  book_name TEXT NOT NULL,
  book_abbrev TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse_number INTEGER NOT NULL,
  verse_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.favorite_verses ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários podem ver seus favoritos"
ON public.favorite_verses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem adicionar favoritos"
ON public.favorite_verses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem remover favoritos"
ON public.favorite_verses FOR DELETE
USING (auth.uid() = user_id);

-- Índice para melhorar performance
CREATE INDEX idx_favorite_verses_user_id ON public.favorite_verses(user_id);
CREATE UNIQUE INDEX idx_favorite_verses_unique ON public.favorite_verses(user_id, book_abbrev, chapter, verse_number);