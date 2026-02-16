import { HttpStatus } from '@nestjs/common';

import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { TokenType } from '@/generated/prisma';

import {
  createAndHardDeleteUser,
  createAuthenticatedUser,
  generateAndStoreVerificationToken,
  getMailpitMessage,
  getMailpitMessages,
} from './fixtures/auth.fixtures';
import { createIntegrationContext, IntegrationTestContext } from './helpers/setup.helpers';

describe('Password Reset Flow (E2E)', () => {
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

  describe('POST /auth/forgot-password', () => {
    it('should return 204 and trigger email for existing user', async () => {
      const { user } = await createAuthenticatedUser(ctx);

      await ctx.authHelpers.forgotPassword({ email: user.email });

      // Wait for async event processing
      await ctx.authHelpers.sleep(100);

      const token = await ctx.authHelpers.findPasswordResetTokenForUserId(user.id);

      expect(token).toMatchObject({
        token: expect.any(String) as string,
        type: TokenType.PASSWORD_RESET,
        userId: user.id,
        expiresAt: expect.toSatisfy((date: Date) => date.getTime() > Date.now()) as Date,
        used: false,
      });

      // Email should have been sent
      const messages = await getMailpitMessages(ctx);
      const email = messages.find((m) => m.To[0]?.Address === user.email);

      expect(email).toMatchObject({
        Subject: 'Password Reset Request',
      });
    });

    it('should return 204 for non-existent user without creating token', async () => {
      const { user: deletedUser } = await createAndHardDeleteUser(ctx);
      // Wait for async event processing
      await ctx.authHelpers.sleep(100);

      // Clear mailpit as a mail was sent for the account deletion
      await ctx.clearMailpit();

      const response = await ctx.authHelpers.forgotPassword({ email: deletedUser.email });

      // Wait for async event processing
      await ctx.authHelpers.sleep(100);

      expect(response.status).toBe(204);

      // No token should be created
      const token = await ctx.authHelpers.findPasswordResetTokenForUserId(deletedUser.id);

      expect(token).toBeNull();

      // Email should NOT have been sent
      const messages = await getMailpitMessages(ctx);

      expect(messages).toHaveLength(0);
    });

    it('should normalize email to lowercase', async () => {
      const userDto = { email: 'TESTEMAIL@Test.COM', password: 'validPassword123' };

      await ctx.authHelpers.registerUser({
        payload: userDto,
      });
      await ctx.authHelpers.forgotPassword({
        email: userDto.email,
      });

      // Wait for async event processing
      await ctx.authHelpers.sleep(100);

      const messages = await getMailpitMessages(ctx);
      const email = messages.find((m) => m.To[0]?.Address === userDto.email.toLowerCase());

      expect(email).toMatchObject({
        Subject: 'Password Reset Request',
      });
    });

    it('should validate email format', async () => {
      await ctx.authHelpers.forgotPassword({ email: 'invalid-email' }, HttpStatus.BAD_REQUEST);

      const messages = await getMailpitMessages(ctx);
      expect(messages).toHaveLength(0);
    });

    it('should require BFF secret header', async () => {
      const response = await request(ctx.app.getHttpServer()).post('/auth/forgot-password').send({
        email: 'testemail@test.com',
      });

      expect(response.status).toBe(401);
    });

    it('should replace existing token with new one', async () => {
      const { user } = await createAuthenticatedUser(ctx);

      // Create first token
      await ctx.authHelpers.forgotPassword({ email: user.email });
      await ctx.authHelpers.sleep(100);

      // Create second token
      await ctx.authHelpers.forgotPassword({ email: user.email });
      await ctx.authHelpers.sleep(100);

      // Should only have one token (upserted)
      const tokens = await ctx.prisma.verificationToken.findMany({
        where: {
          userId: user.id,
          type: TokenType.PASSWORD_RESET,
        },
      });

      expect(tokens).toHaveLength(1);
    });
  });

  describe('POST /auth/reset-password', () => {
    it('should reset password with valid token', async () => {
      const expiresAt = new Date(Date.now() + ctx.passwordResetTokenExpiresInMS);
      const { user, token } = await generateAndStoreVerificationToken({
        ctx,
        type: TokenType.PASSWORD_RESET,
        expiresAt,
      });

      // Reset password
      await ctx.authHelpers.resetPassword({
        token,
        password: 'newValidPassword123',
      });

      // Wait for async event processing
      await ctx.authHelpers.sleep(100);

      // Confirmation email should have been sent
      const messages = await getMailpitMessages(ctx);
      const email = messages.find((m) => m.To[0]?.Address === user.email);

      expect(email).toMatchObject({
        Subject: 'Password Reset Confirmation',
      });

      // Token should be marked as used
      const usedToken = await ctx.prisma.verificationToken.findUnique({
        where: {
          userId_type: {
            userId: user.id,
            type: TokenType.PASSWORD_RESET,
          },
        },
      });

      expect(usedToken).not.toBeNull();
      expect(usedToken!.used).toBe(true);
    });

    it('should reject expired token', async () => {
      const expiresAt = new Date(Date.now() - 1000); // Expired
      const { token } = await generateAndStoreVerificationToken({
        ctx,
        type: TokenType.PASSWORD_RESET,
        expiresAt,
      });

      // Reset password
      await ctx.authHelpers.resetPassword(
        {
          token,
          password: 'newValidPassword123',
        },
        HttpStatus.BAD_REQUEST,
      );

      // Wait for async event processing
      await ctx.authHelpers.sleep(100);

      // Confirmation email should not have been sent
      const messages = await getMailpitMessages(ctx);
      expect(messages).toHaveLength(0);
    });

    it('should reject invalid token', async () => {
      await ctx.authHelpers.resetPassword(
        {
          token: 'invalid-token',
          password: 'newValidPassword123',
        },
        HttpStatus.BAD_REQUEST,
      );
    });

    it('should reject used token', async () => {
      const expiresAt = new Date(Date.now() + ctx.passwordResetTokenExpiresInMS);
      const { user, token } = await generateAndStoreVerificationToken({
        ctx,
        type: TokenType.PASSWORD_RESET,
        expiresAt,
      });

      // Mark token as used
      await ctx.prisma.verificationToken.update({
        where: {
          userId_type: {
            userId: user.id,
            type: TokenType.PASSWORD_RESET,
          },
        },
        data: {
          used: true,
        },
      });

      await ctx.authHelpers.resetPassword(
        {
          token,
          password: 'newValidPassword123',
        },
        HttpStatus.BAD_REQUEST,
      );
    });

    it('should validate password strength', async () => {
      const expiresAt = new Date(Date.now() + ctx.passwordResetTokenExpiresInMS);
      const { token } = await generateAndStoreVerificationToken({
        ctx,
        type: TokenType.PASSWORD_RESET,
        expiresAt,
      });

      await ctx.authHelpers.resetPassword(
        {
          token,
          password: 'weakpassword',
        },
        HttpStatus.BAD_REQUEST,
      );
    });
  });

  describe('Full password reset flow', () => {
    it('should complete entire flow from request to confirmation', async () => {
      const { user } = await createAuthenticatedUser(ctx);

      // Request password reset
      await ctx.authHelpers.forgotPassword({ email: user.email });

      // Wait for async event processing
      await ctx.authHelpers.sleep(100);

      // Extract token from email
      const requestMessages = await getMailpitMessages(ctx);
      const summary = requestMessages.find(
        (m) => m.To[0]?.Address === user.email && m.Subject === 'Password Reset Request',
      );
      if (!summary) throw new Error('Email not found');

      const requestEmail = await getMailpitMessage(ctx, summary.ID);
      if (!requestEmail) throw new Error('Email not found');

      const body = requestEmail.HTML || requestEmail.Text || '';
      // Token is sent in url parameter, format .../reset-password?token=token
      const match = body.match(/token=([^"&\s>]+)/);
      const token = match ? match[1] : null;

      if (!token) {
        throw new Error('Could not extract token from email');
      }

      // Reset password with token
      await ctx.authHelpers.resetPassword({
        token,
        password: 'newValidPassword123',
      });

      // Wait for async event processing
      await ctx.authHelpers.sleep(100);

      const resetMessages = await getMailpitMessages(ctx);
      const resetEmail = resetMessages.find(
        (m) => m.To[0]?.Address === user.email && m.Subject === 'Password Reset Confirmation',
      );

      expect(resetEmail).toBeDefined();
    });
  });
});
