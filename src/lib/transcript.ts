/**
 * WebVTT parsing for video transcripts.
 *
 * YouTube Studio exports captions as .vtt (Subtitles → pick the language →
 * Download). Drop the file into src/data/transcripts/ and name it in the video's
 * `transcriptFile`, exactly as `gpxFile` works for trail data.
 *
 * Auto-generated captions are messy in specific ways this handles: they repeat each
 * line as a "rolling" caption where the previous cue's text is re-emitted with the
 * next word appended, they carry inline <c> and <00:00:00.000> karaoke timing tags,
 * and they cut sentences at arbitrary points. Cues are merged into readable
 * paragraphs rather than shown as a wall of two-word fragments.
 */

export interface Cue {
    /** Start time in seconds — matches the `t` field on chapters, so seek works the same way. */
    t: number;
    text: string;
}

/** `HH:MM:SS.mmm` or `MM:SS.mmm` to seconds. Returns NaN on anything unparseable. */
export function parseTimestamp(stamp: string): number {
    // Seconds are pinned to 00-59 so a malformed "99:99" is rejected rather than
    // quietly read as 6039 seconds and used to seek the player.
    const m = stamp.trim().match(/^(?:(\d+):)?(\d{1,2}):([0-5]\d)(?:[.,](\d{1,3}))?$/);
    if (!m) return NaN;

    const [, h, min, sec, frac] = m;
    // Minutes may only exceed 59 in the MM:SS form, where there is no hour field.
    if (h !== undefined && Number(min) > 59) return NaN;

    const ms = frac ? Number(frac.padEnd(3, '0')) : 0;
    return Number(h ?? 0) * 3600 + Number(min) * 60 + Number(sec) + ms / 1000;
}

/** Strips the karaoke timing spans and <c> tags YouTube leaves in auto-captions. */
const stripTags = (s: string): string =>
    s
        .replace(/<\d{2}:\d{2}:\d{2}[.,]\d{1,3}>/g, '')
        .replace(/<\/?c[^>]*>/g, '')
        .replace(/<\/?[bviu]>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\s+/g, ' ')
        .trim();

/**
 * Parses a WebVTT document into timed cues.
 *
 * Returns [] for empty or unrecognisable input rather than throwing — a broken
 * transcript should leave the panel off the page, not fail the build.
 */
export function parseVtt(vtt: string): Cue[] {
    if (!vtt || typeof vtt !== 'string') return [];

    // Blocks are separated by blank lines. Normalise line endings first.
    const blocks = vtt.replace(/\r\n?/g, '\n').split(/\n{2,}/);
    const cues: Cue[] = [];

    for (const block of blocks) {
        const lines = block.split('\n').filter((l) => l.trim() !== '');
        if (lines.length === 0) continue;

        // Skip the WEBVTT header, NOTE comments and STYLE/REGION blocks.
        const head = lines[0].trim();
        if (/^WEBVTT/.test(head) || /^(NOTE|STYLE|REGION)\b/.test(head)) continue;

        // An optional numeric or textual cue identifier may precede the timing line.
        const timingIndex = lines.findIndex((l) => l.includes('-->'));
        if (timingIndex === -1) continue;

        const [rawStart] = lines[timingIndex].split('-->');
        const t = parseTimestamp(rawStart);
        if (Number.isNaN(t)) continue;

        const text = stripTags(lines.slice(timingIndex + 1).join(' '));
        if (text) cues.push({ t, text });
    }

    return dedupeRolling(cues);
}

/**
 * YouTube's auto-captions roll: each cue repeats the tail of the one before with a
 * few new words. Keeping both would double every sentence in the transcript, so a
 * cue whose text is wholly contained in the next one is dropped.
 */
function dedupeRolling(cues: Cue[]): Cue[] {
    const out: Cue[] = [];

    for (let i = 0; i < cues.length; i++) {
        const cur = cues[i];
        const next = cues[i + 1];

        if (next && next.text.includes(cur.text)) continue;
        // Exact repeats of the previous kept line add nothing either.
        if (out.length > 0 && out[out.length - 1].text === cur.text) continue;

        out.push(cur);
    }

    return out;
}

/**
 * Groups cues into paragraphs of roughly `targetChars`, breaking at a sentence end
 * where one is available. Each paragraph keeps the timestamp of its first cue, so
 * clicking it seeks to where that passage begins.
 */
export function toParagraphs(cues: Cue[], targetChars = 320): Cue[] {
    const paras: Cue[] = [];
    let buf = '';
    let start = 0;

    const flush = () => {
        const text = buf.trim();
        if (text) paras.push({ t: start, text });
        buf = '';
    };

    for (const cue of cues) {
        if (buf === '') start = cue.t;
        buf = buf === '' ? cue.text : `${buf} ${cue.text}`;

        const longEnough = buf.length >= targetChars;
        const endsSentence = /[.!?]["')\]]?$/.test(buf);
        if (longEnough && endsSentence) flush();
        // Hard stop so a transcript with no punctuation at all still breaks up.
        else if (buf.length >= targetChars * 2) flush();
    }

    flush();
    return paras;
}

/** Flattens a transcript to plain prose, for the search index and meta description. */
export function toPlainText(cues: Cue[]): string {
    return cues.map((c) => c.text).join(' ').replace(/\s+/g, ' ').trim();
}

/** `MM:SS`, or `H:MM:SS` past the hour — the same shape the chapter list uses. */
export function formatTimestamp(seconds: number): string {
    const s = Math.max(0, Math.floor(seconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;

    return h > 0
        ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
        : `${m}:${String(sec).padStart(2, '0')}`;
}
