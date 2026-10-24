# Zod security upgrade — 24 October 2026

## Why this change

The production audit flagged [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5),
reviewed 23 October 2026. The upstream fix moves collection upper-bound checks
before element validation; see the [maintainer's patch](https://github.com/colinhacks/zod/commit/a0ebf97).
This matters even for a schema that already has `.max()`: the old implementation
could validate every bad element before reporting the size limit.

## Narrow dependency changes

- Direct `zod`: 3.25.76 → **4.6.7**, retaining a committed lockfile.
- `@astrojs/sitemap`: 3.7.0 → **3.7.4**, whose declared Zod dependency supports v4.
  Its sitemap dependency moves from 8.0.2 to 9.0.1, with associated type packages.
- Scoped `@vercel/cli-config` → `zod: "$zod"` override. That helper pins an older
  v4 release even in its available 0.3.3 package; the existing 0.3.2 helper is
  retained and its declared dependency resolves to the patched v4.6.7.
- Astro and the SDKs remain at their existing versions. Their compatible Zod
  dependencies deduplicate to 4.6.7. No global major-version override, forced
  audit fix, audit exclusion, or weakened security gate was used.

The clean install and production audit reported **zero vulnerabilities** on this
date. This is a dependency-audit result, not a claim that the whole website is
free from security defects.

## Compatibility and boundary checks

The [Zod migration guide](https://zod.dev/v4/changelog) was checked against the
site's schemas. Existing supported `.flatten()`/`.format()` error output is
retained; a deprecated API is not silently replaced with a different response
shape. Application schema shapes and database code did not need changing.

New tests cover:

- Early rejection of an oversized array **without walking any element**, including
  the actual chat request's message limit (not just `success === false`).
- Patched installed/locked declared Zod copies.
- Unknown-field stripping, defaults, coercion, nullability and field-error shape.
- Valid/invalid contact submissions, silent honeypot, and rate-limit behavior
  against a **mocked** Supabase boundary. Invalid input never queries the database;
  unknown caller fields are not forwarded to the insert.
- Vercel configuration parsing using synthetic fixtures only. No real credentials
  or configuration files are read or written by those tests.

**Bundled-code caveat:** cli-config includes bundled validators. Updating its
declared dependency does not rewrite vendored code. Its exported global/auth
schema graphs were inspected and contain no affected array/map/set validators;
a separate regression test guards that assumption. This is not a blanket
certification of every internal Vercel code path. Review the override and this
assumption when updating/removing that helper.

Supabase's current changelog/security guidance was consulted for the boundary
checks. No Supabase SDK upgrade, schema migration, RLS/policy change, key change,
live test insertion or production data access is part of this fix. The tests are
not a live RLS/database security audit.

## Verification

Run the unchanged gates from the repository root:

```sh
npm ci
npm audit --omit=dev --audit-level=high
npm test
npm run build
npm run check:ratchet
```

The install for local verification was isolated from the shared dependency
directory used by earlier worktrees. Install scripts were disabled locally;
GitHub/Vercel's normal clean-install build checks must also pass before merge.
No generated `.astro` files, scratch files or secrets belong in this change.
The type-error ratchet initially remained at the existing 419; do not raise it
to accommodate this upgrade. Check current PR results before publishing.
