import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// Busca de presenteado (Kingdom Store) feita no SERVIDOR: permite achar a
// pessoa por nome OU e-mail, mas NUNCA retorna o e-mail — só id, nome e avatar.
// Assim o cliente não precisa mais ler a tabela public.users direto (que tinha
// e-mail), e o RLS de users pode ser apertado pra "só a própria linha + admin".
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Valida o chamador (precisa estar logado). Usa service_role pra validar.
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) return json({ error: "unauthorized" }, 401);

    const { query } = await req.json().catch(() => ({ query: "" }));
    // Sanitiza: remove caracteres com significado na sintaxe de filtro do
    // PostgREST (evita injeção de filtro no .or()).
    const q = String(query || "").replace(/[,()\\%*]/g, "").trim();
    if (q.length < 2) return json({ results: [] });

    const { data, error } = await supabase
      .from("users")
      .select("id, full_name, avatar_url")
      .or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)
      .neq("id", user.id)
      .limit(8);

    if (error) return json({ error: error.message }, 500);
    return json({ results: data || [] });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
