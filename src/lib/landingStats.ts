import { supabase } from "@/integrations/supabase/client";

const sb = supabase as any;

export interface LandingStats {
  versiculos: number;
  oracoes: number;
  testemunhos: number;
  membros: number;
}

let cache: LandingStats | null = null;

/** Números reais (nunca fabricados) pra faixa de estatísticas da landing page. */
export async function fetchLandingStats(): Promise<LandingStats | null> {
  if (cache) return cache;
  try {
    const { data, error } = await sb.rpc("get_landing_stats");
    if (error || !data) return null;
    cache = data as LandingStats;
    return cache;
  } catch {
    return null;
  }
}
