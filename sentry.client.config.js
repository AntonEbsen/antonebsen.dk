import * as Sentry from "@sentry/astro";

Sentry.init({
    dsn: import.meta.env.PUBLIC_SENTRY_DSN,
    integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration(),
    ],
    // Tracing
    tracesSampleRate: 1.0, // Capture 100% of the transactions
    // Session Replay
    replaysSessionSampleRate: 0.1, // This sample rate is for sessions where errors occur
    replaysOnErrorSampleRate: 1.0, // If you see an error, capture the replay
});
