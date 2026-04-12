-- Creator Notes — diario del creador para alimentar contenido real
CREATE TABLE IF NOT EXISTS public.creator_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  note TEXT NOT NULL,
  note_type TEXT DEFAULT 'insight',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.creator_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own notes" ON public.creator_notes FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own notes" ON public.creator_notes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own notes" ON public.creator_notes FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users delete own notes" ON public.creator_notes FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Anon view notes" ON public.creator_notes FOR SELECT TO anon USING (true);
