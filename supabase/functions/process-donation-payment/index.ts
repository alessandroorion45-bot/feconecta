import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

  try {
    const { amount, isAnonymous, isPublic, donorName, donorCity, formData, deviceId } = await req.json();

    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      return new Response(
        JSON.stringify({ error: "Valor inválido." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!formData?.payment_method_id) {
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

    const paymentBody = {
      transaction_amount: parsedAmount,
      token: formData.token,
      description: "Doação - Aliança Kingdom",
      installments: formData.installments || 1,
      payment_method_id: formData.payment_method_id,
      issuer_id: formData.issuer_id,
      payer: formData.payer,
      external_reference: donation.id,
      notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
      statement_descriptor: "ALIANCA KINGDOM",
    };

    const mpHeaders: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": donation.id,
    };
    if (deviceId) mpHeaders["X-meli-session-id"] = deviceId;

    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: mpHeaders,
      body: JSON.stringify(paymentBody),
    });

    const payment = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error("Erro do Mercado Pago:", mpResponse.status, JSON.stringify(payment));
      await serviceClient
        .from("donations")
        .update({ status: "rejected" })
        .eq("id", donation.id);

      return new Response(
        JSON.stringify({
          error: payment?.message || "Não foi possível processar o pagamento.",
          donationId: donation.id,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const mappedStatus = STATUS_MAP[payment.status] ?? "pending";

    await serviceClient
      .from("donations")
      .update({
        status: mappedStatus,
        mp_payment_id: String(payment.id),
        mp_payment_method_id: payment.payment_method_id ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", donation.id);

    return new Response(
      JSON.stringify({
        donationId: donation.id,
        status: mappedStatus,
        statusDetail: payment.status_detail,
        qrCode: payment.point_of_interaction?.transaction_data?.qr_code ?? null,
        qrCodeBase64: payment.point_of_interaction?.transaction_data?.qr_code_base64 ?? null,
        ticketUrl: payment.point_of_interaction?.transaction_data?.ticket_url ?? null,
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
