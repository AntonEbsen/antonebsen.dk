import { describe, it, expect } from 'vitest';
import {
    parseVtt,
    parseTimestamp,
    toParagraphs,
    toPlainText,
    formatTimestamp
} from './transcript';

describe('parseTimestamp', () => {
    it('reads HH:MM:SS.mmm', () => {
        expect(parseTimestamp('01:02:03.500')).toBeCloseTo(3723.5, 3);
    });

    it('reads MM:SS.mmm without an hour field', () => {
        expect(parseTimestamp('02:03.250')).toBeCloseTo(123.25, 3);
    });

    it('accepts a comma as the decimal separator, as SRT-flavoured files use', () => {
        expect(parseTimestamp('00:00:10,100')).toBeCloseTo(10.1, 3);
    });

    it('pads a short fraction rather than misreading it', () => {
        // .5 is half a second, not 5 milliseconds.
        expect(parseTimestamp('00:00:01.5')).toBeCloseTo(1.5, 3);
    });

    it('returns NaN for junk', () => {
        expect(parseTimestamp('not a time')).toBeNaN();
    });
});

describe('parseVtt', () => {
    const VTT = `WEBVTT

1
00:00:00.000 --> 00:00:04.000
The Dolomites rise about two thousand metres

2
00:00:04.000 --> 00:00:08.500
above the valley floor.

3
00:00:08.500 --> 00:00:12.000
That climb takes most of a morning.
`;

    it('extracts cues with start times and text', () => {
        const cues = parseVtt(VTT);
        expect(cues).toHaveLength(3);
        expect(cues[0]).toEqual({ t: 0, text: 'The Dolomites rise about two thousand metres' });
        expect(cues[1].t).toBe(4);
        expect(cues[2].t).toBeCloseTo(8.5, 3);
    });

    it('skips the WEBVTT header, NOTE comments and STYLE blocks', () => {
        const withNoise = `WEBVTT - Some title

NOTE this is a comment
that spans two lines

STYLE
::cue { color: peachpuff; }

00:00:01.000 --> 00:00:02.000
Only line.
`;
        expect(parseVtt(withNoise)).toEqual([{ t: 1, text: 'Only line.' }]);
    });

    it('strips the karaoke timing tags YouTube leaves in auto-captions', () => {
        const tagged = `WEBVTT

00:00:01.000 --> 00:00:03.000
the <00:00:01.500><c>trail</c> was <c.colorE5E5E5>steep</c>
`;
        expect(parseVtt(tagged)[0].text).toBe('the trail was steep');
    });

    it('collapses the rolling repetition of auto-generated captions', () => {
        // YouTube re-emits the previous line with a few words appended.
        const rolling = `WEBVTT

00:00:00.000 --> 00:00:02.000
we walked

00:00:02.000 --> 00:00:04.000
we walked for six hours

00:00:04.000 --> 00:00:06.000
then it rained
`;
        const cues = parseVtt(rolling);
        expect(cues.map((c) => c.text)).toEqual(['we walked for six hours', 'then it rained']);
    });

    it('drops an exact repeat of the previous kept line', () => {
        const repeated = `WEBVTT

00:00:00.000 --> 00:00:02.000
same line

00:00:02.000 --> 00:00:04.000
same line

00:00:04.000 --> 00:00:06.000
different
`;
        expect(parseVtt(repeated).map((c) => c.text)).toEqual(['same line', 'different']);
    });

    it('handles CRLF line endings', () => {
        const crlf = 'WEBVTT\r\n\r\n00:00:01.000 --> 00:00:02.000\r\nWindows line.\r\n';
        expect(parseVtt(crlf)).toEqual([{ t: 1, text: 'Windows line.' }]);
    });

    it('tolerates a cue identifier line before the timing', () => {
        const withId = `WEBVTT

intro-cue
00:00:05.000 --> 00:00:06.000
Named cue.
`;
        expect(parseVtt(withId)).toEqual([{ t: 5, text: 'Named cue.' }]);
    });

    it('joins a cue spanning several lines into one', () => {
        const multi = `WEBVTT

00:00:01.000 --> 00:00:04.000
first half
second half
`;
        expect(parseVtt(multi)[0].text).toBe('first half second half');
    });

    it('returns [] for empty, missing or unparseable input rather than throwing', () => {
        expect(parseVtt('')).toEqual([]);
        // @ts-expect-error deliberately wrong type
        expect(parseVtt(null)).toEqual([]);
        expect(parseVtt('WEBVTT\n\nnothing useful here\n')).toEqual([]);
    });

    it('skips a cue whose timestamp will not parse', () => {
        const bad = `WEBVTT

99:99 --> nonsense
Dropped.

00:00:02.000 --> 00:00:03.000
Kept.
`;
        expect(parseVtt(bad)).toEqual([{ t: 2, text: 'Kept.' }]);
    });
});

describe('toParagraphs', () => {
    it('merges short cues and breaks at a sentence end', () => {
        const cues = [
            { t: 0, text: 'A'.repeat(150) + '.' },
            { t: 5, text: 'B'.repeat(200) + '.' },
            { t: 12, text: 'C'.repeat(50) + '.' }
        ];
        const paras = toParagraphs(cues, 320);

        expect(paras.length).toBeGreaterThan(1);
        // The paragraph carries the timestamp of the cue it started at.
        expect(paras[0].t).toBe(0);
        expect(paras[0].text.endsWith('.')).toBe(true);
    });

    it('still breaks up text with no punctuation at all', () => {
        const cues = Array.from({ length: 20 }, (_, i) => ({ t: i, text: 'word '.repeat(20).trim() }));
        const paras = toParagraphs(cues, 100);
        expect(paras.length).toBeGreaterThan(1);
    });

    it('keeps everything — no cue text is lost', () => {
        const cues = [
            { t: 0, text: 'one.' },
            { t: 1, text: 'two.' },
            { t: 2, text: 'three.' }
        ];
        expect(toPlainText(toParagraphs(cues))).toBe('one. two. three.');
    });

    it('returns [] for no cues', () => {
        expect(toParagraphs([])).toEqual([]);
    });
});

describe('formatTimestamp', () => {
    it('renders MM:SS below an hour', () => {
        expect(formatTimestamp(0)).toBe('0:00');
        expect(formatTimestamp(65)).toBe('1:05');
        expect(formatTimestamp(599)).toBe('9:59');
    });

    it('renders H:MM:SS past the hour', () => {
        expect(formatTimestamp(3661)).toBe('1:01:01');
    });

    it('clamps a negative to zero rather than printing a minus', () => {
        expect(formatTimestamp(-5)).toBe('0:00');
    });
});
