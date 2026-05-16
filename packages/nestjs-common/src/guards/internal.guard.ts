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

import { THROTTLE_LIMITS } from '../constants/common.constants';
import { InternalAuthenticationException } from '../exceptions/unauthorized.exceptions';

@Injectable()
export class InternalGuard implements CanActivate, OnModuleDestroy {
  private readonly logger = new Logger(InternalGuard.name);
  private readonly failedAttempts = new Map<string, { count: number; resetAt: number }>();
  private readonly LOCKOUT_DURATION_MS = 5 * 60 * 1000;
  private readonly cleanupInterval: ReturnType<typeof setInterval>;
  private readonly internalSecret: string;

  constructor(private configService: ConfigService) {
    this.cleanupInterval = setInterval(() => this.cleanup(), 10 * 60 * 1000);
    this.internalSecret = this.configService.get<string>('INTERNAL_SERVICE_SECRET', '');
  }

  onModuleDestroy(): void {
    clearInterval(this.cleanupInterval);
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const ip = request.ip || 'unknown';
    const attempts = this.failedAttempts.get(ip);

    if (attempts && attempts.count >= THROTTLE_LIMITS.BFF_GUARD) {
      if (Date.now() < attempts.resetAt) {
        this.logger.warn('IP locked out', { ip, attempts: attempts.count });
        throw new InternalAuthenticationException('Too many failed attempts');
      } else {
        this.failedAttempts.delete(ip);
      }
    }

    const rawHeader = request.headers['x-internal-secret'];
    const providedSecret = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;

    if (!this.internalSecret) {
      this.logger.error('INTERNAL_SERVICE_SECRET not configured');
      throw new InternalServerErrorException();
    }

    if (!providedSecret) {
      this.recordFailedAttempt(ip);
      throw new InternalAuthenticationException();
    }

    const expectedBuffer = Buffer.from(this.internalSecret, 'utf8');
    const providedBuffer = Buffer.from(providedSecret, 'utf8');

    if (
      expectedBuffer.length !== providedBuffer.length ||
      !timingSafeEqual(expectedBuffer, providedBuffer)
    ) {
      this.recordFailedAttempt(ip);
      throw new InternalAuthenticationException();
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
      current.resetAt = Date.now() + this.LOCKOUT_DURATION_MS;
      this.logger.warn('Failed internal auth attempt', { ip, attempts: current.count });
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
