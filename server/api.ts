/**
 * Nexora Content Engine — API Server
 * Runs alongside the frontend, exposes AI functions via HTTP endpoints
 *
 * Start: npx tsx server/api.ts
 */

import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { scrapeCompetitor } from './apify.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY!
);

const GROQ_KEY = process.env.GROQ_API_KEY!;

// Helper: call Groq
async function callGroq(messages: any[], temperature = 0.3) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature,
      response_format: { type: 'json_object' },
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return JSON.parse(data.choices[0].message.content || '{}');
}

// Helper: obtener contexto del negocio para prompts AI
async function getBusinessContext(): Promise<string> {
  const { data } = await supabase
    .from('business_profile')
    .select('*')
    .limit(1)
    .single();

  if (!data) return 'Nexora — agencia AI-native de MVPs en Argentina.';

  const parts = [
    data.brand_name && `Marca: ${data.brand_name}`,
    data.tagline && `Tagline: ${data.tagline}`,
    data.services && `Servicios: ${data.services}`,
    data.price_range && `Rango de precios: ${data.price_range}`,
    data.ideal_client && `Cliente ideal: ${data.ideal_client}`,
    data.differentiator && `Diferenciador: ${data.differentiator}`,
    data.tone_and_style && `Tono y estilo: ${data.tone_and_style}`,
    data.brand_story && `Historia: ${data.brand_story}`,
    data.goals && `Objetivos: ${data.goals}`,
    data.avoid_topics && `Evitar: ${data.avoid_topics}`,
  ].filter(Boolean);

  return parts.join('\n');
}

// ==========================================
// POST /api/analyze — Analizar contenido de un competidor
// ==========================================
app.post('/api/analyze', async (req, res) => {
  try {
    const { contentId } = req.body;

    const { data: content, error } = await supabase
      .from('competitor_content')
      .select('*, competitors(name)')
      .eq('id', contentId)
      .single();

    if (error || !content) {
      return res.status(404).json({ error: 'Contenido no encontrado' });
    }

    const competitorName = (content as any).competitors?.name || 'Desconocido';
    const text = content.content_body || content.title;

    const result = await callGroq([
      {
        role: 'system',
        content: `Sos un analista de contenido para Nexora, una agencia AI-native de MVPs en Argentina.
Analizá contenido de competidores y extraé insights accionables sobre PRODUCTO y MVP.
Respondé en español (LATAM) en JSON con: summary, tags (array), analysis (objeto con: product_insights, content_strategy, what_worked, nexora_opportunity).`
      },
      {
        role: 'user',
        content: `Analizá este contenido de ${competitorName}:\n\n${text?.slice(0, 8000)}`
      }
    ]);

    // Update competitor_content
    await supabase
      .from('competitor_content')
      .update({
        is_analyzed: true,
        analysis_notes: JSON.stringify(result.analysis || {}, null, 2),
        tags: result.tags || [],
      })
      .eq('id', contentId);

    // Store in knowledge_base
    await supabase.from('knowledge_base').insert({
      source_type: 'competitor_content',
      competitor_id: content.competitor_id,
      competitor_content_id: contentId,
      title: content.title,
      content: text,
      summary: result.summary,
      tags: result.tags,
      analysis: result.analysis,
    });

    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// POST /api/generate-brief — Generar brief semanal
// ==========================================
app.post('/api/generate-brief', async (req, res) => {
  try {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 14); // últimas 2 semanas para tener más data

    const { data: recentContent } = await supabase
      .from('competitor_content')
      .select('*, competitors(name)')
      .eq('is_analyzed', true)
      .gte('created_at', weekAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(20);

    if (!recentContent?.length) {
      return res.status(400).json({
        error: 'No hay contenido analizado reciente. Ingresá y analizá contenido de competidores primero.'
      });
    }

    const contentForBrief = recentContent.map((c: any) => ({
      competitor: c.competitors?.name || 'Desconocido',
      title: c.title,
      summary: c.analysis_notes || '',
      tags: c.tags || [],
    }));

    const businessContext = await getBusinessContext();

    const brief = await callGroq([
      {
        role: 'system',
        content: `Sos el generador de briefs semanales para Nexora Content Engine.
Analizá contenido de competidores y generá:
1. Highlights (qué publicaron y por qué importa)
2. Temas trending
3. 3-5 ideas de contenido enfocadas en el negocio (NO tutoriales genéricos de herramientas)

Contexto del negocio:
${businessContext}

Respondé en español (LATAM) en JSON con: competitor_highlights (array con {competitor, title, insight}), trending_topics (array strings), suggested_content (array con {title, platform, pillar, rationale}).`
      },
      {
        role: 'user',
        content: `Contenido de competidores reciente:\n\n${JSON.stringify(contentForBrief, null, 2)}`
      }
    ], 0.5);

    // Store
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    const { data: saved, error } = await supabase.from('weekly_briefs').insert({
      week_start: weekStart.toISOString().split('T')[0],
      competitor_highlights: brief.competitor_highlights || [],
      trending_topics: brief.trending_topics || [],
      suggested_content: brief.suggested_content || [],
    }).select().single();

    if (error) return res.status(500).json({ error: error.message });

    res.json({ success: true, brief: saved });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// POST /api/generate-idea — Generar idea de contenido con AI
// ==========================================
app.post('/api/generate-idea', async (req, res) => {
  try {
    const { pillar, platform } = req.body;

    // Get recent analyzed content for context
    const { data: recentContent } = await supabase
      .from('competitor_content')
      .select('title, analysis_notes, tags')
      .eq('is_analyzed', true)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get existing ideas to avoid duplicates
    const { data: existingIdeas } = await supabase
      .from('content_ideas')
      .select('title')
      .order('created_at', { ascending: false })
      .limit(20);

    const context = (recentContent || []).map(c => `${c.title}: ${c.analysis_notes}`).join('\n');
    const existing = (existingIdeas || []).map(i => i.title);

    const businessContext = await getBusinessContext();

    const result = await callGroq([
      {
        role: 'system',
        content: `Sos el estratega de contenido para el siguiente negocio. Tu trabajo es generar ideas que posicionen a la marca y atraigan clientes ideales.

Contexto del negocio:
${businessContext}

Respondé en español (LATAM) en JSON con: title, description, key_message, content_type, draft_outline.`
      },
      {
        role: 'user',
        content: `Generá una idea de contenido única para Lucas.

Contexto de competidores: ${context.slice(0, 4000)}

Ideas existentes (NO repetir): ${existing.join(', ')}

Pilar: ${pillar || 'cualquiera'}
Plataforma: ${platform || 'cualquiera'}`
      }
    ], 0.7);

    res.json({ success: true, idea: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// POST /api/generate-draft — Generar borrador para una idea
// ==========================================
app.post('/api/generate-draft', async (req, res) => {
  try {
    const { ideaId } = req.body;

    const { data: idea, error } = await supabase
      .from('content_ideas')
      .select('*')
      .eq('id', ideaId)
      .single();

    if (error || !idea) return res.status(404).json({ error: 'Idea no encontrada' });

    // Get related competitor content for context
    const { data: related } = await supabase
      .from('knowledge_base')
      .select('title, summary, tags')
      .order('created_at', { ascending: false })
      .limit(5);

    const context = (related || []).map(r => `${r.title}: ${r.summary}`).join('\n');

    const businessContext = await getBusinessContext();

    const result = await callGroq([
      {
        role: 'system',
        content: `Sos el escritor de contenido para el siguiente negocio.
Escribí el borrador completo del contenido. Si es video/YouTube: guion con intro, desarrollo, cierre.
Si es tweet/thread: texto listo para publicar. Si es LinkedIn: post completo.

Contexto del negocio:
${businessContext}

Respondé en JSON con: draft (string con el contenido completo), hooks (array de 3 opciones de gancho/intro), cta (call to action sugerido).`
      },
      {
        role: 'user',
        content: `Escribí un borrador para esta idea:

Título: ${idea.title}
Descripción: ${idea.description || ''}
Plataforma: ${idea.platform}
Tipo: ${idea.content_type}
Mensaje clave: ${idea.key_message || ''}
Audiencia: ${idea.target_audience || 'Founders LATAM'}

Contexto de competidores para referencia:\n${context.slice(0, 3000)}`
      }
    ], 0.6);

    // Update idea with draft
    await supabase
      .from('content_ideas')
      .update({
        draft_content: result.draft,
        status: idea.status === 'idea' ? 'drafting' : idea.status,
      })
      .eq('id', ideaId);

    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// POST /api/generate-carousel — Generar copy para carrusel
// ==========================================
app.post('/api/generate-carousel', async (req, res) => {
  try {
    const { title, slideCount = 7 } = req.body;

    if (!title) return res.status(400).json({ error: 'Falta el título del carrusel' });

    const businessContext = await getBusinessContext();

    const result = await callGroq([
      {
        role: 'system',
        content: `Sos el copywriter para el siguiente negocio.

Contexto del negocio:
${businessContext}

Generá el copy completo para un carrusel de ${slideCount} slides.
El primer slide es el COVER (gancho que frena el scroll).
El último slide es el CTA (call to action).
Los del medio son el contenido.

Respondé en español (LATAM) en JSON con: slides (array de objetos con {slide_type, title, copy, description}).
- slide_type: "cover" para el primero, "cta" para el último, "content" para el resto
- title: título bold del slide
- copy: texto principal (2-3 líneas max)
- description: nota visual sugerida (qué imagen/mockup/screenshot poner)`
      },
      {
        role: 'user',
        content: `Generá el copy para un carrusel sobre: "${title}"`
      }
    ], 0.7);

    res.json({ success: true, slides: result.slides || [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// GET /api/business-profile — Obtener perfil de negocio
// ==========================================
app.get('/api/business-profile', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('business_profile')
      .select('*')
      .limit(1)
      .single();

    if (error && error.code === 'PGRST116') {
      // No profile yet — return empty
      return res.json({ profile: null });
    }
    if (error) return res.status(500).json({ error: error.message });

    res.json({ profile: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// PUT /api/business-profile — Guardar/actualizar perfil de negocio
// ==========================================
app.put('/api/business-profile', async (req, res) => {
  try {
    const profile = req.body;

    if (profile.id) {
      // Update existing
      const { data, error } = await supabase
        .from('business_profile')
        .update(profile)
        .eq('id', profile.id)
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });
      return res.json({ profile: data });
    }

    // Insert new
    const { data, error } = await supabase
      .from('business_profile')
      .insert(profile)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ profile: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// POST /api/scrape-competitor — Scraping de contenido con Apify
// ==========================================
app.post('/api/scrape-competitor', async (req, res) => {
  try {
    const { competitorId, platform, maxPosts = 20 } = req.body;

    if (!competitorId || !platform) {
      return res.status(400).json({ error: 'Faltan competitorId y platform' });
    }

    // Get competitor and their platform URL
    const { data: competitor, error: compError } = await supabase
      .from('competitors')
      .select('*')
      .eq('id', competitorId)
      .single();

    if (compError || !competitor) {
      return res.status(404).json({ error: 'Competidor no encontrado' });
    }

    const platforms = (competitor.platforms || {}) as Record<string, string>;
    const profileUrl = platforms[platform];

    if (!profileUrl) {
      return res.status(400).json({
        error: `El competidor "${competitor.name}" no tiene perfil de ${platform} configurado`
      });
    }

    // Scrape with Apify
    const scraped = await scrapeCompetitor(platform, profileUrl, maxPosts);

    if (scraped.length === 0) {
      return res.json({ success: true, inserted: 0, message: 'No se encontró contenido nuevo' });
    }

    // Get existing URLs to avoid duplicates
    const { data: existing } = await supabase
      .from('competitor_content')
      .select('url')
      .eq('competitor_id', competitorId)
      .eq('platform', platform);

    const existingUrls = new Set((existing || []).map(e => e.url));

    // Filter out duplicates and insert new content
    const newContent = scraped
      .filter(item => item.url && !existingUrls.has(item.url))
      .map(item => ({
        competitor_id: competitorId,
        platform: item.platform,
        title: item.title || 'Sin título',
        url: item.url,
        content_body: item.content_body || null,
        engagement_metrics: item.engagement_metrics,
        published_at: item.published_at,
        tags: [],
        is_analyzed: false,
      }));

    if (newContent.length === 0) {
      return res.json({ success: true, inserted: 0, message: 'Todo el contenido ya estaba cargado' });
    }

    const { error: insertError } = await supabase
      .from('competitor_content')
      .insert(newContent);

    if (insertError) {
      return res.status(500).json({ error: insertError.message });
    }

    // Update competitor audience_size with latest metrics
    const totalEngagement = scraped.reduce((acc, item) => {
      return {
        ...acc,
        avg_likes: (acc.avg_likes || 0) + (item.engagement_metrics.likes || 0),
        avg_views: (acc.avg_views || 0) + (item.engagement_metrics.views || 0),
      };
    }, {} as Record<string, number>);

    const count = scraped.length;
    const audienceUpdate = {
      ...(competitor.audience_size as Record<string, any> || {}),
      [`${platform}_avg_likes`]: Math.round((totalEngagement.avg_likes || 0) / count),
      [`${platform}_avg_views`]: Math.round((totalEngagement.avg_views || 0) / count),
      [`${platform}_last_scraped`]: new Date().toISOString(),
    };

    await supabase
      .from('competitors')
      .update({ audience_size: audienceUpdate })
      .eq('id', competitorId);

    res.json({
      success: true,
      inserted: newContent.length,
      total_scraped: scraped.length,
      duplicates_skipped: scraped.length - newContent.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// POST /api/scrape-all — Scraping de todas las plataformas de un competidor
// ==========================================
app.post('/api/scrape-all', async (req, res) => {
  try {
    const { competitorId, maxPosts = 15 } = req.body;

    if (!competitorId) {
      return res.status(400).json({ error: 'Falta competitorId' });
    }

    const { data: competitor, error: compError } = await supabase
      .from('competitors')
      .select('*')
      .eq('id', competitorId)
      .single();

    if (compError || !competitor) {
      return res.status(404).json({ error: 'Competidor no encontrado' });
    }

    const platforms = (competitor.platforms || {}) as Record<string, string>;
    const supportedPlatforms = ['instagram', 'tiktok', 'youtube'];
    const toScrape = Object.keys(platforms).filter(p => supportedPlatforms.includes(p) && platforms[p]);

    if (toScrape.length === 0) {
      return res.status(400).json({
        error: `${competitor.name} no tiene plataformas soportadas para scraping (instagram, tiktok, youtube)`
      });
    }

    const results: Record<string, any> = {};

    for (const platform of toScrape) {
      try {
        // Call scrape-competitor logic inline
        const scraped = await scrapeCompetitor(platform, platforms[platform], maxPosts);

        const { data: existing } = await supabase
          .from('competitor_content')
          .select('url')
          .eq('competitor_id', competitorId)
          .eq('platform', platform);

        const existingUrls = new Set((existing || []).map(e => e.url));

        const newContent = scraped
          .filter(item => item.url && !existingUrls.has(item.url))
          .map(item => ({
            competitor_id: competitorId,
            platform: item.platform,
            title: item.title || 'Sin título',
            url: item.url,
            content_body: item.content_body || null,
            engagement_metrics: item.engagement_metrics,
            published_at: item.published_at,
            tags: [],
            is_analyzed: false,
          }));

        if (newContent.length > 0) {
          await supabase.from('competitor_content').insert(newContent);
        }

        results[platform] = { scraped: scraped.length, inserted: newContent.length };
      } catch (err: any) {
        results[platform] = { error: err.message };
      }
    }

    res.json({ success: true, competitor: competitor.name, results });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// GET /api/health — Health check
// ==========================================
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', service: 'Nexora Content Engine API' });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`\n🚀 Nexora Content Engine API corriendo en http://localhost:${PORT}`);
  console.log(`\n   Endpoints:`);
  console.log(`   POST /api/analyze            → Analizar contenido de competidor`);
  console.log(`   POST /api/generate-brief     → Generar brief semanal`);
  console.log(`   POST /api/generate-idea      → Generar idea de contenido`);
  console.log(`   POST /api/generate-draft     → Generar borrador para una idea`);
  console.log(`   POST /api/generate-carousel  → Generar copy para carrusel`);
  console.log(`   POST /api/scrape-competitor  → Scraping de una plataforma`);
  console.log(`   POST /api/scrape-all         → Scraping de todas las plataformas`);
  console.log(`   GET  /api/business-profile   → Obtener perfil de negocio`);
  console.log(`   PUT  /api/business-profile   → Guardar perfil de negocio`);
  console.log(`   GET  /api/health             → Health check\n`);
});
