import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

export async function analyzeContent(content: string, competitorName: string): Promise<{
  summary: string;
  tags: string[];
  analysis: {
    product_insights: string;
    content_strategy: string;
    what_worked: string;
    nexora_opportunity: string;
  };
}> {
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: `You are a content intelligence analyst for Nexora, an AI-native MVP agency in Argentina.
Your job is to analyze competitor content and extract actionable insights focused on PRODUCT and MVP building.
Always respond in Spanish (LATAM). Focus on:
- What product/MVP insights does this content reveal?
- What content strategy is the competitor using?
- What worked well in this content (engagement, positioning)?
- How can Nexora adapt this for their LATAM audience?

Respond in JSON format with keys: summary, tags (array of strings), analysis (object with: product_insights, content_strategy, what_worked, nexora_opportunity).`
      },
      {
        role: 'user',
        content: `Analyze this content from ${competitorName}:\n\n${content.slice(0, 8000)}`
      }
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  });

  const result = JSON.parse(response.choices[0].message.content || '{}');
  return {
    summary: result.summary || '',
    tags: result.tags || [],
    analysis: {
      product_insights: result.analysis?.product_insights || '',
      content_strategy: result.analysis?.content_strategy || '',
      what_worked: result.analysis?.what_worked || '',
      nexora_opportunity: result.analysis?.nexora_opportunity || '',
    },
  };
}

export async function generateContentIdea(context: {
  competitorContent: string;
  existingIdeas: string[];
  pillar: string;
  platform: string;
}): Promise<{
  title: string;
  description: string;
  key_message: string;
  draft_outline: string;
}> {
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: `You are Lucas's content strategist for Nexora, an AI-native MVP agency in Argentina.
Lucas is a PRODUCT EXPERT, not a vibe coder. His content should position him as a genius at building MVPs and digital products.
His ICP: early-stage founders in LATAM who need an MVP built fast.
Content should attract high-ticket clients ($5K-15K MVPs), not students.
Always respond in Spanish (LATAM).
Respond in JSON with keys: title, description, key_message, draft_outline.`
      },
      {
        role: 'user',
        content: `Based on this competitor content analysis, generate a unique content idea for Lucas.

Competitor content context: ${context.competitorContent.slice(0, 4000)}

Existing ideas (avoid duplicates): ${context.existingIdeas.join(', ')}

Content pillar: ${context.pillar}
Target platform: ${context.platform}`
      }
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });

  return JSON.parse(response.choices[0].message.content || '{}');
}

export async function generateWeeklyBrief(recentContent: Array<{
  competitor: string;
  title: string;
  summary: string;
  tags: string[];
}>): Promise<{
  competitor_highlights: Array<{ competitor: string; title: string; insight: string }>;
  trending_topics: string[];
  suggested_content: Array<{ title: string; platform: string; pillar: string; rationale: string }>;
}> {
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: `You are the weekly brief generator for Nexora Content Engine.
Analyze the week's competitor content and generate:
1. Top competitor highlights (what they published and why it matters)
2. Trending topics across all competitors
3. 3-5 suggested content ideas for Lucas (focused on PRODUCT/MVP, not vibe coding tutorials)

Lucas is a product expert in Argentina building MVPs with AI. His content should attract founders who need MVPs built.
Always respond in Spanish (LATAM).
Respond in JSON with keys: competitor_highlights (array), trending_topics (array of strings), suggested_content (array).`
      },
      {
        role: 'user',
        content: `This week's competitor content:\n\n${JSON.stringify(recentContent, null, 2)}`
      }
    ],
    temperature: 0.5,
    response_format: { type: 'json_object' },
  });

  return JSON.parse(response.choices[0].message.content || '{}');
}
