import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';

import { AuditLogEventType, AuditLogSeverity } from '@repo/db';
import {
  anonymizeEmail,
  BffAuthenticationException,
  InvalidSessionException,
  safeCaptureSentryException,
} from '@repo/nestjs-common';
import { AuditLogProvider } from '@repo/nestjs-common';

import { Request, Response } from 'express';

import {
  DeletedGuestAccessException,
  SessionExpiredException,
  TokenReusedException,
} from '@/common/exceptions/unauthorized.exceptions';
import { AuthCredentialsDto } from '@/modules/auth/dto/auth-credentials.dto';

interface UnauthorizedExceptionResponse {
  message: string | string[];
  error?: string;
  statusCode?: number;
}

interface AuthErrorContext {
  errorCode: string;
  clientMessage: string;
  auditMessage: string;
  eventType: AuditLogEventType;
  severity: AuditLogSeverity;
  fingerprint?: string[];
}

@Catch(UnauthorizedException)
export class AuthExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AuthExceptionFilter.name);

  constructor(private readonly auditLogProvider: AuditLogProvider) {}

  catch(exception: UnauthorizedException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorContext = this.getErrorContext(exception, request);

    this.processError(errorContext, exception, request, response);
  }

  private getErrorContext(exception: UnauthorizedException, request: Request): AuthErrorContext {
    const exceptionResponse = exception.getResponse() as UnauthorizedExceptionResponse;
    const errorCode = exceptionResponse.error || 'UNAUTHORIZED';
    const clientMessage = this.getClientMessage(exceptionResponse);
    const auditMessage = typeof exception.cause === 'string' ? exception.cause : exception.message;
    const { user } = request;

    let eventType: AuditLogEventType = AuditLogEventType.USER_LOGIN_FAILED;
    let severity: AuditLogSeverity = AuditLogSeverity.WARN;
    let fingerprint: string[] | undefined;

    if (exception instanceof TokenReusedException) {
      eventType = AuditLogEventType.TOKEN_REUSE_DETECTED;
      severity = AuditLogSeverity.CRITICAL;
      fingerprint = ['token-reuse', user?.userId ?? 'unknown'];
    } else if (exception instanceof BffAuthenticationException) {
      eventType = AuditLogEventType.BFF_SECRET_MISMATCH;
      severity = AuditLogSeverity.CRITICAL;
      fingerprint = ['bff-secret-mismatch'];
    } else if (exception instanceof SessionExpiredException) {
      eventType = AuditLogEventType.SESSION_EXPIRED;
      severity = AuditLogSeverity.INFO;
    } else if (exception instanceof InvalidSessionException) {
      eventType = AuditLogEventType.INVALID_SESSION;
    } else if (exception instanceof DeletedGuestAccessException) {
      eventType = AuditLogEventType.DELETED_GUEST_ACCESS;
      severity = AuditLogSeverity.INFO;
    } else if (errorCode === 'INVALID_TOKEN') {
      eventType = AuditLogEventType.SUSPICIOUS_ACTIVITY;
      severity = AuditLogSeverity.CRITICAL;
      fingerprint = ['suspicious-activity', 'invalid-token', user?.userId ?? 'unknown'];
    }

    return {
      errorCode,
      clientMessage,
      auditMessage,
      eventType,
      severity,
      fingerprint,
    };
  }

  private processError(
    ctx: AuthErrorContext,
    exception: UnauthorizedException,
    request: Request,
    response: Response,
  ) {
    const { user } = request;
    const body = request.body as AuthCredentialsDto;

    if (ctx.severity === AuditLogSeverity.CRITICAL) {
      safeCaptureSentryException(
        {
          exception,
          request,
          errorCode: ctx.errorCode,
          eventType: ctx.eventType,
          fingerprint: ctx.fingerprint,
        },
        this.logger,
      );
    }

    this.auditLogProvider.auditRequest(
      {
        eventType: ctx.eventType,
        severity: ctx.severity,
        statusCode: HttpStatus.UNAUTHORIZED,
        errorCode: ctx.errorCode,
        message: ctx.auditMessage,
        metadata: {
          ...(body?.email && { email: anonymizeEmail(body.email) }),
          ...(user?.tokenId && { tokenId: user.tokenId }),
          ...(user?.tokenFamilyId && { tokenFamily: user.tokenFamilyId }),
        },
      },
      request,
    );

    response.status(HttpStatus.UNAUTHORIZED).json({
      statusCode: HttpStatus.UNAUTHORIZED,
      message: ctx.clientMessage,
      error: ctx.errorCode,
      timestamp: new Date().toISOString(),
    });
  }

  private getClientMessage(exceptionResponse: UnauthorizedExceptionResponse): string {
    if (Array.isArray(exceptionResponse.message)) {
      return exceptionResponse.message[0] || 'Unauthorized';
    }
    return exceptionResponse.message || 'Unauthorized';
  }
}
