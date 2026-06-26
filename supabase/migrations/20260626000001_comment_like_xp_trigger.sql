-- =====================================================
-- TRIGGER PARA XP AO RECEBER CURTIDA EM COMENTÁRIO
-- =====================================================
-- Quando um comentário recebe uma curtida, o autor
-- do comentário ganha +3 XP automaticamente
-- =====================================================

CREATE OR REPLACE FUNCTION public.award_xp_on_comment_like()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_comment_author_id uuid;
  v_current_xp integer;
  v_current_level integer;
BEGIN
  -- Obter o autor do comentário
  SELECT user_id INTO v_comment_author_id
  FROM verse_comments
  WHERE id = NEW.comment_id;

  -- Não conceder XP se o usuário curtiu o próprio comentário
  IF v_comment_author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Verificar se o perfil existe
  SELECT xp, level INTO v_current_xp, v_current_level
  FROM profiles
  WHERE id = v_comment_author_id;

  IF v_current_xp IS NULL THEN
    RETURN NEW;
  END IF;

  -- Adicionar +3 XP
  v_current_xp := v_current_xp + 3;

  -- Calcular novo nível (100 XP por nível)
  v_current_level := FLOOR(v_current_xp / 100) + 1;

  -- Atualizar perfil
  UPDATE profiles
  SET
    xp = v_current_xp,
    level = v_current_level,
    updated_at = now()
  WHERE id = v_comment_author_id;

  -- Registrar no log de XP (se a tabela existir)
  BEGIN
    INSERT INTO xp_log (
      user_id,
      action_type,
      xp_amount,
      description
    )
    VALUES (
      v_comment_author_id,
      'comment_like_received',
      3,
      'Recebeu curtida em comentário'
    );
  EXCEPTION
    WHEN undefined_table THEN
      -- Tabela xp_log não existe, ignorar
      NULL;
  END;

  RETURN NEW;
END;
$$;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_award_xp_on_comment_like ON verse_comment_likes;

CREATE TRIGGER trigger_award_xp_on_comment_like
AFTER INSERT ON verse_comment_likes
FOR EACH ROW
EXECUTE FUNCTION award_xp_on_comment_like();

-- Comentário
COMMENT ON FUNCTION public.award_xp_on_comment_like() IS
'Concede +3 XP ao autor do comentário quando seu comentário recebe uma curtida';

-- =====================================================
-- SUCCESS
-- =====================================================

SELECT 'Trigger de XP para curtidas em comentários criado com sucesso!' as message;
