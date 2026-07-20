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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productId, giftToUserId, giftMessage, formData, deviceId } = await req.json();

    if (!productId || !formData?.payer?.email) {
      return new Response(
        JSON.stringify({ error: "Dados de compra incompletos." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

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
    if (giftToUserId && !product.giftable) {
      return new Response(
        JSON.stringify({ error: "Este item não pode ser presenteado." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (product.limitado && product.estoque !== null && product.estoque <= 0) {
      return new Response(
        JSON.stringify({ error: "Item esgotado." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: purchase, error: insertError } = await serviceClient
      .from("store_purchases")
      .insert({
        buyer_id: buyerId,
        product_id: product.id,
        amount: product.preco,
        gift_to: giftToUserId || null,
        gift_message: giftMessage || null,
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError || !purchase) {
      console.error("Erro ao criar compra:", insertError);
      throw new Error("Não foi possível registrar a compra.");
    }

    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!accessToken) throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado.");

    const amountStr = Number(product.preco).toFixed(2);
    const orderBody = {
      type: "online",
      processing_mode: "automatic",
      external_reference: purchase.id,
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
      "X-Idempotency-Key": purchase.id,
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
      await serviceClient.from("store_purchases").update({ status: "rejected" }).eq("id", purchase.id);
      const causeDetail = Array.isArray(order?.cause)
        ? order.cause.map((c: { description?: string; code?: string }) => c.description || c.code).filter(Boolean).join("; ")
        : null;
      return new Response(
        JSON.stringify({
          error: causeDetail || order?.message || order?.errors?.[0]?.message || "Não foi possível processar o pagamento.",
          purchaseId: purchase.id,
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
      .eq("id", purchase.id);

    return new Response(
      JSON.stringify({
        purchaseId: purchase.id,
        status: mappedStatus,
        qrCode: paymentInOrder?.payment_method?.qr_code ?? null,
        qrCodeBase64: paymentInOrder?.payment_method?.qr_code_base64 ?? null,
        ticketUrl: paymentInOrder?.payment_method?.ticket_url ?? null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Erro em process-store-purchase:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
