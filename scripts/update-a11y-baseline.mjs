/**
 * Regenerates tests/a11y-baseline.json from a live run of the wide sweep.
 *
 * A wrapper rather than an npm script because `A11Y_UPDATE=1 playwright test`
 * is not portable — npm runs scripts through cmd on Windows, where inline env
 * assignment is a syntax error. Same spawnSync-with-shell shape as
 * scripts/check-ratchet.mjs.
 *
 * The floor only moves down: run this after fixing violations, never to make a
 * newly introduced one go away.
 */
import { spawnSync } from 'node:child_process';

const result = spawnSync('npx playwright test --project=a11y-wide', {
    shell: true,
    stdio: 'inherit',
    env: { ...process.env, A11Y_UPDATE: '1' }
});

process.exit(result.status ?? 1);
