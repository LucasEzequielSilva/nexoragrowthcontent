import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { contentId } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get the content to analyze
    const { data: content, error: fetchError } = await supabase
      .from('competitor_content')
      .select('*, competitors(name)')
      .eq('id', contentId)
      .single()

    if (fetchError || !content) {
      return new Response(JSON.stringify({ error: 'Contenido no encontrado' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const competitorName = (content as any).competitors?.name || 'Desconocido'
    const textToAnalyze = content.content_body || content.title

    // Analyze with Groq
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('GROQ_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `Sos un analista de contenido para Nexora, una agencia AI-native de MVPs en Argentina.
Tu trabajo es analizar contenido de competidores y extraer insights accionables enfocados en PRODUCTO y MVP.
Respondé siempre en español (LATAM). Enfocate en:
- ¿Qué insights de producto/MVP revela este contenido?
- ¿Qué estrategia de contenido está usando el competidor?
- ¿Qué funcionó bien (engagement, posicionamiento)?
- ¿Cómo puede Nexora adaptar esto para su audiencia LATAM?

Respondé en JSON con keys: summary, tags (array de strings), analysis (objeto con: product_insights, content_strategy, what_worked, nexora_opportunity).`
          },
          {
            role: 'user',
            content: `Analizá este contenido de ${competitorName}:\n\n${textToAnalyze?.slice(0, 8000)}`
          }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    })

    const groqData = await groqRes.json()
    const result = JSON.parse(groqData.choices[0].message.content || '{}')

    // Update competitor_content with analysis
    await supabase
      .from('competitor_content')
      .update({
        is_analyzed: true,
        analysis_notes: JSON.stringify(result.analysis || {}, null, 2),
        tags: result.tags || [],
      })
      .eq('id', contentId)

    // Store in knowledge_base
    await supabase.from('knowledge_base').insert({
      source_type: 'competitor_content',
      competitor_id: content.competitor_id,
      competitor_content_id: contentId,
      title: content.title,
      content: textToAnalyze,
      summary: result.summary,
      tags: result.tags,
      analysis: result.analysis,
    })

    return new Response(JSON.stringify({
      success: true,
      summary: result.summary,
      tags: result.tags,
      analysis: result.analysis,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
