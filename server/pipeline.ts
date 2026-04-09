/**
 * Content Intelligence Pipeline
 *
 * Usage:
 *   npx tsx server/pipeline.ts ingest-youtube <videoUrl> <competitorName>
 *   npx tsx server/pipeline.ts scan-channel <channelId> <competitorName>
 *   npx tsx server/pipeline.ts generate-brief
 *   npx tsx server/pipeline.ts search <query>
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { getYoutubeTranscript, getChannelRecentVideos } from './scraper';
import { analyzeContent, generateWeeklyBrief } from './groq';
import { storeInKnowledgeBase, searchKnowledgeBase } from './embeddings';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY!
);

/**
 * Ingest a single YouTube video: transcript → analyze → vectorize → store
 */
async function ingestYoutubeVideo(videoUrl: string, competitorName: string) {
  console.log(`\n📥 Ingesting: ${videoUrl}`);

  // 1. Get transcript
  console.log('  ⏳ Extracting transcript...');
  const { text } = await getYoutubeTranscript(videoUrl);
  console.log(`  ✅ Transcript: ${text.length} chars`);

  // 2. Find competitor in DB
  const { data: competitors } = await supabase
    .from('competitors')
    .select('id')
    .ilike('name', `%${competitorName}%`)
    .limit(1);

  const competitorId = competitors?.[0]?.id || null;

  // 3. Store in competitor_content
  console.log('  ⏳ Storing in competitor_content...');
  const { data: contentEntry } = await supabase
    .from('competitor_content')
    .insert({
      competitor_id: competitorId,
      platform: 'youtube',
      title: `[Auto] ${competitorName} - ${videoUrl}`,
      url: videoUrl,
      content_body: text,
      is_analyzed: false,
    })
    .select('id')
    .single();

  // 4. Analyze with Groq
  console.log('  ⏳ Analyzing with Groq (Llama 3.3 70B)...');
  const analysis = await analyzeContent(text, competitorName);
  console.log(`  ✅ Summary: ${analysis.summary.slice(0, 100)}...`);
  console.log(`  ✅ Tags: ${analysis.tags.join(', ')}`);

  // 5. Update competitor_content with analysis
  if (contentEntry?.id) {
    await supabase
      .from('competitor_content')
      .update({
        title: analysis.summary.split('.')[0] || `[Auto] ${competitorName}`,
        is_analyzed: true,
        analysis_notes: JSON.stringify(analysis.analysis, null, 2),
        tags: analysis.tags,
      })
      .eq('id', contentEntry.id);
  }

  // 6. Vectorize and store in knowledge base
  console.log('  ⏳ Generating embeddings and storing in KB...');
  const kbId = await storeInKnowledgeBase({
    source_type: 'youtube_transcript',
    source_url: videoUrl,
    competitor_id: competitorId || undefined,
    competitor_content_id: contentEntry?.id || undefined,
    title: analysis.summary.split('.')[0] || competitorName,
    content: text,
    summary: analysis.summary,
    tags: analysis.tags,
    analysis: analysis.analysis,
  });

  console.log(`  ✅ Stored in KB: ${kbId}`);
  console.log(`\n✅ Done! Ingested video from ${competitorName}`);
}

/**
 * Scan a YouTube channel for recent videos and ingest new ones
 */
async function scanChannel(channelId: string, competitorName: string) {
  console.log(`\n🔍 Scanning channel: ${channelId} (${competitorName})`);

  const videos = await getChannelRecentVideos(channelId);
  console.log(`  Found ${videos.length} recent videos`);

  // Check which ones we already have
  const { data: existing } = await supabase
    .from('competitor_content')
    .select('url')
    .eq('platform', 'youtube');

  const existingUrls = new Set((existing || []).map(e => e.url));

  const newVideos = videos.filter(v => !existingUrls.has(v.link));
  console.log(`  ${newVideos.length} new videos to ingest`);

  for (const video of newVideos.slice(0, 5)) { // Max 5 per scan to stay in rate limits
    try {
      await ingestYoutubeVideo(video.link, competitorName);
      // Rate limit: wait 5 seconds between videos (Groq free tier)
      await new Promise(r => setTimeout(r, 5000));
    } catch (err) {
      console.error(`  ❌ Failed to ingest ${video.title}:`, err);
    }
  }
}

/**
 * Generate weekly brief from recent competitor content
 */
async function generateBrief() {
  console.log('\n📋 Generating weekly brief...');

  // Get last 7 days of analyzed content
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const { data: recentContent } = await supabase
    .from('competitor_content')
    .select('*, competitors(name)')
    .eq('is_analyzed', true)
    .gte('created_at', weekAgo.toISOString())
    .order('created_at', { ascending: false });

  if (!recentContent?.length) {
    console.log('  No analyzed content from this week. Ingest some videos first.');
    return;
  }

  console.log(`  Found ${recentContent.length} analyzed items this week`);

  const contentForBrief = recentContent.map(c => ({
    competitor: (c as any).competitors?.name || 'Unknown',
    title: c.title,
    summary: c.analysis_notes || '',
    tags: c.tags || [],
  }));

  console.log('  ⏳ Generating brief with Groq...');
  const brief = await generateWeeklyBrief(contentForBrief);

  // Store brief
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)

  const { error } = await supabase.from('weekly_briefs').insert({
    week_start: weekStart.toISOString().split('T')[0],
    competitor_highlights: brief.competitor_highlights,
    trending_topics: brief.trending_topics,
    suggested_content: brief.suggested_content,
  });

  if (error) {
    console.error('  ❌ Error storing brief:', error);
    return;
  }

  console.log('\n✅ Weekly brief generated!');
  console.log(`  Highlights: ${brief.competitor_highlights?.length || 0}`);
  console.log(`  Trending topics: ${brief.trending_topics?.join(', ')}`);
  console.log(`  Suggested content: ${brief.suggested_content?.length || 0} ideas`);
}

/**
 * Search the knowledge base
 */
async function search(query: string) {
  console.log(`\n🔎 Searching KB: "${query}"`);

  const results = await searchKnowledgeBase(query, { matchThreshold: 0.5, matchCount: 5 });

  if (!results.length) {
    console.log('  No results found.');
    return;
  }

  results.forEach((r, i) => {
    console.log(`\n  ${i + 1}. [${(r.similarity * 100).toFixed(1)}%] ${r.title}`);
    console.log(`     Source: ${r.source_type}`);
    console.log(`     Tags: ${r.tags?.join(', ') || 'none'}`);
    if (r.summary) console.log(`     Summary: ${r.summary.slice(0, 150)}...`);
  });
}

/**
 * Ingest a local text file (transcript or content)
 */
async function ingestFile(filePath: string, competitorName: string) {
  console.log(`\n📄 Ingesting file: ${filePath}`);

  const text = readFileSync(filePath, 'utf-8');
  // Clean timestamp lines (e.g. "00:24", "01:11")
  const cleanText = text.split('\n').filter(l => !l.match(/^\d{2}:\d{2}$/)).join('\n').trim();
  console.log(`  ✅ Content: ${cleanText.length} chars`);

  // Find competitor
  const { data: competitors } = await supabase
    .from('competitors')
    .select('id')
    .ilike('name', `%${competitorName}%`)
    .limit(1);

  const competitorId = competitors?.[0]?.id || null;

  // Extract title from filename
  const title = filePath.split(/[/\\]/).pop()?.replace('.txt', '') || 'Unknown';

  // Store in competitor_content
  console.log('  ⏳ Storing in competitor_content...');
  const { data: contentEntry } = await supabase
    .from('competitor_content')
    .insert({
      competitor_id: competitorId,
      platform: 'youtube',
      title,
      content_body: cleanText,
      is_analyzed: false,
    })
    .select('id')
    .single();

  // Analyze with Groq
  console.log('  ⏳ Analyzing with Groq (Llama 3.3 70B)...');
  const analysis = await analyzeContent(cleanText, competitorName);
  console.log(`  ✅ Summary: ${analysis.summary.slice(0, 100)}...`);
  console.log(`  ✅ Tags: ${analysis.tags.join(', ')}`);

  // Update competitor_content
  if (contentEntry?.id) {
    await supabase
      .from('competitor_content')
      .update({
        is_analyzed: true,
        analysis_notes: JSON.stringify(analysis.analysis, null, 2),
        tags: analysis.tags,
      })
      .eq('id', contentEntry.id);
  }

  // Vectorize and store
  console.log('  ⏳ Generating embeddings...');
  const kbId = await storeInKnowledgeBase({
    source_type: 'youtube_transcript',
    competitor_id: competitorId || undefined,
    competitor_content_id: contentEntry?.id || undefined,
    title,
    content: cleanText,
    summary: analysis.summary,
    tags: analysis.tags,
    analysis: analysis.analysis,
  });

  console.log(`  ✅ Stored in KB: ${kbId}`);
  console.log(`\n✅ Done! Ingested "${title}" from ${competitorName}`);
}

// CLI entry point
const [command, ...args] = process.argv.slice(2);

switch (command) {
  case 'ingest-youtube':
    if (args.length < 2) {
      console.log('Usage: npx tsx server/pipeline.ts ingest-youtube <videoUrl> <competitorName>');
      process.exit(1);
    }
    ingestYoutubeVideo(args[0], args.slice(1).join(' ')).catch(console.error);
    break;

  case 'ingest-file':
    if (args.length < 2) {
      console.log('Usage: npx tsx server/pipeline.ts ingest-file <filePath> <competitorName>');
      process.exit(1);
    }
    ingestFile(args[0], args.slice(1).join(' ')).catch(console.error);
    break;

  case 'scan-channel':
    if (args.length < 2) {
      console.log('Usage: npx tsx server/pipeline.ts scan-channel <channelId> <competitorName>');
      process.exit(1);
    }
    scanChannel(args[0], args.slice(1).join(' ')).catch(console.error);
    break;

  case 'generate-brief':
    generateBrief().catch(console.error);
    break;

  case 'search':
    if (!args.length) {
      console.log('Usage: npx tsx server/pipeline.ts search <query>');
      process.exit(1);
    }
    search(args.join(' ')).catch(console.error);
    break;

  default:
    console.log(`
Nexora Content Intelligence Pipeline

Commands:
  ingest-youtube <url> <competitor>     Ingest a YouTube video (transcript → analyze → vectorize)
  ingest-file <path> <competitor>       Ingest a local text file (transcript)
  scan-channel <channelId> <competitor> Scan channel RSS for new videos
  generate-brief                        Generate weekly brief from analyzed content
  search <query>                        Semantic search in knowledge base

Examples:
  npx tsx server/pipeline.ts ingest-file "./transcripts/video.txt" "Jacob Klug"
  npx tsx server/pipeline.ts ingest-youtube "https://youtube.com/watch?v=abc123" "Jacob Klug"
  npx tsx server/pipeline.ts generate-brief
  npx tsx server/pipeline.ts search "MVP pricing strategy for startups"
    `);
}
