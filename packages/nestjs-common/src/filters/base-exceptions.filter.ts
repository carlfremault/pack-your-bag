import type { ArgumentsHost } from '@nestjs/common';
import {
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';

import { AuditLogEventType, AuditLogSeverity } from '@repo/db';

import { Request, Response } from 'express';

import { AuditLogProvider } from '../audit/audit-log.provider';
import { BffAuthenticationException } from '../exceptions/unauthorized.exceptions';
import { safeCaptureSentryException } from '../utils/captureSentryException';
import { safeStringify } from '../utils/safeStringify';

interface HttpExceptionResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
}

interface ThrottlerExceptionWithTracker extends ThrottlerException {
  tracker?: string;
}

@Catch()
export class BaseGlobalExceptionsFilter implements ExceptionFilter {
  protected readonly logger: Logger;

  constructor(
    protected readonly auditLogProvider: AuditLogProvider,
    loggerName?: string,
  ) {
    this.logger = new Logger(loggerName ?? BaseGlobalExceptionsFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const statusCode = this.getStatusCode(exception);
    const exceptionResponse = this.getExceptionResponse(exception);
    const errorCode = this.getErrorCode(exceptionResponse, statusCode);
    const clientMessage = this.extractClientMessage(exception, exceptionResponse);

    this.handleException(exception, request, statusCode, errorCode, clientMessage);

    response.status(statusCode).json({
      statusCode,
      message: clientMessage,
      error: errorCode,
      timestamp: new Date().toISOString(),
    });
  }

  // ============================================
  // EXCEPTION ROUTING
  // ============================================

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

  protected auditRateLimitExceeded(request: Request, exception: unknown, errorCode: string): void {
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

  protected auditBffAuthenticationFailure(
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

  protected auditInternalServerError(
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

  protected auditUnauthorized(exception: unknown, request: Request, errorCode: string): void {
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

  protected auditForbiddenAccess(exception: unknown, request: Request, errorCode: string): void {
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

  protected auditValidationError(
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

  protected auditConflictError(exception: unknown, request: Request, errorCode: string): void {
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

  protected auditUnexpectedClientError(
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

  // ============================================
  // HELPER METHODS
  // ============================================

  protected isServerError(status: HttpStatus): boolean {
    const statusCode = status as number;
    return statusCode >= 500 && statusCode < 600;
  }

  protected isClientError(status: HttpStatus): boolean {
    const statusCode = status as number;
    return statusCode >= 400 && statusCode < 500;
  }

  protected isValidationError(exception: unknown): boolean {
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

  protected isThrottlerExceptionWithTracker(
    exception: unknown,
  ): exception is ThrottlerExceptionWithTracker {
    return exception instanceof ThrottlerException && 'tracker' in exception;
  }

  protected getStatusCode(exception: unknown): HttpStatus {
    return exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
  }

  protected getExceptionResponse(exception: unknown): HttpExceptionResponse | null {
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

  protected isObjectWithMessage(response: unknown): response is { message: string | string[] } {
    return (
      typeof response === 'object' &&
      response !== null &&
      'message' in response &&
      (typeof (response as Record<string, unknown>).message === 'string' ||
        Array.isArray((response as Record<string, unknown>).message))
    );
  }

  protected hasErrorCode(response: {
    message: string | string[];
  }): response is { message: string | string[]; error: string } {
    return 'error' in response && typeof (response as Record<string, unknown>).error === 'string';
  }

  protected getErrorCode(exceptionResponse: HttpExceptionResponse | null, status: number): string {
    if (exceptionResponse?.error) {
      return exceptionResponse.error;
    }
    return this.getDefaultErrorCode(status);
  }

  protected getDefaultErrorCode(status: number): string {
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

  protected extractClientMessage(
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
