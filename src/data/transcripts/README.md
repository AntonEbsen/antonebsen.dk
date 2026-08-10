# Transcripts

WebVTT caption files, one per video, parsed at build time by
[`src/lib/transcript.ts`](../../lib/transcript.ts).

## Getting a file

YouTube Studio → the video → **Subtitles** → pick the language → **Download**.
Choose `.vtt` if offered; `.srt` also parses, since the timestamp reader accepts a
comma as the decimal separator.

Auto-generated captions are fine. The parser strips YouTube's inline `<c>` and
karaoke timing tags, and collapses the rolling repetition where each cue re-emits
the previous line with a few words appended.

## Wiring one up

Drop the file in this folder and name it in the video's JSON entry:

```json
{
  "youtubeId": "...",
  "transcriptFile": "dolomites-day-1.vtt"
}
```

`transcriptFile_da` and `transcriptFile_de` are optional; both fall back to
`transcriptFile`, the same way `title_da` falls back to `title`.

A named file that does not exist logs a warning and leaves the panel off the page —
it never fails the build.

## What it feeds

- a collapsible transcript on the video detail page, where clicking a passage seeks
  the player (it reuses the chapter-seek handler)
- the site search index, so a phrase spoken in a video is findable
- `transcript` on the page's schema.org `VideoObject`
