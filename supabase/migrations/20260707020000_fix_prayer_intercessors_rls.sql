-- "Erro ao enviar / Não foi possível processar sua ação" + 403 ao clicar em "Orar".
-- Mesma causa raiz recorrente: a política de INSERT de prayer_intercessors
-- existe só no arquivo de migração local, nunca foi aplicada no remoto.

ALTER TABLE public.prayer_intercessors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Intercessores são visíveis para todos" ON public.prayer_intercessors;
DROP POLICY IF EXISTS "Prayer intercessors viewable by authenticated users" ON public.prayer_intercessors;
CREATE POLICY "Prayer intercessors viewable by authenticated users"
ON public.prayer_intercessors FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Usuários podem se tornar intercessores" ON public.prayer_intercessors;
CREATE POLICY "Usuários podem se tornar intercessores"
ON public.prayer_intercessors FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem deixar de interceder" ON public.prayer_intercessors;
CREATE POLICY "Usuários podem deixar de interceder"
ON public.prayer_intercessors FOR DELETE
USING (auth.uid() = user_id);

-- Garante as triggers de notificação/estatísticas (idempotente, SECURITY DEFINER,
-- não bloqueiam o insert do usuário mesmo que faltem tabelas dependentes opcionais).
CREATE OR REPLACE FUNCTION public.notify_prayer_intercession()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  prayer_owner_id uuid;
BEGIN
  SELECT user_id INTO prayer_owner_id FROM prayers WHERE id = NEW.prayer_id;

  IF prayer_owner_id IS NOT NULL AND prayer_owner_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, actor_id, type, content, reference_id)
    VALUES (prayer_owner_id, NEW.user_id, 'prayer_intercession', 'está orando por você 🙏', NEW.prayer_id);
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_prayer_intercession ON public.prayer_intercessors;
CREATE TRIGGER on_prayer_intercession
  AFTER INSERT ON public.prayer_intercessors
  FOR EACH ROW EXECUTE FUNCTION public.notify_prayer_intercession();

NOTIFY pgrst, 'reload schema';
