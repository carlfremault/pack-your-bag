import { Catch } from '@nestjs/common';

import { Prisma } from '@repo/db';
import { BasePrismaExceptionsFilter, ErrorContext } from '@repo/nestjs-common';
import { AuditLogProvider } from '@repo/nestjs-common';

import { Request } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter extends BasePrismaExceptionsFilter {
  constructor(private readonly auditLogProvider: AuditLogProvider) {
    super(PrismaExceptionFilter.name);
  }

  protected handleException(
    errorContext: ErrorContext,
    exception: Prisma.PrismaClientKnownRequestError,
    request: Request,
  ): void {
    this.logger.error(`Data Integrity Error: ${errorContext.auditMessage}`, exception.stack);

    this.auditLogProvider.auditRequest(
      {
        eventType: errorContext.eventType,
        severity: errorContext.severity,
        statusCode: errorContext.statusCode,
        errorCode: errorContext.error,
        message: errorContext.auditMessage,
        metadata: errorContext.metadata,
      },
      request,
    );
  }
}
