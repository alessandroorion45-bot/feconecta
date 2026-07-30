-- ============================================================
-- ESCUDO ANTI-ÓDIO: moderação automática de linguagem
-- ============================================================
-- Escalada: 1ª = advertência · 2ª+ = expulsão TEMPORÁRIA (suspensão,
-- dias crescentes). Expulsão PERMANENTE nunca é automática — o dono
-- decide olhando o relatório. Cada violação gera relatório pros admins
-- (com e-mail + id + conteúdo) e vira alerta em tempo real (push).
-- ============================================================

-- 1) MAIS palavras proibidas (distintas). Idempotente.
INSERT INTO public.banned_words (word, severity, auto_action, is_active)
SELECT v.word, v.severity, 'flag', true
FROM (VALUES
  ('baitola','high'),('baitôla','high'),('bibinha','high'),('bichona','high'),('viadagem','high'),('travecão','high'),('sapatona','high'),
  ('maricas','medium'),('maricão','medium'),('frouxo','low'),('mocinha','low'),
  ('crioulo','high'),('criolo','high'),('macaquice','high'),('preto fedido','high'),('negro sujo','high'),('tição','high'),('senzala','high'),
  ('mongoloide','high'),('mongolóide','high'),('debil mental','high'),('débil mental','high'),('aleijado','medium'),('banana podre','low'),
  ('biscate','high'),('quenga','high'),('rapariga','medium'),('galinha safada','medium'),('messalina','medium'),('vaca (isolado?)','skip'),
  ('trouxa','low'),('tapado','low'),('lerdo','low'),('estupido','medium'),('estúpido','medium'),('panaca','medium'),('cretino','medium'),('cretina','medium'),
  ('energumeno','medium'),('energúmeno','medium'),('asno','low'),('jumenta','low'),('patife','low'),('cafajeste','medium'),('salafrario','medium'),('salafrário','medium'),
  ('miseravel','medium'),('miserável','medium'),('peste','low'),('maldito','medium'),('maldita','medium'),('capiroto','low'),
  ('fidaputa','high'),('fidputa','high'),('fdputa','high'),('filha da mãe','medium'),('filho da mãe','medium'),('vai pra puta que','high'),('puta que pariu','high'),
  ('chupa meu','high'),('mama meu','high'),('siririca','high'),('punhetar','high'),('masturba','medium'),('pornografia','medium'),('pornô','medium'),('porno','medium'),
  ('sacanagem','low'),('safadeza','low'),('grelo','high'),('pentelho','medium'),('ppk','high'),('xota','high'),('xavasca','high'),('xavesca','high'),
  ('crente burro','high'),('crente idiota','high'),('crente otário','high'),('crente fanático','high'),('crente retardado','high'),
  ('bando de fanático','high'),('bando de crente','high'),('igreja de ladrão','high'),('religião de otário','high'),('evangélico burro','high'),('evangelico idiota','high'),
  ('cospe em deus','high'),('odeio crente','high'),('crentice','medium'),
  ('go to hell','medium'),('faggot','high'),('nigger','high'),('retard','high'),('slut','high'),('dickhead','high'),('bastard','medium')
) AS v(word, severity)
WHERE v.severity <> 'skip'
  AND NOT EXISTS (SELECT 1 FROM public.banned_words b WHERE lower(b.word) = lower(v.word));

-- 2) Bloqueio de acesso: usuário com ban OU suspensão ativa
CREATE OR REPLACE FUNCTION public.get_my_access_block()
RETURNS jsonb
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT jsonb_build_object(
        'blocked', true,
        'type', up.punishment_type::text,
        'reason', up.reason,
        'until', up.expires_at
      )
      FROM public.user_punishments up
      WHERE up.user_id = auth.uid()
        AND up.punishment_type IN ('ban','suspension')
        AND up.is_active
        AND (up.expires_at IS NULL OR up.expires_at > now())
      ORDER BY (up.expires_at IS NULL) DESC, up.expires_at DESC NULLS FIRST
      LIMIT 1),
    jsonb_build_object('blocked', false)
  );
$$;
GRANT EXECUTE ON FUNCTION public.get_my_access_block() TO authenticated;

-- 3) Motor de moderação: chamado ANTES de publicar/enviar
CREATE OR REPLACE FUNCTION public.moderate_content(p_content text, p_context text DEFAULT 'publicação')
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_hits text[];
  v_sev text;
  v_count int;
  v_offense int;
  v_action text;         -- 'warning' | 'suspension'
  v_days int := 0;
  v_expires timestamptz := NULL;
  v_email text;
  v_name text;
  v_reason text;
  v_admin record;
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('clean', true); END IF;

  SELECT array_agg(DISTINCT word), max(severity) INTO v_hits, v_sev
  FROM public.check_banned_words(p_content);

  IF v_hits IS NULL OR array_length(v_hits, 1) = 0 THEN
    RETURN jsonb_build_object('clean', true);
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = v_uid;
  SELECT COALESCE(full_name, username, 'Usuário') INTO v_name FROM public.profiles WHERE id = v_uid;

  -- ocorrências automáticas anteriores
  SELECT count(*) INTO v_count FROM public.user_punishments
   WHERE user_id = v_uid AND reason LIKE 'AUTO-MODERAÇÃO:%';
  v_offense := v_count + 1;

  IF v_offense = 1 THEN
    v_action := 'warning';
  ELSE
    v_action := 'suspension';
    v_days := CASE WHEN v_offense = 2 THEN 3 WHEN v_offense = 3 THEN 7 ELSE 30 END;
    v_expires := now() + make_interval(days => v_days);
  END IF;

  v_reason := 'AUTO-MODERAÇÃO: linguagem imprópria/ódio ["' || array_to_string(v_hits, ', ') || '"] em ' || p_context || ' (ocorrência ' || v_offense || ')';

  -- issued_by = o próprio usuário (punição automática disparada pelo conteúdo dele)
  INSERT INTO public.user_punishments (user_id, punishment_type, reason, issued_by, expires_at, is_active)
  VALUES (v_uid, v_action::public.user_punishment_type, v_reason, v_uid, v_expires, true);

  -- notifica o próprio infrator
  INSERT INTO public.notifications (user_id, type, content)
  VALUES (v_uid, 'moderation',
    CASE WHEN v_action = 'warning'
      THEN '⚠️ Advertência: aqui é uma plataforma cristã. Linguagem imprópria não é permitida. Na próxima, sua conta será suspensa.'
      ELSE '🚫 Sua conta foi suspensa por ' || v_days || ' dias por linguagem imprópria. Se continuar, poderá ser excluído permanentemente.'
    END);

  -- log detalhado
  INSERT INTO public.auto_moderation_logs (rule_name, target_type, target_id, action_taken, action_result, trigger_reason, trigger_data)
  VALUES ('Linguagem imprópria', p_context, v_uid, v_action, jsonb_build_object('status', 'aplicado'),
    'Detectado: ' || array_to_string(v_hits, ', '),
    jsonb_build_object('user_id', v_uid, 'email', v_email, 'name', v_name, 'content', p_content, 'words', v_hits, 'offense', v_offense, 'severity', v_sev, 'days', v_days));

  -- relatório pros admins (aparece no painel + vira push em tempo real)
  FOR v_admin IN SELECT ur.user_id FROM public.user_roles ur WHERE ur.role IN ('super_admin','admin') AND ur.is_active LOOP
    INSERT INTO public.notifications (user_id, type, content)
    VALUES (v_admin.user_id, 'moderation_alert',
      '🚨 Moderação · ' || v_name || ' (' || COALESCE(v_email, '?') || ') usou linguagem imprópria ["' || array_to_string(v_hits, ', ')
      || '"] em ' || p_context || '. Ação: ' || (CASE WHEN v_action = 'warning' THEN 'ADVERTÊNCIA' ELSE 'SUSPENSÃO ' || v_days || 'd' END)
      || ' (ocorrência ' || v_offense || '). Decida expulsão permanente no painel se necessário.');
  END LOOP;

  RETURN jsonb_build_object(
    'clean', false, 'offense', v_offense, 'action', v_action, 'days', v_days,
    'words', to_jsonb(v_hits), 'user_name', v_name, 'severity', v_sev
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.moderate_content(text, text) TO authenticated;

SELECT 'ok' AS status, (SELECT count(*) FROM public.banned_words) AS palavras;
