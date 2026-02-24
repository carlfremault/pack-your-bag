import type { ArgumentsHost, ForbiddenException } from '@nestjs/common';
import {
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';

import { AuditEventType, AuditSeverity } from '@repo/db';
import { AccountDeletedException } from '@repo/nestjs-common';

import { Request, Response } from 'express';

import { InvalidTokenException } from '@/common/exceptions/bad-request.exceptions';
import { safeCaptureSentryException } from '@/common/utils/captureSentryException';
import { safeStringify } from '@/common/utils/safeStringify';
import { AuditLogProvider } from '@/modules/audit-log/audit-log.provider';

interface HttpExceptionResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
}

interface ThrottlerExceptionWithTracker extends ThrottlerException {
  tracker?: string;
}

@Catch()
export class GlobalExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionsFilter.name);

  constructor(private readonly auditLogProvider: AuditLogProvider) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const statusCode = this.getStatusCode(exception);
    const exceptionResponse = this.getExceptionResponse(exception);
    const errorCode = this.getErrorCode(exceptionResponse, statusCode);
    const clientMessage = this.extractClientMessage(exception, exceptionResponse);

    this.auditException(exception, request, statusCode, errorCode, clientMessage);

    response.status(statusCode).json({
      statusCode,
      message: clientMessage,
      error: errorCode,
      timestamp: new Date().toISOString(),
    });
  }

  private auditException(
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

  // ============================================
  // HELPER METHODS
  // ============================================

  private isServerError(status: HttpStatus): boolean {
    const statusCode = status as number;
    return statusCode >= 500 && statusCode < 600;
  }

  private isClientError(status: HttpStatus): boolean {
    const statusCode = status as number;
    return statusCode >= 400 && statusCode < 500;
  }

  private isValidationError(exception: unknown): boolean {
    if (!(exception instanceof BadRequestException)) {
      return false;
    }
    const response = exception.getResponse();
    return (
      typeof response === 'object' &&
      response !== null &&
      'message' in response &&
      Array.isArray(response.message)
    );
  }

  private isThrottlerExceptionWithTracker(
    exception: unknown,
  ): exception is ThrottlerExceptionWithTracker {
    return exception instanceof ThrottlerException && 'tracker' in exception;
  }

  private getStatusCode(exception: unknown): HttpStatus {
    return exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private getExceptionResponse(exception: unknown): HttpExceptionResponse | null {
    if (!(exception instanceof HttpException)) {
      return null;
    }

    const response = exception.getResponse();
    const status = exception.getStatus();

    if (typeof response === 'string') {
      return {
        statusCode: status,
        message: response,
      };
    }

    if (this.isObjectWithMessage(response)) {
      return {
        statusCode: status,
        message: response.message,
        ...(this.hasErrorCode(response) && { error: response.error }),
      };
    }

    this.logger.warn(`Unexpected exception response format: ${safeStringify(response)}`);

    return {
      statusCode: status,
      message: 'An error occurred',
    };
  }

  private isObjectWithMessage(response: unknown): response is { message: string | string[] } {
    return (
      typeof response === 'object' &&
      response !== null &&
      'message' in response &&
      (typeof (response as Record<string, unknown>).message === 'string' ||
        Array.isArray((response as Record<string, unknown>).message))
    );
  }

  private hasErrorCode(response: {
    message: string | string[];
  }): response is { message: string | string[]; error: string } {
    return 'error' in response && typeof (response as Record<string, unknown>).error === 'string';
  }

  private getErrorCode(exceptionResponse: HttpExceptionResponse | null, status: number): string {
    if (exceptionResponse?.error) {
      return exceptionResponse.error;
    }
    return this.getDefaultErrorCode(status);
  }

  private getDefaultErrorCode(status: number): string {
    const errorMap: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      409: 'Conflict',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
    };
    return errorMap[status] ?? 'Error';
  }

  private extractClientMessage(
    exception: unknown,
    exceptionResponse: HttpExceptionResponse | null,
  ): string | string[] {
    if (exceptionResponse?.message) {
      return exceptionResponse.message;
    }

    if (exception instanceof Error) {
      return exception.message;
    }

    return 'An unexpected error occurred';
  }
}
