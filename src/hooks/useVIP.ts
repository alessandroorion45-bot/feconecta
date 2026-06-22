import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export type VIPTier = "standard" | "gold" | "platinum" | null;

export interface VIPBenefit {
  benefit_key: string;
  benefit_name: string;
  description: string;
  benefit_value: any;
}

export interface VIPStatus {
  isVIP: boolean;
  tier: VIPTier;
  xpMultiplier: number;
  benefits: VIPBenefit[];
  expiresAt: string | null;
  daysRemaining: number | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useVIP(): VIPStatus {
  const { user } = useAuth();
  const [isVIP, setIsVIP] = useState(false);
  const [tier, setTier] = useState<VIPTier>(null);
  const [xpMultiplier, setXpMultiplier] = useState(1);
  const [benefits, setBenefits] = useState<VIPBenefit[]>([]);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const loadVIPStatus = async () => {
    if (!user) {
      setIsVIP(false);
      setTier(null);
      setXpMultiplier(1);
      setBenefits([]);
      setExpiresAt(null);
      setDaysRemaining(null);
      setLoading(false);
      return;
    }

    try {
      // Verificar se é VIP
      const { data: vipCheck, error: vipError } = await supabase
        .rpc("is_vip", { user_id: user.id });

      if (vipError) throw vipError;

      setIsVIP(vipCheck || false);

      if (!vipCheck) {
        setTier(null);
        setXpMultiplier(1);
        setBenefits([]);
        setExpiresAt(null);
        setDaysRemaining(null);
        setLoading(false);
        return;
      }

      // Buscar tier VIP
      const { data: tierData, error: tierError } = await supabase
        .rpc("get_vip_tier", { user_id: user.id });

      if (tierError) throw tierError;
      setTier(tierData as VIPTier);

      // Buscar multiplicador XP
      const { data: multiplierData, error: multiplierError } = await supabase
        .rpc("get_xp_multiplier", { user_id: user.id });

      if (multiplierError) throw multiplierError;
      setXpMultiplier(multiplierData || 1);

      // Buscar benefícios
      const { data: benefitsData, error: benefitsError } = await supabase
        .rpc("get_user_vip_benefits", { input_user_id: user.id });

      if (benefitsError) throw benefitsError;
      setBenefits(benefitsData || []);

      // Buscar data de expiração
      const { data: subData, error: subError } = await supabase
        .from("vip_subscriptions")
        .select("expires_at")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (subError) throw subError;

      if (subData?.expires_at) {
        setExpiresAt(subData.expires_at);

        // Calcular dias restantes
        const expirationDate = new Date(subData.expires_at);
        const now = new Date();
        const diffTime = expirationDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setDaysRemaining(diffDays > 0 ? diffDays : 0);
      } else {
        setExpiresAt(null);
        setDaysRemaining(null); // Vitalício
      }
    } catch (error) {
      console.error("Erro ao carregar status VIP:", error);
      setIsVIP(false);
      setTier(null);
      setXpMultiplier(1);
      setBenefits([]);
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    setLoading(true);
    await loadVIPStatus();
  };

  useEffect(() => {
    loadVIPStatus();
  }, [user]);

  return {
    isVIP,
    tier,
    xpMultiplier,
    benefits,
    expiresAt,
    daysRemaining,
    loading,
    refresh,
  };
}

// Hook auxiliar: verificar se usuário tem benefício específico
export function useVIPBenefit(benefitKey: string): boolean {
  const { benefits } = useVIP();
  return benefits.some((b) => b.benefit_key === benefitKey);
}

// Hook auxiliar: obter valor de benefício específico
export function useVIPBenefitValue<T = any>(benefitKey: string): T | null {
  const { benefits } = useVIP();
  const benefit = benefits.find((b) => b.benefit_key === benefitKey);
  return benefit ? (benefit.benefit_value as T) : null;
}
