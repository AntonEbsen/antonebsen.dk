import { describe, it, expect, vi, afterEach } from 'vitest';
import { parseFeed, getLatestVideos, CHANNEL_ID } from './youtube';

// A trimmed copy of the real Atom feed shape returned by
// https://www.youtube.com/feeds/videos.xml?channel_id=...
const FEED = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns="http://www.w3.org/2005/Atom">
  <title>The Wandering Economist</title>
  <entry>
    <id>yt:video:Y4hDMjNbL5U</id>
    <yt:videoId>Y4hDMjNbL5U</yt:videoId>
    <title>The Dolomites, day 1</title>
    <published>2026-07-27T16:12:06+00:00</published>
  </entry>
  <entry>
    <id>yt:video:AAAAAAAAAAA</id>
    <yt:videoId>AAAAAAAAAAA</yt:videoId>
    <title>Rey &amp; the Global Financial Cycle</title>
    <published>2026-08-02T09:00:00+00:00</published>
  </entry>
</feed>`;

afterEach(() => {
    vi.restoreAllMocks();
});

describe('parseFeed', () => {
    it('extracts every entry', () => {
        const videos = parseFeed(FEED);

        expect(videos).toHaveLength(2);
        expect(videos[0]).toEqual({
            youtubeId: 'Y4hDMjNbL5U',
            title: 'The Dolomites, day 1',
            publishedAt: '2026-07-27T16:12:06+00:00'
        });
    });

    it('decodes XML entities in titles', () => {
        expect(parseFeed(FEED)[1].title).toBe('Rey & the Global Financial Cycle');
    });

    it('skips entries missing required fields instead of throwing', () => {
        const broken = `<feed><entry><title>No id here</title></entry></feed>`;
        vi.spyOn(console, 'warn').mockImplementation(() => { });

        expect(parseFeed(broken)).toEqual([]);
    });

    it('returns an empty array for junk input', () => {
        expect(parseFeed('')).toEqual([]);
        expect(parseFeed('<html>consent wall</html>')).toEqual([]);
    });
});

describe('getLatestVideos', () => {
    it('fetches and parses the channel feed', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response(FEED, { status: 200 })));

        const videos = await getLatestVideos();

        expect(videos).toHaveLength(2);
        expect(vi.mocked(fetch).mock.calls[0][0]).toContain(CHANNEL_ID);
    });

    // The build must never fail because YouTube is unreachable.
    it('returns [] when the request throws', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('ENOTFOUND'); }));
        vi.spyOn(console, 'warn').mockImplementation(() => { });

        await expect(getLatestVideos()).resolves.toEqual([]);
    });

    it('returns [] on a non-OK response', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 503 })));
        vi.spyOn(console, 'warn').mockImplementation(() => { });

        await expect(getLatestVideos()).resolves.toEqual([]);
    });
});
