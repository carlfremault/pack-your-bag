import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { ThrottlerModuleOptions } from '@nestjs/throttler';
import { ThrottlerException, ThrottlerGuard, ThrottlerStorage } from '@nestjs/throttler';

import { Request } from 'express';

import { anonymizeEmail } from '@/common/utils/anonymizeEmail';
import anonymizeIp from '@/common/utils/anonymizeIp';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  private readonly logger = new Logger(CustomThrottlerGuard.name);

  constructor(
    options: ThrottlerModuleOptions,
    storageService: ThrottlerStorage,
    reflector: Reflector,
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

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      return await super.canActivate(context);
    } catch (error) {
      if (!(error instanceof ThrottlerException)) {
        throw error;
      }

      const request = context.switchToHttp().getRequest<Request>();
      const rawTracker = await this.getTracker(request);
      const maskedTracker = this.maskTracker(rawTracker);

      (error as ThrottlerException & { tracker?: string }).tracker = maskedTracker;

      throw error;
    }
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

  private maskTracker(rawTracker: string): string {
    if (rawTracker.startsWith('user:')) {
      return `user:***${rawTracker.slice(-4)}`;
    } else if (rawTracker.startsWith('ip-email:')) {
      const dataPart = rawTracker.replace('ip-email:', '');
      const lastColonIndex = dataPart.lastIndexOf(':');
      const originalIp = dataPart.substring(0, lastColonIndex);
      const email = dataPart.substring(lastColonIndex + 1);
      return `ip-email:${anonymizeIp(originalIp)}:${anonymizeEmail(email)}`;
    } else {
      const rawIp = rawTracker.replace('ip:', '');
      return `ip:${anonymizeIp(rawIp)}`;
    }
  }
}
