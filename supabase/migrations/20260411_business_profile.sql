-- Business Profile — contexto del negocio para alimentar la AI
CREATE TABLE IF NOT EXISTS public.business_profile (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  brand_name TEXT NOT NULL DEFAULT '',
  tagline TEXT DEFAULT '',
  services TEXT DEFAULT '',
  price_range TEXT DEFAULT '',
  ideal_client TEXT DEFAULT '',
  differentiator TEXT DEFAULT '',
  tone_and_style TEXT DEFAULT '',
  brand_story TEXT DEFAULT '',
  platforms JSONB DEFAULT '{}',
  goals TEXT DEFAULT '',
  avoid_topics TEXT DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.business_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can view business_profile" ON public.business_profile FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert business_profile" ON public.business_profile FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update business_profile" ON public.business_profile FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Anon users can view business_profile" ON public.business_profile FOR SELECT TO anon USING (true);
CREATE POLICY "Anon users can insert business_profile" ON public.business_profile FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon users can update business_profile" ON public.business_profile FOR UPDATE TO anon USING (true);

-- Auto-update updated_at
CREATE TRIGGER update_business_profile_updated_at
  BEFORE UPDATE ON public.business_profile
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
