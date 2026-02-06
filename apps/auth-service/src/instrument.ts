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

      if (event.request?.data) {
        let data: Record<string, unknown>;

        if (typeof event.request.data === 'string') {
          try {
            data = JSON.parse(event.request.data) as Record<string, unknown>;
          } catch {
            event.request.data = '[Unparsable request data redacted]';
            return event;
          }
        } else if (typeof event.request.data === 'object' && event.request.data !== null) {
          data = { ...event.request.data } as Record<string, unknown>;
        } else {
          return event;
        }

        const sensitiveFields = ['email', 'password', 'currentPassword', 'newPassword'];
        for (const field of sensitiveFields) {
          if (field in data) {
            data[field] = '[Filtered]';
          }
        }

        event.request.data = data;
      }

      return event;
    },
  });
}
