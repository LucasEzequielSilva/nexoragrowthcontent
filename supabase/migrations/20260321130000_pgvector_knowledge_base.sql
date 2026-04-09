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
