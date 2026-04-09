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
