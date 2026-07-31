import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1) Autenticação
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const uid = claimsData.claims.sub as string;

    // 2) Só admin pode gerar (defesa no servidor)
    const { data: roles } = await authClient
      .from("user_roles")
      .select("role")
      .eq("user_id", uid)
      .in("role", ["super_admin", "admin", "moderator"]);
    if (!roles || roles.length === 0) {
      return new Response(JSON.stringify({ error: "Apenas administradores." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3) Rate limit (reusa a mesma proteção da geração de imagem)
    const { data: allowed } = await authClient.rpc("check_ai_rate_limit", {
      p_user_id: uid,
      p_action: "generate-affiliate-copy",
      p_max: 30,
      p_window_seconds: 3600,
    });
    if (allowed === false) {
      return new Response(
        JSON.stringify({ error: "Você gerou muitos textos por enquanto. Tente novamente daqui a pouco." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { nome, reason, categoria } = await req.json();
    if (!nome || String(nome).trim().length === 0) {
      return new Response(JSON.stringify({ error: "Informe o nome do produto." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Você é um redator de uma comunidade cristã acolhedora (app "Aliança Kingdom").
Escreve apresentações curtas e honestas de produtos recomendados (links de parceiro/afiliado).
Regras:
- Tom cristão, caloroso e respeitoso. NUNCA agressivo, sem "venda forçada", sem urgência falsa.
- Nada de números inventados, promessas exageradas ou pressão.
- Português do Brasil, linguagem simples e sincera.
- Responda SOMENTE com JSON válido, sem markdown, no formato:
{"headline":"...", "descricao":"...", "cta":"..."}
- headline: curta (máx ~7 palavras), focada no benefício, chamativa mas honesta.
- descricao: 2 a 4 frases persuasivas e acolhedoras a partir do nome e da recomendação.
- cta: 2 a 4 palavras (ex: "Quero conhecer", "Ver oferta").`;

    const userPrompt = `Produto: ${nome}
Categoria: ${categoria || "Recomendados"}
Por que o app recomenda: ${reason || "(não informado — crie algo honesto e acolhedor a partir do nome)"}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas gerações agora. Tente daqui a pouco." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    let text: string = data.choices?.[0]?.message?.content ?? "";
    // Limpa cercas de código, se vierem
    text = text.replace(/```json/gi, "").replace(/```/g, "").trim();

    let parsed: { headline?: string; descricao?: string; cta?: string } = {};
    try {
      const start = text.indexOf("{");
      const end = text.lastIndexOf("}");
      parsed = JSON.parse(start >= 0 && end >= 0 ? text.slice(start, end + 1) : text);
    } catch {
      // Fallback: usa o texto cru como descrição
      parsed = { headline: nome, descricao: text.slice(0, 300), cta: "Ver oferta" };
    }

    return new Response(
      JSON.stringify({
        headline: (parsed.headline || nome).toString().slice(0, 120),
        descricao: (parsed.descricao || "").toString().slice(0, 600),
        cta: (parsed.cta || "Ver oferta").toString().slice(0, 40),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error generating affiliate copy:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
