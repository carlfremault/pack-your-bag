import { HttpStatus } from '@nestjs/common';

import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { registerVerifyAndLoginUser } from './fixtures/auth.fixtures';
import { createIntegrationContext, IntegrationTestContext } from './helpers/setup.helpers';

describe('Auth Update Password (e2e)', () => {
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

  describe('Auth Service - /update-password (PATCH)', () => {
    describe('should validate input data', () => {
      it.each([
        {
          condition: 'missing currentPassword',
          payload: { newPassword: 'validPassword456' },
        },
        {
          condition: 'missing newPassword',
          payload: { currentPassword: 'validPassword123' },
        },
        {
          condition: 'short newPassword',
          payload: { currentPassword: 'validPassword123', newPassword: 'short' },
        },
        {
          condition: 'unsafe newPassword',
          payload: { currentPassword: 'validPassword123', newPassword: 'unsafepassword' },
        },
      ])('should return BAD_REQUEST(400) when $condition', async ({ payload }) => {
        const { body: user } = await registerVerifyAndLoginUser(ctx);
        const { body } = await ctx.authHelpers.updatePassword({
          token: user.access_token,
          payload,
          expectedStatus: HttpStatus.BAD_REQUEST,
        });

        expect(body).toHaveProperty('message');
      });
    });

    it('should update password and return a new token pair - old token should be revoked', async () => {
      const { body: user } = await registerVerifyAndLoginUser(ctx);
      const { body } = await ctx.authHelpers.updatePassword({
        token: user.access_token,
        payload: {
          currentPassword: ctx.authHelpers.defaultUser.password,
          newPassword: 'newPassword123',
        },
      });

      expect(body).toMatchObject({
        access_token: expect.any(String) as string,
        refresh_token: expect.any(String) as string,
        token_type: 'Bearer',
        expires_in: ctx.accessTokenExpires,
      });

      expect(body.access_token).not.toBe(user.access_token);
      expect(body.refresh_token).not.toBe(user.refresh_token);

      await request(ctx.app.getHttpServer())
        .post('/auth/refresh-token')
        .set('Authorization', `Bearer ${user.refresh_token}`)
        .set('x-bff-secret', ctx.bffSecret)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should not update password with identical current and new password', async () => {
      const { body } = await registerVerifyAndLoginUser(ctx);
      const samePassword = ctx.authHelpers.defaultUser.password;
      const payload = { currentPassword: samePassword, newPassword: samePassword };
      const response = await ctx.authHelpers.updatePassword({
        token: body.access_token,
        payload,
        expectedStatus: HttpStatus.BAD_REQUEST,
      });
      expect(response.body).toHaveProperty('message');
    });

    it('should not update password with incorrect current password', async () => {
      const { body: user } = await registerVerifyAndLoginUser(ctx);
      const payload = { currentPassword: 'IncorrectPassword123', newPassword: 'newPassword123' };
      const { body } = await ctx.authHelpers.updatePassword({
        token: user.access_token,
        payload,
        expectedStatus: HttpStatus.BAD_REQUEST,
      });
      expect(body).toHaveProperty('message');
    });

    it('should not update password when user not found', async () => {
      const { body: user } = await registerVerifyAndLoginUser(ctx);
      await ctx.prisma.user.delete({ where: { email: ctx.authHelpers.defaultUser.email } });
      const payload = {
        currentPassword: ctx.authHelpers.defaultUser.password,
        newPassword: 'newPassword123',
      };
      const { body } = await ctx.authHelpers.updatePassword({
        token: user.access_token,
        payload,
        expectedStatus: HttpStatus.NOT_FOUND,
      });
      expect(body).toHaveProperty('message');
    });

    it('should allow login with updated password', async () => {
      const { body } = await registerVerifyAndLoginUser(ctx);
      const payload = {
        currentPassword: ctx.authHelpers.defaultUser.password,
        newPassword: 'newPassword123',
      };
      await ctx.authHelpers.updatePassword({ token: body.access_token, payload });
      await request(ctx.app.getHttpServer())
        .post('/auth/login')
        .set('x-bff-secret', ctx.bffSecret)
        .send({ email: ctx.authHelpers.defaultUser.email, password: 'newPassword123' })
        .expect(HttpStatus.OK);
    });
  });
});
