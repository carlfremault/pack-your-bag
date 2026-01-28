import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';

import { AuditEventType, AuditSeverity } from '@prisma-client';
import { Request, Response } from 'express';

import {
  BffAuthenticationException,
  InvalidSessionException,
  SessionExpiredException,
  TokenReusedException,
} from '@/common/exceptions/auth.exceptions';
import anonymizeIp from '@/common/utils/anonymizeIp';
import { captureSentryException } from '@/common/utils/captureSentryException';
import { getUserAgentFromHeaders } from '@/common/utils/getUserAgentFromHeaders';
import { AuditLogProvider } from '@/modules/audit-log/audit-log.provider';

interface UnauthorizedExceptionResponse {
  message: string | string[];
  error?: string;
  statusCode?: number;
}

@Catch(UnauthorizedException)
export class AuthExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AuthExceptionFilter.name);

  constructor(private readonly auditLogProvider: AuditLogProvider) {}

  catch(exception: UnauthorizedException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const { user, ip, headers, path, method } = request;

    const exceptionResponse = exception.getResponse() as UnauthorizedExceptionResponse;
    const errorCode = exceptionResponse.error || 'UNAUTHORIZED';
    const clientMessage = this.getClientMessage(exceptionResponse);
    const auditMessage = typeof exception.cause === 'string' ? exception.cause : exception.message;
    const userAgent = getUserAgentFromHeaders(headers);

    let severity: AuditSeverity = AuditSeverity.WARN;
    let eventType: AuditEventType;
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
    } else {
      eventType = AuditEventType.USER_LOGIN_FAILED;
    }

    if (severity === AuditSeverity.CRITICAL) {
      try {
        captureSentryException({
          exception,
          request,
          errorCode,
          level: 'warning',
          eventType,
          fingerprint: fingerprint ?? [eventType, errorCode],
        });
      } catch (error) {
        this.logger.error(
          'Failed to capture Sentry exception',
          error instanceof Error ? error.stack : String(error),
        );
      }
    }

    this.auditLogProvider.safeEmit({
      eventType,
      severity,
      userId: user?.userId ?? null,
      ipAddress: ip ? anonymizeIp(ip) : 'unknown',
      userAgent,
      path,
      method,
      statusCode: HttpStatus.UNAUTHORIZED,
      errorCode,
      message: auditMessage,
      metadata: {
        ...(user?.tokenId && { tokenId: user.tokenId }),
        ...(user?.tokenFamilyId && { tokenFamily: user.tokenFamilyId }),
      },
    });

    response.status(HttpStatus.UNAUTHORIZED).json({
      statusCode: HttpStatus.UNAUTHORIZED,
      message: clientMessage,
      error: errorCode,
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
