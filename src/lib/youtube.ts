import { z } from 'zod';

// --- Channel constants ---

export const CHANNEL_ID = 'UCy2watukchWb881sruMWsfg';
export const CHANNEL_HANDLE = '@thewanderingeconomist';
export const CHANNEL_URL = `https://www.youtube.com/${CHANNEL_HANDLE}`;
export const CHANNEL_NAME = 'The Wandering Economist';

/**
 * YouTube's public Atom feed. No API key, no quota, no env var.
 * Caveat: returns only the ~15 most recent uploads and carries no duration,
 * view count or Shorts flag — which is why the `videos` content collection
 * stays the editorial source of truth. This feed only powers a "new on
 * YouTube" strip for uploads that don't have a curated entry yet.
 */
const FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;

// --- Schema ---

const FeedVideoSchema = z.object({
    youtubeId: z.string().min(1),
    title: z.string().min(1),
    publishedAt: z.string().min(1),
});
export type FeedVideo = z.infer<typeof FeedVideoSchema>;

// --- Parsing ---

const decodeXml = (s: string) =>
    s
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&amp;/g, '&');

const pick = (entry: string, tag: string): string | undefined => {
    const match = entry.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
    return match ? decodeXml(match[1].trim()) : undefined;
};

/** Exported for unit testing without a network round-trip. */
export function parseFeed(xml: string): FeedVideo[] {
    const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) ?? [];
    const videos: FeedVideo[] = [];

    for (const entry of entries) {
        const result = FeedVideoSchema.safeParse({
            youtubeId: pick(entry, 'yt:videoId'),
            title: pick(entry, 'title'),
            publishedAt: pick(entry, 'published'),
        });

        if (result.success) {
            videos.push(result.data);
        } else {
            console.warn('Skipping malformed YouTube feed entry:', result.error.flatten());
        }
    }

    return videos;
}

// --- Fetch ---

/**
 * Fetches the channel's latest uploads at build time (both video pages are
 * prerendered, so this never runs per-request).
 *
 * Always returns an array: a YouTube outage, a rate limit or a schema change
 * must never fail the build. Callers fall back to the curated collection.
 */
export async function getLatestVideos(): Promise<FeedVideo[]> {
    try {
        const response = await fetch(FEED_URL, {
            headers: { 'User-Agent': 'antonebsen.dk build' },
            signal: AbortSignal.timeout(8000),
        });

        if (!response.ok) {
            console.warn(`YouTube feed returned ${response.status}; falling back to curated videos.`);
            return [];
        }

        return parseFeed(await response.text());
    } catch (e) {
        console.warn('Could not reach the YouTube feed; falling back to curated videos.', e);
        return [];
    }
}
