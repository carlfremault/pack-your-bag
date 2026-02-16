import { HttpStatus } from '@nestjs/common';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { MS_PER_DAY } from '@/common/constants/auth.constants';
import { AuditEventType, TokenType } from '@/generated/prisma';

import {
  createAndHardDeleteUser,
  createAuthenticatedUser,
  createExpiredSoftDeletedUser,
  createNotYetExpiredSoftDeletedUser,
  createUserWithMultipleTokens,
  generateAndStoreVerificationToken,
  generateVerificationTokenAndDeleteUser,
  getMailpitMessage,
  getMailpitMessages,
} from './fixtures/auth.fixtures';
import { createIntegrationContext, IntegrationTestContext } from './helpers/setup.helpers';

describe('User Deletion (e2e)', () => {
  let ctx: IntegrationTestContext;

  beforeAll(async () => {
    ctx = await createIntegrationContext();
  });

  beforeEach(async () => {
    await ctx.resetDb();
  });

  afterAll(async () => {
    await ctx?.close();
    await ctx?.clearMailpit();
  });

  describe('softDeleteUser', () => {
    it('should soft delete user, revoke all tokens, and send deletion confirmation email', async () => {
      const { user, access_token } = await createUserWithMultipleTokens(ctx);

      await ctx.authHelpers.deleteUser({
        token: access_token,
        password: ctx.authHelpers.defaultUser.password,
      });

      const deletedUser = await ctx.prisma.user.findUnique({ where: { id: user.id } });
      const tokens = await ctx.prisma.refreshToken.findMany({
        where: { userId: user.id, isRevoked: false },
      });

      expect(deletedUser?.isDeleted).toBe(true);
      expect(tokens).toHaveLength(0);

      // Wait for async event processing
      await ctx.authHelpers.sleep(100);

      // Email should have been sent
      const messages = await getMailpitMessages(ctx);
      const email = messages.find((m) => m.To[0]?.Address === user.email);

      expect(email).toMatchObject({
        Subject: 'Account Deletion Request',
      });
    });

    it('should prevent login after soft deletion', async () => {
      const { access_token } = await createAuthenticatedUser(ctx);

      await ctx.authHelpers.deleteUser({
        token: access_token,
        password: ctx.authHelpers.defaultUser.password,
      });

      await ctx.authHelpers.loginUser({ payload: undefined, expectedStatus: HttpStatus.FORBIDDEN });
    });

    it('should not soft delete a user that is already soft deleted', async () => {
      const { access_token } = await createAuthenticatedUser(ctx);

      await ctx.authHelpers.deleteUser({
        token: access_token,
        password: ctx.authHelpers.defaultUser.password,
      });
      const response = await ctx.authHelpers.deleteUser({
        token: access_token,
        password: ctx.authHelpers.defaultUser.password,
        expectedStatus: HttpStatus.FORBIDDEN,
      });

      expect(response.body).toMatchObject({
        error: 'ACCOUNT_DELETED',
        message:
          'Your account is scheduled for deletion in 30 days. To cancel and restore your account, click the link in the deletion confirmation email or contact support.',
      });
    });

    it('should not soft delete a user that does not exist', async () => {
      const { access_token } = await createAndHardDeleteUser(ctx);

      const response = await ctx.authHelpers.deleteUser({
        token: access_token,
        password: ctx.authHelpers.defaultUser.password,
        expectedStatus: HttpStatus.UNAUTHORIZED,
      });

      expect(response.body).toMatchObject({
        error: 'Unauthorized',
        message: 'Access Denied',
      });
    });

    it('should not soft delete with incorrect password', async () => {
      const { access_token } = await createAuthenticatedUser(ctx);

      const response = await ctx.authHelpers.deleteUser({
        token: access_token,
        password: 'wrongPassword123',
        expectedStatus: HttpStatus.UNAUTHORIZED,
      });

      expect(response.body).toMatchObject({
        error: 'Unauthorized',
        message: 'Invalid password',
      });
    });

    it('should not soft delete without password', async () => {
      const { access_token } = await createAuthenticatedUser(ctx);

      const response = await ctx.authHelpers.deleteUser({
        token: access_token,
        password: '',
        expectedStatus: HttpStatus.BAD_REQUEST,
      });

      expect(response.body).toMatchObject({
        error: 'Bad Request',
        message: ['password should not be empty'],
      });
    });

    it('should not allow registration of a user that is already soft deleted', async () => {
      const { access_token } = await createAuthenticatedUser(ctx);

      await ctx.authHelpers.deleteUser({
        token: access_token,
        password: ctx.authHelpers.defaultUser.password,
      });
      const response = await ctx.authHelpers.registerUser({
        payload: ctx.authHelpers.defaultUser,
        expectedStatus: HttpStatus.CONFLICT,
      });

      expect(response.body).toMatchObject({
        error: 'Conflict',
        message: 'Email already exists.',
      });
    });

    it('should create audit log entry for soft deletion', async () => {
      const { user, access_token } = await createAuthenticatedUser(ctx);

      await ctx.authHelpers.deleteUser({
        token: access_token,
        password: ctx.authHelpers.defaultUser.password,
      });
      const auditLogs = await ctx.authHelpers.waitForLogs({
        userId: user.id,
        eventType: AuditEventType.USER_DELETED,
      });

      expect(auditLogs.length).toBeGreaterThan(0);
    });
  });

  describe('cancelAccountDeletion', () => {
    it('should cancel account softDeletion with valid token', async () => {
      const expiresAt = new Date(Date.now() + ctx.userDeleteRetentionPeriod * MS_PER_DAY);
      const { user, token } = await generateAndStoreVerificationToken({
        ctx,
        type: TokenType.ACCOUNT_DELETION_CANCELLATION,
        expiresAt,
      });

      await ctx.prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });

      await ctx.authHelpers.cancelAccountDeletion({
        token,
        currentPassword: ctx.authHelpers.defaultUser.password,
        newPassword: 'newValidPassword456',
      });

      const updatedUser = await ctx.prisma.user.findUnique({ where: { id: user.id } });
      expect(updatedUser).not.toBeNull();
      expect(updatedUser?.isDeleted).toBe(false);
      expect(updatedUser?.deletedAt).toBeNull();
      const updatedToken = await ctx.prisma.verificationToken.findUnique({
        where: {
          userId_type: {
            userId: user.id,
            type: TokenType.ACCOUNT_DELETION_CANCELLATION,
          },
        },
      });
      expect(updatedToken).not.toBeNull();
      expect(updatedToken?.used).toBe(true);
    });

    it('should reject expired token', async () => {
      const expiresAt = new Date(Date.now() - 1000); // Expired
      const { token } = await generateAndStoreVerificationToken({
        ctx,
        type: TokenType.ACCOUNT_DELETION_CANCELLATION,
        expiresAt,
      });

      await ctx.authHelpers.cancelAccountDeletion(
        {
          token,
          currentPassword: ctx.authHelpers.defaultUser.password,
          newPassword: 'newValidPassword456',
        },
        HttpStatus.BAD_REQUEST,
      );
    });

    it('should reject invalid token', async () => {
      await ctx.authHelpers.cancelAccountDeletion(
        {
          token: 'invalid-token',
          currentPassword: ctx.authHelpers.defaultUser.password,
          newPassword: 'newValidPassword456',
        },
        HttpStatus.BAD_REQUEST,
      );
    });

    it('should reject used token', async () => {
      const { user, token } = await generateVerificationTokenAndDeleteUser(ctx);

      // Mark token as used
      await ctx.prisma.verificationToken.update({
        where: {
          userId_type: {
            userId: user.id,
            type: TokenType.ACCOUNT_DELETION_CANCELLATION,
          },
        },
        data: {
          used: true,
        },
      });

      await ctx.authHelpers.cancelAccountDeletion(
        {
          token,
          currentPassword: ctx.authHelpers.defaultUser.password,
          newPassword: 'newValidPassword456',
        },
        HttpStatus.BAD_REQUEST,
      );
    });

    it('should reject wrong current password', async () => {
      const { token } = await generateVerificationTokenAndDeleteUser(ctx);

      await ctx.authHelpers.cancelAccountDeletion(
        {
          token,
          currentPassword: 'invalid-password',
          newPassword: 'newValidPassword456',
        },
        HttpStatus.BAD_REQUEST,
      );
    });

    it('should reject invalid new password', async () => {
      const { token } = await generateVerificationTokenAndDeleteUser(ctx);

      await ctx.authHelpers.cancelAccountDeletion(
        {
          token,
          currentPassword: ctx.authHelpers.defaultUser.password,
          newPassword: 'invalidpassword',
        },
        HttpStatus.BAD_REQUEST,
      );
    });
  });

  describe('softDeletion and restoration - complete flow', () => {
    it('should be possible to cancel account soft deletion by using the token from the cancellation email', async () => {
      const { user } = await createNotYetExpiredSoftDeletedUser(ctx);

      // Wait for async event processing
      await ctx.authHelpers.sleep(100);

      // Extract token from email
      const requestMessages = await getMailpitMessages(ctx);
      const summary = requestMessages.find(
        (m) => m.To[0]?.Address === user.email && m.Subject === 'Account Deletion Request',
      );
      if (!summary) throw new Error('Email not found');

      const requestEmail = await getMailpitMessage(ctx, summary.ID);
      if (!requestEmail) throw new Error('Email not found');

      const body = requestEmail.HTML || requestEmail.Text || '';
      // Token is sent in url parameter, format .../cancel-deletion?token=token
      const match = body.match(/token=([^"&\s>]+)/);
      const token = match ? match[1] : null;

      if (!token) {
        throw new Error('Could not extract token from email');
      }

      // Cancel account deletion
      await ctx.authHelpers.cancelAccountDeletion({
        token,
        currentPassword: ctx.authHelpers.defaultUser.password,
        newPassword: 'newValidPassword456',
      });

      const updatedUser = await ctx.prisma.user.findUnique({ where: { id: user.id } });
      expect(updatedUser?.isDeleted).toBe(false);
      expect(updatedUser?.deletedAt).toBeNull();
    });
  });

  describe('hardDeleteUsers', () => {
    it('should hard delete user, delete all tokens, and anonymize audit logs', async () => {
      const { user } = await createExpiredSoftDeletedUser(ctx);
      await ctx.tasksService.cleanupDeletedUsers();

      const deletedUser = await ctx.prisma.user.findUnique({ where: { id: user.id } });
      const tokens = await ctx.prisma.refreshToken.findMany({ where: { userId: user.id } });
      const auditLogs = await ctx.prisma.auditLog.findMany({ where: { userId: user.id } });

      expect(deletedUser).toBeNull();
      expect(tokens.length).toBe(0);
      expect(auditLogs.length).toBe(0);
    });

    it('should not crash when cron job runs but no user deletions scheduled', async () => {
      await expect(ctx.tasksService.cleanupDeletedUsers()).resolves.not.toThrow();
    });

    it('should not hard delete users within retention period', async () => {
      const { user } = await createNotYetExpiredSoftDeletedUser(ctx);

      await ctx.tasksService.cleanupDeletedUsers();

      const userStillExists = await ctx.prisma.user.findUnique({ where: { id: user.id } });
      expect(userStillExists).not.toBeNull();
      expect(userStillExists?.isDeleted).toBe(true);
    });

    it('should not hard delete a resurrected user', async () => {
      const { user } = await createNotYetExpiredSoftDeletedUser(ctx);
      await ctx.prisma.user.update({
        where: { id: user.id },
        data: { isDeleted: false, deletedAt: null },
      });

      await ctx.tasksService.cleanupDeletedUsers();

      const userStillExists = await ctx.prisma.user.findUnique({ where: { id: user.id } });
      expect(userStillExists).not.toBeNull();
      expect(userStillExists?.isDeleted).toBe(false);
    });
  });
});
