import * as Sentry from '@sentry/nestjs';
import { Request } from 'express';

import { AuditEventType } from '@/generated/prisma';

export function captureSentryException({
  exception,
  request,
  errorCode,
  level = 'error',
  eventType,
  fingerprint,
}: {
  exception: unknown;
  request: Request;
  errorCode: string;
  level?: Sentry.SeverityLevel;
  eventType: AuditEventType;
  fingerprint?: string[];
}): void {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  Sentry.captureException(exception, {
    level,
    tags: {
      eventType,
      errorCode,
      route: request.path,
      method: request.method,
      authenticated: !!request.user,
    },
    extra: {
      requestId: request.id,
    },
    ...(fingerprint && { fingerprint }),
  });
}
