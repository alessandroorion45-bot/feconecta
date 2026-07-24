import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limit: no máximo 15 gerações de quiz por usuário por hora
    const { data: allowed } = await authClient.rpc('check_ai_rate_limit', {
      p_user_id: claimsData.claims.sub,
      p_action: 'generate-quiz-questions',
      p_max: 15,
      p_window_seconds: 3600,
    });
    if (allowed === false) {
      return new Response(
        JSON.stringify({ error: 'Você atingiu o limite de gerações de quiz por enquanto. Tente novamente daqui a pouco.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { bookName, chapter, verseTexts } = await req.json();

    if (!bookName || !chapter || !verseTexts) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: bookName, chapter, verseTexts' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = `Você é um especialista em estudos bíblicos. Com base no capítulo ${chapter} do livro de ${bookName} da Bíblia, gere exatamente 5 questões de múltipla escolha para testar a compreensão do texto.

Texto do capítulo:
${verseTexts}

REGRAS IMPORTANTES:
1. As questões devem ser sobre fatos específicos mencionados no texto
2. Cada questão deve ter 4 alternativas (A, B, C, D)
3. Apenas uma alternativa é correta
4. As alternativas incorretas devem ser plausíveis mas claramente erradas
5. Varie a dificuldade das questões
6. Use linguagem clara e acessível

Retorne APENAS um JSON válido no seguinte formato, sem nenhum texto adicional:
{
  "questions": [
    {
      "question": "Pergunta aqui?",
      "options": {
        "A": "Alternativa A",
        "B": "Alternativa B", 
        "C": "Alternativa C",
        "D": "Alternativa D"
      },
      "correctAnswer": "A",
      "explanation": "Breve explicação do porquê esta é a resposta correta"
    }
  ]
}`;

    // Using Lovable AI with Gemini
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY') || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      
      // Fallback: generate simple questions
      const fallbackQuestions = generateFallbackQuestions(bookName, chapter);
      return new Response(
        JSON.stringify({ questions: fallbackQuestions }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.content[0].text;
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse AI response as JSON');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    return new Response(
      JSON.stringify(parsed),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating quiz:', error);
    
    // Return fallback questions on any error
    const fallbackQuestions = generateFallbackQuestions('Gênesis', 1);
    return new Response(
      JSON.stringify({ questions: fallbackQuestions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateFallbackQuestions(bookName: string, chapter: number) {
  return [
    {
      question: `O que você aprendeu no capítulo ${chapter} de ${bookName}?`,
      options: {
        A: "Uma lição sobre fé",
        B: "Uma lição sobre amor",
        C: "Uma lição sobre esperança",
        D: "Uma lição sobre perseverança"
      },
      correctAnswer: "A",
      explanation: "Todas as respostas são válidas para reflexão pessoal."
    },
    {
      question: `Qual é a mensagem central deste capítulo?`,
      options: {
        A: "Confiar em Deus",
        B: "Amar ao próximo",
        C: "Ter paciência",
        D: "Buscar sabedoria"
      },
      correctAnswer: "A",
      explanation: "Confiar em Deus é um tema central em toda a Bíblia."
    },
    {
      question: `Como este capítulo se aplica à sua vida?`,
      options: {
        A: "Através da oração",
        B: "Através do estudo",
        C: "Através da prática",
        D: "Todas as anteriores"
      },
      correctAnswer: "D",
      explanation: "A aplicação da Palavra envolve múltiplas práticas."
    },
    {
      question: `Qual valor cristão é destacado nesta passagem?`,
      options: {
        A: "Humildade",
        B: "Generosidade",
        C: "Compaixão",
        D: "Obediência"
      },
      correctAnswer: "D",
      explanation: "A obediência a Deus é fundamental na vida cristã."
    },
    {
      question: `O que podemos aprender sobre o caráter de Deus?`,
      options: {
        A: "Ele é fiel",
        B: "Ele é justo",
        C: "Ele é amoroso",
        D: "Todas as anteriores"
      },
      correctAnswer: "D",
      explanation: "Deus manifesta todos esses atributos perfeitamente."
    }
  ];
}
