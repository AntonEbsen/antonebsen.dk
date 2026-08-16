import { describe, it, expect } from 'vitest';
import { checkReadOnly, assertReadOnly } from './sql-guard';

const allowed = (sql: string) => checkReadOnly(sql).ok;
const rejected = (sql: string) => !checkReadOnly(sql).ok;

describe('checkReadOnly — accepts real queries', () => {
    it('accepts a plain SELECT', () => {
        expect(allowed('SELECT * FROM main_data LIMIT 50')).toBe(true);
    });

    it('accepts a CTE', () => {
        expect(allowed('WITH y AS (SELECT date, vix FROM main_data) SELECT * FROM y')).toBe(true);
    });

    it('accepts aggregates, joins and window functions', () => {
        expect(allowed(`
            SELECT year(date) AS yr, avg(vix) AS mean_vix,
                   rank() OVER (ORDER BY avg(vix) DESC) AS r
            FROM main_data
            WHERE sp500 IS NOT NULL
            GROUP BY 1 HAVING count(*) > 10
            ORDER BY 2 DESC LIMIT 50
        `)).toBe(true);
    });

    it('accepts DESCRIBE and EXPLAIN', () => {
        expect(allowed('DESCRIBE main_data')).toBe(true);
        expect(allowed('EXPLAIN SELECT * FROM main_data')).toBe(true);
    });

    it('accepts a trailing semicolon and strips it', () => {
        const result = checkReadOnly('SELECT 1;');
        expect(result.ok).toBe(true);
        expect(result.sql).toBe('SELECT 1');
    });
});

describe('checkReadOnly — rejects mutation', () => {
    it.each([
        'DROP TABLE main_data',
        'DELETE FROM main_data',
        'INSERT INTO main_data VALUES (1)',
        'UPDATE main_data SET vix = 0',
        'ALTER TABLE main_data ADD COLUMN x INT',
        'TRUNCATE main_data',
        'CREATE TABLE evil AS SELECT * FROM main_data',
    ])('rejects %s', (sql) => {
        expect(rejected(sql)).toBe(true);
    });
});

describe('checkReadOnly — rejects the DuckDB escape hatches', () => {
    // These are the ones a guard written only against "DROP TABLE" misses, and they
    // are the dangerous ones in a WASM engine: file writes, mounts, extensions.
    it.each([
        "COPY main_data TO '/tmp/leak.csv'",
        "EXPORT DATABASE '/tmp/dump'",
        "ATTACH 'other.db' AS other",
        "INSTALL httpfs",
        "LOAD httpfs",
        "PRAGMA database_list",
        "SET memory_limit='1GB'",
        "CALL pragma_version()",
    ])('rejects %s', (sql) => {
        expect(rejected(sql)).toBe(true);
    });
});

describe('checkReadOnly — statement boundaries', () => {
    it('rejects a stacked statement hidden after a valid one', () => {
        expect(rejected('SELECT 1; DROP TABLE main_data')).toBe(true);
    });

    it('rejects a mutation hidden behind a line comment', () => {
        // A naive first-keyword check passes this; the newline ends the comment and
        // the second statement runs.
        expect(rejected('SELECT 1 --\nDROP TABLE main_data')).toBe(true);
    });

    it('rejects a mutation hidden behind a block comment', () => {
        expect(rejected('SELECT 1 /* hi */; DROP TABLE main_data')).toBe(true);
    });

    it('rejects a leading-comment statement that is not a SELECT', () => {
        expect(rejected('-- just reading\nDROP TABLE main_data')).toBe(true);
    });
});

describe('checkReadOnly — string literals are data, not keywords', () => {
    it('allows a forbidden word inside a string literal', () => {
        // Rejecting this would make the guard unusable on real data: a column value
        // can legitimately contain the word DROP.
        expect(allowed("SELECT * FROM main_data WHERE note = 'DROP'")).toBe(true);
        expect(allowed("SELECT 'we should DELETE this later' AS memo")).toBe(true);
    });

    it('handles an escaped quote inside a literal', () => {
        expect(allowed("SELECT * FROM main_data WHERE note = 'it''s fine'")).toBe(true);
    });

    it('still rejects a real statement that also contains a literal', () => {
        expect(rejected("DELETE FROM main_data WHERE note = 'keep'")).toBe(true);
    });

    it('allows a column name that merely contains a keyword', () => {
        expect(allowed('SELECT updated_at, created_at FROM main_data')).toBe(true);
    });
});

describe('checkReadOnly — junk input', () => {
    it.each([['', 'empty'], ['   ', 'whitespace'], [';', 'bare semicolon']])(
        'rejects %s input (%s)',
        (sql) => expect(rejected(sql)).toBe(true),
    );

    it('rejects non-strings', () => {
        expect(rejected(undefined as any)).toBe(true);
        expect(rejected(null as any)).toBe(true);
        expect(rejected(42 as any)).toBe(true);
    });

    it('rejects prose the model returned instead of a query', () => {
        expect(rejected("I'm sorry, I can't help with that.")).toBe(true);
    });
});

describe('assertReadOnly', () => {
    it('returns the cleaned statement when it passes', () => {
        expect(assertReadOnly('  SELECT 1;  ')).toBe('SELECT 1');
    });

    it('throws with a reason a visitor can be shown', () => {
        expect(() => assertReadOnly('DROP TABLE main_data')).toThrow(/read-only/i);
        // The message must not leak schema, prompt or provider internals.
        expect(() => assertReadOnly('DROP TABLE main_data')).not.toThrow(/main_data/);
    });
});
