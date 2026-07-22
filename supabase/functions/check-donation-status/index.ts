import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ORDER_STATUS_MAP: Record<string, string> = {
  processed: "approved",
  action_required: "pending",
  created: "pending",
  canceled: "cancelled",
  cancelled: "cancelled",
};

// Chamada de polling (a cada poucos segundos) — timeout mais curto, uma
// falha aqui só significa "tenta de novo no próximo ciclo", nada crítico.
const MP_TIMEOUT_MS = 8000;
async function fetchMP(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MP_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

// Endpoint mínimo pra polling do modal de doação: dado um id de doação
// (UUID imprevisível, gerado só pra quem acabou de criar a cobrança),
// devolve só o status. Como a API de Orders não aceita notification_url
// (sem webhook automático), enquanto o status estiver "pending" a gente
// confere direto na API do Mercado Pago em vez de confiar só no banco.
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const donationId = url.searchParams.get("id");

    if (!donationId) {
      return new Response(
        JSON.stringify({ error: "id é obrigatório." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: donation, error } = await serviceClient
      .from("donations")
      .select("status, amount, mp_preference_id")
      .eq("id", donationId)
      .single();

    if (error || !donation) {
      return new Response(
        JSON.stringify({ error: "Doação não encontrada." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let status = donation.status;

    if (status === "pending" && donation.mp_preference_id) {
      const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
      if (accessToken) {
        try {
          const orderResponse = await fetchMP(
            `https://api.mercadopago.com/v1/orders/${donation.mp_preference_id}`,
            { headers: { Authorization: `Bearer ${accessToken}` } },
          );
          if (orderResponse.ok) {
            const order = await orderResponse.json();
            const freshStatus = ORDER_STATUS_MAP[order.status] ?? "pending";
            if (freshStatus !== status) {
              status = freshStatus;
              const paymentInOrder = order.transactions?.payments?.[0];
              await serviceClient
                .from("donations")
                .update({
                  status: freshStatus,
                  mp_payment_id: paymentInOrder?.id ? String(paymentInOrder.id) : null,
                  mp_payment_method_id: paymentInOrder?.payment_method?.id ?? null,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", donationId);
            }
          }
        } catch (mpError) {
          console.error("Timeout/falha ao reconsultar o Mercado Pago:", mpError);
        }
      }
    }

    return new Response(
      JSON.stringify({ status, amount: donation.amount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Erro em check-donation-status:", error);
    return new Response(
      JSON.stringify({ error: "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
