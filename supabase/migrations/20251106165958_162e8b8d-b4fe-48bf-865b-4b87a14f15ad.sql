-- Create table for storing translated Bible verses
CREATE TABLE IF NOT EXISTS public.versiculos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  livro TEXT NOT NULL,
  capitulo INTEGER NOT NULL,
  versiculo INTEGER NOT NULL,
  texto_original TEXT NOT NULL,
  texto_final TEXT NOT NULL,
  idioma TEXT NOT NULL DEFAULT 'pt-br',
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Unique constraint to prevent duplicate verses
  UNIQUE(livro, capitulo, versiculo)
);

-- Enable Row Level Security
ALTER TABLE public.versiculos ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (verses are public content)
CREATE POLICY "Versículos são visíveis para todos" 
ON public.versiculos 
FOR SELECT 
USING (true);

-- Only authenticated users can insert verses (for caching purposes)
CREATE POLICY "Sistema pode criar cache de versículos" 
ON public.versiculos 
FOR INSERT 
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_versiculos_lookup ON public.versiculos(livro, capitulo, versiculo);
CREATE INDEX idx_versiculos_livro_capitulo ON public.versiculos(livro, capitulo);