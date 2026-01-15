import { ArgumentsHost, Catch, ExceptionFilter, UnauthorizedException } from '@nestjs/common';

import { AuditEventType, AuditSeverity } from '@prisma-client';
import { Request, Response } from 'express';

import {
  InvalidSessionException,
  SessionExpiredException,
  TokenReusedException,
} from '@/common/exceptions/auth.exceptions';
import { RefreshTokenUser } from '@/common/interfaces/refresh-token-user.interface';
import anonymizeIp from '@/common/utils/anonymizeIp';
import { AuditLogProvider } from '@/modules/audit/audit-log.provider';

interface UnauthorizedExceptionResponse {
  message: string | string[];
  error?: string;
  statusCode?: number;
}

@Catch(UnauthorizedException)
export class AuthExceptionFilter implements ExceptionFilter {
  constructor(private readonly auditProvider: AuditLogProvider) {}

  catch(exception: UnauthorizedException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const exceptionResponse = exception.getResponse() as UnauthorizedExceptionResponse;

    const errorCode = exceptionResponse.error || 'UNAUTHORIZED';
    const clientMessage = Array.isArray(exceptionResponse.message)
      ? (exceptionResponse.message[0] ?? 'Unauthorized')
      : exceptionResponse.message || 'Unauthorized';
    const auditMessage = typeof exception.cause === 'string' ? exception.cause : exception.message;

    let severity: AuditSeverity = 'WARN';
    let eventType: AuditEventType;

    if (exception instanceof TokenReusedException) {
      eventType = 'TOKEN_REUSE_DETECTED';
      severity = 'CRITICAL';
    } else if (exception instanceof SessionExpiredException) {
      eventType = 'SESSION_EXPIRED';
      severity = 'INFO';
    } else if (exception instanceof InvalidSessionException) {
      eventType = 'INVALID_SESSION';
    } else if (errorCode === 'INVALID_TOKEN') {
      eventType = 'SUSPICIOUS_ACTIVITY';
      severity = 'CRITICAL';
    } else {
      eventType = 'USER_LOGIN_FAILED';
    }

    const user = request.user as RefreshTokenUser | undefined;

    this.auditProvider.safeEmit({
      eventType,
      severity,
      userId: user?.userId ?? null,
      ipAddress: anonymizeIp(request.ip),
      userAgent: request.headers['user-agent'],
      path: request.path,
      method: request.method,
      statusCode: 401,
      errorCode,
      message: auditMessage,
      metadata: {
        tokenId: user?.tokenId ?? null,
        tokenFamily: user?.tokenFamilyId ?? null,
      },
    });

    response.status(401).json({
      statusCode: 401,
      message: clientMessage,
      error: errorCode,
      timestamp: new Date().toISOString(),
    });
  }
}
