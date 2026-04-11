/**
 * Apify integration — scrape competitor content from social platforms
 * Uses Apify REST API directly (no SDK dependency)
 */
import dotenv from 'dotenv';
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
async function runActor(actorId: string, input: Record<string, any>): Promise<any[]> {
  if (!APIFY_TOKEN) throw new Error('APIFY_TOKEN no configurado. Agregalo al .env');

  // Start actor run and wait for it to finish (synchronous call, up to 120s)
  const res = await fetch(
    `${APIFY_BASE}/acts/${actorId}/run-sync-get-dataset-items?token=${APIFY_TOKEN}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Apify error (${actorId}): ${res.status} — ${err}`);
  }

  return res.json();
}

// ==========================================
// Instagram — scrape recent posts from a profile
// ==========================================
export async function scrapeInstagram(profileUrl: string, maxPosts = 20): Promise<ScrapedContent[]> {
  // Extract username from URL
  const username = profileUrl
    .replace(/\/$/, '')
    .split('/')
    .pop()
    ?.replace('@', '') || profileUrl;

  const items = await runActor('apify~instagram-post-collector', {
    username: [username],
    resultsLimit: maxPosts,
  });

  return items.map((item: any) => ({
    title: (item.caption || item.alt || '').slice(0, 200),
    url: item.url || item.shortCode ? `https://www.instagram.com/p/${item.shortCode}/` : '',
    platform: 'instagram',
    published_at: item.timestamp || item.takenAtTimestamp
      ? new Date((item.timestamp || item.takenAtTimestamp) * 1000).toISOString()
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

  const items = await runActor('clockworks~free-tiktok-scraper', {
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
// YouTube — scrape recent videos with engagement data
// ==========================================
export async function scrapeYouTube(channelUrl: string, maxPosts = 20): Promise<ScrapedContent[]> {
  // Accept URL or handle
  const handle = channelUrl
    .replace(/\/$/, '')
    .split('/')
    .pop()
    ?.replace('@', '') || channelUrl;

  const items = await runActor('streamers~youtube-scraper', {
    startUrls: [{ url: `https://www.youtube.com/@${handle}/videos` }],
    maxResults: maxPosts,
    maxResultsShorts: 0,
    maxResultStreams: 0,
  });

  return items.map((item: any) => ({
    title: (item.title || '').slice(0, 200),
    url: item.url || (item.id ? `https://www.youtube.com/watch?v=${item.id}` : ''),
    platform: 'youtube',
    published_at: item.date || item.uploadDate || null,
    engagement_metrics: {
      likes: item.likes ?? 0,
      comments: item.commentsCount ?? item.numberOfSubscribers ?? 0,
      views: item.viewCount ?? item.views ?? 0,
    },
    content_body: item.description || item.text || '',
  }));
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
