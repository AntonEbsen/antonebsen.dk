import { parseVtt, toParagraphs, toPlainText, type Cue } from './transcript';

/**
 * Resolves a video's transcript, the same way trail.ts resolves GPX: files are
 * pulled in eagerly at build time via import.meta.glob, so there is no filesystem
 * access and a missing folder is simply an empty set.
 */
const vttFiles = import.meta.glob('/src/data/transcripts/*.vtt', {
    query: '?raw',
    import: 'default',
    eager: true
}) as Record<string, string>;

export interface ResolvedTranscript {
    /** Readable paragraphs, each timestamped to where it starts. */
    paragraphs: Cue[];
    /** The whole thing as prose, for the search index. */
    plain: string;
    /** Templates use this to decide whether to render the panel at all. */
    hasTranscript: boolean;
}

const EMPTY: ResolvedTranscript = { paragraphs: [], plain: '', hasTranscript: false };

interface VideoTranscriptInput {
    transcriptFile?: string;
    transcriptFile_da?: string;
    transcriptFile_de?: string;
}

/**
 * Picks the file for `lang`, falling back to the English one — matching how
 * videoTitle and videoDescription degrade in video-feed.ts.
 */
export function resolveTranscript(
    video: VideoTranscriptInput,
    lang: 'da' | 'en' | 'de' = 'en'
): ResolvedTranscript {
    const named =
        (lang === 'da' && video.transcriptFile_da) ||
        (lang === 'de' && video.transcriptFile_de) ||
        video.transcriptFile;

    if (!named) return EMPTY;

    const key = Object.keys(vttFiles).find((path) => path.endsWith(`/${named}`));
    if (!key) {
        console.warn(`Transcript "${named}" not found in src/data/transcripts/ — skipping.`);
        return EMPTY;
    }

    const cues = parseVtt(vttFiles[key]);
    if (cues.length === 0) return EMPTY;

    return {
        paragraphs: toParagraphs(cues),
        plain: toPlainText(cues),
        hasTranscript: true
    };
}
