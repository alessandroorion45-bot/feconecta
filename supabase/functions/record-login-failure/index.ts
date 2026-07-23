import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Gatilho de invasão: N falhas de login na mesma conta numa janela curta.
const THRESHOLD = 5;
const WINDOW_MINUTES = 15;
// Dedup de alerta: no máximo 1 registro de invasão + 1 notificação por
// (e-mail, ip) por hora — impede spam de notificação ao dono da conta.
const DEDUP_MINUTES = 60;

// Geolocalização por IP: provedor configurável por env (grátis, sem chave).
// Default ipwho.is (HTTPS, sem cadastro). {ip} é substituído pelo IP real.
const GEO_API_URL = Deno.env.get("GEO_API_URL") ?? "https://ipwho.is/{ip}";

const GEO_TIMEOUT_MS = 4000;

async function geolocate(ip: string): Promise<string | null> {
  if (!ip || ip === "unknown") return null;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), GEO_TIMEOUT_MS);
  try {
    const res = await fetch(GEO_API_URL.replace("{ip}", encodeURIComponent(ip)), { signal: controller.signal });
    if (!res.ok) return null;
    const d = await res.json();
    // ipwho.is: { city, region, country, connection: { isp } }
    const parts = [d.city, d.region, d.country].filter(Boolean);
    const isp = d.connection?.isp || d.isp || d.org;
    const loc = parts.join(", ");
    return [loc || null, isp ? `(${isp})` : null].filter(Boolean).join(" ") || null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { email, userAgent } = await req.json();
    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ blocked: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const normalizedEmail = email.trim().toLowerCase();

    // IP real do cliente pelos headers (não confia em valor vindo do corpo)
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const ua = (typeof userAgent === "string" ? userAgent : req.headers.get("user-agent")) ?? null;

    const service = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Registra esta falha
    await service.from("failed_login_attempts").insert({ email: normalizedEmail, ip, user_agent: ua });

    // Conta falhas recentes desta conta
    const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();
    const { count } = await service
      .from("failed_login_attempts")
      .select("id", { count: "exact", head: true })
      .eq("email", normalizedEmail)
      .gte("created_at", windowStart);

    const failures = count ?? 0;
    if (failures < THRESHOLD) {
      return new Response(JSON.stringify({ blocked: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Threshold cruzado — geolocaliza (best-effort)
    const location = await geolocate(ip);

    // Dedup: já registramos essa mesma (email, ip) na última hora?
    const dedupStart = new Date(Date.now() - DEDUP_MINUTES * 60_000).toISOString();
    const { data: existing } = await service
      .from("intrusion_attempts")
      .select("id, tentativas")
      .eq("conta_alvo_email", normalizedEmail)
      .eq("ip", ip)
      .eq("tipo_tentativa", "login_falho_repetido")
      .gte("created_at", dedupStart)
      .maybeSingle();

    if (existing) {
      // Já alertado nesta janela — só incrementa o contador, sem re-notificar
      await service
        .from("intrusion_attempts")
        .update({ tentativas: (existing.tentativas ?? 1) + 1 })
        .eq("id", existing.id);
      return new Response(JSON.stringify({ blocked: true, ip, location }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Descobre o dono da conta (se o e-mail existir) — nunca revela ao
    // cliente se existe ou não; só usa internamente pra notificar.
    const { data: targetUser } = await service
      .from("users")
      .select("id")
      .ilike("email", normalizedEmail)
      .maybeSingle();

    await service.from("intrusion_attempts").insert({
      ip,
      localizacao_aproximada: location,
      conta_alvo_id: targetUser?.id ?? null,
      conta_alvo_email: normalizedEmail,
      tipo_tentativa: "login_falho_repetido",
      user_agent: ua,
      tentativas: failures,
    });

    // Notificação in-app ao dono da conta (se existir). O e-mail real é a
    // camada plugável futura — aqui já fica o alerta dentro do app.
    if (targetUser?.id) {
      const quando = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
      await service.from("notifications").insert({
        user_id: targetUser.id,
        type: "security_alert",
        content:
          `🛡️ Alerta de segurança: detectamos ${failures} tentativas de acesso à sua conta em ${quando}. ` +
          `IP aproximado: ${ip}${location ? ` — ${location}` : ""}. ` +
          `Se não foi você, troque sua senha imediatamente.`,
      });

      // ---- PONTO DE PLUG DO E-MAIL (camada futura) --------------------
      // Quando o provedor for definido (Gmail SMTP ou Resend), o disparo
      // do e-mail transacional entra AQUI, reusando targetUser.id, ip,
      // location, failures e quando. Nada mais precisa mudar.
      // -----------------------------------------------------------------
    }

    return new Response(JSON.stringify({ blocked: true, ip, location }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erro em record-login-failure:", error);
    // Nunca travar o fluxo de login por causa da vigilância
    return new Response(JSON.stringify({ blocked: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
