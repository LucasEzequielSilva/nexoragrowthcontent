import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get last 7 days of analyzed content
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const { data: recentContent } = await supabase
      .from('competitor_content')
      .select('*, competitors(name)')
      .eq('is_analyzed', true)
      .gte('created_at', weekAgo.toISOString())
      .order('created_at', { ascending: false })

    if (!recentContent?.length) {
      return new Response(JSON.stringify({
        error: 'No hay contenido analizado de esta semana. Ingresá contenido de competidores primero.'
      }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const contentForBrief = recentContent.map((c: any) => ({
      competitor: c.competitors?.name || 'Desconocido',
      title: c.title,
      summary: c.analysis_notes || '',
      tags: c.tags || [],
    }))

    // Generate brief with Groq
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
            content: `Sos el generador de briefs semanales para Nexora Content Engine.
Analizá el contenido de competidores de la semana y generá:
1. Highlights de competidores (qué publicaron y por qué importa)
2. Temas trending entre todos los competidores
3. 3-5 ideas de contenido sugeridas para Lucas (enfocadas en PRODUCTO/MVP, NO en tutoriales de vibe coding)

Lucas es un experto en producto en Argentina que construye MVPs con AI. Su contenido tiene que atraer founders que necesitan MVPs.
Respondé siempre en español (LATAM).
Respondé en JSON con keys: competitor_highlights (array con {competitor, title, insight}), trending_topics (array de strings), suggested_content (array con {title, platform, pillar, rationale}).`
          },
          {
            role: 'user',
            content: `Contenido de competidores de esta semana:\n\n${JSON.stringify(contentForBrief, null, 2)}`
          }
        ],
        temperature: 0.5,
        response_format: { type: 'json_object' },
      }),
    })

    const groqData = await groqRes.json()
    const brief = JSON.parse(groqData.choices[0].message.content || '{}')

    // Store brief
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())

    const { data: savedBrief, error } = await supabase.from('weekly_briefs').insert({
      week_start: weekStart.toISOString().split('T')[0],
      competitor_highlights: brief.competitor_highlights || [],
      trending_topics: brief.trending_topics || [],
      suggested_content: brief.suggested_content || [],
    }).select().single()

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({
      success: true,
      brief: savedBrief,
      highlights_count: brief.competitor_highlights?.length || 0,
      topics: brief.trending_topics || [],
      suggestions_count: brief.suggested_content?.length || 0,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
