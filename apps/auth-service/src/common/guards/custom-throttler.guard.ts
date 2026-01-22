import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { ThrottlerModuleOptions } from '@nestjs/throttler';
import { ThrottlerGuard, ThrottlerStorage } from '@nestjs/throttler';

import { Request } from 'express';

import anonymizeIp from '@/common/utils/anonymizeIp';
import { AuditLogProvider } from '@/modules/audit-log/audit-log.provider';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  private readonly logger = new Logger(CustomThrottlerGuard.name);

  constructor(
    options: ThrottlerModuleOptions,
    storageService: ThrottlerStorage,
    reflector: Reflector,

    private readonly auditProvider: AuditLogProvider,
  ) {
    super(options, storageService, reflector);
  }

  // Parent class requires Promise<string>, so keep async
  // eslint-disable-next-line @typescript-eslint/require-await
  protected async getTracker(req: Request): Promise<string> {
    if (req.user?.userId) {
      return `user:${req.user.userId}`;
    }

    const ip = this.getClientIp(req);
    return `ip:${ip}`;
  }

  private getClientIp(req: Request): string {
    return req.ip ?? 'unknown';
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      return await super.canActivate(context);
    } catch (error) {
      const request = context.switchToHttp().getRequest<Request>();
      const rawTracker = await this.getTracker(request);
      const { headers, user, path, method } = request;
      const headersUserAgent = Array.isArray(headers['user-agent'])
        ? (headers['user-agent'][0] as string)
        : (headers['user-agent'] as string);

      // Masking for GDPR-compliant logging
      let maskedTracker: string;
      if (rawTracker.startsWith('user:')) {
        maskedTracker = `user:***${rawTracker.slice(-4)}`;
      } else {
        const rawIp = rawTracker.replace('ip:', '');
        maskedTracker = `ip:${anonymizeIp(rawIp)}`;
      }

      this.auditProvider.safeEmit({
        eventType: 'SECURITY_RATE_LIMIT_EXCEEDED',
        severity: 'WARN',
        userId: user?.userId ?? null,
        ipAddress: anonymizeIp(this.getClientIp(request)),
        userAgent: headersUserAgent, // will be anonymized in audit log service as we will extract deviceInfo only
        path,
        method,
        statusCode: 429,
        message: 'Rate limit exceeded',
        metadata: {
          tracker: maskedTracker,
          ...(user?.tokenId && { tokenId: user.tokenId }),
          ...(user?.tokenFamilyId && { tokenFamily: user.tokenFamilyId }),
        },
      });

      this.logger.warn('Rate limit exceeded', {
        tracker: maskedTracker,
        method,
        path,
      });

      throw error;
    }
  }
}
