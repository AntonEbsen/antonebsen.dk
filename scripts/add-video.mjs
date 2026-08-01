#!/usr/bin/env node
/**
 * Scaffolds a videos-collection entry from a YouTube id.
 *
 *   npm run video:add -- <youtubeId> [--track hiking|economics] [--slug my-slug]
 *                                    [--series "Italy 2026"] [--gpx day-2.gpx] [--force]
 *
 * Pulls the title, description and publish date from the channel feed (falling back
 * to oEmbed), and detects portrait vs landscape from the video's own first frame so
 * `orientation` is never guessed by hand.
 *
 * NOTE: the feed-parsing regexes below mirror parseFeed() in src/lib/youtube.ts.
 * That module is TypeScript and cannot be imported from a plain Node script, so the
 * few lines are duplicated deliberately — keep the two in sync if the feed shape
 * ever changes.
 */
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const CHANNEL_ID = 'UCy2watukchWb881sruMWsfg';
const FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
const CONTENT_DIR = path.join(process.cwd(), 'src', 'content', 'videos');

const TRACKS = ['hiking', 'economics'];

function parseArgs(argv) {
    const [id, ...rest] = argv;
    const opts = { youtubeId: id, force: false };

    for (let i = 0; i < rest.length; i++) {
        const arg = rest[i];
        if (arg === '--force') { opts.force = true; continue; }
        if (arg.startsWith('--')) opts[arg.slice(2)] = rest[++i];
    }
    return opts;
}

const decodeXml = (s) =>
    s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'").replace(/&apos;/g, "'").replace(/&amp;/g, '&');

const pick = (entry, tag) => {
    const m = entry.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
    return m ? decodeXml(m[1].trim()) : undefined;
};

/** Looks the video up in the channel's Atom feed (latest ~15 uploads). */
async function fromFeed(youtubeId) {
    try {
        const res = await fetch(FEED_URL, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) return null;

        const xml = await res.text();
        const entry = (xml.match(/<entry>[\s\S]*?<\/entry>/g) ?? [])
            .find((e) => pick(e, 'yt:videoId') === youtubeId);
        if (!entry) return null;

        return {
            title: pick(entry, 'title'),
            description: pick(entry, 'media:description') || '',
            publishedAt: (pick(entry, 'published') || '').slice(0, 10)
        };
    } catch {
        return null;
    }
}

/** Fallback for videos older than the feed window. */
async function fromOembed(youtubeId) {
    try {
        const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${youtubeId}&format=json`;
        const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) return null;

        const data = await res.json();
        return { title: data.title, description: '', publishedAt: '' };
    } catch {
        return null;
    }
}

/**
 * frame0.jpg is the raw first frame at the video's *native* aspect ratio, unlike
 * maxresdefault.jpg which YouTube always pads to 16:9 with a blurred fill.
 * Measured: 268x480 for a Short vs 1280x720 for a normal upload.
 */
async function detectOrientation(youtubeId) {
    try {
        const res = await fetch(`https://i.ytimg.com/vi/${youtubeId}/frame0.jpg`, {
            signal: AbortSignal.timeout(8000)
        });
        if (!res.ok) return 'landscape';

        const { width, height } = await sharp(Buffer.from(await res.arrayBuffer())).metadata();
        if (!width || !height) return 'landscape';

        return height > width ? 'portrait' : 'landscape';
    } catch {
        return 'landscape';
    }
}

const exists = (p) => fs.access(p).then(() => true, () => false);

const slugify = (s) =>
    s.toLowerCase()
        .replace(/[æ]/g, 'ae').replace(/[ø]/g, 'oe').replace(/[å]/g, 'aa')
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60);

async function main() {
    const opts = parseArgs(process.argv.slice(2));

    // Set exitCode and return rather than process.exit(): an abrupt exit while the
    // fetch/sharp handles are still open trips a libuv assertion on Windows.
    if (!opts.youtubeId || opts.youtubeId.startsWith('--')) {
        console.error('Usage: npm run video:add -- <youtubeId> [--track hiking|economics] [--slug ...] [--series ...] [--gpx ...] [--force]');
        process.exitCode = 1;
        return;
    }

    if (opts.track && !TRACKS.includes(opts.track)) {
        console.error(`--track must be one of: ${TRACKS.join(', ')}`);
        process.exitCode = 1;
        return;
    }

    // When the slug is known up front, bail before doing any network or image work.
    if (opts.slug && !opts.force && await exists(path.join(CONTENT_DIR, `${opts.slug}.json`))) {
        console.error(`src/content/videos/${opts.slug}.json already exists. Pass --force to overwrite.`);
        process.exitCode = 1;
        return;
    }

    console.log(`Looking up ${opts.youtubeId}…`);
    const meta = (await fromFeed(opts.youtubeId)) || (await fromOembed(opts.youtubeId));

    if (!meta?.title) {
        console.error('Could not fetch metadata for that id. Is it public, and is the id correct?');
        process.exitCode = 1;
        return;
    }

    const orientation = await detectOrientation(opts.youtubeId);
    const slug = opts.slug || slugify(meta.title);
    const target = path.join(CONTENT_DIR, `${slug}.json`);

    if (!opts.force && await exists(target)) {
        console.error(`${path.relative(process.cwd(), target)} already exists. Pass --force to overwrite.`);
        process.exitCode = 1;
        return;
    }

    const entry = {
        youtubeId: opts.youtubeId,
        title: meta.title,
        title_da: '',
        description: meta.description || '',
        description_da: '',
        publishedAt: meta.publishedAt || new Date().toISOString().slice(0, 10),
        track: opts.track || 'hiking',
        orientation,
        ...(opts.series ? { series: opts.series } : {}),
        ...(opts.gpx ? { gpxFile: opts.gpx } : {})
    };

    await fs.mkdir(CONTENT_DIR, { recursive: true });
    await fs.writeFile(target, JSON.stringify(entry, null, 4) + '\n', 'utf8');

    console.log(`\n  wrote ${path.relative(process.cwd(), target)}`);
    console.log(`  title       ${entry.title}`);
    console.log(`  published   ${entry.publishedAt}`);
    console.log(`  orientation ${orientation}  (detected from frame0.jpg)`);
    console.log(`  track       ${entry.track}${opts.track ? '' : '  <- default, override with --track'}`);
    console.log(`\n  Next: fill in title_da / description_da${opts.gpx ? '' : ', and drop a .gpx into src/data/gpx/ if this was a hike'}.`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
