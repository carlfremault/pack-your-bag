import { initSentry } from '@repo/nestjs-common';

const isProduction = process.env.NODE_ENV === 'production';
const dsn = isProduction ? process.env.AUTH_SENTRY_DSN : process.env.DEV_SENTRY_DSN;

initSentry('auth-service', dsn);
