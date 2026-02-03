import { IntegrationTestContext } from 'test/helpers/setup.helpers';

import { MS_PER_DAY } from '@/common/constants/auth.constants';

const GRACE_PERIOD_BUFFER_MS = 1000;

export const createAuthenticatedUser = async (ctx: IntegrationTestContext) => {
  const response = await ctx.authHelpers.registerUser();
  const { access_token, refresh_token } = response.body;

  const user = await ctx.prisma.user.findUnique({
    where: { email: ctx.authHelpers.defaultUser.email },
  });
  if (!user) throw new Error('User not found after registration');

  return { user, access_token, refresh_token };
};

export const createAndLoginUser = async (ctx: IntegrationTestContext) => {
  await createAuthenticatedUser(ctx);
  return await ctx.authHelpers.loginUser();
};

export const createUserWithMultipleTokens = async (ctx: IntegrationTestContext) => {
  const authenticatedUser = await createAuthenticatedUser(ctx);

  await ctx.authHelpers.loginUser();
  await ctx.authHelpers.refreshToken(authenticatedUser.refresh_token);

  return authenticatedUser;
};

export const createExpiredSoftDeletedUser = async (ctx: IntegrationTestContext) => {
  const { user, access_token } = await createUserWithMultipleTokens(ctx);
  await ctx.authHelpers.deleteUser({
    token: access_token,
    password: ctx.authHelpers.defaultUser.password,
  });

  await ctx.prisma.user.update({
    where: { id: user.id },
    data: { deletedAt: new Date(Date.now() - (ctx.userDeleteRetentionPeriod + 1) * MS_PER_DAY) },
  });

  return { user, access_token };
};

export const createNotYetExpiredSoftDeletedUser = async (ctx: IntegrationTestContext) => {
  const { user, access_token } = await createUserWithMultipleTokens(ctx);
  await ctx.authHelpers.deleteUser({
    token: access_token,
    password: ctx.authHelpers.defaultUser.password,
  });

  await ctx.prisma.user.update({
    where: { id: user.id },
    data: { deletedAt: new Date(Date.now() - (ctx.userDeleteRetentionPeriod - 1) * MS_PER_DAY) },
  });

  return { user, access_token };
};

export const createAndHardDeleteUser = async (ctx: IntegrationTestContext) => {
  const response = await createExpiredSoftDeletedUser(ctx);
  await ctx.tasksService.cleanupDeletedUsers();
  return response;
};

export const waitForGracePeriod = async (ctx: IntegrationTestContext) => {
  await ctx.authHelpers.sleep(ctx.gracePeriod + GRACE_PERIOD_BUFFER_MS);
};
