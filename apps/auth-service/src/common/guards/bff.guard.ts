import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { timingSafeEqual } from 'crypto';
import { Request } from 'express';

import { THROTTLE_LIMITS } from '@/common/constants/auth.constants';
import { BffAuthenticationException } from '@/common/exceptions/auth.exceptions';

@Injectable()
export class BffGuard implements CanActivate, OnModuleDestroy {
  private readonly logger = new Logger(BffGuard.name);
  private readonly failedAttempts = new Map<string, { count: number; resetAt: number }>();
  private readonly LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes
  private readonly cleanupInterval: ReturnType<typeof setInterval>;
  private readonly bffSecret: string;

  constructor(private configService: ConfigService) {
    this.cleanupInterval = setInterval(() => this.cleanup(), 10 * 60 * 1000);
    this.bffSecret = this.configService.get<string>('BFF_SHARED_SECRET', '');
  }

  onModuleDestroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    if (request.path === '/health' || request.path === '/health/') {
      return true;
    }

    const ip = request.ip || 'unknown';
    const attempts = this.failedAttempts.get(ip);

    if (attempts && attempts.count >= THROTTLE_LIMITS.BFF_GUARD) {
      if (Date.now() < attempts.resetAt) {
        this.logger.warn('IP locked out', { ip, attempts: attempts.count });
        throw new BffAuthenticationException('Too many failed attempts');
      } else {
        this.failedAttempts.delete(ip); // Reset after lockout period
      }
    }

    const providedSecret = request.headers['x-bff-secret'] as string;

    if (!this.bffSecret) {
      this.logger.error('BFF_SHARED_SECRET not configured');
      throw new InternalServerErrorException();
    }

    if (!providedSecret) {
      this.recordFailedAttempt(ip);
      throw new BffAuthenticationException();
    }

    const expectedBuffer = Buffer.from(this.bffSecret, 'utf8');
    const providedBuffer = Buffer.from(providedSecret, 'utf8');

    if (
      expectedBuffer.length !== providedBuffer.length ||
      !timingSafeEqual(expectedBuffer, providedBuffer)
    ) {
      this.recordFailedAttempt(ip);
      throw new BffAuthenticationException();
    }

    this.failedAttempts.delete(ip);
    return true;
  }

  private recordFailedAttempt(ip: string): void {
    const current = this.failedAttempts.get(ip);
    if (!current) {
      this.failedAttempts.set(ip, {
        count: 1,
        resetAt: Date.now() + this.LOCKOUT_DURATION_MS,
      });
    } else {
      current.count++;
      this.logger.warn('Failed BFF auth attempt', { ip, attempts: current.count });
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [ip, data] of this.failedAttempts.entries()) {
      if (now >= data.resetAt) {
        this.failedAttempts.delete(ip);
      }
    }
  }
}
