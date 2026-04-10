import { HttpStatus } from '@nestjs/common';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createAndLoginUser, createAuthenticatedUser } from './fixtures/auth.fixtures';
import { createIntegrationContext, IntegrationTestContext } from './helpers/setup.helpers';

describe('Auth login (e2e)', () => {
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

  describe('Auth Service - /login (POST)', () => {
    describe('should validate input data', () => {
      it.each([
        {
          condition: 'missing password',
          payload: { email: 'testemail@test.com' },
        },
        {
          condition: 'missing email',
          payload: { password: 'validPassword123' },
        },
        {
          condition: 'invalid email format',
          payload: { email: 'invalidemail', password: 'validPassword123' },
        },
      ])('should return BAD_REQUEST(400) when $condition', async ({ payload }) => {
        const { body } = await ctx.authHelpers.loginUser({
          payload,
          expectedStatus: HttpStatus.BAD_REQUEST,
        });
        expect(body).toMatchObject({
          error: 'Bad Request',
        });
      });
    });

    it('should log in existing user with correct credentials and return token pair', async () => {
      const { body } = await createAndLoginUser(ctx);
      expect(body).toMatchObject({
        access_token: expect.any(String) as string,
        refresh_token: expect.any(String) as string,
        token_type: 'Bearer',
        expires_in: ctx.accessTokenExpires,
      });
    });

    it('should log in existing user with correct credentials and different email casing', async () => {
      await createAuthenticatedUser(ctx);
      const defaultUser = ctx.authHelpers.defaultUser;
      const { body } = await ctx.authHelpers.loginUser({
        payload: {
          email: defaultUser.email.toUpperCase(),
          password: defaultUser.password,
        },
      });

      expect(body).toMatchObject({
        access_token: expect.any(String) as string,
        refresh_token: expect.any(String) as string,
        token_type: 'Bearer',
        expires_in: ctx.accessTokenExpires,
      });
    });

    it('should not login with incorrect password', async () => {
      await createAuthenticatedUser(ctx);
      const defaultUser = ctx.authHelpers.defaultUser;
      const { body } = await ctx.authHelpers.loginUser({
        payload: {
          email: defaultUser.email,
          password: 'IncorrectPassword123',
        },
        expectedStatus: HttpStatus.UNAUTHORIZED,
      });

      expect(body).toMatchObject({
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
    });

    it('should not login non-existing user', async () => {
      const { body } = await ctx.authHelpers.loginUser({
        payload: ctx.authHelpers.defaultUser,
        expectedStatus: HttpStatus.UNAUTHORIZED,
      });

      expect(body).toMatchObject({
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
    });

    it('should reject login when email is not verified', async () => {
      await ctx.authHelpers.registerUser();
      const { body } = await ctx.authHelpers.loginUser({
        payload: ctx.authHelpers.defaultUser,
        expectedStatus: HttpStatus.FORBIDDEN,
      });

      expect(body).toMatchObject({
        error: 'EMAIL_NOT_VERIFIED',
        message: 'Email not verified',
      });
    });
  });
});
