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
    const url = new URL(req.url);
    const purchaseId = url.searchParams.get("id");
    if (!purchaseId) {
      return new Response(
        JSON.stringify({ error: "id é obrigatório." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: purchase } = await serviceClient
      .from("store_purchases")
      .select("id, status, fulfilled, buyer_id, gift_to, gift_message, mp_order_id, product_id")
      .eq("id", purchaseId)
      .single();

    if (!purchase) {
      return new Response(
        JSON.stringify({ error: "Compra não encontrada." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let status = purchase.status;

    // Sem webhook na API de Orders: confere direto no Mercado Pago enquanto pendente
    if (status === "pending" && purchase.mp_order_id) {
      const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
      if (accessToken) {
        const orderResponse = await fetch(
          `https://api.mercadopago.com/v1/orders/${purchase.mp_order_id}`,
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );
        if (orderResponse.ok) {
          const order = await orderResponse.json();
          const fresh = ORDER_STATUS_MAP[order.status] ?? "pending";
          if (fresh !== status) {
            status = fresh;
            await serviceClient
              .from("store_purchases")
              .update({ status: fresh, updated_at: new Date().toISOString() })
              .eq("id", purchase.id);
          }
        }
      }
    }

    // Entrega o item exatamente uma vez (idempotente via flag fulfilled)
    if (status === "approved" && !purchase.fulfilled) {
      const { data: claimed } = await serviceClient
        .from("store_purchases")
        .update({ fulfilled: true })
        .eq("id", purchase.id)
        .eq("fulfilled", false)
        .select("id")
        .maybeSingle();

      if (claimed) {
        const { data: product } = await serviceClient
          .from("store_products")
          .select("id, nome, tipo, badge_id, cosmetic_key, limitado, estoque")
          .eq("id", purchase.product_id)
          .single();

        const recipient = purchase.gift_to || purchase.buyer_id;

        if (product && recipient) {
          if (product.tipo === "selo" && product.badge_id) {
            await serviceClient.from("user_badges").insert({
              user_id: recipient,
              badge_id: product.badge_id,
              concedido_por: purchase.gift_to ? purchase.buyer_id : null,
              observacao: purchase.gift_to
                ? `Presente: ${purchase.gift_message || "sem mensagem"}`
                : "Compra na Kingdom Store",
            }).then(({ error }) => {
              // duplicado (já possui) não é erro fatal
              if (error && !error.message.includes("duplicate")) console.error("Erro ao conceder selo:", error);
            });
          } else if (product.cosmetic_key) {
            await serviceClient.from("user_cosmetics").insert({
              user_id: recipient,
              product_id: product.id,
              cosmetic_key: product.cosmetic_key,
              tipo: product.tipo,
              acquired_via: purchase.gift_to ? "gift" : "purchase",
              gifted_by: purchase.gift_to ? purchase.buyer_id : null,
            }).then(({ error }) => {
              if (error && !error.message.includes("duplicate")) console.error("Erro ao conceder cosmético:", error);
            });
          }

          if (product.limitado && product.estoque !== null) {
            await serviceClient
              .from("store_products")
              .update({ estoque: Math.max(0, product.estoque - 1) })
              .eq("id", product.id);
          }

          if (purchase.gift_to) {
            let senderName = "Alguém";
            const { data: senderProfile } = await serviceClient
              .from("profiles")
              .select("full_name")
              .eq("id", purchase.buyer_id)
              .maybeSingle();
            if (senderProfile?.full_name) senderName = senderProfile.full_name;

            await serviceClient.from("notifications").insert({
              user_id: purchase.gift_to,
              actor_id: purchase.buyer_id,
              type: "gift_received",
              content: `🎁 ${senderName} te presenteou com "${product.nome}"!${purchase.gift_message ? ` — "${purchase.gift_message}"` : ""}`,
              reference_id: purchase.id,
            });
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ status }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Erro em check-purchase-status:", error);
    return new Response(
      JSON.stringify({ error: "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
