import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// Cache por URL original → URL assinada (evita re-assinar o mesmo arquivo).
const cache = new Map<string, string>();
const MARKER = "/chat-media/";

/**
 * Recebe a URL guardada na mensagem e devolve uma URL ASSINADA temporária
 * para o bucket privado chat-media. Se a URL não for do chat-media (ex.: mídia
 * externa antiga) ou a assinatura falhar, devolve a URL original (fallback) —
 * assim nada quebra durante a transição.
 */
export function useSignedChatMedia(url?: string): string | undefined {
  const [signed, setSigned] = useState<string | undefined>(() => (url ? cache.get(url) || url : undefined));

  useEffect(() => {
    if (!url) { setSigned(undefined); return; }
    if (cache.has(url)) { setSigned(cache.get(url)); return; }

    const idx = url.indexOf(MARKER);
    if (idx === -1) { setSigned(url); return; } // não é do bucket chat-media

    const path = decodeURIComponent(url.slice(idx + MARKER.length).split("?")[0]);
    let active = true;
    supabase.storage
      .from("chat-media")
      .createSignedUrl(path, 60 * 60 * 2) // 2h
      .then(({ data, error }) => {
        if (!active) return;
        if (error || !data?.signedUrl) { setSigned(url); return; } // fallback
        cache.set(url, data.signedUrl);
        setSigned(data.signedUrl);
      });
    return () => { active = false; };
  }, [url]);

  return signed;
}
