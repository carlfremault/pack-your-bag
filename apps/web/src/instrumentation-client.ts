import * as Sentry from '@sentry/nextjs';

const isProduction = process.env.NODE_ENV === 'production';
const dsn = isProduction
  ? process.env.NEXT_PUBLIC_SENTRY_DSN
  : process.env.NEXT_PUBLIC_DEV_SENTRY_DSN;

Sentry.init({
  dsn,
  tracesSampleRate: parseFloat(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
