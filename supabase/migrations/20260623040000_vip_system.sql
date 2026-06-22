-- =====================================================
-- SISTEMA VIP COMPLETO
-- =====================================================
-- VIP concede benefícios premium:
-- - 2x XP em todas ações
-- - Acesso a todos os temas premium
-- - Badge VIP no perfil
-- - Moldura dourada
-- - Sem anúncios (futuro)
-- - Acesso antecipado a features
-- =====================================================

-- =====================================================
-- TABELA: Assinaturas VIP
-- =====================================================
CREATE TABLE IF NOT EXISTS public.vip_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Datas
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- NULL = vitalício

  -- Tipo de VIP
  vip_tier TEXT NOT NULL DEFAULT 'standard', -- 'standard', 'gold', 'platinum'

  -- Admin que concedeu
  granted_by UUID REFERENCES auth.users(id),
  grant_reason TEXT,

  -- Cancelamento
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES auth.users(id),
  cancel_reason TEXT,

  -- Metadata
  metadata JSONB, -- Para futuras expansões

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_vip_subscriptions_user_id ON public.vip_subscriptions(user_id);
CREATE INDEX idx_vip_subscriptions_active ON public.vip_subscriptions(is_active) WHERE is_active = true;
CREATE INDEX idx_vip_subscriptions_expires ON public.vip_subscriptions(expires_at) WHERE expires_at IS NOT NULL;

-- =====================================================
-- TABELA: Benefícios VIP
-- =====================================================
CREATE TABLE IF NOT EXISTS public.vip_benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificação
  benefit_key TEXT NOT NULL UNIQUE, -- 'xp_multiplier', 'all_themes', 'no_ads', etc
  benefit_name TEXT NOT NULL,
  description TEXT,

  -- Configuração
  benefit_value JSONB NOT NULL, -- Valor do benefício (ex: {"multiplier": 2})
  vip_tier TEXT[] DEFAULT ARRAY['standard', 'gold', 'platinum'], -- Quais tiers têm acesso

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_vip_benefits_key ON public.vip_benefits(benefit_key);
CREATE INDEX idx_vip_benefits_active ON public.vip_benefits(is_active) WHERE is_active = true;

-- Inserir benefícios padrão
INSERT INTO public.vip_benefits (benefit_key, benefit_name, description, benefit_value, vip_tier) VALUES
  (
    'xp_multiplier',
    'Multiplicador de XP 2x',
    'Ganhe o dobro de XP em todas as ações',
    '{"multiplier": 2}'::jsonb,
    ARRAY['standard', 'gold', 'platinum']
  ),
  (
    'all_themes_access',
    'Acesso a Todos os Temas',
    'Desbloqueie todos os temas premium instantaneamente',
    '{"unlock_all": true}'::jsonb,
    ARRAY['standard', 'gold', 'platinum']
  ),
  (
    'gold_profile_frame',
    'Moldura Dourada no Perfil',
    'Moldura exclusiva dourada ao redor do avatar',
    '{"frame_type": "gold"}'::jsonb,
    ARRAY['gold', 'platinum']
  ),
  (
    'platinum_effects',
    'Efeitos Platinum Premium',
    'Animações e efeitos visuais exclusivos',
    '{"effects": ["particles", "glow", "shine"]}'::jsonb,
    ARRAY['platinum']
  ),
  (
    'exclusive_badges',
    'Badges Exclusivos VIP',
    'Conquistas especiais apenas para VIPs',
    '{"badge_category": "vip_exclusive"}'::jsonb,
    ARRAY['standard', 'gold', 'platinum']
  ),
  (
    'priority_support',
    'Suporte Prioritário',
    'Atendimento prioritário da equipe',
    '{"priority_level": "high"}'::jsonb,
    ARRAY['gold', 'platinum']
  ),
  (
    'early_access',
    'Acesso Antecipado',
    'Teste novas funcionalidades antes de todos',
    '{"beta_access": true}'::jsonb,
    ARRAY['platinum']
  ),
  (
    'custom_username_color',
    'Cor Customizada do Nome',
    'Escolha a cor do seu nome de usuário',
    '{"customizable": true}'::jsonb,
    ARRAY['gold', 'platinum']
  )
ON CONFLICT (benefit_key) DO NOTHING;

-- =====================================================
-- FUNÇÕES: Verificação VIP
-- =====================================================

-- Verificar se usuário é VIP ativo
CREATE OR REPLACE FUNCTION is_vip(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.vip_subscriptions
    WHERE vip_subscriptions.user_id = $1
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > NOW())
  );
$$;

-- Obter tier VIP do usuário
CREATE OR REPLACE FUNCTION get_vip_tier(user_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT vip_tier
  FROM public.vip_subscriptions
  WHERE vip_subscriptions.user_id = $1
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
  LIMIT 1;
$$;

-- Obter multiplicador de XP do usuário (1 para não-VIP, 2+ para VIP)
CREATE OR REPLACE FUNCTION get_xp_multiplier(user_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_is_vip BOOLEAN;
  v_tier TEXT;
  v_multiplier NUMERIC DEFAULT 1;
BEGIN
  -- Verificar se é VIP
  v_is_vip := is_vip(user_id);

  IF NOT v_is_vip THEN
    RETURN 1; -- Não-VIP: multiplier 1x
  END IF;

  -- Buscar tier
  v_tier := get_vip_tier(user_id);

  -- Aplicar multiplier baseado no tier
  CASE v_tier
    WHEN 'standard' THEN v_multiplier := 2;
    WHEN 'gold' THEN v_multiplier := 2.5;
    WHEN 'platinum' THEN v_multiplier := 3;
    ELSE v_multiplier := 1;
  END CASE;

  RETURN v_multiplier;
END;
$$;

-- Listar benefícios ativos do usuário
CREATE OR REPLACE FUNCTION get_user_vip_benefits(input_user_id UUID)
RETURNS TABLE(
  benefit_key TEXT,
  benefit_name TEXT,
  description TEXT,
  benefit_value JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_tier TEXT;
BEGIN
  -- Verificar se é VIP
  IF NOT is_vip(input_user_id) THEN
    RETURN; -- Não retorna nada se não for VIP
  END IF;

  -- Buscar tier
  v_tier := get_vip_tier(input_user_id);

  -- Retornar benefícios do tier
  RETURN QUERY
  SELECT
    b.benefit_key,
    b.benefit_name,
    b.description,
    b.benefit_value
  FROM public.vip_benefits b
  WHERE b.is_active = true
    AND v_tier = ANY(b.vip_tier)
  ORDER BY b.benefit_name;
END;
$$;

-- =====================================================
-- FUNÇÕES: Gestão VIP (Admin)
-- =====================================================

-- Conceder VIP
CREATE OR REPLACE FUNCTION grant_vip(
  p_user_id UUID,
  p_vip_tier TEXT DEFAULT 'standard',
  p_duration_days INTEGER DEFAULT NULL, -- NULL = vitalício
  p_grant_reason TEXT DEFAULT 'Concedido manualmente',
  p_granted_by UUID DEFAULT auth.uid()
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_subscription_id UUID;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Verificar se quem está concedendo é admin
  IF NOT has_permission(p_granted_by, 'users.grant_vip') THEN
    RAISE EXCEPTION 'Apenas admins com permissão podem conceder VIP';
  END IF;

  -- Calcular expiração
  IF p_duration_days IS NOT NULL THEN
    v_expires_at := NOW() + (p_duration_days || ' days')::INTERVAL;
  END IF;

  -- Inserir ou atualizar assinatura VIP
  INSERT INTO public.vip_subscriptions (
    user_id,
    vip_tier,
    expires_at,
    granted_by,
    grant_reason,
    is_active
  ) VALUES (
    p_user_id,
    p_vip_tier,
    v_expires_at,
    p_granted_by,
    p_grant_reason,
    true
  )
  ON CONFLICT (user_id) DO UPDATE SET
    is_active = true,
    vip_tier = EXCLUDED.vip_tier,
    expires_at = EXCLUDED.expires_at,
    granted_by = EXCLUDED.granted_by,
    grant_reason = EXCLUDED.grant_reason,
    updated_at = NOW()
  RETURNING id INTO v_subscription_id;

  -- Conceder role VIP também
  INSERT INTO public.user_roles (user_id, role, granted_by)
  VALUES (p_user_id, 'vip', p_granted_by)
  ON CONFLICT (user_id, role) DO UPDATE SET
    is_active = true,
    granted_by = EXCLUDED.granted_by,
    updated_at = NOW();

  -- Registrar log administrativo
  PERFORM log_admin_action(
    p_granted_by,
    'user_vip_granted',
    'user',
    p_user_id,
    'VIP ' || p_vip_tier || ' concedido - ' || p_grant_reason,
    jsonb_build_object(
      'subscription_id', v_subscription_id,
      'tier', p_vip_tier,
      'duration_days', p_duration_days,
      'expires_at', v_expires_at
    )
  );

  RETURN v_subscription_id;
END;
$$;

-- Revogar VIP
CREATE OR REPLACE FUNCTION revoke_vip(
  p_user_id UUID,
  p_cancel_reason TEXT DEFAULT 'Revogado manualmente',
  p_cancelled_by UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se quem está revogando é admin
  IF NOT has_permission(p_cancelled_by, 'users.grant_vip') THEN
    RAISE EXCEPTION 'Apenas admins com permissão podem revogar VIP';
  END IF;

  -- Atualizar assinatura
  UPDATE public.vip_subscriptions
  SET
    is_active = false,
    cancelled_at = NOW(),
    cancelled_by = p_cancelled_by,
    cancel_reason = p_cancel_reason,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Desativar role VIP
  UPDATE public.user_roles
  SET is_active = false, updated_at = NOW()
  WHERE user_id = p_user_id AND role = 'vip';

  -- Registrar log
  PERFORM log_admin_action(
    p_cancelled_by,
    'user_vip_revoked',
    'user',
    p_user_id,
    'VIP revogado - ' || p_cancel_reason,
    jsonb_build_object('reason', p_cancel_reason)
  );

  RETURN TRUE;
END;
$$;

-- =====================================================
-- TRIGGER: Auto-expirar VIPs
-- =====================================================
CREATE OR REPLACE FUNCTION auto_expire_vip()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.vip_subscriptions
  SET is_active = false, updated_at = NOW()
  WHERE is_active = true
    AND expires_at IS NOT NULL
    AND expires_at <= NOW();
END;
$$;

-- Configurar cron (executar a cada hora)
-- SELECT cron.schedule('expire-vip', '0 * * * *', 'SELECT auto_expire_vip()');

-- =====================================================
-- TRIGGER: Atualizar updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_vip_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_vip_subscriptions_updated_at ON public.vip_subscriptions;
CREATE TRIGGER trigger_update_vip_subscriptions_updated_at
  BEFORE UPDATE ON public.vip_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_vip_updated_at();

DROP TRIGGER IF EXISTS trigger_update_vip_benefits_updated_at ON public.vip_benefits;
CREATE TRIGGER trigger_update_vip_benefits_updated_at
  BEFORE UPDATE ON public.vip_benefits
  FOR EACH ROW
  EXECUTE FUNCTION update_vip_updated_at();

-- =====================================================
-- VIEW: Usuários VIP com detalhes
-- =====================================================
CREATE OR REPLACE VIEW public.vip_users_detailed AS
SELECT
  u.id,
  u.full_name,
  u.email,
  vs.vip_tier,
  vs.started_at,
  vs.expires_at,
  vs.granted_by,
  vs.grant_reason,
  CASE
    WHEN vs.expires_at IS NULL THEN 'Vitalício'
    WHEN vs.expires_at > NOW() THEN
      EXTRACT(DAY FROM (vs.expires_at - NOW()))::TEXT || ' dias restantes'
    ELSE 'Expirado'
  END as status_text,
  get_xp_multiplier(u.id) as xp_multiplier
FROM auth.users u
JOIN public.vip_subscriptions vs ON vs.user_id = u.id
WHERE vs.is_active = true
ORDER BY vs.started_at DESC;

-- =====================================================
-- RLS: Row Level Security
-- =====================================================

ALTER TABLE public.vip_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_benefits ENABLE ROW LEVEL SECURITY;

-- Users podem ver seu próprio status VIP
CREATE POLICY "Users can view own VIP status"
  ON public.vip_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins podem ver todos os VIPs
CREATE POLICY "Admins can view all VIPs"
  ON public.vip_subscriptions
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Apenas admins podem modificar VIPs (via função)
CREATE POLICY "Only admins can modify VIPs"
  ON public.vip_subscriptions
  FOR ALL
  USING (has_permission(auth.uid(), 'users.grant_vip'))
  WITH CHECK (has_permission(auth.uid(), 'users.grant_vip'));

-- Todos podem ver benefícios VIP (transparência)
CREATE POLICY "Everyone can view VIP benefits"
  ON public.vip_benefits
  FOR SELECT
  USING (true);

-- Apenas super_admin pode modificar benefícios
CREATE POLICY "Only super_admin can modify benefits"
  ON public.vip_benefits
  FOR ALL
  USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- =====================================================
-- GRANTS
-- =====================================================
GRANT SELECT ON public.vip_subscriptions TO authenticated;
GRANT SELECT ON public.vip_benefits TO authenticated;
GRANT SELECT ON public.vip_users_detailed TO authenticated;

GRANT EXECUTE ON FUNCTION is_vip(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_vip_tier(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_xp_multiplier(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_vip_benefits(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION grant_vip(UUID, TEXT, INTEGER, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION revoke_vip(UUID, TEXT, UUID) TO authenticated;

-- =====================================================
-- COMENTÁRIOS
-- =====================================================
COMMENT ON TABLE public.vip_subscriptions IS 'Assinaturas VIP dos usuários com status e datas';
COMMENT ON TABLE public.vip_benefits IS 'Benefícios disponíveis para usuários VIP por tier';
COMMENT ON FUNCTION is_vip(UUID) IS 'Verifica se usuário possui VIP ativo';
COMMENT ON FUNCTION get_vip_tier(UUID) IS 'Retorna o tier VIP do usuário (standard, gold, platinum)';
COMMENT ON FUNCTION get_xp_multiplier(UUID) IS 'Retorna multiplicador de XP do usuário (VIP = 2x+)';
COMMENT ON FUNCTION grant_vip IS 'Concede VIP a um usuário (apenas admins)';
COMMENT ON FUNCTION revoke_vip IS 'Revoga VIP de um usuário (apenas admins)';
