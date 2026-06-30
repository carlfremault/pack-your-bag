import { Catch, HttpStatus } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';

import { AuditLogEventType, AuditLogSeverity } from '@repo/db';
import {
  AuditLogProvider,
  BaseGlobalExceptionsFilter,
  BffAuthenticationException,
  safeCaptureSentryException,
  safeStringify,
} from '@repo/nestjs-common';

import { Request } from 'express';

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

    if (exception instanceof BffAuthenticationException) {
      this.auditBffAuthenticationFailure(exception, request, errorCode);
      return;
    }

    // 5xx Internal server error
    if (this.isServerError(status)) {
      this.auditInternalServerError(exception, request, status, errorCode);
      return;
    }

    // 401 Unauthorized
    if (status === HttpStatus.UNAUTHORIZED) {
      this.auditUnauthorized(exception, request, errorCode);
      return;
    }

    // 403 Forbidden
    if (status === HttpStatus.FORBIDDEN) {
      this.auditForbiddenAccess(exception, request, errorCode);
      return;
    }

    // 404 Not Found
    if (status === HttpStatus.NOT_FOUND) {
      return; // not worth logging noise
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

    // Any other client error
    if (this.isClientError(status) && !this.isValidationError(exception)) {
      this.auditUnexpectedClientError(exception, request, status, errorCode);
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
        eventType: AuditLogEventType.SECURITY_RATE_LIMIT_EXCEEDED,
        severity: AuditLogSeverity.WARN,
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

  private auditBffAuthenticationFailure(
    exception: BffAuthenticationException,
    request: Request,
    errorCode: string,
  ): void {
    const { path, method } = request;
    this.logger.warn(`BFF authentication exception at ${method} ${path}`);

    safeCaptureSentryException(
      { exception, request, errorCode, eventType: AuditLogEventType.BFF_SECRET_MISMATCH },
      this.logger,
    );

    this.auditLogProvider.auditRequest(
      {
        eventType: AuditLogEventType.BFF_SECRET_MISMATCH,
        severity: AuditLogSeverity.CRITICAL,
        statusCode: HttpStatus.UNAUTHORIZED,
        errorCode,
        message: 'BFF authentication failure',
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
        eventType: AuditLogEventType.INTERNAL_SERVER_ERROR,
      },
      this.logger,
    );

    this.auditLogProvider.auditRequest(
      {
        eventType: AuditLogEventType.INTERNAL_SERVER_ERROR,
        severity: AuditLogSeverity.ERROR,
        statusCode: status,
        errorCode,
        message,
      },
      request,
    );
  }

  private auditUnauthorized(exception: unknown, request: Request, errorCode: string): void {
    const { path, method } = request;
    const message = exception instanceof Error ? exception.message : 'Unauthorized';

    this.logger.warn(`Unauthorized at ${method} ${path}`);

    this.auditLogProvider.auditRequest(
      {
        eventType: AuditLogEventType.AUTHORIZATION_FAILED,
        severity: AuditLogSeverity.WARN,
        statusCode: HttpStatus.UNAUTHORIZED,
        errorCode,
        message,
      },
      request,
    );
  }

  private auditForbiddenAccess(exception: unknown, request: Request, errorCode: string): void {
    const { path, method } = request;
    const message = exception instanceof Error ? exception.message : 'Forbidden';

    this.logger.warn(`Forbidden at ${method} ${path}`);

    this.auditLogProvider.auditRequest(
      {
        eventType: AuditLogEventType.AUTHORIZATION_FAILED,
        severity: AuditLogSeverity.WARN,
        statusCode: HttpStatus.FORBIDDEN,
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
        eventType: AuditLogEventType.VALIDATION_ERROR,
        severity: AuditLogSeverity.INFO,
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
        eventType: AuditLogEventType.CONFLICT_ERROR,
        severity: AuditLogSeverity.WARN,
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
        eventType: AuditLogEventType.HTTP_ERROR,
        severity: AuditLogSeverity.WARN,
        statusCode: status,
        errorCode,
        message,
      },
      request,
    );
  }
}
