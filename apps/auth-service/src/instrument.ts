import * as Sentry from '@sentry/nestjs';

if (process.env.AUTH_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.AUTH_SENTRY_DSN,
    environment: process.env.NODE_ENV,

    beforeSend(event) {
      if (event.request?.headers) {
        const safeHeaders = ['user-agent', 'content-type', 'accept', 'origin'];

        const filteredHeaders: Record<string, string> = {};
        for (const key of safeHeaders) {
          if (event.request.headers[key]) {
            filteredHeaders[key] = event.request.headers[key];
          }
        }
        event.request.headers = filteredHeaders;
      }

      return event;
    },
  });
}
