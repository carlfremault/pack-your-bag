import { HttpStatus } from '@nestjs/common';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { AuditEventType } from '@/generated/prisma';

import {
  createAndHardDeleteUser,
  createAuthenticatedUser,
  createExpiredSoftDeletedUser,
  createNotYetExpiredSoftDeletedUser,
  createUserWithMultipleTokens,
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
    await ctx.close();
  });

  describe('Soft deletion', () => {
    it('should soft delete user and revoke all tokens', async () => {
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
    });

    it('should prevent login after soft deletion', async () => {
      const { access_token } = await createAuthenticatedUser(ctx);

      await ctx.authHelpers.deleteUser({
        token: access_token,
        password: ctx.authHelpers.defaultUser.password,
      });

      await ctx.authHelpers.loginUser(undefined, HttpStatus.FORBIDDEN);
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
        expectedStatus: HttpStatus.BAD_REQUEST,
      });

      expect(response.body).toMatchObject({
        error: 'Bad Request',
        message: 'Account already scheduled for deletion',
      });
    });

    it('should not soft delete a user that does not exist', async () => {
      const { access_token } = await createAndHardDeleteUser(ctx);
      await createAuthenticatedUser(ctx);

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
      const response = await ctx.authHelpers.registerUser(
        ctx.authHelpers.defaultUser,
        HttpStatus.CONFLICT,
      );

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

  describe('Hard deletion', () => {
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
