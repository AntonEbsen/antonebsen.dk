/**
 * Read-only enforcement for model-written SQL.
 *
 * The text-to-SQL prompt has always said "SELECT only. Never DROP, DELETE, INSERT,
 * UPDATE or ALTER." That is a request, not a control — a prompt cannot stop a model
 * from emitting a statement, and the query is executed by whatever receives it. This
 * is the check that actually holds.
 *
 * The DuckDB-specific entries matter as much as the obvious ones: `COPY … TO` writes
 * files, `ATTACH` mounts another database, and `INSTALL`/`LOAD` pull in extensions
 * that can reach the network and the filesystem. A guard that only knows about
 * `DROP TABLE` misses every one of those.
 */

/** Statement kinds that may never appear, matched as whole words. */
const FORBIDDEN = [
    // Mutation
    'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'MERGE', 'UPSERT',
    // Schema
    'CREATE', 'DROP', 'ALTER', 'RENAME',
    // DuckDB escape hatches — writes, mounts, extensions, settings
    'COPY', 'EXPORT', 'IMPORT', 'ATTACH', 'DETACH', 'INSTALL', 'LOAD',
    'PRAGMA', 'SET', 'RESET', 'CALL', 'CHECKPOINT', 'VACUUM', 'ANALYZE',
    // Permissions
    'GRANT', 'REVOKE',
];

const FORBIDDEN_PATTERN = new RegExp(`\\b(${FORBIDDEN.join('|')})\\b`, 'i');

export interface SqlCheck {
    ok: boolean;
    /** Present when ok is false. Safe to show a visitor; names no internals. */
    reason?: string;
    /** The statement with comments stripped and any trailing semicolon removed. */
    sql?: string;
}

/**
 * Strip comments and string literals so keyword matching sees only structure.
 *
 * Without this the guard is both too strict and too weak: `WHERE note = 'DROP'` would
 * be rejected, while `SELECT 1 --\nDROP TABLE t` could slip past a naive scan.
 * The result is used *only* for inspection — the SQL that runs is the original.
 */
function skeleton(sql: string): string {
    let out = '';
    let i = 0;

    while (i < sql.length) {
        const two = sql.slice(i, i + 2);

        if (two === '--') {                      // line comment
            const nl = sql.indexOf('\n', i);
            i = nl === -1 ? sql.length : nl;
            continue;
        }
        if (two === '/*') {                      // block comment
            const close = sql.indexOf('*/', i + 2);
            i = close === -1 ? sql.length : close + 2;
            out += ' ';
            continue;
        }
        if (sql[i] === "'" || sql[i] === '"') {  // string / quoted identifier
            const quote = sql[i];
            i++;
            while (i < sql.length) {
                if (sql[i] === quote) {
                    // A doubled quote is an escaped quote, not the end.
                    if (sql[i + 1] === quote) { i += 2; continue; }
                    i++;
                    break;
                }
                i++;
            }
            out += quote === '"' ? 'id' : "''";
            continue;
        }
        out += sql[i];
        i++;
    }
    return out;
}

/** Inspect a statement without throwing. */
export function checkReadOnly(raw: unknown): SqlCheck {
    if (typeof raw !== 'string' || !raw.trim()) {
        return { ok: false, reason: 'No query was produced.' };
    }

    const stripped = skeleton(raw).trim().replace(/;\s*$/, '');

    if (!stripped) {
        return { ok: false, reason: 'No query was produced.' };
    }

    // Stacked statements: `SELECT 1; DROP TABLE t`. One statement per request, always.
    if (stripped.includes(';')) {
        return { ok: false, reason: 'Only a single statement is allowed.' };
    }

    // Anchoring on the opening keyword is what makes this a allowlist rather than a
    // blocklist — an unknown statement type is rejected by default.
    if (!/^\s*(WITH|SELECT|TABLE|FROM|DESCRIBE|SHOW|EXPLAIN)\b/i.test(stripped)) {
        return { ok: false, reason: 'Only read-only queries are allowed.' };
    }

    const forbidden = stripped.match(FORBIDDEN_PATTERN);
    if (forbidden) {
        return { ok: false, reason: `Only read-only queries are allowed (found ${forbidden[1].toUpperCase()}).` };
    }

    return { ok: true, sql: raw.trim().replace(/;\s*$/, '') };
}

/** Throwing form, for call sites that treat a rejection as an error path. */
export function assertReadOnly(raw: unknown): string {
    const result = checkReadOnly(raw);
    if (!result.ok) throw new Error(result.reason);
    return result.sql!;
}
