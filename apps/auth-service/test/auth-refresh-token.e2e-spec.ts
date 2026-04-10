import { HttpStatus } from '@nestjs/common';

import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  createAuthenticatedUser,
  registerVerifyAndLoginUser,
  waitForGracePeriod,
} from './fixtures/auth.fixtures';
import { createIntegrationContext, IntegrationTestContext } from './helpers/setup.helpers';

describe('Auth Refresh Token (e2e)', () => {
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

  describe('Auth Service - /refresh-token (POST)', () => {
    describe('Success cases', () => {
      it('/refresh-token (POST) - should successfully refresh tokens with valid refresh token and prevent reuse', async () => {
        const { access_token: originalAccess, refresh_token: originalRefresh } =
          await createAuthenticatedUser(ctx);

        const { body } = await ctx.authHelpers.refreshToken(originalRefresh);

        expect(body).toMatchObject({
          access_token: expect.any(String) as string,
          refresh_token: expect.any(String) as string,
          token_type: 'Bearer',
          expires_in: ctx.accessTokenExpires,
          user: {
            id: expect.any(String) as string,
            role: expect.any(Number) as number,
          },
        });

        expect(body.access_token).not.toBe(originalAccess);
        expect(body.refresh_token).not.toBe(originalRefresh);
      });

      it('should successfully refresh multiple times (token rotation)', async () => {
        const initial = await createAuthenticatedUser(ctx);

        const { body: refresh1 } = await ctx.authHelpers.refreshToken(initial.refresh_token);
        const { body: refresh2 } = await ctx.authHelpers.refreshToken(refresh1.refresh_token);
        const { body: refresh3 } = await ctx.authHelpers.refreshToken(refresh2.refresh_token);

        expect(refresh1.refresh_token).not.toBe(initial.refresh_token);
        expect(refresh2.refresh_token).not.toBe(refresh1.refresh_token);
        expect(refresh3.refresh_token).not.toBe(refresh2.refresh_token);
      });
    });

    describe('Invalid Token Cases', () => {
      it('should reject malformed refresh token', async () => {
        const { body } = await ctx.authHelpers.refreshToken(
          'not-a-refresh-token',
          HttpStatus.UNAUTHORIZED,
        );

        expect(body).toMatchObject({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: expect.any(String) as string,
          error: expect.any(String) as string,
        });
      });

      it('should reject refresh token with invalid signature', async () => {
        const { refresh_token } = await createAuthenticatedUser(ctx);
        const tamperedToken = ctx.authHelpers.tamperWithToken(refresh_token);

        const { body } = await ctx.authHelpers.refreshToken(tamperedToken, HttpStatus.UNAUTHORIZED);
        expect(body).toMatchObject({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Unauthorized',
          error: 'UNAUTHORIZED',
        });
      });

      it('should reject refresh token that does not exist in database', async () => {
        const { refresh_token } = await createAuthenticatedUser(ctx);
        await ctx.prisma.refreshToken.deleteMany();

        const { body } = await ctx.authHelpers.refreshToken(refresh_token, HttpStatus.UNAUTHORIZED);
        expect(body).toMatchObject({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Access Denied',
          error: 'INVALID_SESSION',
        });
      });
    });

    describe('Token Reuse Detection', () => {
      it('should detect token reuse attack and revoke entire family', async () => {
        const { refresh_token } = await createAuthenticatedUser(ctx);

        // First refresh: token rotates
        const { body: refresh1 } = await ctx.authHelpers.refreshToken(refresh_token);

        // Try to reuse OLD token (outside grace period)
        await waitForGracePeriod(ctx);
        const { body: reuseResponse } = await ctx.authHelpers.refreshToken(
          refresh_token,
          HttpStatus.UNAUTHORIZED,
        );

        expect(reuseResponse).toMatchObject({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Session expired',
          error: 'SESSION_EXPIRED',
        });

        // NEW token should also be revoked (entire family killed)
        const { body: newTokenResponse } = await ctx.authHelpers.refreshToken(
          refresh1.refresh_token,
          HttpStatus.UNAUTHORIZED,
        );
        expect(newTokenResponse).toMatchObject({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Session expired',
          error: 'SESSION_EXPIRED',
        });

        // Verify all tokens in family are revoked
        const revokedTokens = await ctx.prisma.refreshToken.findMany({
          where: { userId: refresh1.user.id },
        });
        expect(revokedTokens.every((t) => t.isRevoked)).toBe(true);
      });

      it('should handle token reuse after multiple rotations', async () => {
        const { refresh_token } = await createAuthenticatedUser(ctx);

        // Rotate twice
        const { body: refresh1 } = await ctx.authHelpers.refreshToken(refresh_token);
        const { body: refresh2 } = await ctx.authHelpers.refreshToken(refresh1.refresh_token);

        await waitForGracePeriod(ctx);

        // Try to reuse the FIRST token (2 rotations ago)
        const { body: reuseResponse } = await ctx.authHelpers.refreshToken(
          refresh_token,
          HttpStatus.UNAUTHORIZED,
        );
        expect(reuseResponse).toMatchObject({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Session expired',
          error: 'SESSION_EXPIRED',
        });

        // All tokens should be revoked
        const { body: response1 } = await ctx.authHelpers.refreshToken(
          refresh1.refresh_token,
          HttpStatus.UNAUTHORIZED,
        );
        const { body: response2 } = await ctx.authHelpers.refreshToken(
          refresh2.refresh_token,
          HttpStatus.UNAUTHORIZED,
        );
        expect(response1).toMatchObject({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Session expired',
          error: 'SESSION_EXPIRED',
        });
        expect(response2).toMatchObject({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Session expired',
          error: 'SESSION_EXPIRED',
        });
      });
    });

    describe('Race Condition Handling', () => {
      it('should handle concurrent refresh requests (within grace period)', async () => {
        const { refresh_token } = await createAuthenticatedUser(ctx);

        // Send two refresh requests nearly simultaneously
        const [{ body: response1 }, { body: response2 }] = await Promise.all([
          ctx.authHelpers.refreshToken(refresh_token),
          ctx.authHelpers.refreshToken(refresh_token),
        ]);

        // Both should succeed (race condition handling)
        expect(response1).toMatchObject({
          access_token: expect.any(String) as string,
          refresh_token: expect.any(String) as string,
          token_type: 'Bearer',
          expires_in: ctx.accessTokenExpires,
          user: {
            id: expect.any(String) as string,
            role: expect.any(Number) as number,
          },
        });
        expect(response2).toMatchObject({
          access_token: expect.any(String) as string,
          refresh_token: expect.any(String) as string,
          token_type: 'Bearer',
          expires_in: ctx.accessTokenExpires,
          user: {
            id: expect.any(String) as string,
            role: expect.any(Number) as number,
          },
        });
      });

      it('should return latest token when old token used within grace period', async () => {
        const { refresh_token } = await createAuthenticatedUser(ctx);

        // First refresh
        const { body: refresh1 } = await ctx.authHelpers.refreshToken(refresh_token);

        // Immediately try to use old token (within grace period)
        const { body: raceResponse } = await ctx.authHelpers.refreshToken(refresh_token);

        expect(raceResponse).toMatchObject({
          access_token: expect.any(String) as string,
          refresh_token: expect.any(String) as string,
          token_type: 'Bearer',
          expires_in: ctx.accessTokenExpires,
          user: {
            id: expect.any(String) as string,
            role: expect.any(Number) as number,
          },
        });

        // Access Tokens should be different
        expect(raceResponse.access_token).not.toBe(refresh1.access_token);

        // Refresh Tokens should have same jti and family
        const payload1 = ctx.authHelpers.jwtDecode(refresh1.refresh_token);
        const payloadRace = ctx.authHelpers.jwtDecode(raceResponse.refresh_token);
        expect(payloadRace.jti).toBe(payload1.jti);
        expect(payloadRace.family).toBe(payload1.family);
      });
    });

    describe('Token Expiration', () => {
      it('should reject expired refresh token', async () => {
        const { refresh_token } = await createAuthenticatedUser(ctx);

        await ctx.prisma.refreshToken.updateMany({
          data: { expiresAt: new Date(Date.now() - 1000) },
        });

        const { body: response } = await ctx.authHelpers.refreshToken(
          refresh_token,
          HttpStatus.UNAUTHORIZED,
        );
        expect(response).toMatchObject({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Session expired',
          error: 'SESSION_EXPIRED',
        });
      });
    });

    describe('Token Ownership/Family Mismatch', () => {
      it('should detect token ownership mismatch', async () => {
        const user1Credentials = {
          email: 'user1@test.com',
          password: 'validPassword123',
        };
        const user2Credentials = {
          email: 'user2@test.com',
          password: 'validPassword456',
        };

        const { body: user1Login } = await registerVerifyAndLoginUser(ctx, user1Credentials);
        const { body: user2Login } = await registerVerifyAndLoginUser(ctx, user2Credentials);

        const user1Token = await ctx.prisma.refreshToken.findFirstOrThrow({
          where: { userId: user1Login.user.id },
        });

        await ctx.prisma.refreshToken.update({
          where: { id: user1Token.id },
          data: { userId: user2Login.user.id },
        });

        const { body } = await ctx.authHelpers.refreshToken(
          user1Login.refresh_token,
          HttpStatus.UNAUTHORIZED,
        );
        expect(body).toMatchObject({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Access Denied',
          error: 'INVALID_SESSION',
        });
      });

      it('should detect token family mismatch', async () => {
        const user1Credentials = {
          email: 'user1@test.com',
          password: 'validPassword123',
        };
        const user2Credentials = {
          email: 'user2@test.com',
          password: 'validPassword456',
        };

        const { body: user1Login } = await registerVerifyAndLoginUser(ctx, user1Credentials);
        const { body: user2Login } = await registerVerifyAndLoginUser(ctx, user2Credentials);

        const user2Token = await ctx.prisma.refreshToken.findFirstOrThrow({
          where: { userId: user2Login.user.id },
        });

        await ctx.prisma.refreshToken.updateMany({
          where: { userId: user1Login.user.id },
          data: { family: user2Token.family },
        });

        const { body } = await ctx.authHelpers.refreshToken(
          user1Login.refresh_token,
          HttpStatus.UNAUTHORIZED,
        );
        expect(body).toMatchObject({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Access Denied',
          error: 'INVALID_SESSION',
        });
      });
    });
  });

  describe('Auth Service - /logout (DELETE)', () => {
    it('should reject refresh after manual logout, within grace period', async () => {
      const { body } = await registerVerifyAndLoginUser(ctx);

      await ctx.authHelpers.logoutUser(body.refresh_token);

      const { body: response } = await ctx.authHelpers.refreshToken(
        body.refresh_token,
        HttpStatus.UNAUTHORIZED,
      );
      expect(response).toMatchObject({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Session expired',
        error: 'SESSION_EXPIRED',
      });
    });

    it('should reject refresh after manual logout, after grace period', async () => {
      const { body } = await registerVerifyAndLoginUser(ctx);

      await ctx.authHelpers.logoutUser(body.refresh_token);

      await waitForGracePeriod(ctx);
      const { body: response } = await ctx.authHelpers.refreshToken(
        body.refresh_token,
        HttpStatus.UNAUTHORIZED,
      );
      expect(response).toMatchObject({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Session expired',
        error: 'SESSION_EXPIRED',
      });
    });

    it('should allow different devices after single device logout', async () => {
      const { body: device1 } = await registerVerifyAndLoginUser(ctx);
      const { body: device2 } = await ctx.authHelpers.loginUser();

      await ctx.authHelpers.logoutUser(device1.refresh_token);
      await ctx.authHelpers.refreshToken(device1.refresh_token, HttpStatus.UNAUTHORIZED);

      const { body: device2Refresh } = await ctx.authHelpers.refreshToken(device2.refresh_token);
      expect(device2Refresh).toMatchObject({
        access_token: expect.any(String) as string,
        refresh_token: expect.any(String) as string,
        token_type: 'Bearer',
        expires_in: ctx.accessTokenExpires,
        user: {
          id: expect.any(String) as string,
          role: expect.any(Number) as number,
        },
      });
    });
  });

  describe('Auth Service - /logout-all (DELETE)', () => {
    it('should revoke all refresh tokens across all devices', async () => {
      const { body: user } = await registerVerifyAndLoginUser(ctx);
      const { body: device1 } = await ctx.authHelpers.loginUser();
      const { body: device2 } = await ctx.authHelpers.loginUser();

      await ctx.authHelpers.logoutAllDevices(user.access_token);

      await ctx.authHelpers.refreshToken(user.refresh_token, HttpStatus.UNAUTHORIZED);
      await ctx.authHelpers.refreshToken(device1.refresh_token, HttpStatus.UNAUTHORIZED);
      await ctx.authHelpers.refreshToken(device2.refresh_token, HttpStatus.UNAUTHORIZED);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing Authorization header', async () => {
      const response = await request(ctx.app.getHttpServer())
        .post('/auth/refresh-token')
        .set('x-bff-secret', ctx.bffSecret)
        .expect(HttpStatus.UNAUTHORIZED);
      expect(response.body).toMatchObject({
        error: 'UNAUTHORIZED',
        message: 'Unauthorized',
      });
    });

    it('should handle malformed Authorization header', async () => {
      const response = await request(ctx.app.getHttpServer())
        .post('/auth/refresh-token')
        .set('Authorization', 'InvalidFormat')
        .set('x-bff-secret', ctx.bffSecret)
        .expect(HttpStatus.UNAUTHORIZED);
      expect(response.body).toMatchObject({
        error: 'UNAUTHORIZED',
        message: 'Unauthorized',
      });
    });

    it('should reject request with missing x-bff-secret header', async () => {
      const { body } = await registerVerifyAndLoginUser(ctx);
      const response = await request(ctx.app.getHttpServer())
        .post('/auth/refresh-token')
        .set('Authorization', `Bearer ${body.refresh_token}`)
        .expect(HttpStatus.UNAUTHORIZED);
      expect(response.body).toMatchObject({
        error: 'UNAUTHORIZED',
        message: 'Unauthorized',
      });
    });

    it('should reject request with invalid x-bff-secret header', async () => {
      const { body } = await registerVerifyAndLoginUser(ctx);
      const response = await request(ctx.app.getHttpServer())
        .post('/auth/refresh-token')
        .set('Authorization', `Bearer ${body.refresh_token}`)
        .set('x-bff-secret', 'invalid-secret')
        .expect(HttpStatus.UNAUTHORIZED);
      expect(response.body).toMatchObject({
        error: 'UNAUTHORIZED',
        message: 'Unauthorized',
      });
    });

    it('should not accept an access token when a refresh token is needed', async () => {
      const { body } = await registerVerifyAndLoginUser(ctx);
      const response = await ctx.authHelpers.refreshToken(
        body.access_token,
        HttpStatus.UNAUTHORIZED,
      );

      expect(response.body).toMatchObject({
        statusCode: HttpStatus.UNAUTHORIZED,
        error: 'INVALID_SESSION',
        message: 'Access Denied',
      });
    });

    it('should not accept a refresh token when an access token is needed', async () => {
      const { body } = await registerVerifyAndLoginUser(ctx);
      const response = await request(ctx.app.getHttpServer())
        .delete('/auth/logout-all')
        .set('Authorization', `Bearer ${body.refresh_token}`)
        .set('x-bff-secret', ctx.bffSecret)
        .expect(HttpStatus.UNAUTHORIZED);
      expect(response.body).toMatchObject({
        error: 'INVALID_SESSION',
        message: 'Access Denied',
      });
    });
  });
});
