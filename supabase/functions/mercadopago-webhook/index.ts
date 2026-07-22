import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Status da API antiga de Payments
const PAYMENT_STATUS_MAP: Record<string, string> = {
  approved: "approved",
  rejected: "rejected",
  cancelled: "cancelled",
  refunded: "refunded",
  charged_back: "refunded",
  in_process: "pending",
  pending: "pending",
};

// Status da API de Orders (a que esta aplicação realmente usa)
const ORDER_STATUS_MAP: Record<string, string> = {
  processed: "approved",
  action_required: "pending",
  created: "pending",
  canceled: "cancelled",
  cancelled: "cancelled",
};

// O Mercado Pago reenvia o webhook se não receber 200 rápido — um timeout
// curto aqui evita ficar preso numa reconsulta lenta enquanto ainda dá
// tempo de responder 200 e deixar o MP tentar de novo depois se precisar.
const MP_TIMEOUT_MS = 10000;
async function fetchMP(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MP_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // O Mercado Pago espera sempre 200 rapidamente, mesmo em erros de negócio,
  // para não ficar reenviando a notificação indefinidamente.
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type") ?? url.searchParams.get("topic");
    let resourceId = url.searchParams.get("data.id") ?? url.searchParams.get("id");

    if (req.method === "POST") {
      try {
        const body = await req.json();
        resourceId = body?.data?.id ?? resourceId;
      } catch {
        // corpo vazio/inválido — segue só com os query params
      }
    }

    if (!resourceId || !type) {
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!accessToken) throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado.");

    const isOrder = type.includes("order");
    const endpoint = isOrder
      ? `https://api.mercadopago.com/v1/orders/${resourceId}`
      : `https://api.mercadopago.com/v1/payments/${resourceId}`;

    // Nunca confiar no corpo do webhook — sempre buscar o recurso real na API do MP
    const resourceResponse = await fetchMP(endpoint, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!resourceResponse.ok) {
      console.error("Erro ao buscar recurso no Mercado Pago:", resourceResponse.status);
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resource = await resourceResponse.json();
    const donationId = resource.external_reference;
    if (!donationId) {
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let mappedStatus: string;
    let mpPaymentId: string | null;
    let mpPaymentMethodId: string | null;

    if (isOrder) {
      const paymentInOrder = resource.transactions?.payments?.[0];
      mappedStatus = ORDER_STATUS_MAP[resource.status] ?? "pending";
      mpPaymentId = paymentInOrder?.id ? String(paymentInOrder.id) : null;
      mpPaymentMethodId = paymentInOrder?.payment_method?.id ?? null;
    } else {
      mappedStatus = PAYMENT_STATUS_MAP[resource.status] ?? "pending";
      mpPaymentId = String(resource.id);
      mpPaymentMethodId = resource.payment_method_id ?? null;
    }

    await serviceClient
      .from("donations")
      .update({
        status: mappedStatus,
        mp_payment_id: mpPaymentId,
        mp_payment_method_id: mpPaymentMethodId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", donationId);

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erro em mercadopago-webhook:", error);
    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
