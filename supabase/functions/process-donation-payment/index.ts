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

const MP_TIMEOUT_MS = 15000;
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

  try {
    const { amount, isAnonymous, isPublic, donorName, donorCity, formData, deviceId, clientRequestId } = await req.json();

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
      const authClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { data, error } = await authClient.auth.getUser(authHeader.replace("Bearer ", ""));
      if (error) console.error("Erro ao validar usuário:", error.message);
      userId = data.user?.id ?? null;
    }

    // Idempotência: mesmo mecanismo do process-store-purchase — se o
    // client mandar um clientRequestId estável (reenviado igual em caso
    // de retry de rede), ele vira o próprio id da doação. Retry de uma
    // doação já registrada nunca cria uma segunda linha nem uma segunda
    // cobrança no Mercado Pago.
    const isValidUuid = (v: unknown): v is string =>
      typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
    const donationId = isValidUuid(clientRequestId) ? clientRequestId : crypto.randomUUID();

    const { data: existing } = await serviceClient
      .from("donations")
      .select("id, status")
      .eq("id", donationId)
      .maybeSingle();

    if (existing && ["approved", "rejected", "cancelled"].includes(existing.status)) {
      // Já processado antes (retry tardio) — devolve o resultado que já existe, sem cobrar de novo
      if (existing.status === "rejected" || existing.status === "cancelled") {
        return new Response(
          JSON.stringify({ error: "Este pagamento já tinha sido recusado anteriormente.", donationId }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify({ donationId, status: existing.status }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let donation: { id: string };
    if (existing) {
      // Ainda pendente — não cria linha nova, só reusa pra reconsultar o MP abaixo
      donation = existing;
    } else {
      const { data: inserted, error: insertError } = await serviceClient
        .from("donations")
        .insert({
          id: donationId,
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

      if (insertError || !inserted) {
        console.error("Erro ao criar doação:", insertError);
        throw new Error("Não foi possível registrar a doação.");
      }
      donation = inserted;
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

    const mpResponse = await fetchMP("https://api.mercadopago.com/v1/orders", {
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
    const timedOut = error instanceof Error && error.name === "AbortError";
    return new Response(
      JSON.stringify({
        error: timedOut
          ? "O Mercado Pago demorou demais pra responder. Tente novamente."
          : error instanceof Error ? error.message : "Erro desconhecido",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
