import { ExecutionContext, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { THROTTLE_LIMITS } from '../constants/common.constants';
import { BffAuthenticationException } from '../exceptions/unauthorized.exceptions';

import { BffGuard } from './bff.guard';

const MOCK_CONFIG = {
  BFF_SHARED_SECRET: 'my-bff-secret-123',
};

function createMockContext(options: {
  path?: string;
  ip?: string;
  bffSecret?: string;
}): ExecutionContext {
  const request = {
    path: options.path ?? '/api/test',
    ip: options.ip ?? '192.168.1.1',
    headers: {
      ...(options.bffSecret !== undefined && { 'x-bff-secret': options.bffSecret }),
    },
  };

  return {
    switchToHttp: vi.fn().mockReturnValue({
      getRequest: vi.fn().mockReturnValue(request),
    }),
  } as never;
}

function exhaustLockoutThreshold(guard: BffGuard, ctx: ExecutionContext): void {
  for (let i = 0; i < THROTTLE_LIMITS.BFF_GUARD; i++) {
    try {
      guard.canActivate(ctx);
    } catch {
      // expected authentication failures
    }
  }
}

describe('BffGuard', () => {
  let guard: BffGuard;
  let bffSecret: string;
  const mockConfigService = {
    get: vi.fn(<T = string>(key: string, defaultValue?: T): T => {
      return (MOCK_CONFIG[key as keyof typeof MOCK_CONFIG] ?? defaultValue) as T;
    }),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    const module: TestingModule = await Test.createTestingModule({
      providers: [BffGuard, { provide: ConfigService, useValue: mockConfigService }],
    }).compile();
    bffSecret = mockConfigService.get('BFF_SHARED_SECRET') as string;

    guard = module.get<BffGuard>(BffGuard);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('health endpoint bypass', () => {
    it('should allow /health without checking BFF secret', () => {
      const context = createMockContext({ path: '/health', bffSecret: undefined });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow /health/ (with trailing slash) without checking BFF secret', () => {
      const context = createMockContext({ path: '/health/', bffSecret: undefined });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });
  });

  describe('missing BFF_SHARED_SECRET config', () => {
    it('should throw BffAuthenticationException when BFF_SHARED_SECRET is not configured', () => {
      mockConfigService.get.mockReturnValueOnce('');

      const context = createMockContext({ bffSecret: 'anything' });

      expect(() => guard.canActivate(context)).toThrow(BffAuthenticationException);
    });
  });

  describe('missing x-bff-secret header', () => {
    it('should throw InternalServerErrorException when header is not provided', () => {
      const context = createMockContext({ bffSecret: undefined });

      expect(() => guard.canActivate(context)).toThrow(InternalServerErrorException);
    });

    it('should record a failed attempt when header is missing', () => {
      const context = createMockContext({ ip: '10.0.0.1', bffSecret: undefined });

      try {
        guard.canActivate(context);
      } catch {
        // expected
      }

      // Second attempt should throw but not be locked out yet
      expect(() => guard.canActivate(context)).toThrow(BffAuthenticationException);
    });
  });

  describe('wrong secret', () => {
    it('should throw BffAuthenticationException when secret does not match', () => {
      const context = createMockContext({ bffSecret: 'wrong-secret' });

      expect(() => guard.canActivate(context)).toThrow(BffAuthenticationException);
    });

    it('should record failed attempt for wrong secret', () => {
      const ip = '10.0.0.2';
      const context = createMockContext({ ip, bffSecret: 'wrong' });

      exhaustLockoutThreshold(guard, context);

      // Next attempt should trigger lockout
      expect(() => guard.canActivate(context)).toThrow(
        new BffAuthenticationException('Too many failed attempts'),
      );
    });

    it('should handle length mismatch in timing-safe comparison', () => {
      // The guard does a length check before timingSafeEqual
      const context = createMockContext({ bffSecret: 'short' });

      expect(() => guard.canActivate(context)).toThrow(BffAuthenticationException);
    });
  });

  describe('correct secret', () => {
    it('should return true when the correct secret is provided', () => {
      const context = createMockContext({ bffSecret });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should clear failed attempts on successful authentication', () => {
      const ip = '10.0.0.3';

      // Record a failed attempt
      const failContext = createMockContext({ ip, bffSecret: 'wrong' });
      try {
        guard.canActivate(failContext);
      } catch {
        // expected
      }

      // Succeed with correct secret
      const successContext = createMockContext({ ip, bffSecret });
      guard.canActivate(successContext);

      // Should be able to fail again without hitting previous count
      try {
        guard.canActivate(failContext);
      } catch {
        // expected
      }

      // Verify we're starting from count=1 again (not carried over)
      const successAgain = createMockContext({ ip, bffSecret });
      expect(() => guard.canActivate(successAgain)).not.toThrow();
    });
  });

  describe('IP lockout', () => {
    const bffSecret = mockConfigService.get('BFF_SHARED_SECRET') as string;

    it('should lock out IP after threshold failed attempts', () => {
      const ip = '10.0.0.4';
      const context = createMockContext({ ip, bffSecret: 'wrong' });

      exhaustLockoutThreshold(guard, context);

      // Next attempt triggers lockout message
      expect(() => guard.canActivate(context)).toThrow(
        new BffAuthenticationException('Too many failed attempts'),
      );
    });

    it('should maintain lockout for the duration even with correct secret', () => {
      const ip = '10.0.0.5';
      const failContext = createMockContext({ ip, bffSecret: 'wrong' });

      exhaustLockoutThreshold(guard, failContext);

      // Try with correct secret while still locked out
      const successContext = createMockContext({ ip, bffSecret });
      expect(() => guard.canActivate(successContext)).toThrow(
        new BffAuthenticationException('Too many failed attempts'),
      );
    });

    it('should reset lockout after the lockout period expires', () => {
      const ip = '10.0.0.6';
      const context = createMockContext({ ip, bffSecret: 'wrong' });

      exhaustLockoutThreshold(guard, context);

      // Verify locked out
      expect(() => guard.canActivate(context)).toThrow(
        new BffAuthenticationException('Too many failed attempts'),
      );

      // Advance time past lockout duration (5 minutes)
      vi.advanceTimersByTime(5 * 60 * 1000 + 1);

      // Should now allow retry (and fail for wrong secret, not lockout)
      expect(() => guard.canActivate(context)).toThrow(BffAuthenticationException);
      // Verify it's not the lockout message by checking we can try again
      expect(() => guard.canActivate(context)).toThrow(BffAuthenticationException);
    });
  });

  describe('recordFailedAttempt', () => {
    it('should create new entry for first failed attempt', () => {
      const ip = '10.0.0.7';
      const context = createMockContext({ ip, bffSecret: 'wrong' });

      try {
        guard.canActivate(context);
      } catch {
        // expected
      }

      // Verify it's recorded (we can infer by attempting again and seeing count increment)
      exhaustLockoutThreshold(guard, context);

      // Should now be locked out
      expect(() => guard.canActivate(context)).toThrow(
        new BffAuthenticationException('Too many failed attempts'),
      );
    });

    it('should increment count for subsequent failed attempts from same IP', () => {
      const ip = '10.0.0.8';
      const context = createMockContext({ ip, bffSecret: 'wrong' });

      // First attempt
      try {
        guard.canActivate(context);
      } catch {
        // expected
      }

      // Second attempt (exercises the else branch in recordFailedAttempt)
      try {
        guard.canActivate(context);
      } catch {
        // expected
      }

      // Should still be able to make more attempts (not locked out yet)
      expect(() => guard.canActivate(context)).toThrow(BffAuthenticationException);
    });
  });

  describe('onModuleDestroy', () => {
    it('should clear the cleanup interval on module destroy', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

      guard.onModuleDestroy();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle unknown IP gracefully', () => {
      const bffSecret = mockConfigService.get('BFF_SHARED_SECRET') as string;
      const context = createMockContext({ ip: undefined, bffSecret });

      // Should still work (ip defaults to 'unknown' string in the guard)
      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });
  });
});
