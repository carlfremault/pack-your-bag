import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';

import { Request, Response } from 'express';

import anonymizeIp from '@/common/utils/anonymizeIp';
import { getUserAgentFromHeaders } from '@/common/utils/getUserAgentFromHeaders';
import { safeStringify } from '@/common/utils/safeStringify';
import { AuditEventType, AuditSeverity } from '@/generated/prisma';
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
    const message = this.extractClientMessage(exception, exceptionResponse);

    this.auditException(exception, request, statusCode, errorCode);

    response.status(statusCode).json({
      statusCode,
      message,
      error: errorCode,
      timestamp: new Date().toISOString(),
    });
  }

  private auditException(
    exception: unknown,
    request: Request,
    status: number,
    errorCode: string,
  ): void {
    if (exception instanceof ThrottlerException) {
      this.auditRateLimitExceeded(request, exception, errorCode);
      return;
    }

    if (status >= 500) {
      this.auditInternalServerError(exception, request, status, errorCode);
      return;
    }

    // Wide range at first. Narrow down progressively after initial deployment
    if (status >= 400) {
      this.auditGeneralException(exception, request, status, errorCode);
    }
  }

  private auditRateLimitExceeded(request: Request, exception: unknown, errorCode: string): void {
    const { headers, user, path, method, ip } = request;
    const tracker = this.isThrottlerExceptionWithTracker(exception) ? exception.tracker : undefined;
    const userAgent = getUserAgentFromHeaders(headers);

    this.logger.warn(`Rate limit exceeded at ${method} ${path} with tracker ${tracker}`);

    this.auditLogProvider.safeEmit({
      eventType: 'SECURITY_RATE_LIMIT_EXCEEDED',
      severity: 'WARN',
      userId: user?.userId ?? null,
      ipAddress: ip ? anonymizeIp(ip) : 'unknown',
      userAgent,
      path,
      method,
      statusCode: HttpStatus.TOO_MANY_REQUESTS,
      errorCode,
      message: 'Rate limit exceeded',
      metadata: {
        tracker,
      },
    });
  }

  private auditInternalServerError(
    exception: unknown,
    request: Request,
    status: number,
    errorCode: string,
  ): void {
    const { headers, user, path, method, ip } = request;
    const message = exception instanceof Error ? exception.message : 'Unknown error';
    const errorStack = exception instanceof Error ? exception.stack : safeStringify(exception);
    const userAgent = getUserAgentFromHeaders(headers);

    this.logger.warn(`Unhandled ${status} at ${method} ${path}: ${message}`, errorStack);

    this.auditLogProvider.safeEmit({
      eventType: 'INTERNAL_SERVER_ERROR',
      severity: 'CRITICAL',
      userId: user?.userId ?? null,
      ipAddress: ip ? anonymizeIp(ip) : 'unknown',
      userAgent,
      path,
      method,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      errorCode,
      message,
    });
  }

  private auditGeneralException(
    exception: unknown,
    request: Request,
    status: number,
    errorCode: string,
  ): void {
    const { headers, user, path, method, ip } = request;
    const severity = this.getSeverityForStatus(status);
    const eventType = this.getEventTypeForStatus(status);
    const message = exception instanceof Error ? exception.message : 'Unknown error';
    const errorStack = exception instanceof Error ? exception.stack : safeStringify(exception);
    const userAgent = getUserAgentFromHeaders(headers);

    this.logger.error(`Unhandled ${status} at ${method} ${path}: ${message}`, errorStack);

    this.auditLogProvider.safeEmit({
      eventType,
      severity,
      userId: user?.userId ?? null,
      ipAddress: ip ? anonymizeIp(ip) : 'unknown',
      userAgent,
      path,
      method,
      statusCode: status,
      errorCode,
      message,
    });
  }

  private getSeverityForStatus(status: number): AuditSeverity {
    if (status >= 500) return 'ERROR';
    if (status === 403 || status === 401) return 'WARN';
    return 'INFO';
  }

  private getEventTypeForStatus(status: number): AuditEventType {
    const eventMap: Record<number, AuditEventType> = {
      400: 'VALIDATION_ERROR',
      403: 'AUTHORIZATION_FAILED',
      404: 'RESOURCE_NOT_FOUND',
      409: 'CONFLICT_ERROR',
    };

    return eventMap[status] ?? 'HTTP_ERROR';
  }

  private getStatusCode(exception: unknown): number {
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

    if (this.isHttpExceptionResponse(response)) {
      return response;
    }

    this.logger.warn(`Unexpected exception response format: ${safeStringify(response)}`);

    return {
      statusCode: status,
      message: 'An error occurred',
    };
  }

  private isHttpExceptionResponse(response: unknown): response is HttpExceptionResponse {
    return (
      typeof response === 'object' &&
      response !== null &&
      'statusCode' in response &&
      'message' in response
    );
  }

  private isThrottlerExceptionWithTracker(
    exception: unknown,
  ): exception is ThrottlerExceptionWithTracker {
    return exception instanceof ThrottlerException && 'tracker' in exception;
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
