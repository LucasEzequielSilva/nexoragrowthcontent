
-- Content Pillars
CREATE TABLE public.content_pillars (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL,
  icon TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.content_pillars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view pillars" ON public.content_pillars FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert pillars" ON public.content_pillars FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update pillars" ON public.content_pillars FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete pillars" ON public.content_pillars FOR DELETE TO authenticated USING (true);

-- Competitors
CREATE TABLE public.competitors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  agency_name TEXT,
  platforms JSONB DEFAULT '{}',
  audience_size JSONB DEFAULT '{}',
  content_style TEXT,
  what_they_sell TEXT,
  frequency TEXT,
  notes TEXT,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view competitors" ON public.competitors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert competitors" ON public.competitors FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update competitors" ON public.competitors FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete competitors" ON public.competitors FOR DELETE TO authenticated USING (true);

-- Competitor Content
CREATE TABLE public.competitor_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competitor_id UUID NOT NULL REFERENCES public.competitors(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT,
  content_body TEXT,
  engagement_metrics JSONB DEFAULT '{}',
  published_at TIMESTAMPTZ,
  tags TEXT[],
  is_analyzed BOOLEAN NOT NULL DEFAULT false,
  analysis_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.competitor_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view competitor_content" ON public.competitor_content FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert competitor_content" ON public.competitor_content FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update competitor_content" ON public.competitor_content FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete competitor_content" ON public.competitor_content FOR DELETE TO authenticated USING (true);

-- Content Ideas
CREATE TABLE public.content_ideas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  source TEXT DEFAULT 'original',
  source_competitor_id UUID REFERENCES public.competitors(id) ON DELETE SET NULL,
  source_content_id UUID REFERENCES public.competitor_content(id) ON DELETE SET NULL,
  platform TEXT DEFAULT 'multi',
  content_type TEXT DEFAULT 'tutorial',
  status TEXT NOT NULL DEFAULT 'idea',
  priority TEXT DEFAULT 'medium',
  target_audience TEXT,
  key_message TEXT,
  draft_content TEXT,
  scheduled_date DATE,
  published_url TEXT,
  performance JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.content_ideas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view content_ideas" ON public.content_ideas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert content_ideas" ON public.content_ideas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update content_ideas" ON public.content_ideas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete content_ideas" ON public.content_ideas FOR DELETE TO authenticated USING (true);

-- Content Idea Pillars (junction)
CREATE TABLE public.content_idea_pillars (
  content_idea_id UUID NOT NULL REFERENCES public.content_ideas(id) ON DELETE CASCADE,
  pillar_id UUID NOT NULL REFERENCES public.content_pillars(id) ON DELETE CASCADE,
  PRIMARY KEY (content_idea_id, pillar_id)
);
ALTER TABLE public.content_idea_pillars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view content_idea_pillars" ON public.content_idea_pillars FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert content_idea_pillars" ON public.content_idea_pillars FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can delete content_idea_pillars" ON public.content_idea_pillars FOR DELETE TO authenticated USING (true);

-- Weekly Briefs
CREATE TABLE public.weekly_briefs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  week_start DATE NOT NULL,
  competitor_highlights JSONB DEFAULT '[]',
  trending_topics TEXT[],
  suggested_content JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.weekly_briefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view weekly_briefs" ON public.weekly_briefs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert weekly_briefs" ON public.weekly_briefs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update weekly_briefs" ON public.weekly_briefs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete weekly_briefs" ON public.weekly_briefs FOR DELETE TO authenticated USING (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_content_ideas_updated_at
  BEFORE UPDATE ON public.content_ideas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- Add tier column to competitors
ALTER TABLE public.competitors ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'tier_1';

-- Seed Content Pillars
INSERT INTO public.content_pillars (name, description, color, icon) VALUES
  ('Build in Public', 'Showing real client work, processes, and results as they happen', '#3B82F6', 'Hammer'),
  ('AI Tool Tutorials', 'Lovable, Cursor, Supabase, Stripe walkthroughs and deep dives', '#8B5CF6', 'Wand'),
  ('Agency Playbook', 'Business model, pricing, operations, scaling lessons', '#10B981', 'BookOpen'),
  ('Founder Stories', 'Origin story, lessons learned, hard truths, personal journey', '#F97316', 'User'),
  ('Product Breakdowns', 'Analyzing successful apps, SaaS, and revenue models', '#EF4444', 'BarChart'),
  ('LATAM Tech', 'AI and tech opportunities specific to Latin America market', '#EAB308', 'Globe');

-- Seed Competitors (8 total, 3 tiers)
INSERT INTO public.competitors (name, agency_name, platforms, audience_size, content_style, what_they_sell, frequency, notes, tier) VALUES
  (
    'Jacob Klug',
    'Creme Digital',
    '{"youtube": "@jacobsklug", "linkedin": "jacobklug", "twitter": "@jacobsklug"}',
    '{"youtube": 9000, "linkedin": 39000, "twitter": 20000}',
    'Tutoriales deep + vlogs + playbooks AI-agency',
    'MVPs AI $9.5K+, retainers, sprints bi-weekly $4.5K',
    '2-3 videos/week + daily LinkedIn/X',
    'THE benchmark. Demian runs X. Automated content system in 72h. Partner de Lovable. $250K/month revenue.',
    'tier_1'
  ),
  (
    'Harry Roper',
    'Imaginary Space',
    '{"youtube": "@HarryRoperMckay", "twitter": "@Harry_Aldian"}',
    '{"youtube": 12000, "twitter": 20000}',
    'Tutorials + case studies enterprise + build in public',
    'MVPs $5K-20K, enterprise retainers',
    '1-2 videos/week + daily X/LinkedIn',
    'Build in public extremo. Triplicó revenue con Lovable + equipo de 3. Enterprise focus.',
    'tier_1'
  ),
  (
    'Christian Peverelli',
    'WeAreNoCode',
    '{"youtube": "@wearenocode", "linkedin": "christianpeverelli"}',
    '{"youtube": 306000, "linkedin": 50000}',
    'Tutorials semanales + bootcamps en vivo + community tips',
    'Bootcamp AI Coding (4 semanas) + agency done-for-you upsell',
    'Weekly videos + community posts',
    'Comunidad como moat (600+ businesses). Education → agency upsell funnel.',
    'tier_1'
  ),
  (
    'Riley Brown',
    NULL,
    '{"youtube": "@rileybrownai", "twitter": "@rileybrown", "tiktok": "@rileybrown.ai"}',
    '{"youtube": 204000, "twitter": 50000}',
    '"I built X in Y min" + predictions 2026 + vibe coding demos',
    'Cursos/tools AI (no agencia premium)',
    '1-2 videos/month + daily shorts/TikTok',
    'El Fireship del vibe coding. No tiene agencia pero formato viral para copiar. Top: "I Made a $1B App in 34 Minutes" 145K views.',
    'tier_2'
  ),
  (
    'Brett Williams',
    'Designjoy',
    '{"twitter": "@BrettFromDJ", "website": "designjoy.co"}',
    '{"twitter": 30000}',
    'Income reports + productized model case studies',
    'Unlimited design subscriptions $5K/mo. $1.3M/year solo.',
    'Weekly X posts + monthly interviews',
    'Modelo productized que Jacob copia. Referencia para pricing model: unlimited requests por fee fijo.',
    'tier_2'
  ),
  (
    'Marc Lou',
    'ShipFast',
    '{"youtube": "@marc-lou", "twitter": "@marc_louvion"}',
    '{"youtube": 140000, "twitter": 40000}',
    'Build in public + failure stories + "failed 27x → $1M"',
    'Templates ShipFast $199 lifetime + SaaS portfolio',
    '1-2 videos/month + daily X',
    'Storytelling extremo. Top: "I failed 27 startups... made $1M solo" 69K views. Template model replicable.',
    'tier_2'
  ),
  (
    'Tibo Louis-Lucas',
    'SuperX / Revid.ai',
    '{"twitter": "@tibo_maker"}',
    '{"twitter": 115000}',
    'Revenue threads + AI repurposing + income reviews',
    'SaaS tools (sold $8M+), newsletter',
    'Daily X + weekly newsletter',
    'Tracción X brutal. "5.6x Revenue Growth 2025" viral. Repurposing AI master. Referencia para crecimiento en X.',
    'tier_2'
  ),
  (
    'Agustín Medina',
    'Lambda Automations',
    '{"youtube": "@agustinmedinaIA"}',
    '{"youtube": 80000}',
    'Automatizaciones n8n/Make en español + "vender IA"',
    'Academy + servicios empresa (automatizaciones, NO productos/MVPs)',
    '1-2 videos/week',
    'SOLO automatizaciones, NO Lovable/Cursor ni MVPs. Referencia para funnel format en español LATAM, no para posicionamiento Waves.',
    'tier_3'
  );

-- Seed Sample Content Ideas
INSERT INTO public.content_ideas (title, description, platform, content_type, status, priority, source, target_audience, key_message) VALUES
  (
    'Construí un MVP en 45 min con Lovable',
    'Live build de un MVP real (tipo SaaS simple) mostrando todo el proceso en Lovable + Supabase. Formato Riley Brown adaptado a LATAM.',
    'youtube',
    'tutorial',
    'idea',
    'high',
    'competitor_inspiration',
    'Founders LATAM sin co-founder técnico',
    'No necesitás saber programar para lanzar tu producto. Te muestro cómo.'
  ),
  (
    'Por qué las agencias tradicionales van a morir en 2026',
    'Hot take sobre cómo AI está matando el modelo de agencia tradicional. Datos reales + experiencia propia con Waves.',
    'twitter',
    'story',
    'drafting',
    'high',
    'original',
    'Founders y dueños de agencias LATAM',
    'El modelo de agencia cambió. Si no integrás AI, quedás afuera.'
  ),
  (
    'Tutorial: Pasarela de pagos con Stripe + Lovable + Supabase',
    'Step-by-step de cómo integrar Stripe en un MVP hecho con Lovable. Caso real de un proyecto Waves.',
    'youtube',
    'tutorial',
    'idea',
    'medium',
    'original',
    'Devs y founders que quieren monetizar sus MVPs',
    'Monetizá tu app desde el día 1 con Stripe + Supabase.'
  ),
  (
    'De freelancer a agencia AI-native: mi historia',
    'Mi journey personal: de hacer webs en WordPress a construir una agencia AI-native en Argentina. Raw, sin filtro.',
    'linkedin',
    'story',
    'review',
    'medium',
    'original',
    'Freelancers y devs LATAM queriendo escalar',
    'No necesitás Silicon Valley. Podés construir algo grande desde Argentina.'
  );
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Knowledge base for vectorized competitor content
CREATE TABLE public.knowledge_base (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_type TEXT NOT NULL, -- 'youtube_transcript' | 'tweet' | 'linkedin_post' | 'manual'
  source_url TEXT,
  competitor_id UUID REFERENCES public.competitors(id) ON DELETE SET NULL,
  competitor_content_id UUID REFERENCES public.competitor_content(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL, -- raw content
  summary TEXT, -- AI-generated summary
  tags TEXT[], -- AI-generated tags
  analysis JSONB DEFAULT '{}', -- AI analysis (what worked, product insights, etc.)
  embedding vector(384), -- all-MiniLM-L6-v2 embeddings
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast similarity search
CREATE INDEX ON public.knowledge_base USING hnsw (embedding vector_cosine_ops);

-- RLS
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view knowledge_base" ON public.knowledge_base FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert knowledge_base" ON public.knowledge_base FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update knowledge_base" ON public.knowledge_base FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete knowledge_base" ON public.knowledge_base FOR DELETE TO authenticated USING (true);

-- Function for semantic search
CREATE OR REPLACE FUNCTION match_knowledge(
  query_embedding vector(384),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  summary TEXT,
  tags TEXT[],
  analysis JSONB,
  source_type TEXT,
  competitor_id UUID,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb.id,
    kb.title,
    kb.content,
    kb.summary,
    kb.tags,
    kb.analysis,
    kb.source_type,
    kb.competitor_id,
    1 - (kb.embedding <=> query_embedding) AS similarity
  FROM public.knowledge_base kb
  WHERE 1 - (kb.embedding <=> query_embedding) > match_threshold
  ORDER BY kb.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
-- Carousels
CREATE TABLE public.carousels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'instagram',
  status TEXT NOT NULL DEFAULT 'draft',
  content_idea_id UUID REFERENCES public.content_ideas(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.carousels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can all carousels" ON public.carousels FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anon users can all carousels" ON public.carousels FOR ALL TO anon USING (true) WITH CHECK (true);

-- Carousel Slides
CREATE TABLE public.carousel_slides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  carousel_id UUID NOT NULL REFERENCES public.carousels(id) ON DELETE CASCADE,
  slide_order INTEGER NOT NULL DEFAULT 0,
  slide_type TEXT NOT NULL DEFAULT 'content',
  title TEXT,
  copy TEXT,
  description TEXT,
  cover_url TEXT,
  bg_color TEXT DEFAULT '#1a1a2e',
  text_color TEXT DEFAULT '#ffffff',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.carousel_slides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can all carousel_slides" ON public.carousel_slides FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anon users can all carousel_slides" ON public.carousel_slides FOR ALL TO anon USING (true) WITH CHECK (true);

-- Trigger updated_at for carousels
CREATE TRIGGER update_carousels_updated_at
  BEFORE UPDATE ON public.carousels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Additional UI/design competitors
INSERT INTO public.competitors (name, agency_name, platforms, audience_size, content_style, what_they_sell, frequency, notes, tier) VALUES
  ('Adrian Kuleszo', NULL, '{"twitter": "@adriankuleszo"}', '{}', 'UI design showcases, product design breakdowns', 'UI/Product design content', 'Regular X posts', 'Referencia de UI/product design.', 'tier_2'),
  ('Ali Bey', NULL, '{"twitter": "@alibey_10"}', '{}', 'UI design, visual design, interface showcases', 'UI/Design content', 'Regular X posts', 'Referencia de UI.', 'tier_2'),
  ('Tempo Immaterial', NULL, '{"twitter": "@tempoimmaterial"}', '{}', 'Builder content, product development', 'Building in public', 'Regular X posts', 'Builder reference.', 'tier_2'),
  ('Prajwal Tomar', 'AI MVP Builders', '{"youtube": "@PrajwalTomar", "twitter": "@PrajwalTomar_"}', '{"youtube": 15000}', 'Skool courses + YouTube tutorials', 'Skool community $35/mo + courses', '2-3 videos/week', 'Competidor directo en education. Skool free 1.9K + PRO 226 miembros.', 'tier_2');
