import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { RmqContext } from '@nestjs/microservices';

import { AuditLogEventType, AuditLogSeverity } from '@repo/db';
import { safeCaptureSentryException, safeStringify } from '@repo/nestjs-common';

import type { Channel, ConsumeMessage } from 'amqplib';

import { AuditLogService } from '@/modules/audit-log/audit-log.service';

const PRISMA_ERROR_NAMES = new Set([
  'PrismaClientKnownRequestError',
  'PrismaClientUnknownRequestError',
  'PrismaClientInitializationError',
  'PrismaClientRustPanicError',
  'PrismaClientValidationError',
]);

function isPrismaError(error: unknown): boolean {
  return error instanceof Error && PRISMA_ERROR_NAMES.has(error.constructor.name);
}

@Catch()
export class RpcExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(RpcExceptionFilter.name, { timestamp: true });

  constructor(private readonly auditLogService: AuditLogService) {}

  async catch(exception: unknown, host: ArgumentsHost): Promise<void> {
    const rpcHost = host.switchToRpc();
    const context = rpcHost.getContext<RmqContext>();
    const data = rpcHost.getData<unknown>();
    const channel = context.getChannelRef() as Channel;
    const originalMsg = context.getMessage() as ConsumeMessage;
    const pattern = context.getPattern();

    channel.nack(originalMsg, false, false);

    if (isPrismaError(exception)) {
      this.handleDatabaseError(exception as Error, pattern);
    } else {
      await this.handleProcessingError(exception, pattern, data);
    }
  }

  private handleDatabaseError(exception: Error, pattern: string): void {
    const errorCode =
      'code' in exception && typeof exception.code === 'string'
        ? exception.code
        : exception.constructor.name;

    this.logger.error(
      `Database error [${errorCode}] in [${pattern}]: ${exception.message}`,
      exception.stack,
    );

    safeCaptureSentryException(
      {
        exception,
        request: null,
        errorCode: `AUDIT_DB_ERROR_${errorCode}`,
        eventType: AuditLogEventType.INTERNAL_SERVER_ERROR,
      },
      this.logger,
    );
  }

  private async handleProcessingError(
    exception: unknown,
    pattern: string,
    data: unknown,
  ): Promise<void> {
    const message = exception instanceof Error ? exception.message : 'Unknown error';
    const stack = exception instanceof Error ? exception.stack : safeStringify(exception);

    this.logger.error(`Processing error [${pattern}]: ${message}`, stack);

    try {
      await this.auditLogService.handleAuditLog({
        requestId: null,
        eventType: AuditLogEventType.INTERNAL_SERVER_ERROR,
        severity: AuditLogSeverity.ERROR,
        userId: null,
        ipAddress: null,
        userAgent: null,
        path: null,
        method: null,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        errorCode: 'AUDIT_PROCESSING_ERROR',
        source: 'audit-service',
        message,
        metadata: {
          pattern,
          originalPayload: safeStringify(data),
        },
      });
    } catch (dbError) {
      this.logger.error(
        'Failed to write processing error to audit log, falling back to Sentry',
        dbError instanceof Error ? dbError.stack : String(dbError),
      );

      safeCaptureSentryException(
        {
          exception,
          request: null,
          errorCode: 'AUDIT_PROCESSING_ERROR_DB_FALLBACK',
          eventType: AuditLogEventType.INTERNAL_SERVER_ERROR,
        },
        this.logger,
      );
    }
  }
}
