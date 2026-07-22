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

// Sem isso, uma resposta lenta/travada do Mercado Pago deixaria a função
// rodando até o limite da plataforma em vez de falhar rápido e de forma
// previsível (cai no catch já existente, retorna erro claro pro cliente).
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
    const { productId, giftToUserId, giftToUserIds, giftMessage, formData, deviceId, clientRequestId } = await req.json();

    if (!productId || !formData?.payer?.email) {
      return new Response(
        JSON.stringify({ error: "Dados de compra incompletos." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Aceita tanto o campo legado (1 destinatário) quanto o novo (vários)
    const recipients: string[] = Array.isArray(giftToUserIds) && giftToUserIds.length > 0
      ? [...new Set(giftToUserIds.filter((id: unknown): id is string => typeof id === "string" && id.length > 0))]
      : giftToUserId ? [giftToUserId] : [];
    const quantity = Math.max(1, recipients.length);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Comprador precisa estar logado (a loja fica atrás de login)
    let buyerId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const authClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { data, error } = await authClient.auth.getUser(authHeader.replace("Bearer ", ""));
      if (error) console.error("Erro ao validar usuário:", error.message);
      buyerId = data.user?.id ?? null;
    }
    if (!buyerId) {
      return new Response(
        JSON.stringify({ error: "Faça login para comprar na Kingdom Store." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Preço SEMPRE do banco — nunca confiar no valor vindo do cliente
    const { data: product } = await serviceClient
      .from("store_products")
      .select("id, nome, preco, status, giftable, limitado, estoque")
      .eq("id", productId)
      .single();

    if (!product || product.status !== "active") {
      return new Response(
        JSON.stringify({ error: "Produto indisponível." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (recipients.length > 0 && !product.giftable) {
      return new Response(
        JSON.stringify({ error: "Este item não pode ser presenteado." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (product.limitado && product.estoque !== null && product.estoque < quantity) {
      return new Response(
        JSON.stringify({ error: recipients.length > 1 ? "Não há estoque suficiente para todos os destinatários." : "Item esgotado." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Presente pra vários: 1 linha de store_purchases por destinatário
    // (preserva o fluxo já existente de abertura/agradecimento por presente),
    // todas amarradas por gift_batch_id — 1 pagamento cobre a compra toda.
    //
    // Idempotência: se o client mandar um clientRequestId (UUID gerado uma
    // vez só por tentativa de compra, reenviado igual em caso de retry de
    // rede), ele vira o próprio gift_batch_id. Isso fecha a janela de
    // "clicou, caiu a conexão, tentou de novo" cobrar duas vezes — se já
    // existir linha com esse id, NÃO cria de novo; se já tiver um status
    // final, devolve ele direto; senão, refaz a chamada ao Mercado Pago
    // reusando a MESMA X-Idempotency-Key, que o proprio MP garante não
    // duplicar (mesma requisição, mesma resposta).
    const isValidUuid = (v: unknown): v is string =>
      typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
    const unitPrice = Number(product.preco);
    const batchId = isValidUuid(clientRequestId) ? clientRequestId : crypto.randomUUID();

    const { data: existingRows } = await serviceClient
      .from("store_purchases")
      .select("id, status, mp_order_id")
      .eq("gift_batch_id", batchId);

    let skipInsert = false;
    if (existingRows && existingRows.length > 0) {
      const allTerminal = existingRows.every((r) => ["approved", "rejected", "cancelled"].includes(r.status));
      if (allTerminal) {
        // Já processado antes (retry tardio) — devolve o resultado que já existe, sem chamar o MP de novo
        const finalStatus = existingRows[0].status;
        if (finalStatus === "rejected" || finalStatus === "cancelled") {
          return new Response(
            JSON.stringify({ error: "Este pagamento já tinha sido recusado anteriormente.", purchaseId: batchId }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
        return new Response(
          JSON.stringify({ purchaseId: batchId, status: finalStatus }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      // Ainda pendente — não insere de novo, só reusa o mesmo lote pra reconsultar o MP abaixo
      skipInsert = true;
    }

    if (!skipInsert) {
      const rows = recipients.length > 0
        ? recipients.map((recipientId) => ({
            buyer_id: buyerId,
            product_id: product.id,
            amount: unitPrice,
            gift_to: recipientId,
            gift_message: giftMessage || null,
            gift_batch_id: batchId,
            status: "pending",
          }))
        : [{
            buyer_id: buyerId,
            product_id: product.id,
            amount: unitPrice,
            gift_to: null,
            gift_message: null,
            gift_batch_id: batchId,
            status: "pending",
          }];

      const { error: insertError } = await serviceClient.from("store_purchases").insert(rows);

      if (insertError) {
        console.error("Erro ao criar compra:", insertError);
        throw new Error("Não foi possível registrar a compra.");
      }
    }

    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!accessToken) throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado.");

    const amountStr = (unitPrice * quantity).toFixed(2);
    const orderBody = {
      type: "online",
      processing_mode: "automatic",
      external_reference: batchId,
      total_amount: amountStr,
      payer: { email: formData.payer.email },
      transactions: {
        payments: [
          { amount: amountStr, payment_method: { id: "pix", type: "bank_transfer" } },
        ],
      },
    };

    const mpHeaders: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": batchId,
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
      await serviceClient.from("store_purchases").update({ status: "rejected" }).eq("gift_batch_id", batchId);
      const causeDetail = Array.isArray(order?.cause)
        ? order.cause.map((c: { description?: string; code?: string }) => c.description || c.code).filter(Boolean).join("; ")
        : null;
      return new Response(
        JSON.stringify({
          error: causeDetail || order?.message || order?.errors?.[0]?.message || "Não foi possível processar o pagamento.",
          purchaseId: batchId,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const paymentInOrder = order.transactions?.payments?.[0];
    const mappedStatus = ORDER_STATUS_MAP[order.status] ?? "pending";

    await serviceClient
      .from("store_purchases")
      .update({
        status: mappedStatus,
        mp_order_id: order.id,
        mp_payment_id: paymentInOrder?.id ? String(paymentInOrder.id) : null,
        updated_at: new Date().toISOString(),
      })
      .eq("gift_batch_id", batchId);

    return new Response(
      JSON.stringify({
        purchaseId: batchId,
        status: mappedStatus,
        qrCode: paymentInOrder?.payment_method?.qr_code ?? null,
        qrCodeBase64: paymentInOrder?.payment_method?.qr_code_base64 ?? null,
        ticketUrl: paymentInOrder?.payment_method?.ticket_url ?? null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Erro em process-store-purchase:", error);
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
