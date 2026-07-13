import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mapeia os status de pagamento do Mercado Pago para os status internos
const STATUS_MAP: Record<string, string> = {
  approved: "approved",
  rejected: "rejected",
  cancelled: "cancelled",
  refunded: "refunded",
  charged_back: "refunded",
  in_process: "pending",
  pending: "pending",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // O Mercado Pago espera sempre 200 rapidamente, mesmo em erros de negócio,
  // para não ficar reenviando a notificação indefinidamente.
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type") ?? url.searchParams.get("topic");
    let paymentId = url.searchParams.get("data.id") ?? url.searchParams.get("id");

    if (req.method === "POST") {
      try {
        const body = await req.json();
        paymentId = body?.data?.id ?? paymentId;
      } catch {
        // corpo vazio/ inválido — segue só com os query params
      }
    }

    if (type !== "payment" || !paymentId) {
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!accessToken) throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado.");

    // Nunca confiar no corpo do webhook — sempre buscar o pagamento real na API do MP
    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!paymentResponse.ok) {
      console.error("Erro ao buscar pagamento no Mercado Pago:", paymentResponse.status);
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payment = await paymentResponse.json();
    const donationId = payment.external_reference;
    if (!donationId) {
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const mappedStatus = STATUS_MAP[payment.status] ?? "pending";

    await serviceClient
      .from("donations")
      .update({
        status: mappedStatus,
        mp_payment_id: String(payment.id),
        mp_payment_method_id: payment.payment_method_id ?? null,
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
