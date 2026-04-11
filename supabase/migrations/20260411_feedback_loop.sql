-- Feedback loop: approve/reject ideas to train the AI over time
ALTER TABLE public.content_ideas ADD COLUMN IF NOT EXISTS feedback_status TEXT DEFAULT 'pending';
ALTER TABLE public.content_ideas ADD COLUMN IF NOT EXISTS feedback_notes TEXT;
ALTER TABLE public.content_ideas ADD COLUMN IF NOT EXISTS feedback_at TIMESTAMPTZ;
