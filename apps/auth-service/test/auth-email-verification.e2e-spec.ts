import { HttpStatus } from '@nestjs/common';

import { TokenType } from '@repo/db';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { getMailpitMessage, getMailpitMessages } from './fixtures/auth.fixtures';
import { createIntegrationContext, IntegrationTestContext } from './helpers/setup.helpers';

describe('Email Verification Flow (e2e)', () => {
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

  const extractVerificationTokenFromMail = async (email: string): Promise<string> => {
    const messages = await getMailpitMessages(ctx);
    const summary = messages.find(
      (message) =>
        message.To[0]?.Address === email && message.Subject === 'Account Verification Request',
    );
    if (!summary) {
      throw new Error('Verification email not found');
    }

    const fullMessage = await getMailpitMessage(ctx, summary.ID);
    const body = fullMessage.HTML || fullMessage.Text || '';
    const match = body.match(/token=([^"&\s>]+)/);
    const token = match?.[1] ? decodeURIComponent(match[1]) : null;
    if (!token) {
      throw new Error('Could not extract verification token from email');
    }
    return token;
  };

  describe('POST /auth/verify-email', () => {
    it('should verify email with a valid token and allow login afterwards', async () => {
      await ctx.authHelpers.registerUser();
      await ctx.authHelpers.sleep(200);

      const token = await extractVerificationTokenFromMail(ctx.authHelpers.defaultUser.email);
      await ctx.authHelpers.verifyEmail({ token });

      const user = await ctx.prisma.user.findUniqueOrThrow({
        where: { email: ctx.authHelpers.defaultUser.email },
      });
      expect(user.isEmailVerified).toBe(true);
      expect(user.emailVerifiedAt).toBeTruthy();

      const storedToken = await ctx.prisma.verificationToken.findUnique({
        where: {
          userId_type: {
            userId: user.id,
            type: TokenType.EMAIL_VERIFICATION,
          },
        },
      });
      expect(storedToken).not.toBeNull();
      expect(storedToken!.used).toBe(true);

      const { body } = await ctx.authHelpers.loginUser();
      expect(body).toMatchObject({
        access_token: expect.any(String) as string,
        refresh_token: expect.any(String) as string,
        token_type: 'Bearer',
        expires_in: ctx.accessTokenExpires,
      });
    });

    it('should reject invalid token', async () => {
      await ctx.authHelpers.verifyEmail({ token: 'invalid-token' }, HttpStatus.BAD_REQUEST);
    });

    it('should reject expired token', async () => {
      await ctx.authHelpers.registerUser();
      await ctx.authHelpers.sleep(100);
      const user = await ctx.prisma.user.findUniqueOrThrow({
        where: { email: ctx.authHelpers.defaultUser.email },
      });

      const token = await extractVerificationTokenFromMail(ctx.authHelpers.defaultUser.email);

      await ctx.prisma.verificationToken.update({
        where: {
          userId_type: {
            userId: user.id,
            type: TokenType.EMAIL_VERIFICATION,
          },
        },
        data: { expiresAt: new Date(Date.now() - 1000) },
      });

      await ctx.authHelpers.verifyEmail({ token }, HttpStatus.BAD_REQUEST);
    });

    it('should reject used token', async () => {
      await ctx.authHelpers.registerUser();
      await ctx.authHelpers.sleep(100);

      const token = await extractVerificationTokenFromMail(ctx.authHelpers.defaultUser.email);

      await ctx.authHelpers.verifyEmail({ token });
      await ctx.authHelpers.verifyEmail({ token }, HttpStatus.BAD_REQUEST);
    });
  });

  describe('POST /auth/resend-verification-email', () => {
    it('should resend verification email for unverified user', async () => {
      await ctx.authHelpers.registerUser();
      await ctx.authHelpers.sleep(100);

      await ctx.clearMailpit();

      await ctx.authHelpers.resendVerificationEmail({ email: ctx.authHelpers.defaultUser.email });
      await ctx.authHelpers.sleep(100);

      const messages = await getMailpitMessages(ctx);
      const email = messages.find(
        (message) =>
          message.To[0]?.Address === ctx.authHelpers.defaultUser.email &&
          message.Subject === 'Account Verification Request',
      );
      expect(email).toBeDefined();
    });

    it('should not resend verification email for already verified user', async () => {
      await ctx.authHelpers.registerUser();
      await ctx.authHelpers.sleep(100);
      await ctx.clearMailpit();

      await ctx.prisma.user.update({
        where: { email: ctx.authHelpers.defaultUser.email },
        data: { isEmailVerified: true, emailVerifiedAt: new Date() },
      });

      await ctx.authHelpers.resendVerificationEmail({ email: ctx.authHelpers.defaultUser.email });
      await ctx.authHelpers.sleep(100);

      const messages = await getMailpitMessages(ctx);
      expect(messages).toHaveLength(0);
    });

    it('should return no-content for non-existent user and not send email', async () => {
      await ctx.authHelpers.resendVerificationEmail({ email: 'non-existent-user@test.com' });
      await ctx.authHelpers.sleep(100);

      const messages = await getMailpitMessages(ctx);
      expect(messages).toHaveLength(0);
    });
  });
});
