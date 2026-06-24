-- =====================================================
-- CORREÇÃO: Adicionar coluna tier na tabela themes
-- =====================================================

-- Adicionar coluna tier se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'themes'
        AND column_name = 'tier'
    ) THEN
        ALTER TABLE public.themes
        ADD COLUMN tier text CHECK (tier IN ('standard', 'gold', 'platinum'));
    END IF;
END $$;

-- Adicionar coluna effects se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'themes'
        AND column_name = 'effects'
    ) THEN
        ALTER TABLE public.themes
        ADD COLUMN effects jsonb DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Adicionar coluna rarity se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'themes'
        AND column_name = 'rarity'
    ) THEN
        ALTER TABLE public.themes
        ADD COLUMN rarity integer DEFAULT 1 CHECK (rarity BETWEEN 1 AND 5);
    END IF;
END $$;

-- Adicionar coluna is_active se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'themes'
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE public.themes
        ADD COLUMN is_active boolean DEFAULT true;
    END IF;
END $$;
