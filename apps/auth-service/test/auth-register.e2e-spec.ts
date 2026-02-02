import { HttpStatus } from '@nestjs/common';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createIntegrationContext, IntegrationTestContext } from './helpers/setup.helpers';

describe('Auth Register (e2e)', () => {
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

  describe('Auth Service - /register (POST)', () => {
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
          condition: 'short password',
          payload: { email: 'testemail@test.com', password: 'short' },
        },
        {
          condition: 'unsafe password',
          payload: { email: 'testemail@test.com', password: 'unsafepassword' },
        },
        {
          condition: 'invalid email format',
          payload: { email: 'invalidemail', password: 'validPassword123' },
        },
      ])('should return HttpStatus.BAD_REQUEST(400) when $condition', async ({ payload }) => {
        const { body } = await ctx.authHelpers.registerUser({
          payload,
          expectedStatus: HttpStatus.BAD_REQUEST,
        });
        expect(body).toMatchObject({
          error: 'Bad Request',
        });
      });
    });

    it('should register a new user and return a pair of tokens', async () => {
      const { body } = await ctx.authHelpers.registerUser({ payload: ctx.authHelpers.defaultUser });

      expect(body).toMatchObject({
        access_token: expect.any(String) as string,
        refresh_token: expect.any(String) as string,
        token_type: 'Bearer',
        expires_in: ctx.configService.get<number>('AUTH_ACCESS_TOKEN_EXPIRATION_IN_SECONDS', 900),
      });
    });

    it('should not accept a duplicate email', async () => {
      await ctx.authHelpers.registerUser({ payload: ctx.authHelpers.defaultUser });
      const response = await ctx.authHelpers.registerUser({
        payload: ctx.authHelpers.defaultUser,
        expectedStatus: HttpStatus.CONFLICT,
      });
      expect(response.body).toMatchObject({
        error: 'Conflict',
        message: 'Email already exists.',
      });
    });

    it('should not accept a duplicate email with different casing', async () => {
      await ctx.authHelpers.registerUser({ payload: ctx.authHelpers.defaultUser });
      const uppercaseDto = {
        ...ctx.authHelpers.defaultUser,
        email: ctx.authHelpers.defaultUser.email.toUpperCase(),
      };
      const { body } = await ctx.authHelpers.registerUser({
        payload: uppercaseDto,
        expectedStatus: HttpStatus.CONFLICT,
      });
      expect(body).toMatchObject({
        error: 'Conflict',
        message: 'Email already exists.',
      });
    });
  });
});
