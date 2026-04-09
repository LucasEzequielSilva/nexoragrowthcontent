-- Add user_id to all main tables
ALTER TABLE public.competitors ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.competitor_content ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.content_ideas ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.content_pillars ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.weekly_briefs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.carousels ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.knowledge_base ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop old permissive policies
DROP POLICY IF EXISTS "Authenticated users can view competitors" ON public.competitors;
DROP POLICY IF EXISTS "Authenticated users can insert competitors" ON public.competitors;
DROP POLICY IF EXISTS "Authenticated users can update competitors" ON public.competitors;
DROP POLICY IF EXISTS "Authenticated users can delete competitors" ON public.competitors;

DROP POLICY IF EXISTS "Authenticated users can view competitor_content" ON public.competitor_content;
DROP POLICY IF EXISTS "Authenticated users can insert competitor_content" ON public.competitor_content;
DROP POLICY IF EXISTS "Authenticated users can update competitor_content" ON public.competitor_content;
DROP POLICY IF EXISTS "Authenticated users can delete competitor_content" ON public.competitor_content;

DROP POLICY IF EXISTS "Authenticated users can view content_ideas" ON public.content_ideas;
DROP POLICY IF EXISTS "Authenticated users can insert content_ideas" ON public.content_ideas;
DROP POLICY IF EXISTS "Authenticated users can update content_ideas" ON public.content_ideas;
DROP POLICY IF EXISTS "Authenticated users can delete content_ideas" ON public.content_ideas;

DROP POLICY IF EXISTS "Authenticated users can view content_pillars" ON public.content_pillars;
DROP POLICY IF EXISTS "Authenticated users can insert content_pillars" ON public.content_pillars;
DROP POLICY IF EXISTS "Authenticated users can update content_pillars" ON public.content_pillars;
DROP POLICY IF EXISTS "Authenticated users can delete content_pillars" ON public.content_pillars;

DROP POLICY IF EXISTS "Authenticated users can view weekly_briefs" ON public.weekly_briefs;
DROP POLICY IF EXISTS "Authenticated users can insert weekly_briefs" ON public.weekly_briefs;
DROP POLICY IF EXISTS "Authenticated users can update weekly_briefs" ON public.weekly_briefs;
DROP POLICY IF EXISTS "Authenticated users can delete weekly_briefs" ON public.weekly_briefs;

DROP POLICY IF EXISTS "Authenticated users can view knowledge_base" ON public.knowledge_base;
DROP POLICY IF EXISTS "Authenticated users can insert knowledge_base" ON public.knowledge_base;
DROP POLICY IF EXISTS "Authenticated users can update knowledge_base" ON public.knowledge_base;
DROP POLICY IF EXISTS "Authenticated users can delete knowledge_base" ON public.knowledge_base;

DROP POLICY IF EXISTS "Auth users can all carousels" ON public.carousels;
DROP POLICY IF EXISTS "Anon users can all carousels" ON public.carousels;
DROP POLICY IF EXISTS "Auth users can all carousel_slides" ON public.carousel_slides;
DROP POLICY IF EXISTS "Anon users can all carousel_slides" ON public.carousel_slides;

-- Create user-scoped RLS policies
CREATE POLICY "Users see own competitors" ON public.competitors FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own competitors" ON public.competitors FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own competitors" ON public.competitors FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users delete own competitors" ON public.competitors FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users see own competitor_content" ON public.competitor_content FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own competitor_content" ON public.competitor_content FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own competitor_content" ON public.competitor_content FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users delete own competitor_content" ON public.competitor_content FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users see own content_ideas" ON public.content_ideas FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own content_ideas" ON public.content_ideas FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own content_ideas" ON public.content_ideas FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users delete own content_ideas" ON public.content_ideas FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users see own content_pillars" ON public.content_pillars FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own content_pillars" ON public.content_pillars FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own content_pillars" ON public.content_pillars FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users delete own content_pillars" ON public.content_pillars FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users see own weekly_briefs" ON public.weekly_briefs FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own weekly_briefs" ON public.weekly_briefs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own weekly_briefs" ON public.weekly_briefs FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users delete own weekly_briefs" ON public.weekly_briefs FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users see own carousels" ON public.carousels FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own carousels" ON public.carousels FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own carousels" ON public.carousels FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users delete own carousels" ON public.carousels FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users see own carousel_slides" ON public.carousel_slides FOR SELECT TO authenticated USING (
  carousel_id IN (SELECT id FROM public.carousels WHERE user_id = auth.uid())
);
CREATE POLICY "Users insert own carousel_slides" ON public.carousel_slides FOR INSERT TO authenticated WITH CHECK (
  carousel_id IN (SELECT id FROM public.carousels WHERE user_id = auth.uid())
);
CREATE POLICY "Users update own carousel_slides" ON public.carousel_slides FOR UPDATE TO authenticated USING (
  carousel_id IN (SELECT id FROM public.carousels WHERE user_id = auth.uid())
);
CREATE POLICY "Users delete own carousel_slides" ON public.carousel_slides FOR DELETE TO authenticated USING (
  carousel_id IN (SELECT id FROM public.carousels WHERE user_id = auth.uid())
);

CREATE POLICY "Users see own knowledge_base" ON public.knowledge_base FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own knowledge_base" ON public.knowledge_base FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own knowledge_base" ON public.knowledge_base FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users delete own knowledge_base" ON public.knowledge_base FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Auto-set user_id on insert via trigger (frontend doesn't need to send it)
CREATE OR REPLACE FUNCTION public.set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER set_user_id_competitors BEFORE INSERT ON public.competitors FOR EACH ROW EXECUTE FUNCTION public.set_user_id();
CREATE TRIGGER set_user_id_competitor_content BEFORE INSERT ON public.competitor_content FOR EACH ROW EXECUTE FUNCTION public.set_user_id();
CREATE TRIGGER set_user_id_content_ideas BEFORE INSERT ON public.content_ideas FOR EACH ROW EXECUTE FUNCTION public.set_user_id();
CREATE TRIGGER set_user_id_content_pillars BEFORE INSERT ON public.content_pillars FOR EACH ROW EXECUTE FUNCTION public.set_user_id();
CREATE TRIGGER set_user_id_weekly_briefs BEFORE INSERT ON public.weekly_briefs FOR EACH ROW EXECUTE FUNCTION public.set_user_id();
CREATE TRIGGER set_user_id_carousels BEFORE INSERT ON public.carousels FOR EACH ROW EXECUTE FUNCTION public.set_user_id();
CREATE TRIGGER set_user_id_knowledge_base BEFORE INSERT ON public.knowledge_base FOR EACH ROW EXECUTE FUNCTION public.set_user_id();

-- Assign existing data to Lucas (luxassilva@gmail.com)
UPDATE public.competitors SET user_id = (SELECT id FROM auth.users WHERE email = 'luxassilva@gmail.com' LIMIT 1) WHERE user_id IS NULL;
UPDATE public.competitor_content SET user_id = (SELECT id FROM auth.users WHERE email = 'luxassilva@gmail.com' LIMIT 1) WHERE user_id IS NULL;
UPDATE public.content_ideas SET user_id = (SELECT id FROM auth.users WHERE email = 'luxassilva@gmail.com' LIMIT 1) WHERE user_id IS NULL;
UPDATE public.content_pillars SET user_id = (SELECT id FROM auth.users WHERE email = 'luxassilva@gmail.com' LIMIT 1) WHERE user_id IS NULL;
UPDATE public.weekly_briefs SET user_id = (SELECT id FROM auth.users WHERE email = 'luxassilva@gmail.com' LIMIT 1) WHERE user_id IS NULL;
UPDATE public.carousels SET user_id = (SELECT id FROM auth.users WHERE email = 'luxassilva@gmail.com' LIMIT 1) WHERE user_id IS NULL;
UPDATE public.knowledge_base SET user_id = (SELECT id FROM auth.users WHERE email = 'luxassilva@gmail.com' LIMIT 1) WHERE user_id IS NULL;
