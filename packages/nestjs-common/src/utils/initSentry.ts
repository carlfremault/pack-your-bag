import * as Sentry from '@sentry/nestjs';

/**
 * Initializes Sentry for a given service.
 *
 * @param serviceName - The name of the service to initialize Sentry for.
 */
export function initSentry(serviceName: string): void {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,

      beforeSend(event) {
        if (event.request?.headers) {
          const safeHeaders = new Set(['user-agent', 'content-type', 'accept', 'origin']);

          const filteredHeaders: Record<string, string> = {};
          for (const [key, value] of Object.entries(event.request.headers)) {
            if (safeHeaders.has(key.toLowerCase())) {
              filteredHeaders[key.toLowerCase()] = value;
            }
          }
          event.request.headers = filteredHeaders;
        }

        if (event.request?.data) {
          let data: Record<string, unknown> | null;

          if (typeof event.request.data === 'string') {
            try {
              data = JSON.parse(event.request.data) as Record<string, unknown>;
            } catch {
              event.request.data = '[Unparsable request data redacted]';
              data = null;
            }
          } else if (typeof event.request.data === 'object' && event.request.data !== null) {
            data = { ...event.request.data } as Record<string, unknown>;
          } else {
            data = null;
          }

          if (data) {
            const sensitiveFields = ['email', 'password', 'currentPassword', 'newPassword'];
            for (const field of sensitiveFields) {
              if (field in data) {
                data[field] = '[Filtered]';
              }
            }
            event.request.data = data;
          }
        }

        event.tags = {
          ...event.tags,
          service: serviceName,
        };

        event.fingerprint = event.fingerprint ?? ['{{ default }}', serviceName];

        return event;
      },
    });
  }
}
