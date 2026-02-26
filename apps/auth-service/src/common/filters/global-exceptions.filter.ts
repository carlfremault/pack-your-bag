import type { ForbiddenException } from '@nestjs/common';
import { Catch, HttpStatus } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';

import { AuditEventType, AuditSeverity } from '@repo/db';
import {
  AccountDeletedException,
  BaseGlobalExceptionsFilter,
  safeCaptureSentryException,
  safeStringify,
} from '@repo/nestjs-common';

import { Request } from 'express';

import { InvalidTokenException } from '@/common/exceptions/bad-request.exceptions';
import { AuditLogProvider } from '@/modules/audit-log/audit-log.provider';

@Catch()
export class GlobalExceptionsFilter extends BaseGlobalExceptionsFilter {
  constructor(private readonly auditLogProvider: AuditLogProvider) {
    super(GlobalExceptionsFilter.name);
  }

  protected handleException(
    exception: unknown,
    request: Request,
    status: HttpStatus,
    errorCode: string,
    clientMessage?: string | string[],
  ): void {
    if (exception instanceof ThrottlerException) {
      this.auditRateLimitExceeded(request, exception, errorCode);
      return;
    }

    // 5xx Internal server error
    if (this.isServerError(status)) {
      this.auditInternalServerError(exception, request, status, errorCode);
      return;
    }

    // 401 Unauthorized
    if (status === HttpStatus.UNAUTHORIZED) {
      // Already handled by AuthExceptionFilter
      return;
    }

    // 403 Account deleted attempts
    if (exception instanceof AccountDeletedException) {
      this.auditAccountDeletionAttempt(request, exception, errorCode);
      return;
    }

    // 403 Other forbidden access
    if (status === HttpStatus.FORBIDDEN) {
      this.auditForbiddenAccess(exception, request, errorCode);
      return;
    }

    // 400 Invalid token attempts (password reset, etc.)
    if (exception instanceof InvalidTokenException) {
      this.auditInvalidToken(request, exception, errorCode);
      return;
    }

    // 400 Validation errors
    if (status === HttpStatus.BAD_REQUEST && this.isValidationError(exception)) {
      this.auditValidationError(request, exception, errorCode, clientMessage);
      return;
    }

    // 409 Conflict
    if (status === HttpStatus.CONFLICT) {
      this.auditConflictError(exception, request, errorCode);
      return;
    }

    // 404 not found
    if (status === HttpStatus.NOT_FOUND) {
      return;
    }

    // Any other 4xx
    if (this.isClientError(status)) {
      this.auditUnexpectedClientError(exception, request, status, errorCode);
      return;
    }
  }

  // ============================================
  // AUDIT HANDLERS
  // ============================================

  private auditRateLimitExceeded(request: Request, exception: unknown, errorCode: string): void {
    const { path, method } = request;
    const tracker = this.isThrottlerExceptionWithTracker(exception) ? exception.tracker : undefined;

    this.logger.warn(`Rate limit exceeded at ${method} ${path} with tracker ${tracker}`);

    this.auditLogProvider.auditRequest(
      {
        eventType: AuditEventType.SECURITY_RATE_LIMIT_EXCEEDED,
        severity: AuditSeverity.WARN,
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        errorCode,
        message: 'Rate limit exceeded',
        metadata: {
          tracker,
        },
      },
      request,
    );
  }

  private auditInternalServerError(
    exception: unknown,
    request: Request,
    status: number,
    errorCode: string,
  ): void {
    const { path, method } = request;
    const message = exception instanceof Error ? exception.message : 'Unknown error';
    const errorStack = exception instanceof Error ? exception.stack : safeStringify(exception);

    this.logger.error(`Unhandled ${status} at ${method} ${path}: ${message}`, errorStack);

    safeCaptureSentryException(
      {
        exception,
        request,
        errorCode,
        eventType: AuditEventType.INTERNAL_SERVER_ERROR,
      },
      this.logger,
    );

    this.auditLogProvider.auditRequest(
      {
        eventType: AuditEventType.INTERNAL_SERVER_ERROR,
        severity: AuditSeverity.ERROR,
        statusCode: status,
        errorCode,
        message,
      },
      request,
    );
  }

  private auditAccountDeletionAttempt(
    request: Request,
    exception: ForbiddenException,
    errorCode: string,
  ): void {
    const auditMessage = typeof exception.cause === 'string' ? exception.cause : exception.message;

    this.auditLogProvider.auditRequest(
      {
        eventType: AuditEventType.ACCOUNT_DELETION_ACCESS_ATTEMPT,
        severity: AuditSeverity.INFO,
        statusCode: HttpStatus.FORBIDDEN,
        errorCode,
        message: auditMessage,
      },
      request,
    );
  }

  private auditForbiddenAccess(exception: unknown, request: Request, errorCode: string): void {
    const { path, method } = request;
    const message = exception instanceof Error ? exception.message : 'Forbidden';

    this.logger.warn(`Forbidden access at ${method} ${path}: ${message}`);

    this.auditLogProvider.auditRequest(
      {
        eventType: AuditEventType.AUTHORIZATION_FAILED,
        severity: AuditSeverity.WARN,
        statusCode: HttpStatus.FORBIDDEN,
        errorCode,
        message,
      },
      request,
    );
  }

  private auditInvalidToken(
    request: Request,
    exception: InvalidTokenException,
    errorCode: string,
  ): void {
    const { path, method } = request;
    const message = typeof exception.cause === 'string' ? exception.cause : exception.message;

    this.logger.warn(`Invalid token attempt at ${method} ${path}: ${message}`);

    this.auditLogProvider.auditRequest(
      {
        eventType: AuditEventType.INVALID_TOKEN,
        severity: AuditSeverity.WARN,
        statusCode: HttpStatus.BAD_REQUEST,
        errorCode,
        message,
      },
      request,
    );
  }

  private auditValidationError(
    request: Request,
    exception: unknown,
    errorCode: string,
    clientMessage?: string | string[],
  ): void {
    const message = exception instanceof Error ? exception.message : 'Validation failed';

    this.auditLogProvider.auditRequest(
      {
        eventType: AuditEventType.VALIDATION_ERROR,
        severity: AuditSeverity.INFO,
        statusCode: HttpStatus.BAD_REQUEST,
        errorCode,
        message: clientMessage ?? message,
      },
      request,
    );
  }

  private auditConflictError(exception: unknown, request: Request, errorCode: string): void {
    const message = exception instanceof Error ? exception.message : 'Conflict';

    this.auditLogProvider.auditRequest(
      {
        eventType: AuditEventType.CONFLICT_ERROR,
        severity: AuditSeverity.WARN,
        statusCode: HttpStatus.CONFLICT,
        errorCode,
        message,
      },
      request,
    );
  }

  private auditUnexpectedClientError(
    exception: unknown,
    request: Request,
    status: number,
    errorCode: string,
  ): void {
    const { path, method } = request;
    const message = exception instanceof Error ? exception.message : 'Unknown error';
    const errorStack = exception instanceof Error ? exception.stack : safeStringify(exception);

    this.logger.warn(`Unexpected ${status} at ${method} ${path}: ${message}`, errorStack);

    this.auditLogProvider.auditRequest(
      {
        eventType: AuditEventType.HTTP_ERROR,
        severity: AuditSeverity.WARN,
        statusCode: status,
        errorCode,
        message,
      },
      request,
    );
  }
}
