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
    },
    extra: {
      ...(request.user?.tokenId && { sessionTokenId: request.user.tokenId }),
      ...(request.user?.tokenFamilyId && { sessionTokenFamilyId: request.user.tokenFamilyId }),
    },
    user: request.user ? { id: request.user.userId } : undefined,
    ...(fingerprint && { fingerprint }),
  });
}
