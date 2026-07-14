import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Status da Order (não confundir com status de payment da API antiga)
const ORDER_STATUS_MAP: Record<string, string> = {
  processed: "approved",
  action_required: "pending",
  created: "pending",
  canceled: "cancelled",
  cancelled: "cancelled",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount, isAnonymous, isPublic, donorName, donorCity, formData, deviceId } = await req.json();

    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      return new Response(
        JSON.stringify({ error: "Valor inválido." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!formData?.payment_method_id || !formData?.payer?.email) {
      return new Response(
        JSON.stringify({ error: "Dados de pagamento incompletos." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const authClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data } = await authClient.auth.getUser();
      userId = data.user?.id ?? null;
    }

    const { data: donation, error: insertError } = await serviceClient
      .from("donations")
      .insert({
        user_id: userId,
        amount: parsedAmount,
        is_anonymous: !!isAnonymous,
        is_public: !!isPublic,
        donor_name: isAnonymous ? null : (donorName || null),
        donor_city: donorCity || null,
        preferred_method: formData.payment_method_id,
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError || !donation) {
      console.error("Erro ao criar doação:", insertError);
      throw new Error("Não foi possível registrar a doação.");
    }

    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!accessToken) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado.");
    }

    const amountStr = parsedAmount.toFixed(2);

    const orderBody = {
      type: "online",
      processing_mode: "automatic",
      external_reference: donation.id,
      total_amount: amountStr,
      payer: { email: formData.payer.email },
      transactions: {
        payments: [
          {
            amount: amountStr,
            payment_method: { id: formData.payment_method_id, type: "bank_transfer" },
          },
        ],
      },
    };

    const mpHeaders: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": donation.id,
    };
    if (deviceId) mpHeaders["X-meli-session-id"] = deviceId;

    const mpResponse = await fetch("https://api.mercadopago.com/v1/orders", {
      method: "POST",
      headers: mpHeaders,
      body: JSON.stringify(orderBody),
    });

    const order = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error("Erro do Mercado Pago:", mpResponse.status, JSON.stringify(order));
      await serviceClient
        .from("donations")
        .update({ status: "rejected" })
        .eq("id", donation.id);

      return new Response(
        JSON.stringify({
          error: order?.message || order?.errors?.[0]?.message || "Não foi possível processar o pagamento.",
          errorDetails: order?.errors ?? order?.cause ?? null,
          donationId: donation.id,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const paymentInOrder = order.transactions?.payments?.[0];
    const mappedStatus = ORDER_STATUS_MAP[order.status] ?? "pending";

    await serviceClient
      .from("donations")
      .update({
        status: mappedStatus,
        mp_preference_id: order.id,
        mp_payment_id: paymentInOrder?.id ? String(paymentInOrder.id) : null,
        mp_payment_method_id: paymentInOrder?.payment_method?.id ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", donation.id);

    return new Response(
      JSON.stringify({
        donationId: donation.id,
        status: mappedStatus,
        statusDetail: order.status_detail,
        qrCode: paymentInOrder?.payment_method?.qr_code ?? null,
        qrCodeBase64: paymentInOrder?.payment_method?.qr_code_base64 ?? null,
        ticketUrl: paymentInOrder?.payment_method?.ticket_url ?? null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Erro em process-donation-payment:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
