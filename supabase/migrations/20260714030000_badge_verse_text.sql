-- Faltava o texto literal do versículo (separado da referência e da
-- "história" narrativa do selo) — campo pedido explicitamente no painel admin.
ALTER TABLE public.badges ADD COLUMN IF NOT EXISTS verse_text TEXT;

NOTIFY pgrst, 'reload schema';

SELECT 'ok' as status;
