import { Logger } from '@nestjs/common';

import { AuditEventType } from '@prisma-client';
import * as Sentry from '@sentry/nestjs';
import { Request } from 'express';

interface SentryReportContext {
  exception: unknown;
  request: Request | null;
  errorCode: string;
  level?: Sentry.SeverityLevel;
  eventType: AuditEventType;
  fingerprint?: string[];
}

/**
 * Safely captures exceptions to Sentry with error handling.
 *
 * Wraps the Sentry captureException method and logs any errors that occur
 * during the capture process. Skips capture in test environments.
 *
 * @param context - The Sentry report context containing exception details, request info, and metadata
 * @param logger - NestJS logger instance for logging capture failures
 */
export function safeCaptureSentryException(context: SentryReportContext, logger: Logger): void {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  const { exception, request, errorCode, eventType, level = 'error', fingerprint } = context;

  try {
    Sentry.captureException(exception, {
      level,
      tags: {
        eventType,
        errorCode,
        route: request?.path,
        method: request?.method,
        authenticated: !!request?.user,
      },
      extra: {
        requestId: request?.id,
      },
      ...(fingerprint && { fingerprint }),
    });
  } catch (sentryError) {
    logger.error(
      'Failed to capture Sentry exception',
      sentryError instanceof Error ? sentryError.stack : String(sentryError),
    );
  }
}
