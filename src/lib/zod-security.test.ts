import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { z } from 'zod';
import { ChatRequestSchema, CHAT_LIMITS } from './ai/request';
import { BookSchema, BucketListInputSchema, BucketListUpdateSchema, CvEducationSchema, GuestbookSchema, ProjectSchema } from './schemas';

const require = createRequire(import.meta.url);

describe('patched Zod collection validation', () => {
    it('rejects an oversized collection before validating any element', () => {
        let inspected = 0;
        const item = z.string().refine(() => { inspected++; return true; });
        const result = z.array(item).max(2).safeParse(Array(1000).fill('x'));
        expect(result.success).toBe(false);
        if (!result.success) expect(result.error.issues).toMatchObject([{ code: 'too_big' }]);
        expect(inspected).toBe(0);
    });

    it('applies that early bound to the actual chat request schema', () => {
        let inspected = 0;
        const messages = Array.from({ length: CHAT_LIMITS.messages + 1 }, () => ({
            role: 'user',
            get content() { inspected++; return 'x'; },
        }));
        const result = ChatRequestSchema.safeParse({ messages });
        expect(result.success).toBe(false);
        if (!result.success) expect(result.error.issues).toMatchObject([{ code: 'too_big', path: ['messages'] }]);
        expect(inspected).toBe(0);
    });

    it('pins only patched declared Zod copies in the lockfile', () => {
        const lock = JSON.parse(readFileSync(new URL('../../package-lock.json', import.meta.url), 'utf8'));
        const copies = Object.entries(lock.packages).filter(([path]) => path.endsWith('/zod'));
        expect(copies.length).toBeGreaterThan(0);
        for (const [, entry] of copies) expect((entry as { version: string }).version).toBe('4.6.7');
        const installed = JSON.parse(readFileSync(require.resolve('zod/package.json'), 'utf8'));
        expect(installed.version).toBe('4.6.7');
    });
});

describe('validation contracts survive the major upgrade', () => {
    it('still strips unknown write fields rather than forwarding them to the database', () => {
        const parsed = ProjectSchema.parse({ title: 'Example', description: 'Research', admin: true, id: 99 });
        expect(parsed).toEqual({ title: 'Example', description: 'Research' });
        expect(GuestbookSchema.parse({ name: 'Reader', message: 'Hello', approved: true }))
            .toEqual({ name: 'Reader', message: 'Hello' });
    });

    it('keeps defaults, coercion and nullable fields', () => {
        expect(BucketListInputSchema.parse({ title: 'Research' }).status).toBe('todo');
        expect(BucketListUpdateSchema.parse({ id: '12', status: 'done' })).toEqual({ id: 12, status: 'done' });
        expect(BucketListUpdateSchema.safeParse({ id: 'not-an-id', status: 'done' }).success).toBe(false);
        expect(BookSchema.parse({ title: 'Example', status: 'Reading', rating: null }).rating).toBeNull();
    });

    it('keeps nested field-error output used by the API routes', () => {
        const result = CvEducationSchema.safeParse({ institution: '', degree: 'MSc', bullets: [42] });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.flatten().fieldErrors.institution?.length).toBeGreaterThan(0);
            expect(result.error.flatten().fieldErrors.bullets?.length).toBeGreaterThan(0);
        }
    });

    it('checks the scoped Vercel config dependency without reading credentials or files', () => {
        const config = require('@vercel/cli-config');
        // Pure parsers only. Never call read*/write*/getLikely* on the real machine.
        expect(config.parseGlobalConfig({ telemetry: { enabled: false } }).telemetry.enabled).toBe(false);
        expect(config.parseAuthConfig({ token: 'synthetic-test-token' }).token).toBe('synthetic-test-token');
        expect(() => config.parseAuthConfig({ token: 123 })).toThrow();
        expect(() => config.parseGlobalConfig({ credStorage: 'invalid-test-value' })).toThrow();
    });

    it('guards the Vercel helper’s bundled schema graph separately from its declared dependency', () => {
        // cli-config bundles validators: an npm override does not rewrite that
        // bundle. Its global/auth schemas currently have no affected collection
        // validators. A future change must be reviewed, not hidden by a green audit.
        const config = require('@vercel/cli-config');
        const seen = new Set<unknown>();
        const collections: string[] = [];
        function visit(schema: unknown, path: string) {
            const def = (schema as { _zod?: { def: Record<string, unknown> } } | undefined)?._zod?.def;
            if (!def || seen.has(schema)) return;
            seen.add(schema);
            if (['array', 'map', 'set'].includes(String(def.type))) collections.push(path);
            for (const key of ['innerType', 'element', 'keyType', 'valueType']) visit(def[key], `${path}.${key}`);
            if (def.shape && typeof def.shape === 'object') {
                for (const [key, child] of Object.entries(def.shape)) visit(child, `${path}.${key}`);
            }
            if (Array.isArray(def.options)) for (const child of def.options) visit(child, `${path}.option`);
        }
        visit(config.globalConfigSchema, 'global');
        visit(config.authConfigSchema, 'auth');
        expect(seen.size).toBeGreaterThan(20);
        expect(collections).toEqual([]);
    });
});
