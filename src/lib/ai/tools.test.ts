import { describe, it, expect } from 'vitest';
import { TOOLS, isServerResolved, resolveCitations, AWARDABLE_LEDGER_ENTRIES, toolsFor } from './tools';
import { NAV_ALLOWLIST } from './safe-html';

const byName = (n: string) => TOOLS.find((t) => t.name === n)!;

describe('tool definitions', () => {
    it('gives every tool a name, a description and an object schema', () => {
        for (const tool of TOOLS) {
            expect(tool.name, 'name').toBeTruthy();
            // The description is how the model decides when to call it, so an empty
            // or one-line description is a real defect, not a style nit.
            expect(tool.description!.length, `${tool.name} description`).toBeGreaterThan(60);
            expect(tool.input_schema.type).toBe('object');
        }
    });

    it('closes every schema to unexpected properties', () => {
        for (const tool of TOOLS) {
            expect((tool.input_schema as any).additionalProperties, tool.name).toBe(false);
        }
    });
});

describe('navigateTo', () => {
    it('constrains the path to the allowlist via the schema', () => {
        // This is the point of the tool rewrite: the allowlist used to be a sentence
        // in the prompt asking the model to behave. Now it is an enum the API
        // validates, so an off-list path never reaches the browser at all.
        const path = (byName('navigateTo').input_schema as any).properties.path;
        expect(path.enum).toEqual([...NAV_ALLOWLIST]);
    });

    it('does not admit an external origin', () => {
        const paths: string[] = (byName('navigateTo').input_schema as any).properties.path.enum;
        expect(paths.some((p) => p.startsWith('http') || p.startsWith('//'))).toBe(false);
        expect(paths.every((p) => p.startsWith('/'))).toBe(true);
    });
});

describe('recordLedgerEntry', () => {
    it('only admits the two entries the assistant may award', () => {
        const entry = (byName('recordLedgerEntry').input_schema as any).properties.entry;
        expect(entry.enum).toEqual([...AWARDABLE_LEDGER_ENTRIES]);
        // The rest are earned by doing the thing they describe; the model must not
        // be able to hand them out for saying the right words.
        expect(entry.enum).not.toContain('explorer');
        expect(entry.enum).not.toContain('easter_egg');
    });
});

describe('isServerResolved', () => {
    it('resolves citations on the server and forwards the rest to the browser', () => {
        expect(isServerResolved('citeSources')).toBe(true);
        for (const name of ['showChart', 'navigateTo', 'suggestFollowUps', 'askQuizQuestion', 'recordLedgerEntry']) {
            expect(isServerResolved(name), name).toBe(false);
        }
    });
});

describe('resolveCitations', () => {
    it('turns cited ids into titles and site-relative links', () => {
        const { sources } = resolveCitations({ ids: ['blog:ecb-part-1'] }, 'en');
        expect(sources).toHaveLength(1);
        expect(sources[0].url).toBe('/en/blog/ecb-part-1');
        expect(sources[0].title).toBeTruthy();
    });

    it('drops ids the model invented', () => {
        // A hallucinated citation must produce no link, not a plausible 404.
        const { sources } = resolveCitations({ ids: ['blog:not-real', 'nonsense'] }, 'en');
        expect(sources).toEqual([]);
    });

    it('keeps the real ids out of a mixed list', () => {
        const { sources } = resolveCitations({ ids: ['blog:ecb-part-1', 'blog:fabricated'] }, 'da');
        expect(sources).toHaveLength(1);
        expect(sources[0].id).toBe('blog:ecb-part-1');
    });

    it('never emits a non-relative URL', () => {
        const { sources } = resolveCitations({ ids: ['blog:ecb-part-1', 'cv:experience:0'] }, 'en');
        for (const s of sources) {
            if (s.url) expect(s.url.startsWith('/')).toBe(true);
        }
    });

    it('tolerates junk input without throwing', () => {
        expect(resolveCitations(undefined, 'en').sources).toEqual([]);
        expect(resolveCitations({}, 'en').sources).toEqual([]);
        expect(resolveCitations({ ids: 'not-an-array' }, 'en').sources).toEqual([]);
        expect(resolveCitations({ ids: [1, null, {}] }, 'en').sources).toEqual([]);
    });
});

describe('askQuizQuestion', () => {
    const schema = () => (byName('askQuizQuestion').input_schema as any).properties;

    it('bounds the option list to something renderable', () => {
        // The client draws one button per option. Unbounded, the model could return
        // twenty and blow out the panel.
        expect(schema().options.minItems).toBe(2);
        expect(schema().options.maxItems).toBe(4);
    });

    it('keeps correctIndex inside the options it allows', () => {
        // maxItems is 4, so a valid zero-based index can never exceed 3. Without this
        // the client would look up options[7] and render 'undefined' as the answer.
        expect(schema().correctIndex.minimum).toBe(0);
        expect(schema().correctIndex.maximum).toBe(3);
        expect(schema().correctIndex.type).toBe('integer');
    });

    it('requires the explanation, so a wrong answer always teaches something', () => {
        const required = (byName('askQuizQuestion').input_schema as any).required;
        expect(required).toEqual(
            expect.arrayContaining(['question', 'options', 'correctIndex', 'explanation']),
        );
    });

    it('replaced the startQuiz stub rather than sitting beside it', () => {
        // startQuiz rendered a panel saying 'Quiz Mode Activated' and did nothing else.
        expect(TOOLS.find((t) => t.name === 'startQuiz')).toBeUndefined();
    });
});

describe('toolsFor', () => {
    it('offers a chat surface everything', () => {
        expect(toolsFor('chat')).toEqual(TOOLS);
        // The default has to be the permissive one: every existing caller omits it.
        expect(toolsFor()).toEqual(TOOLS);
    });

    it('offers a prose surface nothing the client would have to render', () => {
        const names = toolsFor('prose').map((t) => t.name);
        for (const clientRendered of ['showChart', 'navigateTo', 'suggestFollowUps', 'askQuizQuestion']) {
            expect(names, `${clientRendered} needs a client to draw it`).not.toContain(clientRendered);
        }
    });

    it('keeps citeSources on a prose surface', () => {
        // The server resolves this one, so no client rendering is involved and a
        // compact preview can still be grounded.
        expect(toolsFor('prose').map((t) => t.name)).toContain('citeSources');
    });

    it('never offers a tool the loop would answer with a lie', () => {
        // The loop replies "Shown to the visitor." to every client-rendered call. On a
        // surface that renders none, that answer would be false — so the surface must
        // only ever be offered tools the server resolves itself.
        for (const tool of toolsFor('prose')) {
            expect(isServerResolved(tool.name), `${tool.name} is not server-resolved`).toBe(true);
        }
    });
});
