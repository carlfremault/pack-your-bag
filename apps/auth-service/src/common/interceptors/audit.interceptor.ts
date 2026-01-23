import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { AuditEventType } from '@prisma-client';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { AUDIT_EVENT_KEY } from '@/common/decorators/audit-log.decorator';
import anonymizeIp from '@/common/utils/anonymizeIp';
import { AuditLogProvider } from '@/modules/audit-log/audit-log.provider';

interface AuditableResponse {
  user?: {
    id?: string;
  };
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name, { timestamp: true });
  constructor(
    private readonly reflector: Reflector,
    private readonly auditProvider: AuditLogProvider,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const defaultEvent = this.reflector.get<AuditEventType>(AUDIT_EVENT_KEY, context.getHandler());
    if (!defaultEvent) return next.handle();

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      tap((data: AuditableResponse) => {
        const { user, auditOverride, ip, headers, path, method } = request;
        const userAgent = Array.isArray(headers['user-agent'])
          ? (headers['user-agent'][0] as string)
          : (headers['user-agent'] as string);

        // Logic to find the ID:
        // 1. Look in the request (for authenticated actions like password change)
        // 2. Look in the returned response (for login/register)
        const userId = user?.userId || data?.user?.id || null;
        const eventType: AuditEventType = auditOverride || defaultEvent;

        if (!userId && eventType !== 'USER_REGISTERED') {
          this.logger.warn(`Could not resolve userId for audit event: ${eventType}`);
        }

        this.auditProvider.safeEmit({
          eventType,
          severity: 'INFO',
          userId,
          ipAddress: anonymizeIp(ip),
          userAgent,
          path,
          method,
          statusCode: response.statusCode,
          message: 'Success',
          metadata: {
            ...(user?.tokenId && { tokenId: user.tokenId }),
            ...(user?.tokenFamilyId && { tokenFamily: user.tokenFamilyId }),
          },
        });
      }),
    );
  }
}
