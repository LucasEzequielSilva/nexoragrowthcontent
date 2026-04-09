import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { YoutubeTranscript } = require('youtube-transcript');

/**
 * Extract transcript from a YouTube video URL or ID
 */
export async function getYoutubeTranscript(urlOrId: string): Promise<{
  text: string;
  segments: Array<{ text: string; offset: number; duration: number }>;
}> {
  // Extract video ID from URL if needed
  let videoId = urlOrId;
  const urlMatch = urlOrId.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (urlMatch) videoId = urlMatch[1];

  const segments = await YoutubeTranscript.fetchTranscript(videoId);
  const text = segments.map((s: any) => s.text).join(' ');

  return {
    text,
    segments: segments.map((s: any) => ({
      text: s.text,
      offset: s.offset,
      duration: s.duration,
    })),
  };
}

/**
 * Extract YouTube channel recent videos (via RSS feed - no API key needed)
 */
export async function getChannelRecentVideos(channelHandle: string): Promise<Array<{
  videoId: string;
  title: string;
  published: string;
  link: string;
}>> {
  // YouTube RSS feed by channel handle
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelHandle}`;

  try {
    const res = await fetch(feedUrl);
    const xml = await res.text();

    // Simple XML parsing for RSS entries
    const entries: Array<{ videoId: string; title: string; published: string; link: string }> = [];
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let match;

    while ((match = entryRegex.exec(xml)) !== null) {
      const entry = match[1];
      const videoId = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/)?.[1] || '';
      const title = entry.match(/<title>(.*?)<\/title>/)?.[1] || '';
      const published = entry.match(/<published>(.*?)<\/published>/)?.[1] || '';
      const link = `https://www.youtube.com/watch?v=${videoId}`;

      entries.push({ videoId, title, published, link });
    }

    return entries;
  } catch {
    // Fallback: try with handle-based URL
    console.error(`Failed to fetch RSS for ${channelHandle}. May need channel ID instead of handle.`);
    return [];
  }
}
