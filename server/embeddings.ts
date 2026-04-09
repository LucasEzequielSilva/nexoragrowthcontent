import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY!
);

// Dynamic import for Transformers.js (ESM module)
let pipeline: any = null;
let embedder: any = null;

async function getEmbedder() {
  if (embedder) return embedder;
  const { pipeline: createPipeline } = await import('@xenova/transformers');
  embedder = await createPipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  pipeline = createPipeline;
  return embedder;
}

/**
 * Generate embedding vector for text content
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const model = await getEmbedder();
  const output = await model(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data) as number[];
}

/**
 * Store content in the knowledge base with embedding
 */
export async function storeInKnowledgeBase(entry: {
  source_type: string;
  source_url?: string;
  competitor_id?: string;
  competitor_content_id?: string;
  title: string;
  content: string;
  summary?: string;
  tags?: string[];
  analysis?: Record<string, any>;
}): Promise<string | null> {
  // Generate embedding from content (use summary if available for better semantic match)
  const textToEmbed = entry.summary
    ? `${entry.title}. ${entry.summary}`
    : `${entry.title}. ${entry.content.slice(0, 1000)}`;

  const embedding = await generateEmbedding(textToEmbed);

  const { data, error } = await supabase
    .from('knowledge_base')
    .insert({
      ...entry,
      embedding: embedding,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error storing in knowledge base:', error);
    return null;
  }

  return data.id;
}

/**
 * Semantic search in the knowledge base
 */
export async function searchKnowledgeBase(query: string, options?: {
  matchThreshold?: number;
  matchCount?: number;
}): Promise<Array<{
  id: string;
  title: string;
  content: string;
  summary: string;
  tags: string[];
  analysis: Record<string, any>;
  source_type: string;
  competitor_id: string;
  similarity: number;
}>> {
  const embedding = await generateEmbedding(query);

  const { data, error } = await supabase.rpc('match_knowledge', {
    query_embedding: embedding,
    match_threshold: options?.matchThreshold ?? 0.7,
    match_count: options?.matchCount ?? 10,
  });

  if (error) {
    console.error('Error searching knowledge base:', error);
    return [];
  }

  return data || [];
}
