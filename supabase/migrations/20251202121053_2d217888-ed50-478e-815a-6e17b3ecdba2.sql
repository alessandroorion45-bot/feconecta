-- Tabela para planos de leitura bíblica
CREATE TABLE bible_reading_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_name TEXT NOT NULL,
  current_day INTEGER NOT NULL DEFAULT 1,
  total_days INTEGER NOT NULL DEFAULT 365,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para registro de leitura diária
CREATE TABLE bible_reading_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_id UUID REFERENCES bible_reading_plans(id) ON DELETE CASCADE,
  book_abbrev TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para anotações em versículos
CREATE TABLE bible_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  book_name TEXT NOT NULL,
  book_abbrev TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse_number INTEGER NOT NULL,
  note_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS para planos de leitura
ALTER TABLE bible_reading_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seus planos"
ON bible_reading_plans FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar planos"
ON bible_reading_plans FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus planos"
ON bible_reading_plans FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus planos"
ON bible_reading_plans FOR DELETE
USING (auth.uid() = user_id);

-- RLS para progresso de leitura
ALTER TABLE bible_reading_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seu progresso"
ON bible_reading_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem registrar progresso"
ON bible_reading_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar progresso"
ON bible_reading_progress FOR DELETE
USING (auth.uid() = user_id);

-- RLS para anotações
ALTER TABLE bible_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas anotações"
ON bible_notes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar anotações"
ON bible_notes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas anotações"
ON bible_notes FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas anotações"
ON bible_notes FOR DELETE
USING (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX idx_bible_reading_plans_user_id ON bible_reading_plans(user_id);
CREATE INDEX idx_bible_reading_progress_user_id ON bible_reading_progress(user_id);
CREATE INDEX idx_bible_reading_progress_plan_id ON bible_reading_progress(plan_id);
CREATE INDEX idx_bible_notes_user_id ON bible_notes(user_id);
CREATE INDEX idx_bible_notes_reference ON bible_notes(book_abbrev, chapter, verse_number);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_bible_reading_plans_updated_at
BEFORE UPDATE ON bible_reading_plans
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bible_notes_updated_at
BEFORE UPDATE ON bible_notes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();