import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-secret",
};

// VAPID: chaves REAIS deste projeto (a pública também vive no front em
// usePushNotifications.ts — precisam ser o mesmo par).
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") || "";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") || "";
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "https://www.aliancakingdom.com.br";
// Segredo compartilhado com o trigger do banco (modo interno: pode enviar
// push pra qualquer usuário, pois é o servidor notificando sobre um evento).
const PUSH_HOOK_SECRET = Deno.env.get("PUSH_HOOK_SECRET") || "";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

interface PushPayload {
  user_id: string;
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return new Response(
        JSON.stringify({ error: "VAPID keys não configuradas no servidor." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: PushPayload = await req.json();
    const { user_id, title, body, icon, tag, data } = payload;

    if (!user_id || !title || !body) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios: user_id, title, body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // --- Autorização em dois modos ---
    const internalSecret = req.headers.get("x-internal-secret");
    const isInternal = !!PUSH_HOOK_SECRET && internalSecret === PUSH_HOOK_SECRET;

    if (!isInternal) {
      // Modo usuário: precisa de token válido e só pode notificar a si mesmo.
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(
        authHeader.replace("Bearer ", ""),
      );
      const callerUserId = (claimsData?.claims as Record<string, unknown> | undefined)?.sub as string | undefined;
      if (claimsError || !callerUserId) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (user_id !== callerUserId) {
        return new Response(
          JSON.stringify({ error: "Forbidden: não é possível notificar outro usuário" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // Inscrições push do destinatário
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", user_id);

    if (subError) {
      return new Response(
        JSON.stringify({ error: "Falha ao buscar inscrições" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: "Sem inscrições", sent: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const pushBody = JSON.stringify({
      title,
      body,
      icon: icon || "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: tag || "notification",
      data: data || { url: "/" },
    });

    let sent = 0;
    const expiredEndpoints: string[] = [];

    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            pushBody,
          );
          sent++;
        } catch (err: unknown) {
          const status = (err as { statusCode?: number })?.statusCode;
          // 404/410 = inscrição morta (app desinstalado / permissão revogada)
          if (status === 404 || status === 410) {
            expiredEndpoints.push(sub.endpoint);
          } else {
            console.error("Erro ao enviar push:", status, (err as Error)?.message);
          }
        }
      }),
    );

    // Limpa inscrições mortas pra não tentar de novo
    if (expiredEndpoints.length > 0) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .eq("user_id", user_id)
        .in("endpoint", expiredEndpoints);
    }

    return new Response(
      JSON.stringify({ message: "ok", sent, total: subscriptions.length, cleaned: expiredEndpoints.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Erro em send-push-notification:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
