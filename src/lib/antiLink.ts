import { supabase } from "@/integrations/supabase/client";

const sb = supabase as any;

// Espelho client-side da função SQL contains_external_link — mesma lógica,
// pra bloquear ANTES de bater no banco e dar feedback imediato. O servidor
// (triggers) é a barreira real; isto é só UX + registro da tentativa.
const LINK_PATTERNS: RegExp[] = [
  /https?:\/\//i,
  /hxxps?/i,
  /\bwww\s*[.[]/i,
  /[a-z0-9-]+(\.|\s+\.)(com|net|org|io|me|ly|app|site|online|xyz|info|club|shop|store|live|link|click|cc|tv|gg|to|co|br)(\.[a-z]{2})?\b/i,
  /[a-z0-9-]+\s*(\[\.\]|\(dot\)|\(ponto\))\s*[a-z]{2,}/i,
];

export type ViolationContentType = "post" | "comentario" | "comentario_versiculo" | "mensagem";

export function containsExternalLink(text: string | null | undefined): boolean {
  if (!text) return false;
  return LINK_PATTERNS.some((re) => re.test(text));
}

/**
 * Registra a tentativa de link no servidor (tabela link_violations) e
 * dispara a advertência automática por reincidência. Best-effort: se
 * falhar, nunca trava o fluxo do usuário — a barreira real é o trigger.
 * Retorna quantas tentativas o usuário já acumulou (0 se não deu pra saber).
 */
export async function registerLinkViolation(content: string, type: ViolationContentType): Promise<number> {
  try {
    const { data, error } = await sb.rpc("register_link_violation", { p_content: content, p_type: type });
    if (error) {
      console.error("Falha ao registrar violação de link:", error.message);
      return 0;
    }
    return (data?.count as number) ?? 0;
  } catch {
    return 0;
  }
}
