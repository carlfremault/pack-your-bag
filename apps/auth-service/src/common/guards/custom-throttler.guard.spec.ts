import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerException, ThrottlerGuard, ThrottlerStorage } from '@nestjs/throttler';

import { Request } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CustomThrottlerGuard } from './custom-throttler.guard';

type GuardWithProtectedMethods = CustomThrottlerGuard & {
  getTracker(req: Request): Promise<string>;
};

type ThrottlerExceptionWithTracker = ThrottlerException & { tracker?: string };

function createMockRequest(overrides?: {
  user?: { userId: string };
  ip?: string;
  path?: string;
  body?: unknown;
}) {
  return {
    user: overrides?.user ?? null,
    ip: overrides?.ip ?? '192.168.1.100',
    path: overrides?.path ?? '/api/test',
    body: overrides?.body ?? {},
  };
}

describe('CustomThrottlerGuard', () => {
  let guard: CustomThrottlerGuard;
  let guardWithProtected: GuardWithProtectedMethods;

  const mockThrottlerOptions = { throttlers: [] };
  const mockThrottlerStorage = {} as ThrottlerStorage;
  const mockReflector = {} as Reflector;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: CustomThrottlerGuard,
          useFactory: () =>
            new CustomThrottlerGuard(mockThrottlerOptions, mockThrottlerStorage, mockReflector),
        },
      ],
    }).compile();

    guard = module.get<CustomThrottlerGuard>(CustomThrottlerGuard);
    guardWithProtected = guard as GuardWithProtectedMethods;
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('getTracker', () => {
    it('should return user-based tracker when user is authenticated', async () => {
      const req = createMockRequest({ user: { userId: 'user-abc-123' } }) as Request;

      const tracker = await guardWithProtected.getTracker(req);

      expect(tracker).toBe('user:user-abc-123');
    });

    it('should return ip-email tracker for login requests with valid email', async () => {
      const req = createMockRequest({
        path: '/auth/login',
        ip: '10.0.0.5',
        body: { email: 'Test@Example.com', password: 'secret' },
      }) as Request;

      const tracker = await guardWithProtected.getTracker(req);

      // Email should be lowercased
      expect(tracker).toBe('ip-email:10.0.0.5:test@example.com');
    });

    it('should return ip-only tracker for login requests with invalid body', async () => {
      const req = createMockRequest({
        path: '/auth/login',
        ip: '10.0.0.6',
        body: { username: 'test' }, // no email field
      }) as Request;

      const tracker = await guardWithProtected.getTracker(req);

      expect(tracker).toBe('ip:10.0.0.6');
    });

    it('should return ip-only tracker for non-login requests', async () => {
      const req = createMockRequest({
        path: '/api/users',
        ip: '172.16.0.1',
        body: { email: 'test@example.com' }, // even with email in body
      }) as Request;

      const tracker = await guardWithProtected.getTracker(req);

      expect(tracker).toBe('ip:172.16.0.1');
    });

    it('should return "ip:unknown" when IP is missing', async () => {
      const req = createMockRequest() as Request;
      const reqWithMissingIp = { ...req, ip: undefined } as Request;

      const tracker = await guardWithProtected.getTracker(reqWithMissingIp);

      expect(tracker).toBe('ip:unknown');
    });
  });

  describe('isLoginBody validation', () => {
    it('should reject null body', async () => {
      const req = createMockRequest({ path: '/auth/login', body: null }) as Request;

      const tracker = await guardWithProtected.getTracker(req);

      expect(tracker).toBe('ip:192.168.1.100'); // falls back to IP
    });

    it('should reject body without email field', async () => {
      const req = createMockRequest({
        path: '/auth/login',
        body: { password: 'secret' },
      }) as Request;

      const tracker = await guardWithProtected.getTracker(req);

      expect(tracker).toBe('ip:192.168.1.100');
    });

    it('should reject body where email is not a string', async () => {
      const req = createMockRequest({ path: '/auth/login', body: { email: 12345 } }) as Request;

      const tracker = await guardWithProtected.getTracker(req);

      expect(tracker).toBe('ip:192.168.1.100');
    });

    it('should reject empty string email', async () => {
      const req = createMockRequest({ path: '/auth/login', body: { email: '' } }) as Request;

      const tracker = await guardWithProtected.getTracker(req);

      expect(tracker).toBe('ip:192.168.1.100');
    });

    it('should reject email longer than 255 characters', async () => {
      const longEmail = 'a'.repeat(256) + '@example.com';
      const req = createMockRequest({ path: '/auth/login', body: { email: longEmail } }) as Request;

      const tracker = await guardWithProtected.getTracker(req);

      expect(tracker).toBe('ip:192.168.1.100');
    });

    it('should accept valid email at boundary (254 chars)', async () => {
      const validEmail = 'a'.repeat(242) + '@example.com'; // 254 chars total
      const req = createMockRequest({
        path: '/auth/login',
        ip: '10.0.0.7',
        body: { email: validEmail },
      }) as Request;

      const tracker = await guardWithProtected.getTracker(req);

      expect(tracker).toBe(`ip-email:10.0.0.7:${validEmail.toLowerCase()}`);
    });
  });

  describe('maskTracker (via canActivate error enrichment)', () => {
    it('should mask user tracker to show only last 4 chars', async () => {
      expect.assertions(1);

      const context = {
        switchToHttp: () => ({
          getRequest: () => createMockRequest({ user: { userId: 'user-abc-123456' } }),
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as ExecutionContext;

      vi.spyOn(ThrottlerGuard.prototype, 'canActivate').mockRejectedValue(new ThrottlerException());

      try {
        await guard.canActivate(context);
      } catch (error) {
        expect((error as ThrottlerExceptionWithTracker).tracker).toBe('user:***3456');
      }
    });

    it('should mask ip-email tracker with anonymized IP and email', async () => {
      expect.assertions(1);

      const context = {
        switchToHttp: () => ({
          getRequest: () =>
            createMockRequest({
              path: '/auth/login',
              ip: '192.168.1.100',
              body: { email: 'john.doe@example.com' },
            }),
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as ExecutionContext;

      vi.spyOn(ThrottlerGuard.prototype, 'canActivate').mockRejectedValue(new ThrottlerException());

      try {
        await guard.canActivate(context);
      } catch (error) {
        // anonymizeIp(192.168.1.100) → 192.168.1.0
        // anonymizeEmail(john.doe@example.com) → jo***e@example.com
        expect((error as ThrottlerExceptionWithTracker).tracker).toBe(
          'ip-email:192.168.1.0:jo***e@example.com',
        );
      }
    });

    it('should mask ip-only tracker with anonymized IP', async () => {
      expect.assertions(1);

      const context = {
        switchToHttp: () => ({
          getRequest: () => createMockRequest({ ip: '203.0.113.45' }),
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as ExecutionContext;

      vi.spyOn(ThrottlerGuard.prototype, 'canActivate').mockRejectedValue(new ThrottlerException());

      try {
        await guard.canActivate(context);
      } catch (error) {
        // anonymizeIp(203.0.113.45) → 203.0.113.0
        expect((error as ThrottlerExceptionWithTracker).tracker).toBe('ip:203.0.113.0');
      }
    });
  });

  describe('canActivate', () => {
    it('should allow request when parent canActivate returns true', async () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => createMockRequest(),
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as ExecutionContext;

      vi.spyOn(ThrottlerGuard.prototype, 'canActivate').mockResolvedValue(true);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should rethrow non-ThrottlerException errors without modification', async () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => createMockRequest(),
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as ExecutionContext;

      const customError = new Error('Database failure');
      vi.spyOn(ThrottlerGuard.prototype, 'canActivate').mockRejectedValue(customError);

      await expect(guard.canActivate(context)).rejects.toThrow('Database failure');
    });
  });
});
