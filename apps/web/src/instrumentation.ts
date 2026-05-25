import * as Sentry from '@sentry/nextjs';

export const onRequestError = Sentry.captureRequestError;

export async function register() {
  // Injected by Next.js at runtime
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');
  }

  // Injected by Next.js at runtime
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }

  // Initialize Zod custom error messages
  await import('@/lib/zod');
}
