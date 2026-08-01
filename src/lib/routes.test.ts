import { describe, it, expect } from 'vitest';
import { fileToRoute, stripLocale, localizedPath } from './routes';

// routeExists/availableAlternates depend on import.meta.glob, which only resolves
// inside the Astro/Vite build. The pure path helpers they are built on are tested
// here; the end-to-end behaviour is covered by tests/hreflang.spec.ts.

describe('fileToRoute', () => {
    it('maps index files to their directory root', () => {
        expect(fileToRoute('/src/pages/index.astro')).toBe('/');
        expect(fileToRoute('/src/pages/en/index.astro')).toBe('/en');
        expect(fileToRoute('/src/pages/de/index.astro')).toBe('/de');
    });

    it('maps ordinary pages', () => {
        expect(fileToRoute('/src/pages/about.astro')).toBe('/about');
        expect(fileToRoute('/src/pages/en/about.astro')).toBe('/en/about');
        expect(fileToRoute('/src/pages/camino/route.astro')).toBe('/camino/route');
    });

    it('keeps dynamic segments so they can be turned into patterns', () => {
        expect(fileToRoute('/src/pages/blog/[slug].astro')).toBe('/blog/[slug]');
        expect(fileToRoute('/src/pages/videoer/serie/[series].astro')).toBe('/videoer/serie/[series]');
    });

    it('ignores rest params, which would need prefix matching', () => {
        expect(fileToRoute('/src/pages/docs/[...path].astro')).toBeNull();
    });
});

describe('stripLocale', () => {
    it('removes a leading locale prefix', () => {
        expect(stripLocale('/en/about')).toBe('/about');
        expect(stripLocale('/de/videos')).toBe('/videos');
    });

    it('leaves Danish paths alone', () => {
        expect(stripLocale('/about')).toBe('/about');
        expect(stripLocale('/videoer')).toBe('/videoer');
    });

    it('does not strip a segment that merely starts with the prefix', () => {
        expect(stripLocale('/energy')).toBe('/energy');
        expect(stripLocale('/design')).toBe('/design');
    });

    it('handles the bare locale root', () => {
        expect(stripLocale('/en')).toBe('/');
        expect(stripLocale('/de')).toBe('/');
    });
});

describe('localizedPath', () => {
    it('round-trips between languages', () => {
        expect(localizedPath('/en/about', 'da')).toBe('/about');
        expect(localizedPath('/about', 'en')).toBe('/en/about');
        expect(localizedPath('/de/about', 'en')).toBe('/en/about');
    });

    it('keeps the home page tidy rather than emitting /en/', () => {
        expect(localizedPath('/', 'en')).toBe('/en');
        expect(localizedPath('/en', 'da')).toBe('/');
        expect(localizedPath('/de', 'de')).toBe('/de');
    });

    it('ignores trailing slashes, matching trailingSlash: never', () => {
        expect(localizedPath('/about/', 'en')).toBe('/en/about');
    });
});
