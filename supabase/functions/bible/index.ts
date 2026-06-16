import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-path, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

async function getCachedVerses(bookName: string, chapter: number): Promise<any[] | null> {
  try {
    const { data, error } = await supabase
      .from('versiculos')
      .select('*')
      .eq('livro', bookName)
      .eq('capitulo', chapter)
      .order('versiculo', { ascending: true })

    if (error) {
      console.error('Error fetching cached verses:', error)
      return null
    }

    if (data && data.length > 0) {
      console.log(`Found ${data.length} cached verses for ${bookName} ${chapter}`)
      return data.map(v => ({
        number: v.versiculo,
        verse: v.texto_final,
        id: v.versiculo
      }))
    }

    return null
  } catch (error) {
    console.error('Cache lookup error:', error)
    return null
  }
}

async function cacheTranslatedVerses(bookName: string, chapter: number, verses: any[]) {
  try {
    const versesToCache = verses.map(v => ({
      livro: bookName,
      capitulo: chapter,
      versiculo: v.number,
      texto_original: v.verse, // Spanish text
      texto_final: v.verse, // Translated Portuguese text
      idioma: 'pt-br'
    }))

    const { error } = await supabase
      .from('versiculos')
      .upsert(versesToCache, { 
        onConflict: 'livro,capitulo,versiculo',
        ignoreDuplicates: false 
      })

    if (error) {
      console.error('Error caching verses:', error)
    } else {
      console.log(`Cached ${verses.length} verses for ${bookName} ${chapter}`)
    }
  } catch (error) {
    console.error('Cache save error:', error)
  }
}

async function translateVerses(verses: any[], bookName: string, chapter: number): Promise<any[]> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  if (!LOVABLE_API_KEY) {
    console.warn('LOVABLE_API_KEY not found, returning verses without translation');
    return verses;
  }

  try {
    // Prepare verses text for translation
    const versesText = verses.map((v, i) => `${i + 1}. ${v.verse}`).join('\n');
    
    const systemPrompt = `Você é um tradutor bíblico especializado em espiritualidade cristã. Sua tarefa é traduzir versículos da Bíblia do espanhol para o português brasileiro, mantendo o estilo reverente, claro e fiel à versão NVI.

IMPORTANTE:
- Traduza APENAS o texto dos versículos
- Mantenha a numeração exatamente como fornecida
- Use linguagem acessível e espiritual
- Evite termos arcaicos
- Preserve o significado original
- Não adicione comentários ou explicações
- Retorne apenas os versículos traduzidos na mesma estrutura

Exemplo de formato esperado:
1. Texto do versículo 1 traduzido
2. Texto do versículo 2 traduzido`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Traduza os seguintes versículos do espanhol para o português brasileiro:\n\n${versesText}` }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI translation error:', response.status, errorText);
      return verses; // Return original verses if translation fails
    }

    const aiResponse = await response.json();
    const translatedText = aiResponse.choices?.[0]?.message?.content;

    if (!translatedText) {
      console.warn('No translation received from AI');
      return verses;
    }

    // Parse translated verses
    const translatedLines = translatedText.trim().split('\n').filter((line: string) => line.trim());
    const translatedVerses = verses.map((verse, index) => {
      const translatedLine = translatedLines.find((line: string) => 
        line.trim().startsWith(`${index + 1}.`)
      );
      
      if (translatedLine) {
        const translatedText = translatedLine.replace(/^\d+\.\s*/, '').trim();
        return { ...verse, verse: translatedText };
      }
      
      return verse; // Keep original if translation not found
    });

    // Cache translated verses for future use
    await cacheTranslatedVerses(bookName, chapter, translatedVerses);

    return translatedVerses;
  } catch (error) {
    console.error('Translation error:', error);
    return verses; // Return original verses on error
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Authenticate the caller
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const authClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token)
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const url = new URL(req.url)
    // Support both URL path and x-path header for routing
    const urlPath = url.pathname.replace(/^\/bible\/?/, '')
    const headerPath = req.headers.get('x-path') || ''
    const path = headerPath || urlPath

    console.log('Bible API request path:', path);

    const baseUrl = 'https://bible-api.deno.dev'
    
    // Route: GET /books - List all books
    if (path === 'books' || path === '') {
      console.log('Fetching books list');
      const response = await fetch(`${baseUrl}/api/books`)
      const data = await response.json()
      console.log('Books fetched:', data.length);
      
      return new Response(
        JSON.stringify(data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Route: GET /books/:abbrev/chapters/:chapter - Get chapter with verses
    if (path.includes('/chapters/')) {
      const parts = path.split('/')
      const abbrev = parts[1].toLowerCase()
      const chapter = parseInt(parts[3])
      
      console.log(`Fetching chapter ${chapter} of book ${abbrev}`);
      
      // First, try to get from cache
      const response = await fetch(`${baseUrl}/api/read/nvi/${abbrev}/${chapter}`)
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('External API error:', response.status, errorText);
        throw new Error(`External API returned ${response.status}: ${errorText}`);
      }
      
      const data = await response.json()
      const bookName = data.name || abbrev;
      
      // Check cache first
      const cachedVerses = await getCachedVerses(bookName, chapter);
      
      if (cachedVerses) {
        console.log('Using cached translated verses');
        data.vers = cachedVerses;
      } else {
        console.log('No cache found, translating verses...');
        // Translate and cache
        data.vers = await translateVerses(data.vers, bookName, chapter);
      }
      
      console.log('Response ready');
      
      return new Response(
        JSON.stringify(data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Route not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Bible API error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
