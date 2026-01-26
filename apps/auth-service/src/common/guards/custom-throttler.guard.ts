import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { ThrottlerModuleOptions } from '@nestjs/throttler';
import { ThrottlerException, ThrottlerGuard, ThrottlerStorage } from '@nestjs/throttler';

import { Request } from 'express';

import { anonymizeEmail } from '@/common/utils/anonymizeEmail';
import anonymizeIp from '@/common/utils/anonymizeIp';
import { getUserAgentFromHeaders } from '@/common/utils/getUserAgentFromHeaders';
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

    if (req.path === '/auth/login' && this.isLoginBody(req.body)) {
      return `ip-email:${ip}:${req.body.email.toLowerCase()}`;
    }

    return `ip:${ip}`;
  }

  private getClientIp(req: Request): string {
    return req.ip ?? 'unknown';
  }

  private isLoginBody(body: unknown): body is { email: string } {
    return (
      body !== null &&
      typeof body === 'object' &&
      'email' in body &&
      typeof body.email === 'string' &&
      body.email.length > 0 &&
      body.email.length < 255
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      return await super.canActivate(context);
    } catch (error) {
      if (!(error instanceof ThrottlerException)) {
        throw error;
      }

      const request = context.switchToHttp().getRequest<Request>();
      const rawTracker = await this.getTracker(request);
      const { headers, user, path, method } = request;
      const userAgent = getUserAgentFromHeaders(headers);

      // Masking for GDPR-compliant logging
      let maskedTracker: string;
      if (rawTracker.startsWith('user:')) {
        maskedTracker = `user:***${rawTracker.slice(-4)}`;
      } else if (rawTracker.startsWith('ip-email:')) {
        const dataPart = rawTracker.replace('ip-email:', '');
        const lastColonIndex = dataPart.lastIndexOf(':');
        const originalIp = dataPart.substring(0, lastColonIndex);
        const email = dataPart.substring(lastColonIndex + 1);
        maskedTracker = `ip-email:${anonymizeIp(originalIp)}:${anonymizeEmail(email)}`;
      } else {
        const rawIp = rawTracker.replace('ip:', '');
        maskedTracker = `ip:${anonymizeIp(rawIp)}`;
      }

      this.auditProvider.safeEmit({
        eventType: 'SECURITY_RATE_LIMIT_EXCEEDED',
        severity: 'WARN',
        userId: user?.userId ?? null,
        ipAddress: anonymizeIp(this.getClientIp(request)),
        userAgent,
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
