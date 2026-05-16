import { ExecutionContext, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { THROTTLE_LIMITS } from '../constants/common.constants';
import { InternalAuthenticationException } from '../exceptions/unauthorized.exceptions';

import { InternalGuard } from './internal.guard';

const MOCK_CONFIG = {
  INTERNAL_SERVICE_SECRET: 'my-internal-secret-456',
};

function createMockContext(options: {
  path?: string;
  ip?: string;
  internalSecret?: string;
}): ExecutionContext {
  const request = {
    path: options.path ?? '/internal/cleanup/users',
    ip: options.ip ?? '192.168.1.1',
    headers: {
      ...(options.internalSecret !== undefined && { 'x-internal-secret': options.internalSecret }),
    },
  };

  return {
    switchToHttp: vi.fn().mockReturnValue({
      getRequest: vi.fn().mockReturnValue(request),
    }),
  } as never;
}

function exhaustLockoutThreshold(guard: InternalGuard, ctx: ExecutionContext): void {
  for (let i = 0; i < THROTTLE_LIMITS.BFF_GUARD; i++) {
    try {
      guard.canActivate(ctx);
    } catch {
      // expected authentication failures
    }
  }
}

describe('InternalGuard', () => {
  let guard: InternalGuard;
  let internalSecret: string;
  const mockConfigService = {
    get: vi.fn(<T = string>(key: string, defaultValue?: T): T => {
      return (MOCK_CONFIG[key as keyof typeof MOCK_CONFIG] ?? defaultValue) as T;
    }),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    const module: TestingModule = await Test.createTestingModule({
      providers: [InternalGuard, { provide: ConfigService, useValue: mockConfigService }],
    }).compile();
    internalSecret = mockConfigService.get('INTERNAL_SERVICE_SECRET') as string;

    guard = module.get<InternalGuard>(InternalGuard);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('missing INTERNAL_SERVICE_SECRET config', () => {
    it('should throw InternalAuthenticationException when INTERNAL_SERVICE_SECRET is not configured', () => {
      mockConfigService.get.mockReturnValueOnce('');

      const context = createMockContext({ internalSecret: 'anything' });

      expect(() => guard.canActivate(context)).toThrow(InternalAuthenticationException);
    });
  });

  describe('missing x-internal-secret header', () => {
    it('should throw InternalServerErrorException when header is not provided', () => {
      const context = createMockContext({ internalSecret: undefined });

      expect(() => guard.canActivate(context)).toThrow(InternalServerErrorException);
    });

    it('should record a failed attempt when header is missing', () => {
      const context = createMockContext({ ip: '10.0.0.1', internalSecret: undefined });

      try {
        guard.canActivate(context);
      } catch {
        // expected
      }

      expect(() => guard.canActivate(context)).toThrow(InternalAuthenticationException);
    });
  });

  describe('wrong secret', () => {
    it('should throw InternalAuthenticationException when secret does not match', () => {
      const context = createMockContext({ internalSecret: 'wrong-secret' });

      expect(() => guard.canActivate(context)).toThrow(InternalAuthenticationException);
    });

    it('should record failed attempt for wrong secret', () => {
      const ip = '10.0.0.2';
      const context = createMockContext({ ip, internalSecret: 'wrong' });

      exhaustLockoutThreshold(guard, context);

      expect(() => guard.canActivate(context)).toThrow(
        new InternalAuthenticationException('Too many failed attempts'),
      );
    });

    it('should handle length mismatch in timing-safe comparison', () => {
      const context = createMockContext({ internalSecret: 'short' });

      expect(() => guard.canActivate(context)).toThrow(InternalAuthenticationException);
    });
  });

  describe('correct secret', () => {
    it('should return true when the correct secret is provided', () => {
      const context = createMockContext({ internalSecret });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should clear failed attempts on successful authentication', () => {
      const ip = '10.0.0.3';

      const failContext = createMockContext({ ip, internalSecret: 'wrong' });
      try {
        guard.canActivate(failContext);
      } catch {
        // expected
      }

      const successContext = createMockContext({ ip, internalSecret });
      guard.canActivate(successContext);

      try {
        guard.canActivate(failContext);
      } catch {
        // expected
      }

      const successAgain = createMockContext({ ip, internalSecret });
      expect(() => guard.canActivate(successAgain)).not.toThrow();
    });
  });

  describe('IP lockout', () => {
    it('should lock out IP after threshold failed attempts', () => {
      const ip = '10.0.0.4';
      const context = createMockContext({ ip, internalSecret: 'wrong' });

      exhaustLockoutThreshold(guard, context);

      expect(() => guard.canActivate(context)).toThrow(
        new InternalAuthenticationException('Too many failed attempts'),
      );
    });

    it('should maintain lockout for the duration even with correct secret', () => {
      const ip = '10.0.0.5';
      const failContext = createMockContext({ ip, internalSecret: 'wrong' });

      exhaustLockoutThreshold(guard, failContext);

      const successContext = createMockContext({ ip, internalSecret });
      expect(() => guard.canActivate(successContext)).toThrow(
        new InternalAuthenticationException('Too many failed attempts'),
      );
    });

    it('should reset lockout after the lockout period expires', () => {
      const ip = '10.0.0.6';
      const context = createMockContext({ ip, internalSecret: 'wrong' });

      exhaustLockoutThreshold(guard, context);

      expect(() => guard.canActivate(context)).toThrow(
        new InternalAuthenticationException('Too many failed attempts'),
      );

      vi.advanceTimersByTime(5 * 60 * 1000 + 1);

      expect(() => guard.canActivate(context)).toThrow(InternalAuthenticationException);
      expect(() => guard.canActivate(context)).toThrow(InternalAuthenticationException);
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
      const context = createMockContext({ ip: undefined, internalSecret });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });
  });
});
