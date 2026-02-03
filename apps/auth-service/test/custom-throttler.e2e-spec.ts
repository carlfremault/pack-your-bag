import { HttpStatus } from '@nestjs/common';

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { THROTTLE_LIMITS } from '@/common/constants/auth.constants';
import { AuditEventType, AuditSeverity } from '@/generated/prisma';

import { createIntegrationContext, IntegrationTestContext } from './helpers/setup.helpers';

describe('Custom Throttler Log (e2e)', () => {
  let ctx: IntegrationTestContext;

  beforeAll(async () => {
    ctx = await createIntegrationContext();
  });

  beforeEach(async () => {
    await ctx.resetDb();
  });

  afterAll(async () => {
    await ctx?.close();
  });

  afterEach(() => {
    // We need to reset the throttle storage after each test
    // Accessing internal ThrottlerStorage structure - may break if library internals change
    const internalStorage = ctx.storage as unknown as Record<string, Map<string, number>>;
    if (internalStorage.storage instanceof Map) {
      internalStorage.storage.clear();
    } else {
      console.warn('ThrottlerStorage internal structure changed - throttle reset skipped');
    }
  });

  describe('Auth Service - Custom Throttler', () => {
    it('should trigger custom throttler guard and create an audit log entry - ip based tracking', async () => {
      for (let i = 0; i < THROTTLE_LIMITS.REGISTER; i++) {
        await ctx.authHelpers.registerUser({
          payload: {
            email: `testemail${i}@test.com`,
            password: 'validPassword123',
          },
          headers: { 'x-force-throttling': 'true' },
        });
      }
      await ctx.authHelpers.registerUser({
        payload: ctx.authHelpers.defaultUser,
        expectedStatus: HttpStatus.TOO_MANY_REQUESTS,
        headers: { 'x-force-throttling': 'true' },
      });

      const auditLogEntry = await ctx.authHelpers.waitForMostRecentLog({
        eventType: AuditEventType.SECURITY_RATE_LIMIT_EXCEEDED,
      });

      expect(auditLogEntry).toMatchObject({
        severity: AuditSeverity.WARN,
        ipAddress: expect.any(String) as string,
        path: '/auth/register',
        method: 'POST',
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
      });

      expect(auditLogEntry.metadata).toBeTruthy();
      const metadata = auditLogEntry.metadata as Record<string, unknown>;
      expect(metadata.tracker).toContain('ip:');
    });

    it('should trigger custom throttler guard and create an audit log entry - email based tracking', async () => {
      await ctx.authHelpers.registerUser({ headers: { 'x-force-throttling': 'true' } });
      for (let i = 0; i < THROTTLE_LIMITS.LOGIN; i++) {
        await ctx.authHelpers.loginUser({ headers: { 'x-force-throttling': 'true' } });
      }
      await ctx.authHelpers.loginUser({
        expectedStatus: HttpStatus.TOO_MANY_REQUESTS,
        headers: { 'x-force-throttling': 'true' },
      });

      const auditLogEntry = await ctx.authHelpers.waitForMostRecentLog({
        eventType: AuditEventType.SECURITY_RATE_LIMIT_EXCEEDED,
      });

      expect(auditLogEntry).toMatchObject({
        severity: AuditSeverity.WARN,
        ipAddress: expect.any(String) as string,
        path: '/auth/login',
        method: 'POST',
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
      });

      expect(auditLogEntry.metadata).toBeTruthy();
      const metadata = auditLogEntry.metadata as Record<string, unknown>;
      expect(metadata.tracker).toContain('ip-email:');
    });

    it('should trigger custom throttler guard and create an audit log entry - userId based tracking', async () => {
      const { body } = await ctx.authHelpers.registerUser({
        headers: { 'x-force-throttling': 'true' },
      });
      await ctx.authHelpers.updatePassword({
        token: body.access_token,
        payload: {
          currentPassword: 'validPassword123',
          newPassword: 'validPassword456',
        },
        headers: { 'x-force-throttling': 'true' },
      });
      await ctx.authHelpers.updatePassword({
        token: body.access_token,
        payload: {
          currentPassword: 'validPassword456',
          newPassword: 'validPassword789',
        },
        headers: { 'x-force-throttling': 'true' },
      });
      await ctx.authHelpers.updatePassword({
        token: body.access_token,
        payload: {
          currentPassword: 'validPassword789',
          newPassword: 'validPassword123',
        },
        headers: { 'x-force-throttling': 'true' },
      });
      await ctx.authHelpers.updatePassword({
        token: body.access_token,
        payload: { currentPassword: 'validPassword123', newPassword: 'validPassword456' },
        expectedStatus: HttpStatus.TOO_MANY_REQUESTS,
        headers: { 'x-force-throttling': 'true' },
      });

      const auditLogEntry = await ctx.authHelpers.waitForMostRecentLog({
        eventType: AuditEventType.SECURITY_RATE_LIMIT_EXCEEDED,
      });

      expect(auditLogEntry).toMatchObject({
        severity: AuditSeverity.WARN,
        ipAddress: expect.any(String) as string,
        path: '/auth/update-password',
        method: 'PATCH',
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
      });

      expect(auditLogEntry.metadata).toBeTruthy();
      const metadata = auditLogEntry.metadata as Record<string, unknown>;
      expect(metadata.tracker).toContain('user:');
    });
  });
});
