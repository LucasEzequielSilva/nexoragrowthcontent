-- Creator Profiles — perfil de cada creador de contenido
CREATE TABLE IF NOT EXISTS public.creator_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  role TEXT DEFAULT '',
  content_focus TEXT DEFAULT '',
  personal_tone TEXT DEFAULT '',
  target_audience TEXT DEFAULT '',
  personal_brand TEXT DEFAULT '',
  handles JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.creator_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view creator_profiles" ON public.creator_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert creator_profiles" ON public.creator_profiles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update creator_profiles" ON public.creator_profiles FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Anon view creator_profiles" ON public.creator_profiles FOR SELECT TO anon USING (true);
CREATE POLICY "Anon insert creator_profiles" ON public.creator_profiles FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon update creator_profiles" ON public.creator_profiles FOR UPDATE TO anon USING (true);

CREATE TRIGGER update_creator_profiles_updated_at
  BEFORE UPDATE ON public.creator_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
