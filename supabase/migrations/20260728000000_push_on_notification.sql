-- ============================================================
-- PUSH DE RETORNO: dispara push quando chega uma notificação
-- ============================================================
-- Fecha a lacuna: antes NADA chamava a edge function. Agora todo
-- INSERT em public.notifications aciona um push (via pg_net) pro
-- dono da notificação — mesmo com o app fechado / tela bloqueada.
--
-- Segurança: o segredo compartilhado com a edge function fica num
-- schema privado (fora do alcance de anon/authenticated). A função
-- é SECURITY DEFINER e nunca deixa uma falha de push quebrar a
-- criação da notificação.
-- ============================================================

-- 1) pg_net (chamadas HTTP a partir do banco)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2) Segredos internos (só o postgres/owner lê)
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM anon, authenticated, public;

CREATE TABLE IF NOT EXISTS private.app_secrets (
  key   text PRIMARY KEY,
  value text NOT NULL
);
REVOKE ALL ON private.app_secrets FROM anon, authenticated, public;

INSERT INTO private.app_secrets (key, value) VALUES
  -- NÃO commitar o segredo real. O valor de produção é definido/rotacionado
  -- direto no banco (private.app_secrets) e deve casar com o env PUSH_HOOK_SECRET
  -- da edge function. Este placeholder só cria a linha se ela ainda não existir.
  ('push_hook_secret', 'SET-VIA-DB-NAO-COMMITAR'),
  ('project_url', 'https://kfetvofrwtuduwmpvdlz.supabase.co')
ON CONFLICT (key) DO NOTHING;

-- 3) Trigger: notificação criada -> push
CREATE OR REPLACE FUNCTION public.notify_push_on_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_secret text;
  v_url    text;
  v_title  text;
BEGIN
  SELECT value INTO v_secret FROM private.app_secrets WHERE key = 'push_hook_secret';
  SELECT value INTO v_url    FROM private.app_secrets WHERE key = 'project_url';
  IF v_secret IS NULL OR v_url IS NULL THEN
    RETURN NEW;
  END IF;

  -- Título amigável por tipo (o corpo é o content da notificação)
  v_title := CASE NEW.type
    WHEN 'referral_reward'  THEN 'Recompensa desbloqueada! 🎉'
    WHEN 'gift'             THEN 'Você recebeu um presente 🎁'
    WHEN 'gift_received'    THEN 'Você recebeu um presente 🎁'
    WHEN 'friend_request'   THEN 'Novo pedido de amizade 👋'
    WHEN 'friend_accepted'  THEN 'Vocês agora são amigos 🤝'
    WHEN 'comment'          THEN 'Novo comentário 💬'
    WHEN 'reply'            THEN 'Responderam você 💬'
    WHEN 'like'             THEN 'Alguém curtiu 💛'
    WHEN 'reaction'         THEN 'Nova reação ✨'
    WHEN 'prayer'           THEN 'Oração 🙏'
    WHEN 'prayer_reminder'  THEN 'Hora de orar 🙏'
    WHEN 'mention'          THEN 'Mencionaram você 📣'
    WHEN 'system'           THEN 'Aliança Kingdom'
    ELSE 'Aliança Kingdom'
  END;

  PERFORM net.http_post(
    url     := v_url || '/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-internal-secret', v_secret
    ),
    body    := jsonb_build_object(
      'user_id', NEW.user_id,
      'title',   v_title,
      'body',    COALESCE(NULLIF(NEW.content, ''), 'Você tem uma nova notificação'),
      'tag',     COALESCE(NEW.type, 'notification'),
      'data',    jsonb_build_object('url', '/')
    )
  );

  RETURN NEW;
EXCEPTION WHEN others THEN
  -- push nunca pode derrubar a criação da notificação
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_push ON public.notifications;
CREATE TRIGGER trg_notify_push
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_push_on_notification();

SELECT 'ok' AS status,
  (SELECT count(*) FROM pg_extension WHERE extname = 'pg_net') AS pg_net_on;
