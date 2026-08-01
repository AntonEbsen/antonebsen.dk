import * as Sentry from "@sentry/astro";

Sentry.init({
    dsn: import.meta.env.PUBLIC_SENTRY_DSN,

    integrations: [
        Sentry.browserTracingIntegration(),
        // Session Replay is deliberately not enabled. replayIntegration() pulls the
        // rrweb DOM recorder into the client bundle that every page loads, which was
        // roughly half of it. Error reports keep their stack traces and breadcrumbs
        // without it. If a specific bug ever needs replay, prefer loading it on
        // demand via Sentry.lazyLoadIntegration('replayIntegration') rather than
        // putting it back on the critical path.
    ],

    // Was 1.0, which sends a transaction for every single page view: enough to
    // burn the quota with no extra signal at this traffic level, and Vercel Speed
    // Insights already covers Web Vitals.
    tracesSampleRate: 0.1,
});
