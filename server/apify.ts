/**
 * Apify integration — scrape competitor content from social platforms
 * Uses Apify REST API directly (no SDK dependency)
 *
 * Actor IDs (verified):
 *   Instagram: shu8hvrXbJbY3Eb9W (apify/instagram-scraper)
 *   TikTok:    OtzYfK1ndEGdwWFKQ (clockworks/free-tiktok-scraper)
 *   YouTube:   67Q6fmd8iedTVcCwY (fast youtube channel scraper)
 */
import dotenv from 'dotenv';
import { getYoutubeTranscript } from './scraper.js';
dotenv.config();

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const APIFY_BASE = 'https://api.apify.com/v2';

interface ScrapedContent {
  title: string;
  url: string;
  platform: string;
  published_at: string | null;
  engagement_metrics: {
    likes?: number;
    comments?: number;
    shares?: number;
    views?: number;
    saves?: number;
  };
  content_body?: string;
}

// Generic: run an Apify actor and wait for results
async function runActor(actorId: string, input: Record<string, any>, timeoutSecs = 120): Promise<any[]> {
  if (!APIFY_TOKEN) throw new Error('APIFY_TOKEN no configurado. Agregalo al .env');

  const res = await fetch(
    `${APIFY_BASE}/acts/${actorId}/run-sync-get-dataset-items?token=${APIFY_TOKEN}&timeout=${timeoutSecs}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Apify error (${actorId}): ${res.status} — ${err.slice(0, 300)}`);
  }

  return res.json();
}

// ==========================================
// Instagram — scrape recent posts from a profile
// ==========================================
export async function scrapeInstagram(profileUrl: string, maxPosts = 20): Promise<ScrapedContent[]> {
  const username = profileUrl
    .replace(/\/$/, '')
    .split('/')
    .pop()
    ?.replace('@', '') || profileUrl;

  const items = await runActor('shu8hvrXbJbY3Eb9W', {
    directUrls: [`https://www.instagram.com/${username}/`],
    resultsType: 'posts',
    resultsLimit: maxPosts,
  });

  return items.map((item: any) => ({
    title: (item.caption || item.alt || '').slice(0, 200),
    url: item.url || (item.shortCode ? `https://www.instagram.com/p/${item.shortCode}/` : ''),
    platform: 'instagram',
    published_at: item.timestamp
      ? new Date(item.timestamp).toISOString()
      : null,
    engagement_metrics: {
      likes: item.likesCount ?? item.likes ?? 0,
      comments: item.commentsCount ?? item.comments ?? 0,
      views: item.videoViewCount ?? item.videoPlayCount ?? undefined,
    },
    content_body: item.caption || '',
  }));
}

// ==========================================
// TikTok — scrape recent videos from a profile
// ==========================================
export async function scrapeTikTok(profileUrl: string, maxPosts = 20): Promise<ScrapedContent[]> {
  const username = profileUrl
    .replace(/\/$/, '')
    .split('/')
    .pop()
    ?.replace('@', '') || profileUrl;

  const items = await runActor('OtzYfK1ndEGdwWFKQ', {
    profiles: [`https://www.tiktok.com/@${username}`],
    resultsPerPage: maxPosts,
    shouldDownloadVideos: false,
  });

  return items.map((item: any) => ({
    title: (item.text || item.desc || item.description || '').slice(0, 200),
    url: item.webVideoUrl || item.url || '',
    platform: 'tiktok',
    published_at: item.createTime
      ? new Date(item.createTime * 1000).toISOString()
      : item.createTimeISO || null,
    engagement_metrics: {
      likes: item.diggCount ?? item.likes ?? 0,
      comments: item.commentCount ?? item.comments ?? 0,
      shares: item.shareCount ?? item.shares ?? 0,
      views: item.playCount ?? item.plays ?? item.views ?? 0,
    },
    content_body: item.text || item.desc || item.description || '',
  }));
}

// ==========================================
// YouTube — scrape via RSS feed (free, instant, no Apify credits)
// ==========================================
export async function scrapeYouTube(channelUrl: string, maxPosts = 20): Promise<ScrapedContent[]> {
  // Extract handle from URL
  let handle = channelUrl;
  if (handle.includes('youtube.com')) {
    handle = handle.replace(/\/$/, '').split('/').pop() || handle;
  }
  handle = handle.replace('@', '');

  // First resolve handle to channel ID via page scrape
  const pageRes = await fetch(`https://www.youtube.com/@${handle}`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    redirect: 'follow',
  });
  const pageHtml = await pageRes.text();
  const channelIdMatch =
    pageHtml.match(/"channelId":"(UC[^"]+)"/) ||
    pageHtml.match(/"externalId":"(UC[^"]+)"/) ||
    pageHtml.match(/channel_id=(UC[^&"]+)/);

  if (!channelIdMatch) {
    throw new Error(`No se pudo resolver el canal de YouTube para @${handle}`);
  }

  const channelId = channelIdMatch[1];
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  const feedRes = await fetch(feedUrl);
  const xml = await feedRes.text();

  const entries: ScrapedContent[] = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;

  while ((match = entryRegex.exec(xml)) !== null && entries.length < maxPosts) {
    const entry = match[1];
    const videoId = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/)?.[1] || '';
    const title = entry.match(/<title>(.*?)<\/title>/)?.[1] || '';
    const published = entry.match(/<published>(.*?)<\/published>/)?.[1] || '';
    const views = entry.match(/<media:statistics views="(\d+)"/)?.[1];
    const likes = entry.match(/<media:starRating.*?count="(\d+)"/)?.[1];

    // Try to get transcript
    let transcript = '';
    try {
      const result = await getYoutubeTranscript(videoId);
      transcript = result.text;
    } catch {
      // No transcript available (private, no captions, etc.) — continue without it
    }

    entries.push({
      title: title.slice(0, 200),
      url: `https://www.youtube.com/watch?v=${videoId}`,
      platform: 'youtube',
      published_at: published || null,
      engagement_metrics: {
        views: views ? parseInt(views) : 0,
        likes: likes ? parseInt(likes) : 0,
      },
      content_body: transcript,
    });
  }

  return entries;
}

// ==========================================
// Router: scrape by platform
// ==========================================
export async function scrapeCompetitor(
  platform: string,
  profileUrl: string,
  maxPosts = 20
): Promise<ScrapedContent[]> {
  switch (platform) {
    case 'instagram':
      return scrapeInstagram(profileUrl, maxPosts);
    case 'tiktok':
      return scrapeTikTok(profileUrl, maxPosts);
    case 'youtube':
      return scrapeYouTube(profileUrl, maxPosts);
    default:
      throw new Error(`Plataforma no soportada para scraping: ${platform}. Soportadas: instagram, tiktok, youtube`);
  }
}
