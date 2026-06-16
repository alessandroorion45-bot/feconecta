import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const THEME_PROMPTS: Record<string, string> = {
  "Criação e Gênesis": "Ultra realistic cinematic biblical scene of the Creation, Garden of Eden with lush paradise, divine golden light rays breaking through clouds, animals and pristine nature, dramatic sky with stars being formed, volumetric lighting, epic composition, 8k digital painting, sacred atmosphere",
  "Êxodo e Libertação": "Ultra realistic cinematic biblical scene, Moses holding glowing stone tablets with divine golden light, Red Sea parting with massive walls of water, desert mountains, dramatic stormy sky, volumetric lighting, epic composition, 8k digital painting",
  "Leis e Levítico": "Ultra realistic cinematic biblical scene of ancient sacred temple interior, golden menorah glowing, stone tablets with commandments, incense smoke rising, divine light beams, marble columns, epic composition, 8k digital painting",
  "Números e Jornada": "Ultra realistic cinematic biblical scene of Israelites journeying through vast desert, pillar of fire and cloud guiding them, tents stretching to horizon, golden sunset, dramatic landscape, volumetric lighting, 8k digital painting",
  "Deuteronômio": "Ultra realistic cinematic biblical scene of Moses on Mount Nebo overlooking the Promised Land, golden sunset over green valleys, dramatic clouds, divine light, epic panoramic composition, 8k digital painting",
  "Josué e Conquista": "Ultra realistic cinematic biblical scene of the walls of Jericho crumbling, trumpets blowing, divine golden light, dust and dramatic sky, warriors with faith, epic action composition, 8k digital painting",
  "Juízes de Israel": "Ultra realistic cinematic biblical scene of Samson with divine strength, ancient battlefield, dramatic golden light breaking through dark clouds, epic heroic composition, 8k digital painting",
  "Rute e Fidelidade": "Ultra realistic cinematic biblical scene of Ruth gleaning wheat in golden harvest fields at sunset, gentle warm light, peaceful countryside, ancient Bethlehem in background, serene composition, 8k digital painting",
  "Samuel e os Reis": "Ultra realistic cinematic biblical scene of young David being anointed by Samuel, oil flask glowing with divine light, humble shepherd setting, golden rays from heaven, epic sacred moment, 8k digital painting",
  "Davi e o Reino": "Ultra realistic cinematic biblical scene of King David playing harp on palace terrace, Jerusalem golden city below, sunset with divine light rays, majestic composition, 8k digital painting",
  "Salmos e Louvor": "Ultra realistic cinematic biblical scene of heavenly worship, golden harps and celestial instruments, divine light cascading through clouds, angels singing, peaceful mountains and still waters, 8k digital painting",
  "Sabedoria e Provérbios": "Ultra realistic cinematic biblical scene of King Solomon on golden throne, ancient scrolls and wisdom books, divine light illuminating knowledge, ornate temple interior, 8k digital painting",
  "Eclesiastes": "Ultra realistic cinematic biblical scene of contemplative philosopher overlooking vast landscape, sunrise and sunset merging, seasons changing, deep golden light, philosophical mood, 8k digital painting",
  "Cânticos": "Ultra realistic cinematic biblical scene of beautiful garden of love, blooming roses and lilies, golden sunset, gentle streams, romantic sacred atmosphere, soft divine light, 8k digital painting",
  "Isaías Profeta": "Ultra realistic cinematic biblical scene of Prophet Isaiah receiving divine vision, seraphim with six wings, throne room of God with smoke and glory, intense golden light, epic sacred composition, 8k digital painting",
  "Jeremias": "Ultra realistic cinematic biblical scene of Prophet Jeremiah weeping over Jerusalem, city in dramatic twilight, scrolls burning, divine light breaking through dark storm clouds, emotional composition, 8k digital painting",
  "Ezequiel": "Ultra realistic cinematic biblical scene of Ezekiel's vision, valley of dry bones coming to life, divine wind and golden light, dramatic supernatural sky, epic prophetic composition, 8k digital painting",
  "Daniel": "Ultra realistic cinematic biblical scene of Daniel in the lions den, peaceful among fierce lions, divine golden protective light, angel standing guard, dramatic torch-lit cave, 8k digital painting",
  "Evangelho de Mateus": "Ultra realistic cinematic biblical scene of the Sermon on the Mount, Jesus teaching crowds on hillside, golden divine light radiating, peaceful Galilee landscape, epic sacred composition, 8k digital painting",
  "Evangelho de Marcos": "Ultra realistic cinematic biblical scene of Jesus calming the storm on Sea of Galilee, dramatic waves, divine golden light breaking through dark clouds, boat with disciples, epic composition, 8k digital painting",
  "Evangelho de Lucas": "Ultra realistic cinematic biblical scene of the Nativity, baby Jesus in manger with divine golden glow, star of Bethlehem shining bright, shepherds approaching, peaceful sacred night, 8k digital painting",
  "Evangelho de João": "Ultra realistic cinematic biblical scene of Jesus as the Light of the World, radiant divine golden glow, darkness retreating, symbolic imagery of vine and branches, epic spiritual composition, 8k digital painting",
  "Atos dos Apóstolos": "Ultra realistic cinematic biblical scene of Pentecost, tongues of fire descending on apostles, divine wind and golden light filling the room, dramatic sacred moment, epic composition, 8k digital painting",
  "Epístola aos Romanos": "Ultra realistic cinematic biblical scene of ancient Rome with Christian cross glowing with divine golden light over the Colosseum, dramatic sky, faith conquering empire, epic composition, 8k digital painting",
  "Coríntios": "Ultra realistic cinematic biblical scene of ancient Corinth church gathering, diverse believers united, golden divine light streaming through windows, love and unity theme, sacred atmosphere, 8k digital painting",
  "Gálatas": "Ultra realistic cinematic biblical scene of broken chains and freedom, dove flying into golden divine light, green pastures of liberty, dramatic sky of transformation, epic composition, 8k digital painting",
  "Epístola aos Efésios": "Ultra realistic cinematic biblical scene of spiritual armor of God, glowing golden shield of faith and sword of spirit, divine warrior standing in light, epic dramatic composition, 8k digital painting",
  "Filipenses": "Ultra realistic cinematic biblical scene of Paul writing letters in prison cell, divine golden light streaming through window bars, joy despite chains, scroll and ink, intimate sacred moment, 8k digital painting",
  "Colossenses": "Ultra realistic cinematic biblical scene of Christ supreme over creation, cosmic divine golden light, galaxies and earth below, majestic throne above all, epic universal composition, 8k digital painting",
  "Epístola aos Hebreus": "Ultra realistic cinematic biblical scene of heavenly temple with golden altar, high priest entering holy of holies, divine light and glory, ancient sacred architecture, epic composition, 8k digital painting",
  "Epístola de Tiago": "Ultra realistic cinematic biblical scene of faithful hands working and praying, golden wheat fields, simple honest life, divine light blessing labor, warm sacred atmosphere, 8k digital painting",
  "Apocalipse e Revelação": "Ultra realistic cinematic biblical scene of the New Jerusalem descending from heaven, gates of pearl and streets of gold, divine light everywhere, dramatic cosmic sky, ultimate epic composition, 8k digital painting",
};

const DEFAULT_PROMPT = "Ultra realistic cinematic biblical scene, ancient scrolls and open Bible with divine golden light rays, peaceful sacred atmosphere, mountains and clouds, volumetric lighting, epic composition, 8k digital painting";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the caller
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { theme } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const prompt = THEME_PROMPTS[theme] || DEFAULT_PROMPT;
    console.log("Generating theme image for:", theme);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited. Try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageUrl) {
      console.error("No image in response:", JSON.stringify(data).slice(0, 200));
      throw new Error("No image generated");
    }

    return new Response(
      JSON.stringify({ imageUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating theme image:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
