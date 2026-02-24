import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';

import { AuditEventType, AuditSeverity } from '@repo/db';
import { InvalidSessionException } from '@repo/nestjs-common';

import { Request, Response } from 'express';

import {
  BffAuthenticationException,
  SessionExpiredException,
  TokenReusedException,
} from '@/common/exceptions/unauthorized.exceptions';
import { anonymizeEmail } from '@/common/utils/anonymizeEmail';
import { safeCaptureSentryException } from '@/common/utils/captureSentryException';
import { AuditLogProvider } from '@/modules/audit-log/audit-log.provider';
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
  eventType: AuditEventType;
  severity: AuditSeverity;
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

    let eventType: AuditEventType = AuditEventType.USER_LOGIN_FAILED;
    let severity: AuditSeverity = AuditSeverity.WARN;
    let fingerprint: string[] | undefined;

    if (exception instanceof TokenReusedException) {
      eventType = AuditEventType.TOKEN_REUSE_DETECTED;
      severity = AuditSeverity.CRITICAL;
      fingerprint = ['token-reuse', user?.userId ?? 'unknown'];
    } else if (exception instanceof BffAuthenticationException) {
      eventType = AuditEventType.BFF_SECRET_MISMATCH;
      severity = AuditSeverity.CRITICAL;
      fingerprint = ['bff-secret-mismatch'];
    } else if (exception instanceof SessionExpiredException) {
      eventType = AuditEventType.SESSION_EXPIRED;
      severity = AuditSeverity.INFO;
    } else if (exception instanceof InvalidSessionException) {
      eventType = AuditEventType.INVALID_SESSION;
    } else if (errorCode === 'INVALID_TOKEN') {
      eventType = AuditEventType.SUSPICIOUS_ACTIVITY;
      severity = AuditSeverity.CRITICAL;
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

    if (ctx.severity === AuditSeverity.CRITICAL) {
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
