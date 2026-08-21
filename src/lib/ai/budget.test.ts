import { describe, it, expect } from 'vitest';
import { evaluateBudget, monthKey, dayKey, DEFAULT_CAPS, type BudgetCaps, COST_PER_MESSAGE_USD, MONTHLY_BUDGET_USD } from './budget';

const caps: BudgetCaps = { month: 450, day: 100, perIpDay: 30 };
const under = { month: 1, day: 1, perIp: 1 };

describe('evaluateBudget', () => {
    it('allows a request well inside every cap', () => {
        expect(evaluateBudget(under, caps)).toEqual({ allowed: true });
    });

    it('allows the request that lands exactly on each cap', () => {
        // Counts are post-increment, so a cap of N must permit the Nth request.
        expect(evaluateBudget({ month: 450, day: 100, perIp: 30 }, caps).allowed).toBe(true);
    });

    it('refuses the request after the monthly cap', () => {
        const verdict = evaluateBudget({ ...under, month: 451 }, caps);
        expect(verdict.allowed).toBe(false);
        expect(verdict).toMatchObject({ scope: 'month' });
    });

    it('refuses the request after the daily cap', () => {
        const verdict = evaluateBudget({ ...under, day: 101 }, caps);
        expect(verdict).toMatchObject({ allowed: false, scope: 'day' });
    });

    it('refuses one visitor over their share while the site is still inside its budget', () => {
        // The point of the per-IP cap: one person cannot spend everyone else's month.
        const verdict = evaluateBudget({ month: 5, day: 5, perIp: 31 }, caps);
        expect(verdict).toMatchObject({ allowed: false, scope: 'ip' });
    });

    it('reports the broadest breach first', () => {
        // Over all three at once is a site-wide problem, not a per-visitor one, and the
        // message a visitor sees should say so.
        const verdict = evaluateBudget({ month: 999, day: 999, perIp: 999 }, caps);
        expect(verdict).toMatchObject({ scope: 'month' });
    });

    it('gives every refusal a message safe to show a visitor', () => {
        for (const counts of [
            { ...under, month: 451 },
            { ...under, day: 101 },
            { ...under, perIp: 31 },
        ]) {
            const verdict = evaluateBudget(counts, caps);
            if (verdict.allowed) throw new Error('expected a refusal');
            expect(verdict.message).toBeTruthy();
            // No internals: no key names, no counts, no provider detail.
            expect(verdict.message).not.toMatch(/redis|budget:|upstash|anthropic|\d{3}/i);
        }
    });

    it('honours caps passed in, not just the defaults', () => {
        const tight: BudgetCaps = { month: 1, day: 1, perIpDay: 1 };
        expect(evaluateBudget({ month: 1, day: 1, perIp: 1 }, tight).allowed).toBe(true);
        expect(evaluateBudget({ month: 2, day: 1, perIp: 1 }, tight).allowed).toBe(false);
    });

    it('ships defaults sized to the agreed ceiling', () => {
        // ~$0.011 per message on Sonnet 5 with the corpus cached.
        expect(DEFAULT_CAPS.month * 0.011).toBeLessThanOrEqual(5.5);
        expect(DEFAULT_CAPS.day).toBeLessThan(DEFAULT_CAPS.month);
        expect(DEFAULT_CAPS.perIpDay).toBeLessThan(DEFAULT_CAPS.day);
    });
});

describe('bucket keys', () => {
    it('changes the month key when the month rolls over', () => {
        expect(monthKey(new Date('2026-08-31T23:59:59Z'))).toBe('2026-08');
        expect(monthKey(new Date('2026-09-01T00:00:00Z'))).toBe('2026-09');
    });

    it('changes the day key when the day rolls over', () => {
        expect(dayKey(new Date('2026-08-15T23:59:59Z'))).toBe('2026-08-15');
        expect(dayKey(new Date('2026-08-16T00:00:00Z'))).toBe('2026-08-16');
    });

    it('keeps the same month key across a day boundary inside the month', () => {
        expect(monthKey(new Date('2026-08-15T00:00:00Z'))).toBe(
            monthKey(new Date('2026-08-16T00:00:00Z')),
        );
    });
});

describe('checkBudget without Redis configured', () => {
    it('allows the request', async () => {
        // Local dev and CI have no Upstash credentials. There is no shared counter to
        // consult and no production spend to protect, so the guard stands aside —
        // which is why validate-env.mjs requires the keys for a real deploy.
        const { checkBudget } = await import('./budget');
        expect(await checkBudget('127.0.0.1')).toEqual({ allowed: true });
    });
});

describe('the caps follow the budget', () => {
    it('never allows more than the stated budget at the measured cost', () => {
        // The property the old numbers failed: 450 requests at $0.062 is ~$28, not $5.
        const worstCase = DEFAULT_CAPS.month * COST_PER_MESSAGE_USD;
        expect(worstCase).toBeLessThanOrEqual(MONTHLY_BUDGET_USD);
    });

    it('keeps a day and one visitor below the month', () => {
        expect(DEFAULT_CAPS.day).toBeLessThan(DEFAULT_CAPS.month);
        expect(DEFAULT_CAPS.perIpDay).toBeLessThan(DEFAULT_CAPS.day);
    });

    it('leaves every cap usable', () => {
        // Deriving from a budget can round to zero if the cost estimate ever climbs;
        // a cap of nought would refuse the first visitor of the month.
        for (const [name, value] of Object.entries(DEFAULT_CAPS)) {
            expect(value, name).toBeGreaterThan(0);
        }
    });
});
