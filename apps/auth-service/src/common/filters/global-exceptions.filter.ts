import type { ForbiddenException } from '@nestjs/common';
import { Catch, HttpStatus } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';

import { AuditLogEventType, AuditLogSeverity } from '@repo/db';
import {
  AccountDeletedException,
  AuditLogProvider,
  BaseGlobalExceptionsFilter,
} from '@repo/nestjs-common';

import { Request } from 'express';

import {
  EmailAlreadyVerifiedException,
  InvalidTokenException,
} from '@/common/exceptions/bad-request.exceptions';

@Catch()
export class GlobalExceptionsFilter extends BaseGlobalExceptionsFilter {
  constructor(auditLogProvider: AuditLogProvider) {
    super(auditLogProvider, GlobalExceptionsFilter.name);
  }

  protected override handleException(
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

    // 400 Email already verified (benign repeat click)
    if (exception instanceof EmailAlreadyVerifiedException) {
      this.auditEmailAlreadyVerified(request, errorCode);
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
  // AUTH-SPECIFIC AUDIT HANDLERS
  // ============================================

  private auditAccountDeletionAttempt(
    request: Request,
    exception: ForbiddenException,
    errorCode: string,
  ): void {
    const auditMessage = typeof exception.cause === 'string' ? exception.cause : exception.message;

    this.auditLogProvider.auditRequest(
      {
        eventType: AuditLogEventType.ACCOUNT_DELETION_ACCESS_ATTEMPT,
        severity: AuditLogSeverity.INFO,
        statusCode: HttpStatus.FORBIDDEN,
        errorCode,
        message: auditMessage,
      },
      request,
    );
  }

  private auditEmailAlreadyVerified(request: Request, errorCode: string): void {
    this.auditLogProvider.auditRequest(
      {
        eventType: AuditLogEventType.INVALID_TOKEN,
        severity: AuditLogSeverity.INFO,
        statusCode: HttpStatus.BAD_REQUEST,
        errorCode,
        message: 'Email address has already been verified',
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
        eventType: AuditLogEventType.INVALID_TOKEN,
        severity: AuditLogSeverity.WARN,
        statusCode: HttpStatus.BAD_REQUEST,
        errorCode,
        message,
      },
      request,
    );
  }
}
