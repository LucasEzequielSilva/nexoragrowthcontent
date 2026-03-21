
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
