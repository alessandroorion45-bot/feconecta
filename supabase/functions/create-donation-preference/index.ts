import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://aliancakingdom.com.br";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount, isAnonymous, isPublic, donorName, donorCity, preferredMethod } = await req.json();

    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      return new Response(
        JSON.stringify({ error: "Valor inválido." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Doação identificada (opcional): se o usuário estiver logado, vincula o user_id
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
        preferred_method: preferredMethod || null,
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

    const preferenceBody = {
      items: [
        {
          title: "Doação - Aliança Kingdom",
          quantity: 1,
          unit_price: parsedAmount,
          currency_id: "BRL",
        },
      ],
      external_reference: donation.id,
      back_urls: {
        success: `${SITE_URL}/sobre-o-projeto?donation=${donation.id}&status=success`,
        pending: `${SITE_URL}/sobre-o-projeto?donation=${donation.id}&status=pending`,
        failure: `${SITE_URL}/sobre-o-projeto?donation=${donation.id}&status=failure`,
      },
      auto_return: "approved",
      notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
      statement_descriptor: "ALIANCA KINGDOM",
    };

    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preferenceBody),
    });

    if (!mpResponse.ok) {
      const errorText = await mpResponse.text();
      console.error("Erro do Mercado Pago:", mpResponse.status, errorText);
      throw new Error("Não foi possível iniciar o pagamento no Mercado Pago.");
    }

    const preference = await mpResponse.json();

    await serviceClient
      .from("donations")
      .update({ mp_preference_id: preference.id })
      .eq("id", donation.id);

    return new Response(
      JSON.stringify({
        donationId: donation.id,
        initPoint: preference.init_point,
        sandboxInitPoint: preference.sandbox_init_point,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Erro em create-donation-preference:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
