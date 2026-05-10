import { HttpStatus } from '@nestjs/common';

import { AuditEventType, AuditSeverity } from '@repo/db';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { AuthResponseDto } from '@/modules/auth/dto/auth-response.dto';

import { createAuthenticatedUser, waitForGracePeriod } from './fixtures/auth.fixtures';
import { createIntegrationContext, IntegrationTestContext } from './helpers/setup.helpers';

describe('Audit Log (e2e)', () => {
  let ctx: IntegrationTestContext;

  beforeAll(async () => {
    ctx = await createIntegrationContext();
  });

  beforeEach(async () => {
    await ctx.clearMailpit();
    await ctx.resetDb();
  });

  afterAll(async () => {
    await ctx?.close();
  });

  describe('Auth Service - Audit Log', () => {
    it('should create an audit log entry for a successful operation', async () => {
      const { user } = await createAuthenticatedUser(ctx);
      const log = await ctx.authHelpers.waitForMostRecentLog({
        userId: user.id,
        eventType: AuditEventType.USER_LOGIN_SUCCESS,
      });

      expect(log).toMatchObject({
        severity: AuditSeverity.INFO,
        userId: user.id,
        path: '/auth/login',
        method: 'POST',
        statusCode: HttpStatus.OK,
      });
    });

    it('should create an audit log entry for a failed operation', async () => {
      const { user, refresh_token } = await createAuthenticatedUser(ctx);
      const { jti, family } = ctx.authHelpers.jwtDecode(refresh_token);
      const { body } = (await ctx.authHelpers.refreshToken(refresh_token)) as {
        body: AuthResponseDto;
      };
      expect(body.access_token).toBeDefined();

      // Try to reuse OLD token (outside grace period)
      await waitForGracePeriod(ctx);
      await ctx.authHelpers.refreshToken(refresh_token, HttpStatus.UNAUTHORIZED);

      const log = await ctx.authHelpers.waitForMostRecentLog({
        userId: user.id,
        eventType: AuditEventType.TOKEN_REUSE_DETECTED,
      });

      expect(log).toMatchObject({
        severity: AuditSeverity.CRITICAL,
        userId: user.id,
        path: '/auth/refresh-token',
        method: 'POST',
        statusCode: HttpStatus.UNAUTHORIZED,
        metadata: {
          tokenId: jti,
          tokenFamily: family,
        },
      });
    });
  });
});
