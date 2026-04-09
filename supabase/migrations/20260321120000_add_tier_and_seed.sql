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
